// src/routes/admin/customers.ts — Real Customer & Guest Buyer Management API
import { Hono } from 'hono'
import type { Env, AdminVars } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

// GET /api/admin/customers — Aggregated Customer & Guest Buyer Listing
app.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '20'), 100)
  const offset = parseInt(c.req.query('offset') ?? '0')
  const search = c.req.query('search')?.trim()
  const type = c.req.query('type')?.trim() // 'guest' | 'registered' | ''

  // Group orders by email (or order if no email)
  let baseQuery = `
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.customer_email IS NOT NULL AND o.customer_email != ''
  `
  const params: (string | number)[] = []

  if (search) {
    baseQuery += ` AND (o.customer_name LIKE ? OR o.customer_email LIKE ? OR o.customer_phone LIKE ?)`
    const term = `%${search}%`
    params.push(term, term, term)
  }

  // Count total distinct customers
  const countQuery = `SELECT COUNT(DISTINCT o.customer_email) as total ${baseQuery}`
  const countStmt = c.env.DB.prepare(countQuery)
  const countRes = (params.length > 0 ? await countStmt.bind(...params).first() : await countStmt.first()) as { total: number } | null
  const total = countRes?.total ?? 0

  // Aggregated Customer List
  const listQuery = `
    SELECT
      o.customer_email as email,
      MAX(o.customer_name) as name,
      MAX(o.customer_phone) as phone,
      'guest' as customer_type,
      COUNT(o.id) as orders_count,
      SUM(CASE WHEN o.status = 'PAID' THEN 1 ELSE 0 END) as paid_orders_count,
      COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.amount ELSE 0 END), 0) as total_spent,
      MAX(o.created_at) as last_order_at,
      MIN(o.created_at) as first_order_at
    ${baseQuery}
    GROUP BY o.customer_email
    ORDER BY last_order_at DESC
    LIMIT ? OFFSET ?
  `
  const listParams = [...params, limit, offset]
  const customersRes = await c.env.DB.prepare(listQuery).bind(...listParams).all()

  // Overall Customer Stats
  const statsRes = await c.env.DB.prepare(`
    SELECT
      COUNT(DISTINCT customer_email) as total_customers,
      COUNT(DISTINCT CASE WHEN status = 'PAID' THEN customer_email END) as paying_customers,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_spent_all
    FROM orders
    WHERE customer_email IS NOT NULL AND customer_email != ''
  `).first() as {
    total_customers: number
    paying_customers: number
    total_spent_all: number
  } | null

  return c.json({
    customers: customersRes.results,
    total,
    stats: {
      total_customers: statsRes?.total_customers ?? 0,
      guest_buyers: statsRes?.total_customers ?? 0,
      paying_customers: statsRes?.paying_customers ?? 0,
      total_spent_all: statsRes?.total_spent_all ?? 0,
    },
  })
})

// GET /api/admin/customers/:email — Customer Detail & Order History
app.get('/:email', async (c) => {
  const emailParam = decodeURIComponent(c.req.param('email')).trim()

  const summary = await c.env.DB.prepare(`
    SELECT
      o.customer_email as email,
      MAX(o.customer_name) as name,
      MAX(o.customer_phone) as phone,
      'guest' as customer_type,
      COUNT(o.id) as total_orders,
      SUM(CASE WHEN o.status = 'PAID' THEN 1 ELSE 0 END) as paid_orders,
      COALESCE(SUM(CASE WHEN o.status = 'PAID' THEN o.amount ELSE 0 END), 0) as total_spent,
      MIN(o.created_at) as first_purchased_at,
      MAX(o.created_at) as last_purchased_at
    FROM orders o
    WHERE o.customer_email = ?
    GROUP BY o.customer_email
  `).bind(emailParam).first()

  if (!summary) {
    return c.json({ error: 'Customer not found' }, 404)
  }

  // Fetch all orders placed by this customer
  const orders = await c.env.DB.prepare(`
    SELECT o.*, p.title as product_title, p.slug as product_slug
    FROM orders o
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.customer_email = ?
    ORDER BY o.created_at DESC
  `).bind(emailParam).all()

  // Fetch active download tokens for this customer's orders
  const downloadTokens = await c.env.DB.prepare(`
    SELECT dt.*, o.order_number, p.title as product_title
    FROM download_tokens dt
    JOIN orders o ON dt.order_id = o.id
    LEFT JOIN products p ON o.product_id = p.id
    WHERE o.customer_email = ?
    ORDER BY dt.created_at DESC
  `).bind(emailParam).all()

  return c.json({
    customer: summary,
    orders: orders.results,
    download_tokens: downloadTokens.results,
  })
})

export default app
