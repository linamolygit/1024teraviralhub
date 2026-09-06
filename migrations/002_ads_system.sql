-- 002_ads_system.sql — Ads Management & Non-Buyer Monetization Engine Tables
CREATE TABLE IF NOT EXISTS ad_networks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  integration_type TEXT DEFAULT 'banner',
  config TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

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
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  network_id INTEGER,
  placement_id INTEGER,
  status TEXT DEFAULT 'active',
  target_rule TEXT DEFAULT 'low_intent',
  max_impressions_day INTEGER DEFAULT 1000,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ad_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
