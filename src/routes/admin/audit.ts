// src/routes/admin/audit.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '50')
  const offset = parseInt(c.req.query('offset') ?? '0')

  const logs = await c.env.DB.prepare(`
    SELECT * FROM admin_audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).bind(limit, offset).all()

  const count = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM admin_audit_logs`).first() as {c: number}
  return c.json({ logs: logs.results, total: count.c })
})

export default app
