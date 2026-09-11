-- migrations/004_external_partners.sql
-- Multi-Tenant External Partner Websites Table

CREATE TABLE IF NOT EXISTS external_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id TEXT UNIQUE NOT NULL,
  site_name TEXT NOT NULL,
  site_url TEXT NOT NULL,
  api_key TEXT UNIQUE NOT NULL,
  webhook_url TEXT,
  status TEXT DEFAULT 'active', -- 'active' | 'paused'
  total_orders INTEGER DEFAULT 0,
  paid_orders INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ext_partners_key ON external_partners (api_key);
CREATE INDEX IF NOT EXISTS idx_ext_partners_status ON external_partners (status);

-- Seed existing partner (instatextpro.online)
INSERT OR IGNORE INTO external_partners (
  partner_id, site_name, site_url, api_key, webhook_url, status, notes
) VALUES (
  'partner_instatextpro',
  'InstaTextPro (AI Girl Chat)',
  'https://instatextpro.online',
  'tvh_live_sk_xDuyiXDC4iYVWds2tPiB0FlDgFsOm1g96wPW',
  'https://instatextpro.online/api/webhook/payment',
  'active',
  'Primary AI Girl Chat platform with locked photo microtransactions'
);
