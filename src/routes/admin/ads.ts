// src/routes/admin/ads.ts — Production Ads Manager Backend API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AdminVars } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

// Helper to auto-create ads tables if not exists (migrated in 002_ads_system.sql)
async function ensureAdsTables(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ad_networks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      provider_type TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      integration_type TEXT DEFAULT 'banner',
      config TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {})

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ad_placements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      placement_key TEXT NOT NULL UNIQUE,
      network_id INTEGER,
      ad_type TEXT DEFAULT 'banner',
      status TEXT DEFAULT 'active',
      suppress_on_high_intent INTEGER DEFAULT 1,
      suppress_on_checkout INTEGER DEFAULT 1,
      frequency_cap_session INTEGER DEFAULT 3,
      custom_code TEXT,
      target_page TEXT DEFAULT 'all',
      device_visibility TEXT DEFAULT 'all',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {})

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ad_campaigns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      network_id INTEGER,
      placement_id INTEGER,
      status TEXT DEFAULT 'active',
      target_rule TEXT DEFAULT 'low_intent',
      max_impressions_day INTEGER DEFAULT 1000,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {})

  await db.prepare(`
    CREATE TABLE IF NOT EXISTS ad_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `).run().catch(() => {})

  // Safe migration of columns if table already existed without them
  try {
    await db.prepare(`ALTER TABLE ad_placements ADD COLUMN target_page TEXT DEFAULT 'all'`).run()
  } catch {}
  try {
    await db.prepare(`ALTER TABLE ad_placements ADD COLUMN device_visibility TEXT DEFAULT 'all'`).run()
  } catch {}
}

const STANDARD_PLACEMENTS = [
  // ─── Global High-Impact Units ───
  {
    name: 'Global Header - Leaderboard Banner (Under Nav)',
    placement_key: 'header_global_banner',
    ad_type: 'responsive',
    target_page: 'all',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Global Anchor Ad - High-CPM Sticky Bottom Banner',
    placement_key: 'global_anchor_ad',
    ad_type: 'sticky_anchor',
    target_page: 'all',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Global Slider Ad - Floating Corner 300x250 Unit',
    placement_key: 'global_slider_ad',
    ad_type: 'slider',
    target_page: 'all',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Global Vignette Ad - Interstitial Page Transition',
    placement_key: 'global_vignette_ad',
    ad_type: 'interstitial',
    target_page: 'all',
    device_visibility: 'all',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 2,
  },

  // ─── Homepage ───
  {
    name: 'Homepage - Top Leaderboard Banner (Above Fold)',
    placement_key: 'home_top_banner',
    ad_type: 'responsive',
    target_page: 'home',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Homepage - Mid Content Banner',
    placement_key: 'home_banner_mid',
    ad_type: 'responsive',
    target_page: 'home',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Homepage - Bottom Banner (Above Footer)',
    placement_key: 'home_bottom_banner',
    ad_type: 'responsive',
    target_page: 'home',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },

  // ─── Product Page ───
  {
    name: 'Product Details - Top Header Leaderboard Banner',
    placement_key: 'product_header_banner',
    ad_type: 'responsive',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Product Details - Below Image & Title',
    placement_key: 'product_below_image',
    ad_type: 'responsive',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Product Details - Below Buy Box & Urgency Unit',
    placement_key: 'product_details_banner',
    ad_type: 'responsive',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Product Details - Below Guarantee & Highlights',
    placement_key: 'product_below_buy',
    ad_type: 'responsive',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Product Details - 300x250 Medium Rectangle Box',
    placement_key: 'product_300x250_box',
    ad_type: 'banner_300x250',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Product Details - Above Customer Reviews',
    placement_key: 'product_bottom_banner',
    ad_type: 'responsive',
    target_page: 'product',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },

  // ─── Checkout Page (Specially Requested) ───
  {
    name: 'Checkout Page - Top Leaderboard Ad Banner',
    placement_key: 'checkout_top_banner',
    ad_type: 'responsive',
    target_page: 'checkout',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: false,
    frequency_cap_session: 5,
  },
  {
    name: 'Checkout Page - 300x250 Sidebar Order Ad',
    placement_key: 'checkout_sidebar_banner',
    ad_type: 'banner_300x250',
    target_page: 'checkout',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: false,
    frequency_cap_session: 5,
  },
  {
    name: 'Checkout Page - Bottom Guarantee Ad Banner',
    placement_key: 'checkout_bottom_banner',
    ad_type: 'responsive',
    target_page: 'checkout',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: false,
    frequency_cap_session: 5,
  },

  // ─── Shop & Catalog ───
  {
    name: 'Shop Catalog - Top Leaderboard',
    placement_key: 'category_top_banner',
    ad_type: 'responsive',
    target_page: 'products',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Shop Catalog - Bottom Banner',
    placement_key: 'category_bottom_banner',
    ad_type: 'responsive',
    target_page: 'products',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },

  // ─── Blog Post ───
  {
    name: 'Blog Post - Above Article Title',
    placement_key: 'blog_top_banner',
    ad_type: 'responsive',
    target_page: 'blog',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Blog Post - In-Article Mid Paragraph',
    placement_key: 'blog_mid_article',
    ad_type: 'responsive',
    target_page: 'blog',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },
  {
    name: 'Blog Post - End of Post Banner',
    placement_key: 'blog_bottom_banner',
    ad_type: 'responsive',
    target_page: 'blog',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 10,
  },

  // ─── Utilities ───
  {
    name: 'Order Lookup - Status Page Banner',
    placement_key: 'order_lookup_banner',
    ad_type: 'responsive',
    target_page: 'order-lookup',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: true,
    frequency_cap_session: 5,
  },
  {
    name: 'Delivery Download - Post Download Banner',
    placement_key: 'download_page_banner',
    ad_type: 'responsive',
    target_page: 'download',
    device_visibility: 'all',
    suppress_on_high_intent: false,
    suppress_on_checkout: false,
    frequency_cap_session: 5,
  },
]

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
  target_page: z.string().default('all').optional(),
  device_visibility: z.enum(['all', 'desktop', 'mobile']).default('all').optional(),
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
        suppress_on_high_intent, suppress_on_checkout, frequency_cap_session,
        custom_code, target_page, device_visibility
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      d.name,
      d.placement_key,
      d.network_id ?? null,
      d.ad_type,
      d.status,
      d.suppress_on_high_intent ? 1 : 0,
      d.suppress_on_checkout ? 1 : 0,
      d.frequency_cap_session,
      d.custom_code ?? null,
      d.target_page ?? 'all',
      d.device_visibility ?? 'all'
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
  if (d.target_page !== undefined) { fields.push('target_page = ?'); values.push(d.target_page) }
  if (d.device_visibility !== undefined) { fields.push('device_visibility = ?'); values.push(d.device_visibility) }

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

