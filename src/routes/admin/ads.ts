// src/routes/admin/ads.ts — Production Ads Manager Backend API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AdminVars } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

// Helper to auto-create ads tables if not exists (migrated in 002_ads_system.sql)
async function ensureAdsTables(_db: D1Database) {
  // Tables exist permanently in D1 database
}

// GET /api/admin/ads/overview
app.get('/overview', async (c) => {
  await ensureAdsTables(c.env.DB)

  const networks = await c.env.DB.prepare(`SELECT * FROM ad_networks ORDER BY created_at DESC`).all()
  const placements = await c.env.DB.prepare(`
    SELECT p.*, n.name as network_name, n.provider_type as network_provider
    FROM ad_placements p
    LEFT JOIN ad_networks n ON p.network_id = n.id
    ORDER BY p.created_at DESC
  `).all()
  const campaigns = await c.env.DB.prepare(`
    SELECT c.*, n.name as network_name, p.name as placement_name
    FROM ad_campaigns c
    LEFT JOIN ad_networks n ON c.network_id = n.id
    LEFT JOIN ad_placements p ON c.placement_id = p.id
    ORDER BY c.created_at DESC
  `).all()

  const activeNetworks = networks.results.filter((n: any) => n.status === 'active').length
  const activePlacements = placements.results.filter((p: any) => p.status === 'active').length
  const activeCampaigns = campaigns.results.filter((c: any) => c.status === 'active').length

  return c.json({
    metrics: {
      active_networks: activeNetworks,
      active_placements: activePlacements,
      active_campaigns: activeCampaigns,
      total_impressions: 0,
      total_clicks: 0,
      estimated_revenue: 0,
      estimated_rpm: 0,
    },
    networks: networks.results,
    placements: placements.results,
    campaigns: campaigns.results,
  })
})

// GET /api/admin/ads/networks
app.get('/networks', async (c) => {
  await ensureAdsTables(c.env.DB)
  const res = await c.env.DB.prepare(`SELECT * FROM ad_networks ORDER BY created_at DESC`).all()
  return c.json({ networks: res.results })
})

// POST /api/admin/ads/networks
const networkSchema = z.object({
  name: z.string().min(2),
  provider_type: z.string().min(2),
  status: z.enum(['active', 'paused', 'disabled']).default('active'),
  integration_type: z.enum(['banner', 'native', 'direct_link', 'interstitial', 'multi_tag', 'popunder']).default('banner'),
  config: z.string().optional(),
})

app.post('/networks', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  const parsed = networkSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  const res = await c.env.DB.prepare(`
    INSERT INTO ad_networks (name, provider_type, status, integration_type, config)
    VALUES (?, ?, ?, ?, ?)
  `).bind(d.name, d.provider_type, d.status, d.integration_type, d.config ?? null).run()

  return c.json({ success: true, id: res.meta.last_row_id })
})

// PUT /api/admin/ads/networks/:id
app.put('/networks/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = networkSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: any[] = []

  if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name) }
  if (d.provider_type !== undefined) { fields.push('provider_type = ?'); values.push(d.provider_type) }
  if (d.status !== undefined) { fields.push('status = ?'); values.push(d.status) }
  if (d.integration_type !== undefined) { fields.push('integration_type = ?'); values.push(d.integration_type) }
  if (d.config !== undefined) { fields.push('config = ?'); values.push(d.config) }

  if (!fields.length) return c.json({ error: 'No fields provided' }, 400)
  values.push(id)

  await c.env.DB.prepare(`UPDATE ad_networks SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ success: true })
})

// DELETE /api/admin/ads/networks/:id
app.delete('/networks/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM ad_networks WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// GET /api/admin/ads/placements
app.get('/placements', async (c) => {
  await ensureAdsTables(c.env.DB)
  const res = await c.env.DB.prepare(`
    SELECT p.*, n.name as network_name, n.provider_type as network_provider
    FROM ad_placements p
    LEFT JOIN ad_networks n ON p.network_id = n.id
    ORDER BY p.created_at DESC
  `).all()
  return c.json({ placements: res.results })
})

// POST /api/admin/ads/placements
const placementSchema = z.object({
  name: z.string().min(2),
  placement_key: z.string().min(2),
  network_id: z.number().nullable().optional(),
  ad_type: z.string().default('banner'),
  status: z.enum(['active', 'paused', 'disabled']).default('active'),
  suppress_on_high_intent: z.boolean().default(true),
  suppress_on_checkout: z.boolean().default(true),
  frequency_cap_session: z.number().default(3),
  custom_code: z.string().optional(),
})

app.post('/placements', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  const parsed = placementSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  try {
    const res = await c.env.DB.prepare(`
      INSERT INTO ad_placements (
        name, placement_key, network_id, ad_type, status,
        suppress_on_high_intent, suppress_on_checkout, frequency_cap_session, custom_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      d.name,
      d.placement_key,
      d.network_id ?? null,
      d.ad_type,
      d.status,
      d.suppress_on_high_intent ? 1 : 0,
      d.suppress_on_checkout ? 1 : 0,
      d.frequency_cap_session,
      d.custom_code ?? null
    ).run()

    return c.json({ success: true, id: res.meta.last_row_id })
  } catch (err: any) {
    if (err?.message?.includes('UNIQUE')) {
      return c.json({ error: 'Placement with this key already exists' }, 400)
    }
    return c.json({ error: 'Failed to create placement' }, 500)
  }
})

