// src/routes/admin/analytics.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const [
    totalRevenue, todayRevenue, weekRevenue, monthRevenue,
    totalOrders, paidOrders, failedOrders, pendingOrders,
    activeProducts,
    topProducts, dailyRevenue, recentOrders
  ] = await Promise.all([
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'PAID'`).first() as Promise<{total: number}>,
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'PAID' AND date(created_at) = date('now')`).first() as Promise<{total: number}>,
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'PAID' AND created_at >= datetime('now', '-7 days')`).first() as Promise<{total: number}>,
    c.env.DB.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = 'PAID' AND created_at >= datetime('now', '-30 days')`).first() as Promise<{total: number}>,
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM orders`).first() as Promise<{c: number}>,
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'PAID'`).first() as Promise<{c: number}>,
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'FAILED'`).first() as Promise<{c: number}>,
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM orders WHERE status = 'PENDING'`).first() as Promise<{c: number}>,
    c.env.DB.prepare(`SELECT COUNT(*) as c FROM products WHERE is_published = 1`).first() as Promise<{c: number}>,
    c.env.DB.prepare(`
      SELECT p.title, p.slug, p.total_sales, p.total_revenue, p.price
      FROM products p ORDER BY p.total_sales DESC LIMIT 5
    `).all(),
    c.env.DB.prepare(`
      SELECT date(created_at) as day, SUM(amount) as revenue, COUNT(*) as orders
      FROM orders WHERE status = 'PAID' AND created_at >= datetime('now', '-30 days')
      GROUP BY date(created_at) ORDER BY day ASC
    `).all(),
    c.env.DB.prepare(`
      SELECT o.order_number, o.customer_name, o.customer_email, o.amount, o.status, o.created_at, p.title as product
      FROM orders o JOIN products p ON o.product_id = p.id
      ORDER BY o.created_at DESC LIMIT 10
    `).all(),
  ])

  // Conversion rate
  const pageViews = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM analytics_events WHERE event_type = 'product_view' AND created_at >= datetime('now', '-30 days')`
  ).first() as {c: number}
  const checkoutStarts = await c.env.DB.prepare(
    `SELECT COUNT(*) as c FROM analytics_events WHERE event_type = 'checkout_start' AND created_at >= datetime('now', '-30 days')`
  ).first() as {c: number}

  return c.json({
    revenue: {
      total: totalRevenue?.total ?? 0,
      today: todayRevenue?.total ?? 0,
      week: weekRevenue?.total ?? 0,
      month: monthRevenue?.total ?? 0,
    },
    orders: {
      total: totalOrders?.c ?? 0,
      paid: paidOrders?.c ?? 0,
      failed: failedOrders?.c ?? 0,
      pending: pendingOrders?.c ?? 0,
    },
    active_products: activeProducts?.c ?? 0,
    conversion: {
      product_views: pageViews?.c ?? 0,
      checkout_starts: checkoutStarts?.c ?? 0,
      purchases: paidOrders?.c ?? 0,
      checkout_rate: (pageViews?.c ?? 0) > 0 ? Math.round(((checkoutStarts?.c ?? 0) / pageViews.c) * 100) : 0,
      purchase_rate: (checkoutStarts?.c ?? 0) > 0 ? Math.round(((paidOrders?.c ?? 0) / checkoutStarts.c) * 100) : 0,
    },
    top_products: topProducts?.results ?? [],
    daily_revenue: dailyRevenue?.results ?? [],
    recent_orders: recentOrders?.results ?? [],
  })
})

export default app
