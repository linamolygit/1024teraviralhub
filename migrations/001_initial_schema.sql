-- ========================================
-- 1024teraviralhub.com — D1 Schema v1
-- Migration: 001_initial_schema.sql
-- ========================================

-- Product Categories
CREATE TABLE IF NOT EXISTS product_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  category_id INTEGER REFERENCES product_categories(id),
  price REAL NOT NULL,
  sale_price REAL,
  currency TEXT DEFAULT 'INR',
  is_published INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  tags TEXT,                    -- JSON array as text
  file_type TEXT,               -- 'image', 'pdf', 'zip', 'template', etc.
  file_count INTEGER DEFAULT 1,
  total_file_size INTEGER,      -- bytes
  license_type TEXT DEFAULT 'personal',
  license_info TEXT,
  usage_instructions TEXT,
  meta_title TEXT,
  meta_description TEXT,
  og_image_key TEXT,            -- R2 key
  button_text TEXT DEFAULT 'Buy',
  download_limit INTEGER DEFAULT 3,
  access_duration_hours INTEGER DEFAULT 12,
  total_sales INTEGER DEFAULT 0,
  total_revenue REAL DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Product Files (stored in R2)
CREATE TABLE IF NOT EXISTS product_files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER,
  file_type TEXT,
  mime_type TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Product Preview Images (stored in R2)
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  alt_text TEXT,
  is_thumbnail INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Admins (Firebase UID based)
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firebase_uid TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin',    -- 'super_admin', 'admin'
  is_active INTEGER DEFAULT 1,
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL UNIQUE,    -- e.g. TVH-20250830-0001
  product_id INTEGER NOT NULL REFERENCES products(id),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'INR',
  status TEXT DEFAULT 'PENDING',        -- PENDING, PAID, FAILED, REFUNDED
  cashfree_order_id TEXT UNIQUE,
  payment_session_id TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  referrer_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Payments (Cashfree transaction records)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  cashfree_payment_id TEXT,
  cashfree_order_id TEXT,
  status TEXT NOT NULL,                 -- SUCCESS, FAILED, PENDING, CANCELLED
  amount REAL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT,                  -- 'upi', 'card', 'netbanking', etc.
  payment_group TEXT,
  bank_reference TEXT,
  error_code TEXT,
  error_description TEXT,
  raw_response TEXT,                    -- JSON stored as text
  created_at TEXT DEFAULT (datetime('now'))
);

-- Download Tokens (12-hour secure access)
CREATE TABLE IF NOT EXISTS download_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  token TEXT NOT NULL UNIQUE,           -- UUID v4
  expires_at TEXT NOT NULL,
  download_count INTEGER DEFAULT 0,
  max_downloads INTEGER DEFAULT 3,
  is_revoked INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Download Logs
CREATE TABLE IF NOT EXISTS download_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token_id INTEGER NOT NULL REFERENCES download_tokens(id),
  file_id INTEGER REFERENCES product_files(id),
  ip_address TEXT,
  user_agent TEXT,
  country TEXT,
  success INTEGER DEFAULT 1,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Blog Categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Blog Posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,              -- HTML/Markdown
  excerpt TEXT,
  author_name TEXT DEFAULT 'Admin',
  category_id INTEGER REFERENCES blog_categories(id),
  thumbnail_key TEXT,                 -- R2 key
  is_published INTEGER DEFAULT 0,
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  meta_title TEXT,
  meta_description TEXT,
  tags TEXT,                          -- JSON array
  published_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Website Settings (key-value store)
CREATE TABLE IF NOT EXISTS website_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,                -- JSON stored as text
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Admin Audit Logs
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_uid TEXT NOT NULL,
  admin_email TEXT,
  action TEXT NOT NULL,               -- 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', etc.
  resource_type TEXT,                 -- 'product', 'order', 'blog_post', etc.
  resource_id TEXT,
  details TEXT,                       -- JSON
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Webhook Logs (Cashfree)
CREATE TABLE IF NOT EXISTS webhook_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT DEFAULT 'cashfree',
  event_type TEXT,
  cashfree_order_id TEXT,
  payload TEXT NOT NULL,              -- Raw JSON body
  signature_valid INTEGER DEFAULT 0,
  processed INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Analytics Events
CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,           -- 'page_view', 'product_view', 'checkout_start', 'purchase'
  product_id INTEGER REFERENCES products(id),
  order_id INTEGER REFERENCES orders(id),
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  metadata TEXT,                      -- JSON
  created_at TEXT DEFAULT (datetime('now'))
);

-- Contact Messages
CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read INTEGER DEFAULT 0,
  ip_address TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Coupons & Offers