// POST /api/admin/ads/seed-standard-placements — Auto-create high-performing standard slots
app.post('/seed-standard-placements', async (c) => {
  await ensureAdsTables(c.env.DB)
  let count = 0
  for (const p of STANDARD_PLACEMENTS) {
    try {
      const res = await c.env.DB.prepare(`
        INSERT INTO ad_placements (
          name, placement_key, ad_type, status,
          suppress_on_high_intent, suppress_on_checkout,
          frequency_cap_session, target_page, device_visibility
        ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
        ON CONFLICT(placement_key) DO NOTHING
      `).bind(
        p.name,
        p.placement_key,
        p.ad_type,
        p.suppress_on_high_intent ? 1 : 0,
        p.suppress_on_checkout ? 1 : 0,
        p.frequency_cap_session,
        p.target_page,
        p.device_visibility
      ).run()
      if (res.meta?.changes && res.meta.changes > 0) count++
    } catch {}
  }
  return c.json({ success: true, seeded_count: count })
})

// GET /api/admin/ads/ads-txt — Fetch live ads.txt content
app.get('/ads-txt', async (c) => {
  await ensureAdsTables(c.env.DB)
  const defaultAdsTxt = `google.com, pub-2291828876695516, DIRECT, f08c47fec0942fa0\n`
  try {
    const row = await c.env.DB.prepare(`SELECT value FROM ad_rules WHERE key = 'ads_txt_content'`).first<{ value: string }>()
    const content = (row?.value && row.value.trim().length > 0) ? row.value : defaultAdsTxt
    const lines = content.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
    return c.json({
      content,
      is_custom: Boolean(row?.value && row.value.trim().length > 0),
      line_count: lines.length,
      live_url: 'https://1024teraviralhub.com/ads.txt'
    })
  } catch (err: any) {
    return c.json({ content: defaultAdsTxt, is_custom: false, line_count: 1, error: err?.message }, 500)
  }
})

