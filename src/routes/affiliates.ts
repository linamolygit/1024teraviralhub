// src/routes/affiliates.ts — Public Affiliate Partner Registration & Lookup
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  upi_id: z.string().min(3).max(100),
})

// POST /api/affiliates/register
app.post('/register', async (c) => {
  const body = await c.req.json()
  const parsed = registerSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  const rawCode = `AFF-${d.name.replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`

  try {
    const res = await c.env.DB.prepare(`
      INSERT INTO affiliate_partners (name, email, code, upi_id, commission_percent, is_active)
      VALUES (?, ?, ?, ?, 20.0, 1)
    `).bind(d.name, d.email, rawCode, d.upi_id).run()

    const siteUrl = c.env.SITE_URL || `${new URL(c.req.url).origin}`
    return c.json({
      success: true,
      code: rawCode,
      referral_link: `${siteUrl}/?ref=${rawCode}`,
      commission_percent: 20.0,
    })
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      const existing = await c.env.DB.prepare(`SELECT code, commission_percent, total_earnings FROM affiliate_partners WHERE email = ?`).bind(d.email).first()
      return c.json({ success: true, ...existing, note: 'Existing account found' })
    }
    return c.json({ error: 'Registration failed' }, 500)
  }
})

// GET /api/affiliates/stats/:code
app.get('/stats/:code', async (c) => {
  const code = c.req.param('code')
  const partner = await c.env.DB.prepare(`
    SELECT id, name, code, commission_percent, total_earnings, paid_earnings
    FROM affiliate_partners WHERE code = ? AND is_active = 1
  `).bind(code).first()

  if (!partner) return c.json({ error: 'Affiliate not found' }, 404)

  const conversions = await c.env.DB.prepare(`
    SELECT COUNT(*) as total_sales, SUM(commission_amount) as pending_earnings
    FROM affiliate_conversions WHERE affiliate_id = ?
  `).bind((partner as any).id).first()

  return c.json({ partner, conversions })
})

export default app