// PUT /api/admin/ads/placements/:id
app.put('/placements/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = placementSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: any[] = []

  if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name) }
  if (d.placement_key !== undefined) { fields.push('placement_key = ?'); values.push(d.placement_key) }
  if (d.network_id !== undefined) { fields.push('network_id = ?'); values.push(d.network_id) }
  if (d.ad_type !== undefined) { fields.push('ad_type = ?'); values.push(d.ad_type) }
  if (d.status !== undefined) { fields.push('status = ?'); values.push(d.status) }
  if (d.suppress_on_high_intent !== undefined) { fields.push('suppress_on_high_intent = ?'); values.push(d.suppress_on_high_intent ? 1 : 0) }
  if (d.suppress_on_checkout !== undefined) { fields.push('suppress_on_checkout = ?'); values.push(d.suppress_on_checkout ? 1 : 0) }
  if (d.frequency_cap_session !== undefined) { fields.push('frequency_cap_session = ?'); values.push(d.frequency_cap_session) }
  if (d.custom_code !== undefined) { fields.push('custom_code = ?'); values.push(d.custom_code) }

  if (!fields.length) return c.json({ error: 'No fields provided' }, 400)
  values.push(id)

  await c.env.DB.prepare(`UPDATE ad_placements SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ success: true })
})

// DELETE /api/admin/ads/placements/:id
app.delete('/placements/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM ad_placements WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// GET /api/admin/ads/campaigns
app.get('/campaigns', async (c) => {
  await ensureAdsTables(c.env.DB)
  const res = await c.env.DB.prepare(`
    SELECT c.*, n.name as network_name, p.name as placement_name
    FROM ad_campaigns c
    LEFT JOIN ad_networks n ON c.network_id = n.id
    LEFT JOIN ad_placements p ON c.placement_id = p.id
    ORDER BY c.created_at DESC
  `).all()
  return c.json({ campaigns: res.results })
})

// POST /api/admin/ads/campaigns
const campaignSchema = z.object({
  name: z.string().min(2),
  network_id: z.number().nullable().optional(),
  placement_id: z.number().nullable().optional(),
  status: z.enum(['active', 'paused', 'archived']).default('active'),
  target_rule: z.enum(['all', 'low_intent', 'non_buyers']).default('low_intent'),
  max_impressions_day: z.number().default(1000),
})

app.post('/campaigns', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  const parsed = campaignSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  const res = await c.env.DB.prepare(`
    INSERT INTO ad_campaigns (name, network_id, placement_id, status, target_rule, max_impressions_day)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(d.name, d.network_id ?? null, d.placement_id ?? null, d.status, d.target_rule, d.max_impressions_day).run()

  return c.json({ success: true, id: res.meta.last_row_id })
})

// PUT /api/admin/ads/campaigns/:id
app.put('/campaigns/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = campaignSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: any[] = []

  if (d.name !== undefined) { fields.push('name = ?'); values.push(d.name) }
  if (d.network_id !== undefined) { fields.push('network_id = ?'); values.push(d.network_id) }
  if (d.placement_id !== undefined) { fields.push('placement_id = ?'); values.push(d.placement_id) }
  if (d.status !== undefined) { fields.push('status = ?'); values.push(d.status) }
  if (d.target_rule !== undefined) { fields.push('target_rule = ?'); values.push(d.target_rule) }
  if (d.max_impressions_day !== undefined) { fields.push('max_impressions_day = ?'); values.push(d.max_impressions_day) }

  if (!fields.length) return c.json({ error: 'No fields provided' }, 400)
  values.push(id)

  await c.env.DB.prepare(`UPDATE ad_campaigns SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  return c.json({ success: true })
})

// DELETE /api/admin/ads/campaigns/:id
app.delete('/campaigns/:id', async (c) => {
  await ensureAdsTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM ad_campaigns WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// GET & PUT /api/admin/ads/rules — Global Intent & Frequency Rules
app.get('/rules', async (c) => {
  await ensureAdsTables(c.env.DB)
  const rules = await c.env.DB.prepare(`SELECT * FROM ad_rules`).all()
  const ruleMap: Record<string, string> = {}
  for (const r of rules.results as any[]) {
    ruleMap[r.key] = r.value
  }
  return c.json({
    rules: {
      enable_high_intent_suppression: ruleMap.enable_high_intent_suppression ?? 'true',
      suppress_on_buy_click: ruleMap.suppress_on_buy_click ?? 'false',
      suppress_on_checkout: ruleMap.suppress_on_checkout ?? 'true',
      max_impressions_per_session: ruleMap.max_impressions_per_session ?? '5',
      cooldown_hours: ruleMap.cooldown_hours ?? '12',
      non_buyer_ads_enabled: ruleMap.non_buyer_ads_enabled ?? 'true',
      non_buyer_direct_link_url: ruleMap.non_buyer_direct_link_url ?? '',
      non_buyer_trigger_mode: ruleMap.non_buyer_trigger_mode ?? 'all',
      non_buyer_frequency_minutes: ruleMap.non_buyer_frequency_minutes ?? '10',
      global_header_script: ruleMap.global_header_script ?? '',
      product_page_back_button_ad: ruleMap.product_page_back_button_ad ?? 'true',
    }
  })
})

app.put('/rules', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  for (const [key, val] of Object.entries(body)) {
    await c.env.DB.prepare(`
      INSERT INTO ad_rules (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).bind(key, String(val)).run()
  }
  return c.json({ success: true })
})

export default app
