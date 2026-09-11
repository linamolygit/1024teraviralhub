// src/routes/admin/analytics.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const period = c.req.query('period') || '30d'

  // Time filter condition for analytics_events & orders
  let eventWhere = `created_at >= datetime('now', '-30 days')`
  let ordersWhere = `created_at >= datetime('now', '-30 days')`

  if (period === 'today') {
    eventWhere = `date(created_at) = date('now')`
    ordersWhere = `date(created_at) = date('now')`
  } else if (period === '7d') {
    eventWhere = `created_at >= datetime('now', '-7 days')`
    ordersWhere = `created_at >= datetime('now', '-7 days')`
  } else if (period === 'all') {
    eventWhere = `1=1`
    ordersWhere = `1=1`
  }

  // 1. Existing dashboard stats (Preserved 100% without deletion)
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

  // 2. Real-time Live Visitors (Shoppers active in last 5 minutes)
  const liveVisitorsQuery = await c.env.DB.prepare(`
    SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) as c
    FROM analytics_events
    WHERE created_at >= datetime('now', '-5 minutes')
  `).first<{ c: number }>().catch(() => ({ c: 0 }))

  const liveVisitors = liveVisitorsQuery?.c ?? 0

  // 3. Traffic Analytics (in selected period)
  const [
    totalVisitorsRow,
    pageViewsRow,
    newVisitorsRow,
    dwellTimeRow,
    totalClicksRow,
    buyNowClicksRow,
    trafficSourcesRow,
    productViewsRow,
    checkoutStartsRow,
    periodPaidOrdersRow
  ] = await Promise.all([
    // Unique Visitors
    c.env.DB.prepare(`
      SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) as c
      FROM analytics_events
      WHERE ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Total Page Views
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM analytics_events
      WHERE event_type IN ('page_view', 'product_view') AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // New Visitors (identified via metadata is_new_user = true / 1)
    c.env.DB.prepare(`
      SELECT COUNT(DISTINCT COALESCE(session_id, ip_address)) as c
      FROM analytics_events
      WHERE (json_extract(metadata, '$.is_new_user') = 1 OR json_extract(metadata, '$.is_new_user') = 'true')
        AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Dwell Time (Average time spent in seconds)
    c.env.DB.prepare(`
      SELECT AVG(CAST(json_extract(metadata, '$.dwell_seconds') AS REAL)) as avg_dwell
      FROM analytics_events
      WHERE event_type = 'dwell_time' AND ${eventWhere}
    `).first<{ avg_dwell: number | null }>().catch(() => ({ avg_dwell: null })),

    // Total clicks
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM analytics_events
      WHERE event_type IN ('click', 'buy_now_click') AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Buy Now Button clicks specifically
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM analytics_events
      WHERE event_type = 'buy_now_click' AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Traffic sources breakdown (Facebook Reels, Instagram, Google, Direct, etc.)
    c.env.DB.prepare(`
      SELECT
        COALESCE(NULLIF(utm_source, ''), 'Direct / Caption Link') as source,
        COUNT(*) as total_events,
        COUNT(DISTINCT COALESCE(session_id, ip_address)) as unique_visitors
      FROM analytics_events
      WHERE ${eventWhere}
      GROUP BY source
      ORDER BY unique_visitors DESC
      LIMIT 8
    `).all().catch(() => ({ results: [] })),

    // Funnel Stage 2: Product Views
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM analytics_events
      WHERE (event_type = 'product_view' OR (event_type = 'page_view' AND product_id IS NOT NULL))
        AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Funnel Stage 4: Checkout Starts
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM analytics_events
      WHERE event_type = 'checkout_start' AND ${eventWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),

    // Funnel Stage 5: Paid orders in period
    c.env.DB.prepare(`
      SELECT COUNT(*) as c
      FROM orders
      WHERE status = 'PAID' AND ${ordersWhere}
    `).first<{ c: number }>().catch(() => ({ c: 0 })),
  ])

  const totalVisitors = totalVisitorsRow?.c ?? 0
  const pageViews = pageViewsRow?.c ?? 0
  const newVisitors = Math.min(newVisitorsRow?.c ?? 0, totalVisitors)
  const returningVisitors = Math.max(0, totalVisitors - newVisitors)
  const newVisitorPct = totalVisitors > 0 ? Math.round((newVisitors / totalVisitors) * 100) : 0

  const avgDwellSeconds = Math.round(dwellTimeRow?.avg_dwell ?? 0)
  const dwellMins = Math.floor(avgDwellSeconds / 60)
  const dwellSecs = avgDwellSeconds % 60
  const dwellTimeFormatted = avgDwellSeconds > 0 ? `${dwellMins}m ${dwellSecs}s` : '0m 0s'

  const totalClicks = totalClicksRow?.c ?? 0
  const buyNowClicks = buyNowClicksRow?.c ?? 0
  const productViews = productViewsRow?.c ?? 0
  const checkoutStarts = checkoutStartsRow?.c ?? 0
  const paidPurchases = periodPaidOrdersRow?.c ?? 0

  // 4. Calculate 5-Stage Funnel Percentages
  // Stage 1: Visitors
  // Stage 2: Product Views
  // Stage 3: Buy Now Clicks
  // Stage 4: Checkout Started
  // Stage 5: Paid Orders
  const funnel = [
    {
      stage: 'Store Visitors',
      count: totalVisitors,
      pctOfTotal: 100,
      dropoffPct: totalVisitors > 0 ? Math.max(0, Math.round(((totalVisitors - productViews) / totalVisitors) * 100)) : 0,
    },
    {
      stage: 'Product Views',
      count: productViews,
      pctOfTotal: totalVisitors > 0 ? Math.round((productViews / totalVisitors) * 100) : 0,
      dropoffPct: productViews > 0 ? Math.max(0, Math.round(((productViews - buyNowClicks) / productViews) * 100)) : 0,
    },
    {
      stage: 'Buy Now Clicks',
      count: buyNowClicks,
      pctOfTotal: totalVisitors > 0 ? Math.round((buyNowClicks / totalVisitors) * 100) : 0,
      dropoffPct: buyNowClicks > 0 ? Math.max(0, Math.round(((buyNowClicks - checkoutStarts) / buyNowClicks) * 100)) : 0,
    },
    {
      stage: 'Checkout Initiated',
      count: checkoutStarts,
      pctOfTotal: totalVisitors > 0 ? Math.round((checkoutStarts / totalVisitors) * 100) : 0,
      dropoffPct: checkoutStarts > 0 ? Math.max(0, Math.round(((checkoutStarts - paidPurchases) / checkoutStarts) * 100)) : 0,
    },
    {
      stage: 'Paid Orders',
      count: paidPurchases,
      pctOfTotal: totalVisitors > 0 ? Math.round((paidPurchases / totalVisitors) * 100) : 0,
      dropoffPct: 0,
    },
  ]

  // Traffic Source Breakdown with % of visitors
  const sources = ((trafficSourcesRow as any)?.results || []).map((s: any) => ({
    source: s.source || 'Direct / Caption Link',
    total_events: s.total_events || 0,
    unique_visitors: s.unique_visitors || 0,
    percentage: totalVisitors > 0 ? Math.round(((s.unique_visitors || 0) / totalVisitors) * 100) : 0,
  }))

  return c.json({
    // Preserved fields for existing dashboards
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
      product_views: productViews,
      checkout_starts: checkoutStarts,
      purchases: paidPurchases,
      checkout_rate: productViews > 0 ? Math.round((checkoutStarts / productViews) * 100) : 0,
      purchase_rate: checkoutStarts > 0 ? Math.round((paidPurchases / checkoutStarts) * 100) : 0,
    },
    top_products: topProducts?.results ?? [],
    daily_revenue: dailyRevenue?.results ?? [],
    recent_orders: recentOrders?.results ?? [],

    // NEW Traffic & Tracking Features
    period,
    live_visitors: liveVisitors,
    traffic: {
      total_visitors: totalVisitors,
      total_pageviews: pageViews,
      new_visitors: newVisitors,
      returning_visitors: returningVisitors,
      new_visitor_pct: newVisitorPct,
      avg_dwell_seconds: avgDwellSeconds,
      dwell_time_formatted: dwellTimeFormatted,
      total_clicks: totalClicks,
      buy_now_clicks: buyNowClicks,
      buy_now_ctr: totalVisitors > 0 ? Math.round((buyNowClicks / totalVisitors) * 100) : 0,
    },
    funnel,
    traffic_sources: sources,
  })
})

export default app
