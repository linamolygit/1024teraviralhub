// src/routes/admin/downloads.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '50')
  const offset = parseInt(c.req.query('offset') ?? '0')

  const logs = await c.env.DB.prepare(`
    SELECT dl.*, dt.token, dt.expires_at, dt.download_count, dt.max_downloads,
           o.order_number, o.customer_name, o.customer_email, p.title as product_title
    FROM download_logs dl
    JOIN download_tokens dt ON dl.token_id = dt.id
    JOIN orders o ON dt.order_id = o.id
    JOIN products p ON o.product_id = p.id
    ORDER BY dl.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(limit, offset).all()

  const suspicious = await c.env.DB.prepare(`
    SELECT dl.ip_address, COUNT(*) as attempts
    FROM download_logs dl
    WHERE dl.created_at >= datetime('now', '-1 hour') AND dl.success = 0
    GROUP BY dl.ip_address HAVING attempts > 5
    ORDER BY attempts DESC
  `).all()

  return c.json({ logs: logs.results, suspicious_ips: suspicious.results })
})

export default app
