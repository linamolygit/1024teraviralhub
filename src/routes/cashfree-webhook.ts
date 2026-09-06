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
