// src/routes/admin/orders.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const status = c.req.query('status')
  const limit = parseInt(c.req.query('limit') ?? '20')
  const offset = parseInt(c.req.query('offset') ?? '0')
  const search = c.req.query('search')
  const sort = c.req.query('sort') ?? 'newest'
  const dateRange = c.req.query('date_range')

  let query = `
    SELECT o.*, p.title as product_title
    FROM orders o
    JOIN products p ON o.product_id = p.id
    WHERE 1=1
  `
  const params: (string | number)[] = []
  if (status) { query += ` AND o.status = ?`; params.push(status) }
  if (search) {
    query += ` AND (o.order_number LIKE ? OR o.customer_email LIKE ? OR o.customer_name LIKE ?)`
    params.push(`%${search}%`, `%${search}%`, `%${search}%`)
  }
  if (dateRange === 'today') {
    query += ` AND date(o.created_at) = date('now')`
  } else if (dateRange === '7d') {
    query += ` AND o.created_at >= datetime('now', '-7 days')`
  } else if (dateRange === '30d') {
    query += ` AND o.created_at >= datetime('now', '-30 days')`
  }

  if (sort === 'oldest') {
    query += ` ORDER BY o.created_at ASC`
  } else if (sort === 'amount_desc') {
    query += ` ORDER BY o.amount DESC`
  } else if (sort === 'amount_asc') {
    query += ` ORDER BY o.amount ASC`
  } else {
    query += ` ORDER BY o.created_at DESC`
  }

  query += ` LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const orders = await c.env.DB.prepare(query).bind(...params).all()
  const stats = await c.env.DB.prepare(`
    SELECT
      COUNT(*) as total_orders,
      SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END) as total_revenue,
      SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_count,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pending_count,
      SUM(CASE WHEN status = 'FAILED' THEN 1 ELSE 0 END) as failed_count
    FROM orders
  `).first() as {
    total_orders: number
    total_revenue: number | null
    paid_count: number
    pending_count: number
    failed_count: number
  }

  return c.json({
    orders: orders.results,
    total: stats?.total_orders ?? 0,
    stats: {
      total_orders: stats?.total_orders ?? 0,
      total_revenue: stats?.total_revenue ?? 0,
      paid_count: stats?.paid_count ?? 0,
      pending_count: stats?.pending_count ?? 0,
      failed_count: stats?.failed_count ?? 0,
    }
  })
})

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const order = await c.env.DB.prepare(`
    SELECT o.*, p.title as product_title, p.slug as product_slug
    FROM orders o JOIN products p ON o.product_id = p.id
    WHERE o.id = ? OR o.order_number = ?
  `).bind(id, id).first()

  if (!order) return c.json({ error: 'Order not found' }, 404)

  const payments = await c.env.DB.prepare(
    `SELECT * FROM payments WHERE order_id = ? ORDER BY created_at DESC`
  ).bind((order as {id: number}).id).all()

  const token = await c.env.DB.prepare(
    `SELECT * FROM download_tokens WHERE order_id = ? ORDER BY created_at DESC LIMIT 1`
  ).bind((order as {id: number}).id).first()

  const downloadLogs = await c.env.DB.prepare(
    `SELECT dl.* FROM download_logs dl JOIN download_tokens dt ON dl.token_id = dt.id WHERE dt.order_id = ? ORDER BY dl.created_at DESC`
  ).bind((order as {id: number}).id).all()

  return c.json({ order, payments: payments.results, download_token: token, download_logs: downloadLogs.results })
})

export default app
