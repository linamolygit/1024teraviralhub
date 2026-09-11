// src/routes/order-lookup.ts — Universal Order & Product Delivery Recovery
import { Hono } from 'hono'
import type { Env } from '../worker'
import { verifyAndFulfillOrder } from './checkout'

const app = new Hono<{ Bindings: Env }>()

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
      SELECT o.*, p.title as product_title, p.price as original_price, p.sale_price,
             p.slug as product_slug, p.access_duration_hours, p.download_limit
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE (o.order_number = ? OR o.order_number = ?)
      ORDER BY o.created_at DESC LIMIT 1
    `).bind(orderNumber, orderAlt).first()
  }

  // 2. Try lookup by Phone Number if not found
  if (!order && (phoneParam || isPhone)) {
    const targetPhone = phoneParam || queryPhone.slice(-10)
    order = await c.env.DB.prepare(`
      SELECT o.*, p.title as product_title, p.price as original_price, p.sale_price,
             p.slug as product_slug, p.access_duration_hours, p.download_limit
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE o.customer_phone LIKE ?
      ORDER BY o.created_at DESC LIMIT 1
    `).bind(`%${targetPhone}%`).first()
  }

  // 3. Try lookup by Email if not found
  if (!order && emailParam) {
    order = await c.env.DB.prepare(`
      SELECT o.*, p.title as product_title, p.price as original_price, p.sale_price,
             p.slug as product_slug, p.access_duration_hours, p.download_limit
      FROM orders o
      JOIN products p ON o.product_id = p.id
      WHERE LOWER(o.customer_email) = ?
      ORDER BY o.created_at DESC LIMIT 1
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

  return c.json({
    order_number: order.order_number,
    status: finalStatus,
    amount: order.amount,
    original_price: order.original_price ?? order.amount,
    sale_price: order.sale_price ?? order.amount,
    product: order.product_title,
    product_slug: order.product_slug,
    created_at: order.created_at,
    download_token,
    download_expired: finalStatus === 'PAID' && !download_token,
  })
})

export default app
