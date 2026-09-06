// src/routes/admin/auth.ts — Admin auth routes
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware, type AdminVars } from './middleware'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

// GET /api/admin/auth/me — verify token + get current admin info
app.get('/me', adminAuthMiddleware, async (c) => {
  const uid = c.get('adminUid')
  const admin = await c.env.DB.prepare(
    `SELECT firebase_uid, email, name, role, last_login, created_at FROM admins WHERE firebase_uid = ?`
  ).bind(uid).first()
  return c.json({ admin })
})

// POST /api/admin/auth/setup — first-time admin setup
// Only works if admins table is empty
app.post('/setup', async (c) => {
  const count = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM admins`).first() as { c: number }
  if (count.c > 0) return c.json({ error: 'Admin already configured' }, 403)

  const body = await c.req.json() as { firebase_uid: string; email: string; name?: string; secret: string }
  if (body.secret !== c.env.ADMIN_SECRET_KEY) return c.json({ error: 'Invalid setup secret' }, 403)

  await c.env.DB.prepare(
    `INSERT INTO admins (firebase_uid, email, name, role) VALUES (?, ?, ?, 'super_admin')`
  ).bind(body.firebase_uid, body.email, body.name ?? 'Admin').run()

  return c.json({ success: true, message: 'Super admin created' })
})

export default app
