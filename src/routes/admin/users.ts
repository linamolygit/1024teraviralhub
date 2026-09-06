// src/routes/admin/users.ts — Multi-Admin Staff & Permissions API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AdminVars } from '../../worker'
import { logAdminAudit } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

const adminUserSchema = z.object({
  firebase_uid: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(2).max(100).optional(),
  role: z.enum(['super_admin', 'admin', 'content_manager', 'support_manager']),
  is_active: z.boolean().optional(),
})

// GET /api/admin/users
app.get('/', async (c) => {
  const users = await c.env.DB.prepare(`
    SELECT id, firebase_uid, email, name, role, is_active, last_login, created_at
    FROM admins
    ORDER BY created_at DESC
  `).all()
  return c.json({ users: users.results })
})

// POST /api/admin/users
app.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = adminUserSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  try {
    const res = await c.env.DB.prepare(`
      INSERT INTO admins (firebase_uid, email, name, role, is_active)
      VALUES (?, ?, ?, ?, ?)
    `).bind(
      d.firebase_uid,
      d.email,
      d.name ?? null,
      d.role,
      d.is_active ?? true ? 1 : 0
    ).run()

    await logAdminAudit(c.env.DB, {
      admin_uid: c.get('adminUid'),
      admin_email: c.get('adminEmail'),
      action: 'CREATE',
      resource_type: 'admin_user',
      resource_id: res.meta.last_row_id?.toString(),
    })

    return c.json({ success: true, id: res.meta.last_row_id })
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      return c.json({ error: 'Admin with this Firebase UID or Email already exists' }, 400)
    }
    return c.json({ error: 'Failed to create admin' }, 500)
  }
})

// PUT /api/admin/users/:id
app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = adminUserSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name) }
  if (d.role !== undefined) { fields.push('role = ?'); values.push(d.role) }
  if (d.is_active !== undefined) { fields.push('is_active = ?'); values.push(d.is_active ? 1 : 0) }

  if (!fields.length) return c.json({ error: 'No fields provided' }, 400)
  values.push(id)

  await c.env.DB.prepare(`UPDATE admins SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'UPDATE',
    resource_type: 'admin_user',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

// DELETE /api/admin/users/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM admins WHERE id = ?`).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'DELETE',
    resource_type: 'admin_user',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

export default app
