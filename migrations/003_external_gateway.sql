-- ============================================================
-- Migration 003: External Payment Gateway & Multi-Site Bridge
-- Supports instatextpro.online 1-Click PhonePe/UPI Microtransactions
-- ============================================================

CREATE TABLE IF NOT EXISTS external_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,
  origin_site TEXT NOT NULL DEFAULT 'instatextpro.online',
  item_id TEXT NOT NULL,
  item_name TEXT DEFAULT 'AI Chat Media Unlock',
  chat_session_id TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'PENDING',
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  cashfree_order_id TEXT UNIQUE,
  payment_session_id TEXT,
  phonepe_deep_link TEXT,
  upi_intent_json TEXT,
  return_url TEXT,
  webhook_url TEXT,
  webhook_delivered INTEGER DEFAULT 0,
  webhook_response TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_external_orders_order_number ON external_orders(order_number);
CREATE INDEX IF NOT EXISTS idx_external_orders_cashfree_id ON external_orders(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_external_orders_origin ON external_orders(origin_site);

-- Initial settings for partner API
INSERT OR IGNORE INTO website_settings (key, value) VALUES ('external_payments_enabled', '1');
INSERT OR IGNORE INTO website_settings (key, value) VALUES ('external_partner_api_key', 'tvh_sec_live_9f83a7c4e21b058d9237416e582914ca');
INSERT OR IGNORE INTO website_settings (key, value) VALUES ('external_allowed_origins', 'https://instatextpro.online,http://localhost:3000');
