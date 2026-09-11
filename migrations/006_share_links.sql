-- migrations/006_share_links.sql
-- Dynamic Unique Share Link System (/share/:uid)
-- Anti-spam protection for Facebook/WhatsApp & interaction bridge for unmuted video autoplay

CREATE TABLE IF NOT EXISTS share_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uid TEXT UNIQUE NOT NULL,
  product_id INTEGER NOT NULL,
  product_slug TEXT NOT NULL,
  created_by TEXT DEFAULT 'user',
  clicks INTEGER DEFAULT 0,
  last_clicked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_share_links_uid ON share_links(uid);
CREATE INDEX IF NOT EXISTS idx_share_links_product ON share_links(product_id);
