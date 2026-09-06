// src/routes/admin/affiliates.ts — Admin Affiliate Management API
import { Hono } from 'hono'
import type { Env, AdminVars } from '../../worker'
import { logAdminAudit } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

// GET /api/admin/affiliates
app.get('/', async (c) => {
  const partners = await c.env.DB.prepare(`
    SELECT * FROM affiliate_partners ORDER BY created_at DESC
  `).all()

  const conversions = await c.env.DB.prepare(`
    SELECT ac.*, ap.name as affiliate_name, ap.code as affiliate_code, o.order_number
    FROM affiliate_conversions ac
    JOIN affiliate_partners ap ON ac.affiliate_id = ap.id
    JOIN orders o ON ac.order_id = o.id
    ORDER BY ac.created_at DESC
    LIMIT 100
  `).all()

  return c.json({ partners: partners.results, conversions: conversions.results })
})

// PUT /api/admin/affiliates/:id/payout
app.put('/:id/payout', async (c) => {
  const id = parseInt(c.req.param('id'))
  const partner = await c.env.DB.prepare(`SELECT total_earnings, paid_earnings FROM affiliate_partners WHERE id = ?`).bind(id).first() as any
  if (!partner) return c.json({ error: 'Partner not found' }, 404)

  await c.env.DB.prepare(`
    UPDATE affiliate_partners SET paid_earnings = total_earnings WHERE id = ?
  `).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'AFFILIATE_PAYOUT',
    resource_type: 'affiliate_partner',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

export default app
