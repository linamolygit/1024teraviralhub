// src/routes/admin/gateways.ts
// Admin API for managing multi-site external payment gateways

import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

function generateApiKey(): string {
  // Modern Enterprise Base62 API Key (Stripe / OpenAI / Meta standard)
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const randomBytes = new Uint8Array(36)
  crypto.getRandomValues(randomBytes)
  let randomString = ''
  for (let i = 0; i < randomBytes.length; i++) {
    randomString += charset[randomBytes[i] % charset.length]
  }
  return `tvh_live_sk_${randomString}`
}

function generatePartnerId(siteName: string): string {
  const slug = siteName.toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 16)
  return `partner_${slug}_${Math.random().toString(36).substring(2, 6)}`
}

// GET /api/admin/gateways/stats
// Overall multi-site analytics
app.get('/stats', async (c) => {
  const partnerStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as total_partners,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_partners,
      COALESCE(SUM(total_orders), 0) as partner_total_orders,
      COALESCE(SUM(paid_orders), 0) as partner_paid_orders,
      COALESCE(SUM(total_revenue), 0) as partner_total_revenue
    FROM external_partners
  `).first<{
    total_partners: number
    active_partners: number
    partner_total_orders: number
    partner_paid_orders: number
    partner_total_revenue: number
  }>()

  const orderStats = await c.env.DB.prepare(`
    SELECT 
      COUNT(*) as actual_total_orders,
      SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as actual_paid_orders,
      COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as actual_total_revenue
    FROM external_orders
  `).first<{
    actual_total_orders: number
    actual_paid_orders: number
    actual_total_revenue: number
  }>()

  const globalSetting = await c.env.DB.prepare(
    `SELECT value FROM website_settings WHERE key = 'external_payments_enabled'`
  ).first<{ value: string }>()

  const isGlobalEnabled = globalSetting ? globalSetting.value === '1' || globalSetting.value === 'true' : true

  return c.json({
    total_partners: partnerStats?.total_partners ?? 0,
    active_partners: partnerStats?.active_partners ?? 0,
    total_orders: orderStats?.actual_total_orders ?? 0,
    paid_orders: orderStats?.actual_paid_orders ?? 0,
    total_revenue: orderStats?.actual_total_revenue ?? 0,
    global_enabled: isGlobalEnabled,
    stealth_mode_active: true,
  })
})

// POST /api/admin/gateways/toggle-global
// Master kill switch for all external gateway traffic
app.post('/toggle-global', async (c) => {
  const { enabled } = await c.req.json() as { enabled: boolean }
  const val = enabled ? '1' : '0'

  await c.env.DB.prepare(`
    INSERT INTO website_settings (key, value, updated_at)
    VALUES ('external_payments_enabled', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).bind(val).run()

  return c.json({ success: true, enabled })
})

// GET /api/admin/gateways/partners
// List all registered partner websites
app.get('/partners', async (c) => {
  const partners = await c.env.DB.prepare(`
    SELECT * FROM external_partners ORDER BY created_at DESC
  `).all()

  return c.json({ partners: partners.results })
})

// POST /api/admin/gateways/partners
// Register a new partner website (Site 2, Site 3, etc.)
app.post('/partners', async (c) => {
  const body = await c.req.json() as {
    site_name: string
    site_url: string
    webhook_url?: string
    notes?: string
  }

  if (!body.site_name || !body.site_url) {
    return c.json({ error: 'Site name and Site URL are required' }, 400)
  }

  // Normalize site_url
  let siteUrl = body.site_url.trim().toLowerCase()
  if (!siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    siteUrl = 'https://' + siteUrl
  }
  siteUrl = siteUrl.replace(/\/+$/, '') // strip trailing slash

  const partnerId = generatePartnerId(body.site_name)
  const apiKey = generateApiKey()
  const webhookUrl = body.webhook_url?.trim() || `${siteUrl}/api/webhook/payment`

  await c.env.DB.prepare(`
    INSERT INTO external_partners (
      partner_id, site_name, site_url, api_key, webhook_url, status, notes
    ) VALUES (?, ?, ?, ?, ?, 'active', ?)
  `).bind(
    partnerId,
    body.site_name.trim(),
    siteUrl,
    apiKey,
    webhookUrl,
    body.notes?.trim() || null
  ).run()

  const created = await c.env.DB.prepare(`SELECT * FROM external_partners WHERE partner_id = ?`).bind(partnerId).first()
  return c.json({ success: true, partner: created })
})

// PUT /api/admin/gateways/partners/:id
// Update partner site configuration
app.put('/partners/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json() as {
    site_name?: string
    site_url?: string
    webhook_url?: string
    status?: 'active' | 'paused'
    notes?: string
  }

  const existing = await c.env.DB.prepare(`SELECT * FROM external_partners WHERE id = ?`).bind(id).first()
  if (!existing) {
    return c.json({ error: 'Partner site not found' }, 404)
  }

  let siteUrl = body.site_url ? body.site_url.trim().toLowerCase().replace(/\/+$/, '') : undefined
  if (siteUrl && !siteUrl.startsWith('http://') && !siteUrl.startsWith('https://')) {
    siteUrl = 'https://' + siteUrl
  }

  await c.env.DB.prepare(`
    UPDATE external_partners
    SET site_name = COALESCE(?, site_name),
        site_url = COALESCE(?, site_url),
        webhook_url = COALESCE(?, webhook_url),
        status = COALESCE(?, status),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    body.site_name?.trim() ?? null,
    siteUrl ?? null,
    body.webhook_url?.trim() ?? null,
    body.status ?? null,
    body.notes?.trim() ?? null,
    id
  ).run()

  const updated = await c.env.DB.prepare(`SELECT * FROM external_partners WHERE id = ?`).bind(id).first()
  return c.json({ success: true, partner: updated })
})

// POST /api/admin/gateways/partners/:id/regenerate-key
// Regenerate API secret key for a specific partner
app.post('/partners/:id/regenerate-key', async (c) => {
  const id = c.req.param('id')
  const newKey = generateApiKey()

  const res = await c.env.DB.prepare(`
    UPDATE external_partners
    SET api_key = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(newKey, id).run()

  if (res.meta.changes === 0) {
    return c.json({ error: 'Partner not found' }, 404)
  }

  return c.json({ success: true, api_key: newKey })
})

// DELETE /api/admin/gateways/partners/:id
// Delete a partner site
app.delete('/partners/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM external_partners WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// GET /api/admin/gateways/transactions
// Recent external orders list
app.get('/transactions', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
  const status = c.req.query('status')
  const partnerId = c.req.query('partner_id')

  let query = `SELECT * FROM external_orders`
  const conditions: string[] = []
  const bindings: any[] = []

  if (status) {
    conditions.push(`status = ?`)
    bindings.push(status)
  }
  if (partnerId) {
    conditions.push(`(origin_site = ? OR origin_site LIKE ? )`)
    bindings.push(partnerId, `%${partnerId}%`)
  }

  if (conditions.length > 0) {
    query += ` WHERE ` + conditions.join(' AND ')
  }

  query += ` ORDER BY created_at DESC LIMIT ?`
  bindings.push(limit)

  const stmt = c.env.DB.prepare(query)
  const rows = await stmt.bind(...bindings).all()

  return c.json({ transactions: rows.results })
})

export default app
