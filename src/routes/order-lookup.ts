// src/routes/order-lookup.ts
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

// GET /api/order-lookup?order=TVH-...&email=optional
app.get('/', async (c) => {
  const email = c.req.query('email')?.toLowerCase().trim()
  const rawOrder = c.req.query('order')?.trim() || ''
  const orderNumber = rawOrder.toUpperCase().replace(/^#/, '').trim()

  if (!orderNumber) {
    return c.json({ error: 'Order number is required (e.g. TVH-20250830-0001)' }, 400)
  }

  const orderAlt = orderNumber.startsWith('TVH-') ? orderNumber : `TVH-${orderNumber}`

  let orderQuery = `
    SELECT o.id, o.order_number, o.status, o.amount, o.created_at, o.product_id,
           p.title as product_title, p.price as original_price, p.sale_price
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE (o.order_number = ? OR o.order_number = ?)
  `
  const params: any[] = [orderNumber, orderAlt]

  if (email) {
    orderQuery += ` AND LOWER(o.customer_email) = ?`
    params.push(email)
  }

  const order = await c.env.DB.prepare(orderQuery).bind(...params).first() as {
    id: number; order_number: string; status: string; amount: number;
    created_at: string; product_id: number; product_title: string;
    original_price?: number; sale_price?: number;
  } | null

  if (!order) {
    return c.json({
      error: email
        ? 'Order not found. Please verify your order number and email address.'
        : 'Order not found. Please check your order number and try again.'
    }, 404)
  }

  let download_token = null
  if (order.status === 'PAID') {
    const token = await c.env.DB.prepare(`
      SELECT token, expires_at, download_count, max_downloads
      FROM download_tokens
      WHERE order_id = ? AND is_revoked = 0
      ORDER BY created_at DESC LIMIT 1
    `).bind(order.id).first() as {
      token: string; expires_at: string; download_count: number; max_downloads: number
    } | null

    if (token && new Date(token.expires_at) > new Date() && token.download_count < token.max_downloads) {
      download_token = token.token
    }
  }

  return c.json({
    order_number: order.order_number,
    status: order.status,
    amount: order.amount,
    original_price: order.original_price ?? order.amount,
    sale_price: order.sale_price ?? order.amount,
    product: order.product_title,
    created_at: order.created_at,
    download_token,
    download_expired: order.status === 'PAID' && !download_token,
  })
})

export default app
