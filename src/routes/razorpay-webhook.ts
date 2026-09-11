// ============================================
// src/routes/razorpay-webhook.ts
// Razorpay Webhook Handler
// POST /api/razorpay/webhook
// ============================================

import { Hono } from 'hono'
import type { Env } from '../worker'
import { RazorpayClient } from '../lib/razorpay'
import { getSetting, updateOrderStatus, createDownloadToken, getProductById, logAnalyticsEvent } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

app.post('/webhook', async (c) => {
  const rawBody = await c.req.text()
  const signature = c.req.header('x-razorpay-signature') ?? ''

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return c.json({ error: 'Invalid JSON' }, 400)
  }

  // Retrieve webhook secret from website_settings
  const webhookSecret = await getSetting<string>(c.env.DB, 'razorpay_webhook_secret', '')

  // If secret is set, verify signature
  if (webhookSecret && webhookSecret.trim()) {
    const keyId = await getSetting<string>(c.env.DB, 'razorpay_key_id', '')
    const keySecret = await getSetting<string>(c.env.DB, 'razorpay_key_secret', '')
    const client = new RazorpayClient({ keyId: keyId || '', keySecret: keySecret || '' })

    const isValid = await client.verifyWebhookSignature(rawBody, signature, webhookSecret)
    if (!isValid) {
      console.warn('[Razorpay Webhook] Invalid signature received')
      return c.json({ error: 'Invalid signature' }, 401)
    }
  }

  const event = payload.event
  const paymentEntity = payload.payload?.payment?.entity
  const orderEntity = payload.payload?.order?.entity
  const paymentLinkEntity = payload.payload?.payment_link?.entity

  const razorpayOrderId = paymentEntity?.order_id || orderEntity?.id
  const paymentLinkId = paymentLinkEntity?.id
  const notesOrderNumber =
    paymentEntity?.notes?.order_number ||
    paymentLinkEntity?.notes?.order_number ||
    paymentLinkEntity?.reference_id ||
    orderEntity?.notes?.order_number

  const paymentStatus = paymentEntity?.status || paymentLinkEntity?.status

  if (!razorpayOrderId && !paymentLinkId && !notesOrderNumber) {
    return c.json({ received: true })
  }

  // Check if order is successful: payment.captured, order.paid, or payment_link.paid
  const isSuccessful =
    event === 'payment.captured' ||
    event === 'order.paid' ||
    event === 'payment_link.paid' ||
    paymentStatus === 'captured' ||
    paymentStatus === 'paid'

  if (!isSuccessful) {
    return c.json({ received: true, event })
  }

  // Find order in D1 across order_id, payment_session_id, notes, or order_number
  let order = null
  if (razorpayOrderId) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE cashfree_order_id = ? OR payment_session_id = ?
    `).bind(razorpayOrderId, razorpayOrderId).first<{
      id: number
      order_number: string
      status: string
      product_id: number
      amount: number
      customer_email: string
    }>()
  }

  if (!order && paymentLinkId) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE payment_session_id = ? OR cashfree_order_id = ? OR notes LIKE ?
    `).bind(paymentLinkId, paymentLinkId, `%${paymentLinkId}%`).first<{
      id: number
      order_number: string
      status: string
      product_id: number
      amount: number
      customer_email: string
    }>()
  }

  if (!order && notesOrderNumber) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE order_number = ?
    `).bind(notesOrderNumber).first<{
      id: number
      order_number: string
      status: string
      product_id: number
      amount: number
      customer_email: string
    }>()
  }

  if (!order) {
    // Check if it's an external partner order
    let extOrder = null
    if (razorpayOrderId) {
      extOrder = await c.env.DB.prepare(`
        SELECT * FROM external_orders WHERE cashfree_order_id = ? OR payment_session_id = ?
      `).bind(razorpayOrderId, razorpayOrderId).first<{
        id: number
        order_number: string
        status: string
        amount: number
        webhook_url?: string
        origin_site: string
        item_id: string
        chat_session_id?: string
      }>()
    }
    if (!extOrder && paymentLinkId) {
      extOrder = await c.env.DB.prepare(`
        SELECT * FROM external_orders WHERE payment_session_id = ? OR cashfree_order_id = ?
      `).bind(paymentLinkId, paymentLinkId).first<{
        id: number
        order_number: string
        status: string
        amount: number
        webhook_url?: string
        origin_site: string
        item_id: string
        chat_session_id?: string
      }>()
    }
    if (!extOrder && notesOrderNumber) {
      extOrder = await c.env.DB.prepare(`
        SELECT * FROM external_orders WHERE order_number = ?
      `).bind(notesOrderNumber).first<{
        id: number
        order_number: string
        status: string
        amount: number
        webhook_url?: string
        origin_site: string
        item_id: string
        chat_session_id?: string
      }>()
    }

    if (extOrder) {
      if (extOrder.status !== 'PAID') {
        await c.env.DB.prepare(`
          UPDATE external_orders SET status = 'PAID', updated_at = datetime('now') WHERE id = ?
        `).bind(extOrder.id).run()

        // Update partner stats
        await c.env.DB.prepare(`
          UPDATE external_partners
          SET total_orders = total_orders + 1,
              paid_orders = paid_orders + 1,
              total_revenue = total_revenue + ?
          WHERE site_url = ?
        `).bind(extOrder.amount, extOrder.origin_site).run().catch(() => {})

        // Dispatch partner webhook with HMAC-SHA256 signature
        if (extOrder.webhook_url) {
          try {
            const partner = await c.env.DB.prepare(
              `SELECT * FROM external_partners WHERE site_url = ? OR ? LIKE ('%' || site_url || '%') LIMIT 1`
            ).bind(extOrder.origin_site, extOrder.origin_site).first() as { id: number; api_key: string } | null

            let secretKey = partner?.api_key
            if (!secretKey) {
              const partnerKeyRow = await c.env.DB.prepare(
                `SELECT value FROM website_settings WHERE key = 'external_partner_api_key'`
              ).first() as { value: string } | null
              secretKey = partnerKeyRow?.value || ''
            }

            const webhookPayload = JSON.stringify({
              event: 'PAYMENT_SUCCESS',
              status: 'PAID',
              order_number: extOrder.order_number,
              item_id: extOrder.item_id,
              chat_session_id: extOrder.chat_session_id,
              amount: extOrder.amount,
              currency: 'INR',
              gateway: 'razorpay',
              timestamp: new Date().toISOString(),
            })

            const headers: Record<string, string> = {
              'Content-Type': 'application/json',
            }

            if (secretKey) {
              const enc = new TextEncoder()
              const cryptoKey = await crypto.subtle.importKey(
                'raw', enc.encode(secretKey),
                { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
              )
              const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(webhookPayload))
              const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
              headers['X-Gateway-Signature'] = sigHex
            }

            const fwdRes = await fetch(extOrder.webhook_url, {
              method: 'POST',
              headers,
              body: webhookPayload,
            })

            await c.env.DB.prepare(
              `UPDATE external_orders SET webhook_delivered = ?, webhook_response = ? WHERE id = ?`
            ).bind(fwdRes.ok ? 1 : 0, `HTTP ${fwdRes.status}`, extOrder.id).run().catch(() => {})
          } catch (err: any) {
            console.error('[Razorpay Webhook] Partner webhook dispatch failed:', err)
          }
        }
      }
      return c.json({ received: true, status: 'PAID_EXTERNAL' })
    }

    console.warn(`[Razorpay Webhook] Order not found for Razorpay order ID: ${razorpayOrderId}`)
    return c.json({ received: true, status: 'order_not_found' })
  }

  // If already marked PAID, return success
  if (order.status === 'PAID') {
    return c.json({ received: true, status: 'already_paid' })
  }

  // Mark order as PAID
  await updateOrderStatus(c.env.DB, order.id, 'PAID')

  // Update product sales stats
  const paidAmount = paymentEntity?.amount ? paymentEntity.amount / 100 : order.amount
  await c.env.DB.prepare(`
    UPDATE products SET total_sales = total_sales + 1, total_revenue = total_revenue + ? WHERE id = ?
  `).bind(paidAmount, order.product_id).run()

  // Generate download token
  const product = await getProductById(c.env.DB, order.product_id)
  const expiryHours = product?.access_duration_hours ?? 12
  const maxDownloads = product?.download_limit ?? 3
  await createDownloadToken(c.env.DB, order.id, expiryHours, maxDownloads)

  // Log analytics event
  await logAnalyticsEvent(c.env.DB, {
    event_type: 'purchase',
    product_id: order.product_id,
    order_id: order.id,
    metadata: {
      gateway: 'razorpay',
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentEntity?.id,
    },
  })

  return c.json({ success: true, status: 'PAID' })
})

export default app
