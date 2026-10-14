// src/routes/order-lookup.ts — Universal Order & Product Delivery Recovery
import { Hono } from 'hono'
import type { Env } from '../worker'
import { verifyAndFulfillOrder } from './checkout'

const app = new Hono<{ Bindings: Env }>()

// Helper to extract real product ID from order record
function extractRealProductId(orderRow: any): number {
  if (orderRow.real_product_id && Number(orderRow.real_product_id) > 0) {
    return Number(orderRow.real_product_id)
  }
  if (orderRow.notes && typeof orderRow.notes === 'string') {
    const match = orderRow.notes.match(/real_product_id:(\d+)/)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  return orderRow.product_id
}

// GET /api/order-lookup?order=...&phone=...&email=...
app.get('/', async (c) => {
  const emailParam = c.req.query('email')?.toLowerCase().trim() || ''
  const phoneParam = c.req.query('phone')?.replace(/[^0-9]/g, '').trim() || ''
  const rawQuery = (c.req.query('order') || c.req.query('q') || '').trim()

  // Clean raw order number
  const orderNumber = rawQuery.toUpperCase().replace(/^#/, '').trim()
  const orderAlt = orderNumber.startsWith('TVH-') ? orderNumber : `TVH-${orderNumber}`

  // If query looks like a 10-digit phone number
  const queryPhone = rawQuery.replace(/[^0-9]/g, '')
  const isPhone = queryPhone.length >= 10

  if (!orderNumber && !emailParam && !phoneParam) {
    return c.json({ error: 'Please provide an Order Number, Mobile Number, or Email address.' }, 400)
  }

  let order: any = null

  // 1. Try lookup by Order Number
  if (orderNumber) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE (order_number = ? OR order_number = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(orderNumber, orderAlt).first()
  }

  // 2. Try lookup by Phone Number if not found
  if (!order && (phoneParam || isPhone)) {
    const targetPhone = phoneParam || queryPhone.slice(-10)
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE customer_phone LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(`%${targetPhone}%`).first()
  }

  // 3. Try lookup by Email if not found
  if (!order && emailParam) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE LOWER(customer_email) = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(emailParam).first()
  }

  if (!order) {
    return c.json({
      error: 'Order not found. Please double-check your Order Number or Mobile Number and try again.'
    }, 404)
  }

  // Auto-verify with payment gateway if pending, and guarantee download token
  const verification = await verifyAndFulfillOrder(c.env.DB, c.env, order)

  let download_token = verification.download_token || null
  const finalStatus = verification.isPaid ? 'PAID' : (verification.status || order.status)

  // Resolve Real Product Data that the customer actually bought!
  const realProdId = extractRealProductId(order)
  let product = await c.env.DB.prepare(
    `SELECT id, title, slug, price, sale_price, access_duration_hours, download_limit, google_drive_link, file_type, file_count
     FROM products WHERE id = ?`
  ).bind(realProdId).first() as any

  if (!product) {
    product = await c.env.DB.prepare(
      `SELECT id, title, slug, price, sale_price, access_duration_hours, download_limit, google_drive_link, file_type, file_count
       FROM products WHERE id = ?`
    ).bind(order.product_id).first() as any
  }

  // Fetch product thumbnail image for the real product (or wallpaper fallback)
  const thumb = await c.env.DB.prepare(
    `SELECT r2_key FROM product_images WHERE product_id = ? ORDER BY is_thumbnail DESC, sort_order ASC, id ASC LIMIT 1`
  ).bind(product?.id || order.product_id).first<{ r2_key: string }>()

  const productImage = thumb ? `/api/images/${encodeURIComponent(thumb.r2_key)}` : null

  return c.json({
    order_number: order.order_number,
    status: finalStatus,
    amount: order.amount,
    original_price: product?.price ?? order.amount,
    sale_price: product?.sale_price ?? order.amount,
    product: product?.title ?? 'Digital Product Asset',
    product_slug: product?.slug ?? '',
    product_id: product?.id ?? order.product_id,
    product_image: productImage,
    created_at: order.created_at,
    download_token,
    download_expired: finalStatus === 'PAID' && !download_token,
  })
})

export default app
