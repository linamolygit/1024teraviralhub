// ============================================
// src/routes/cashfree-webhook.ts
// Cashfree Payment Webhook Handler
// POST /api/cashfree/webhook
// ============================================

import { Hono } from 'hono'
import type { Env } from '../worker'
import { CashfreeClient } from '../lib/cashfree'
import {
  getOrderByCashfreeId, updateOrderStatus,
  createDownloadToken, getProductById, logAnalyticsEvent
} from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

app.post('/webhook', async (c) => {
  const rawBody = await c.req.text()
  const timestamp = c.req.header('x-webhook-timestamp') ?? ''
  const signature = c.req.header('x-webhook-signature') ?? ''

  let payload: {
    type: string
    data?: {
      order?: { order_id: string; order_status: string; order_amount: number }
      payment?: {
        cf_payment_id: string
        payment_status: string
        payment_amount: number
        payment_method?: Record<string, unknown>
        payment_group?: string
        bank_reference?: string
        error_details?: { error_code?: string; error_description?: string }
      }
    }
  }

  try {
    payload = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Log the webhook first (for debugging/audit)
  await c.env.DB.prepare(`
    INSERT INTO webhook_logs (provider, event_type, cashfree_order_id, payload, signature_valid, processed)
    VALUES ('cashfree', ?, ?, ?, 0, 0)
  `).bind(
    payload.type ?? 'unknown',
    payload.data?.order?.order_id ?? null,
    rawBody,
  ).run()

  // Verify signature
  const cashfree = new CashfreeClient({
    appId: c.env.CASHFREE_APP_ID,
    secretKey: c.env.CASHFREE_SECRET_KEY,
    apiUrl: c.env.CASHFREE_API_URL,
  })

  let signatureValid = false
  try {
    signatureValid = await cashfree.verifyWebhookSignature(
      rawBody, signature, timestamp, c.env.CASHFREE_WEBHOOK_SECRET
    )
  } catch {
    // In sandbox mode, signature may not be present — log and continue carefully
    console.warn('Webhook signature verification failed')
  }

  if (!signatureValid && c.env.ENVIRONMENT === 'production') {
    // Update the log entry
    await c.env.DB.prepare(
      `UPDATE webhook_logs SET error_message = 'Invalid signature' WHERE cashfree_order_id = ? ORDER BY created_at DESC LIMIT 1`
    ).bind(payload.data?.order?.order_id ?? '').run()
    return c.json({ error: 'Invalid signature' }, 401)
  }

  const cashfreeOrderId = payload.data?.order?.order_id
  const orderStatus = payload.data?.order?.order_status
  const paymentData = payload.data?.payment

  if (!cashfreeOrderId) {
    return c.json({ received: true }) // Acknowledge unknown events
  }

  // Find our order
  const order = await c.env.DB.prepare(
    `SELECT * FROM orders WHERE cashfree_order_id = ?`
  ).bind(cashfreeOrderId).first() as {
    id: number; status: string; product_id: number; amount: number
  } | null

  if (!order) {
    // Check if order belongs to external partner (e.g. instatextpro.online)
    const externalOrder = await c.env.DB.prepare(
      `SELECT * FROM external_orders WHERE cashfree_order_id = ?`
    ).bind(cashfreeOrderId).first() as {
      id: number
      order_number: string
      status: string
      amount: number
      origin_site: string
      item_id: string
      chat_session_id: string
      webhook_url: string
    } | null

    if (externalOrder) {
      if (orderStatus === 'PAID' || paymentData?.payment_status === 'SUCCESS') {
        await c.env.DB.prepare(
          `UPDATE external_orders SET status = 'PAID', updated_at = datetime('now') WHERE id = ?`
        ).bind(externalOrder.id).run()

        // Lookup partner in external_partners
        const partner = await c.env.DB.prepare(
          `SELECT * FROM external_partners WHERE site_url = ? OR ? LIKE ('%' || site_url || '%') LIMIT 1`
        ).bind(externalOrder.origin_site, externalOrder.origin_site).first() as { id: number; api_key: string } | null

        if (partner) {
          await c.env.DB.prepare(
            `UPDATE external_partners SET paid_orders = paid_orders + 1, total_revenue = total_revenue + ?, updated_at = datetime('now') WHERE id = ?`
          ).bind(externalOrder.amount, partner.id).run()
        }

        // Forward webhook to partner site
        if (externalOrder.webhook_url) {
          try {
            let secretKey = partner?.api_key
            if (!secretKey) {
              const partnerKeyRow = await c.env.DB.prepare(
                `SELECT value FROM website_settings WHERE key = 'external_partner_api_key'`
              ).first() as { value: string } | null
              secretKey = partnerKeyRow?.value || ''
            }

            const notifyPayload = JSON.stringify({
              event: 'PAYMENT_SUCCESS',
              status: 'PAID',
              order_number: externalOrder.order_number,
              item_id: externalOrder.item_id,
              chat_session_id: externalOrder.chat_session_id,
              amount: externalOrder.amount,
              currency: 'INR',
              timestamp: new Date().toISOString(),
            })

            // Generate HMAC-SHA256 signature
            const enc = new TextEncoder()
            const cryptoKey = await crypto.subtle.importKey(
              'raw', enc.encode(secretKey),
              { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
            )
            const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(notifyPayload))
            const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')

            const forwardRes = await fetch(externalOrder.webhook_url, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'X-Gateway-Signature': sigHex,
              },
              body: notifyPayload,
            })

            await c.env.DB.prepare(
              `UPDATE external_orders SET webhook_delivered = ?, webhook_response = ? WHERE id = ?`
            ).bind(forwardRes.ok ? 1 : 0, `HTTP ${forwardRes.status}`, externalOrder.id).run()
          } catch (fwdErr: any) {
            console.error('[Webhook Forwarder Error]', fwdErr)
          }
        }
      }

      if (orderStatus === 'FAILED' || paymentData?.payment_status === 'FAILED') {
        await c.env.DB.prepare(
          `UPDATE external_orders SET status = 'FAILED', updated_at = datetime('now') WHERE id = ?`
        ).bind(externalOrder.id).run()
      }

      return c.json({ received: true, note: 'External order processed' })
    }

    return c.json({ received: true, note: 'Order not found in DB' })
  }

  // Prevent reprocessing already-PAID orders
  if (order.status === 'PAID') {
    return c.json({ received: true, note: 'Already processed' })
  }

  // Record payment details
  if (paymentData) {
    await c.env.DB.prepare(`
      INSERT INTO payments (
        order_id, cashfree_payment_id, cashfree_order_id, status, amount,
        payment_method, payment_group, bank_reference, error_code, error_description, raw_response
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      order.id,
      paymentData.cf_payment_id ?? null,
      cashfreeOrderId,
      paymentData.payment_status,
      paymentData.payment_amount ?? order.amount,
      paymentData.payment_method ? JSON.stringify(paymentData.payment_method) : null,
      paymentData.payment_group ?? null,
      paymentData.bank_reference ?? null,
      paymentData.error_details?.error_code ?? null,
      paymentData.error_details?.error_description ?? null,
      rawBody,
    ).run()
  }

  // Handle payment success
  if (orderStatus === 'PAID' || paymentData?.payment_status === 'SUCCESS') {
    await updateOrderStatus(c.env.DB, order.id, 'PAID')

    // Update product stats
    await c.env.DB.prepare(
      `UPDATE products SET total_sales = total_sales + 1, total_revenue = total_revenue + ? WHERE id = ?`
    ).bind(order.amount, order.product_id).run()

    // Generate download token
    const product = await getProductById(c.env.DB, order.product_id)
    const expiryHours = product?.access_duration_hours ?? 12
    const maxDownloads = product?.download_limit ?? 3
    await createDownloadToken(c.env.DB, order.id, expiryHours, maxDownloads)

    // Log analytics
    await logAnalyticsEvent(c.env.DB, {
      event_type: 'purchase',
      product_id: order.product_id,
      order_id: order.id,
    })
  }

  if (orderStatus === 'FAILED' || paymentData?.payment_status === 'FAILED') {
    await updateOrderStatus(c.env.DB, order.id, 'FAILED')
  }

  // Mark webhook as processed
  await c.env.DB.prepare(
    `UPDATE webhook_logs SET signature_valid = ?, processed = 1 WHERE cashfree_order_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind(signatureValid ? 1 : 0, cashfreeOrderId).run()

  return c.json({ received: true, status: 'processed' })
})

export default app