CREATE TABLE IF NOT EXISTS coupons (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,         -- 'percent' or 'fixed'
  discount_value REAL NOT NULL,
  min_spend REAL DEFAULT 0,
  max_uses INTEGER DEFAULT 0,          -- 0 = unlimited
  used_count INTEGER DEFAULT 0,
  expires_at TEXT,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Product Reviews
CREATE TABLE IF NOT EXISTS product_reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  rating INTEGER NOT NULL,             -- 1 to 5
  comment TEXT NOT NULL,
  is_verified_purchase INTEGER DEFAULT 0,
  is_approved INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Affiliate Partners
CREATE TABLE IF NOT EXISTS affiliate_partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  code TEXT NOT NULL UNIQUE,           -- e.g. AFF-RAHUL
  commission_percent REAL DEFAULT 20.0,
  upi_id TEXT,
  total_earnings REAL DEFAULT 0,
  paid_earnings REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Affiliate Conversions
CREATE TABLE IF NOT EXISTS affiliate_conversions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_id INTEGER NOT NULL REFERENCES affiliate_partners(id),
  order_id INTEGER NOT NULL REFERENCES orders(id),
  order_amount REAL NOT NULL,
  commission_amount REAL NOT NULL,
  status TEXT DEFAULT 'PENDING',        -- PENDING, APPROVED, PAID
  created_at TEXT DEFAULT (datetime('now'))
);

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_number TEXT NOT NULL UNIQUE,   -- e.g. TKT-1001
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  order_number TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'OPEN',           -- OPEN, IN_PROGRESS, RESOLVED, CLOSED
  priority TEXT DEFAULT 'NORMAL',       -- LOW, NORMAL, HIGH, URGENT
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- ========================================
-- INDEXES
-- ========================================

CREATE INDEX IF NOT EXISTS idx_affiliate_code ON affiliate_partners(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_conv_aff ON affiliate_conversions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_num ON support_tickets(ticket_number);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved ON product_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_products_slug ON products(slug);
CREATE INDEX IF NOT EXISTS idx_products_published ON products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_cashfree_id ON orders(cashfree_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_product ON orders(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

CREATE INDEX IF NOT EXISTS idx_download_tokens_token ON download_tokens(token);
CREATE INDEX IF NOT EXISTS idx_download_tokens_order ON download_tokens(order_id);
CREATE INDEX IF NOT EXISTS idx_download_tokens_expiry ON download_tokens(expires_at);

CREATE INDEX IF NOT EXISTS idx_download_logs_token ON download_logs(token_id);
CREATE INDEX IF NOT EXISTS idx_download_logs_created ON download_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(is_published);

CREATE INDEX IF NOT EXISTS idx_analytics_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_product ON analytics_events(product_id);
CREATE INDEX IF NOT EXISTS idx_analytics_created ON analytics_events(created_at);

CREATE INDEX IF NOT EXISTS idx_audit_logs_uid ON admin_audit_logs(admin_uid);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON admin_audit_logs(created_at);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_cashfree_order ON webhook_logs(cashfree_order_id);

-- ========================================
-- SEED DEFAULT SETTINGS
-- ========================================

INSERT OR IGNORE INTO website_settings (key, value) VALUES
  ('site_name', '"1024TeraViralHub"'),
  ('site_tagline', '"Premium Digital Products"'),
  ('site_description', '"Download premium digital products — photo packs, wallpapers, templates and more."'),
  ('contact_email', '"support@1024teraviralhub.com"'),
  ('contact_phone', '""'),
  ('social_links', '{"facebook":"","instagram":"","twitter":"","youtube":""}'),
  ('homepage_hero_title', '"Premium Digital Products for Creators"'),
  ('homepage_hero_subtitle', '"High-quality wallpapers, photo packs, templates & more. Instant download after payment."'),
  ('announcement_banner', '{"enabled":false,"text":"","link":"","type":"info"}'),
  ('cashfree_mode', '"sandbox"'),
  ('download_expiry_hours', '12'),
  ('max_downloads_per_order', '3'),
  ('maintenance_mode', 'false');

-- Seed Default Categories
INSERT OR IGNORE INTO product_categories (name, slug, description, icon, sort_order) VALUES
  ('Wallpapers', 'wallpapers', 'High-quality wallpapers for desktop and mobile', '🖼️', 1),
  ('Photo Packs', 'photo-packs', 'Premium photo collections for personal and commercial use', '📷', 2),
  ('Templates', 'templates', 'Ready-to-use design templates', '📐', 3),
  ('PDF Products', 'pdf-products', 'E-books, guides, and PDF resources', '📄', 4),
  ('ZIP Bundles', 'zip-bundles', 'Complete digital asset bundles', '📦', 5),
  ('Graphics', 'graphics', 'Vector graphics, icons, and design elements', '🎨', 6);
