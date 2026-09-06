// src/routes/admin/coupons.ts — Admin Coupon CRUD API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AdminVars } from '../../worker'
import { logAdminAudit } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

const couponSchema = z.object({
  code: z.string().min(2).max(30).toUpperCase(),
  discount_type: z.enum(['percent', 'fixed']),
  discount_value: z.number().positive(),
  min_spend: z.number().min(0).optional(),
  max_uses: z.number().int().min(0).optional(),
  expires_at: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
})

// GET /api/admin/coupons
app.get('/', async (c) => {
  const coupons = await c.env.DB.prepare(`
    SELECT * FROM coupons ORDER BY created_at DESC
  `).all()
  return c.json({ coupons: coupons.results })
})

// POST /api/admin/coupons
app.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = couponSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  try {
    const res = await c.env.DB.prepare(`
      INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_uses, expires_at, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      d.code,
      d.discount_type,
      d.discount_value,
      d.min_spend ?? 0,
      d.max_uses ?? 0,
      d.expires_at ?? null,
      d.is_active ?? true ? 1 : 0
    ).run()

    await logAdminAudit(c.env.DB, {
      admin_uid: c.get('adminUid'),
      admin_email: c.get('adminEmail'),
      action: 'CREATE',
      resource_type: 'coupon',
      resource_id: res.meta.last_row_id?.toString(),
    })

    return c.json({ success: true, id: res.meta.last_row_id })
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      return c.json({ error: 'Coupon code already exists' }, 400)
    }
    return c.json({ error: 'Failed to create coupon' }, 500)
  }
})

// PUT /api/admin/coupons/:id
app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = couponSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (d.code !== undefined) { fields.push('code = ?'); values.push(d.code) }
  if (d.discount_type !== undefined) { fields.push('discount_type = ?'); values.push(d.discount_type) }
  if (d.discount_value !== undefined) { fields.push('discount_value = ?'); values.push(d.discount_value) }
  if (d.min_spend !== undefined) { fields.push('min_spend = ?'); values.push(d.min_spend) }
  if (d.max_uses !== undefined) { fields.push('max_uses = ?'); values.push(d.max_uses) }
  if (d.expires_at !== undefined) { fields.push('expires_at = ?'); values.push(d.expires_at) }
  if (d.is_active !== undefined) { fields.push('is_active = ?'); values.push(d.is_active ? 1 : 0) }

  if (!fields.length) return c.json({ error: 'No fields provided' }, 400)
  values.push(id)

  await c.env.DB.prepare(`UPDATE coupons SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'UPDATE',
    resource_type: 'coupon',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

// DELETE /api/admin/coupons/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM coupons WHERE id = ?`).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'DELETE',
    resource_type: 'coupon',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

export default app
