// src/routes/ads.ts — Public Ad Delivery API (Client Storefront)
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

// Helper to ensure ads tables exist (migrated in 002_ads_system.sql)
async function ensureAdsTables(_db: D1Database) {
  // Tables exist permanently in D1 database
}

// GET /api/ads/active — Public endpoint for storefront ad rendering
app.get('/active', async (c) => {
  await ensureAdsTables(c.env.DB)

  // 1. Fetch active networks
  const networksRes = await c.env.DB.prepare(`
    SELECT id, name, provider_type, integration_type, config
    FROM ad_networks
    WHERE status = 'active'
  `).all()

  // 2. Fetch active placements with network info
  const placementsRes = await c.env.DB.prepare(`
    SELECT p.id, p.name, p.placement_key, p.network_id, p.ad_type,
           p.suppress_on_high_intent, p.suppress_on_checkout,
           p.frequency_cap_session, p.custom_code,
           n.name as network_name, n.provider_type as network_provider
    FROM ad_placements p
    LEFT JOIN ad_networks n ON p.network_id = n.id
    WHERE p.status = 'active'
  `).all()

  // 3. Fetch rules
  const rulesRes = await c.env.DB.prepare(`SELECT key, value FROM ad_rules`).all()
  const ruleMap: Record<string, string> = {}
  for (const r of rulesRes.results as any[]) {
    ruleMap[r.key] = r.value
  }

  // Map placements by key for fast lookup in React components
  const placementsByKey: Record<string, any> = {}
  for (const p of placementsRes.results as any[]) {
    placementsByKey[p.placement_key] = p
  }

  return c.json({
    networks: networksRes.results,
    placements: placementsByKey,
    rules: {
      global_header_script: ruleMap.global_header_script || '',
      non_buyer_ads_enabled: ruleMap.non_buyer_ads_enabled === 'true',
      non_buyer_direct_link_url: ruleMap.non_buyer_direct_link_url || '',
      non_buyer_trigger_mode: ruleMap.non_buyer_trigger_mode || 'all',
      non_buyer_frequency_minutes: parseInt(ruleMap.non_buyer_frequency_minutes || '10', 10),
      suppress_on_checkout: ruleMap.suppress_on_checkout !== 'false',
      product_page_back_button_ad: ruleMap.product_page_back_button_ad !== 'false',
    }
  }, 200, {
    // Cache for 60 seconds at edge/browser
    'Cache-Control': 'public, max-age=60',
  })
})

export default app
