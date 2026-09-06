// ============================================
// src/routes/checkout.ts — Cashfree Checkout
// POST /api/checkout/create
// GET  /api/checkout/verify/:orderId
// ============================================

import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'
import { CashfreeClient, generateOrderNumber } from '../lib/cashfree'
import {
  getProductById, createOrder, getOrderByCashfreeId,
  updateOrderStatus, createDownloadToken, logAnalyticsEvent
} from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

const checkoutSchema = z.object({
  product_id: z.number().int().positive(),
  customer_name: z.string().max(100).optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional().or(z.literal('')),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer_url: z.string().optional(),
})

// POST /api/checkout/create
app.post('/create', async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const data = parsed.data

  // Fetch product to get authoritative price (never trust client-side price)
  const product = await getProductById(c.env.DB, data.product_id)
  if (!product) return c.json({ error: 'Product not found' }, 404)
  if (!product.is_published) return c.json({ error: 'Product not available' }, 404)

  const amount = product.sale_price ?? product.price
  const orderNumber = generateOrderNumber()

  // Sane fallbacks for frictionless 1-click guest purchase
  const randId = Math.floor(1000 + Math.random() * 9000)
  const hostDomain = c.req.header('host')?.replace(/:\d+$/, '') || 'store.local'
  const customerName = data.customer_name?.trim() || 'Guest Customer'
  const customerEmail = (data.customer_email && data.customer_email.trim().length > 0)
    ? data.customer_email.trim().toLowerCase()
    : `guest_${Date.now()}_${randId}@${hostDomain}`
  const customerPhone = (data.customer_phone && data.customer_phone.replace(/\D/g, '').length >= 10)
    ? data.customer_phone.replace(/\D/g, '').slice(0, 10)
    : '9876543210'

  const cashfree = new CashfreeClient({
    appId: c.env.CASHFREE_APP_ID,
    secretKey: c.env.CASHFREE_SECRET_KEY,
    apiUrl: c.env.CASHFREE_API_URL,
  })

  const siteUrl = c.env.SITE_URL

  let cfOrder
  try {
    cfOrder = await cashfree.createOrder({
      orderId: orderNumber,
      amount,
      currency: 'INR',
      customerName,
      customerEmail,
      customerPhone,
      returnUrl: `${siteUrl}/payment/processing?order=${orderNumber}`,
      notifyUrl: `${siteUrl}/api/cashfree/webhook`,
    })
  } catch (err) {
    console.error('Cashfree order creation error:', err)
    return c.json({ error: 'Payment gateway error. Please try again.' }, 502)
  }

  // Attempt to create UPI Intent / Deeplink session
  const upiSession = await cashfree.createUpiPaymentSession(cfOrder.payment_session_id, 'link')

  // Create order in our DB
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')
  await createOrder(c.env.DB, {
    order_number: orderNumber,
    product_id: data.product_id,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    amount,
    cashfree_order_id: cfOrder.cf_order_id.toString(),
    payment_session_id: cfOrder.payment_session_id,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    referrer_url: data.referrer_url,
    ip_address: ip,
  })

  // Log analytics event
  await logAnalyticsEvent(c.env.DB, {
    event_type: 'checkout_start',
    product_id: data.product_id,
    ip_address: ip,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
  })

  return c.json({
    success: true,
    order_number: orderNumber,
    payment_session_id: cfOrder.payment_session_id,
    amount,
    currency: 'INR',
    upi_intent: upiSession?.data?.payload ?? null,
    upi_link: upiSession?.data?.link ?? null,
    upi_qrcode: upiSession?.data?.qrcode ?? null,
  })
})

// GET /api/checkout/verify/:orderNumber
// Called by frontend after payment redirect — verifies server-side
app.get('/verify/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')

  const order = await c.env.DB.prepare(
    `SELECT * FROM orders WHERE order_number = ?`
  ).bind(orderNumber).first() as {
    id: number; status: string; cashfree_order_id: string;
    product_id: number; customer_email: string; customer_name: string
  } | null

  if (!order) return c.json({ error: 'Order not found' }, 404)

  // If already PAID, return existing download token
  if (order.status === 'PAID') {
    const token = await c.env.DB.prepare(
      `SELECT token, expires_at, download_count, max_downloads FROM download_tokens WHERE order_id = ? AND is_revoked = 0 ORDER BY created_at DESC LIMIT 1`
    ).bind(order.id).first() as { token: string; expires_at: string; download_count: number; max_downloads: number } | null

    return c.json({ success: true, status: 'PAID', download_token: token?.token })
  }

  // Verify with Cashfree server-side
  const cashfree = new CashfreeClient({
    appId: c.env.CASHFREE_APP_ID,
    secretKey: c.env.CASHFREE_SECRET_KEY,
    apiUrl: c.env.CASHFREE_API_URL,
  })

  try {
    const cfStatus = await cashfree.getOrderStatus(order.cashfree_order_id)

    if (cfStatus.order_status === 'PAID') {
      await updateOrderStatus(c.env.DB, order.id, 'PAID')

      // Update product stats
      await c.env.DB.prepare(
        `UPDATE products SET total_sales = total_sales + 1, total_revenue = total_revenue + ? WHERE id = ?`
      ).bind(cfStatus.order_amount, order.product_id).run()

      // Get product settings for download
      const product = await getProductById(c.env.DB, order.product_id)
      const expiryHours = product?.access_duration_hours ?? 12
      const maxDownloads = product?.download_limit ?? 3

      // Generate download token
      const token = await createDownloadToken(c.env.DB, order.id, expiryHours, maxDownloads)

      // Log purchase event
      await logAnalyticsEvent(c.env.DB, {
        event_type: 'purchase',
        product_id: order.product_id,
        order_id: order.id,
      })

      return c.json({ success: true, status: 'PAID', download_token: token })
    }

    if (cfStatus.order_status === 'FAILED') {
      await updateOrderStatus(c.env.DB, order.id, 'FAILED')
      return c.json({ success: false, status: 'FAILED' })
    }

    return c.json({ success: false, status: cfStatus.order_status ?? 'PENDING' })
  } catch (err) {
    console.error('Payment verification error:', err)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// GET /api/checkout/order/:orderNumber
app.get('/order/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')

  const order = await c.env.DB.prepare(
    `SELECT o.*, p.title as product_title, p.slug as product_slug, p.price as product_price,
            p.sale_price as product_sale_price, p.file_count, p.file_type, p.access_duration_hours, p.download_limit
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.order_number = ?`
  ).bind(orderNumber).first() as any

  if (!order) return c.json({ error: 'Order not found' }, 404)

  const thumbnail = await c.env.DB.prepare(
    `SELECT r2_key FROM product_images WHERE product_id = ? AND is_thumbnail = 1 LIMIT 1`
  ).bind(order.product_id).first() as { r2_key: string } | null

  return c.json({
    order_number: order.order_number,
    status: order.status,
    amount: order.amount,
    currency: 'INR',
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    payment_session_id: order.payment_session_id,
    created_at: order.created_at,
    product: {
      id: order.product_id,
      title: order.product_title,
      slug: order.product_slug,
      price: order.product_price,
      sale_price: order.product_sale_price,
      file_count: order.file_count,
      file_type: order.file_type,
      access_duration_hours: order.access_duration_hours,
      download_limit: order.download_limit,
      thumbnail_url: thumbnail ? `/api/images/${encodeURIComponent(thumbnail.r2_key)}` : null,
    },
  })
})

export default app