// PUT /api/admin/ads/ads-txt — Update live ads.txt content
const adsTxtSchema = z.object({
  content: z.string(),
})

app.put('/ads-txt', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  const parsed = adsTxtSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const content = parsed.data.content.trim()
  await c.env.DB.prepare(`
    INSERT INTO ad_rules (key, value) VALUES ('ads_txt_content', ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).bind(content).run()

  const lines = content.split('\n').filter(l => l.trim().length > 0 && !l.trim().startsWith('#'))
  return c.json({
    success: true,
    message: 'ads.txt updated successfully and is now active at /ads.txt',
    line_count: lines.length
  })
})

// GET /api/admin/ads/global-settings — Fetch AdSense Auto-Ads, Head Scripts, GAM/AdX
app.get('/global-settings', async (c) => {
  await ensureAdsTables(c.env.DB)
  const rows = await c.env.DB.prepare(
    `SELECT key, value FROM website_settings WHERE key IN ('adsense_enabled', 'adsense_publisher_id', 'adsense_head_code', 'adx_enabled', 'adx_head_code')`
  ).all()

  const settings: Record<string, any> = {}
  for (const r of (rows.results || []) as { key: string; value: string }[]) {
    try { settings[r.key] = JSON.parse(r.value) } catch { settings[r.key] = r.value }
  }

  const ruleRows = await c.env.DB.prepare(
    `SELECT key, value FROM ad_rules WHERE key IN ('global_header_script', 'ads_txt_content')`
  ).all()
  const rules: Record<string, string> = {}
  for (const r of (ruleRows.results || []) as { key: string; value: string }[]) {
    rules[r.key] = r.value
  }

  return c.json({
    settings: {
      adsense_enabled: settings.adsense_enabled !== false && settings.adsense_enabled !== 'false',
      adsense_publisher_id: settings.adsense_publisher_id || 'ca-pub-2291828876695516',
      adsense_head_code: settings.adsense_head_code || '',
      adx_enabled: Boolean(settings.adx_enabled === true || settings.adx_enabled === 'true'),
      adx_head_code: settings.adx_head_code || '',
      global_header_script: rules.global_header_script || '',
    }
  })
})

// PUT /api/admin/ads/global-settings — Update AdSense, AdX, and Global Head Script
const globalSettingsSchema = z.object({
  adsense_enabled: z.boolean().optional(),
  adsense_publisher_id: z.string().optional(),
  adsense_head_code: z.string().optional(),
  adx_enabled: z.boolean().optional(),
  adx_head_code: z.string().optional(),
  global_header_script: z.string().optional(),
})

app.put('/global-settings', async (c) => {
  await ensureAdsTables(c.env.DB)
  const body = await c.req.json()
  const parsed = globalSettingsSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data

  const wsUpdates: Array<[string, string]> = []
  if (d.adsense_enabled !== undefined) wsUpdates.push(['adsense_enabled', JSON.stringify(d.adsense_enabled)])
  if (d.adsense_publisher_id !== undefined) wsUpdates.push(['adsense_publisher_id', JSON.stringify(d.adsense_publisher_id.trim())])
  if (d.adsense_head_code !== undefined) wsUpdates.push(['adsense_head_code', JSON.stringify(d.adsense_head_code.trim())])
  if (d.adx_enabled !== undefined) wsUpdates.push(['adx_enabled', JSON.stringify(d.adx_enabled)])
  if (d.adx_head_code !== undefined) wsUpdates.push(['adx_head_code', JSON.stringify(d.adx_head_code.trim())])

  for (const [k, v] of wsUpdates) {
    await c.env.DB.prepare(`
      INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).bind(k, v).run()
  }

  if (d.global_header_script !== undefined) {
    await c.env.DB.prepare(`
      INSERT INTO ad_rules (key, value) VALUES ('global_header_script', ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
    `).bind(d.global_header_script.trim()).run()
  }

  return c.json({ success: true, message: 'Global AdSense, AdX & Header Scripts saved successfully.' })
})

export default app
