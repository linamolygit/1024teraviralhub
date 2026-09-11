-- migrations/005_image_deduplication.sql
-- Global Media Assets Registry & Image Content Deduplication System
-- Eliminates duplicate uploads, saves R2 storage, and tracks reference counts across products

-- 1. Media Assets Registry (Content-Addressable Storage Index)
CREATE TABLE IF NOT EXISTS media_assets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  content_hash TEXT NOT NULL UNIQUE,
  r2_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  variants_json TEXT,
  reference_count INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_media_assets_key ON media_assets(r2_key);

-- 2. Add deduplication columns to product_images
-- (Handled safely with ALTER TABLE or ensureMediaDedupTables in code)
-- ALTER TABLE product_images ADD COLUMN content_hash TEXT;
-- ALTER TABLE product_images ADD COLUMN file_size INTEGER DEFAULT 0;
-- ALTER TABLE product_images ADD COLUMN original_filename TEXT;

CREATE INDEX IF NOT EXISTS idx_product_images_content_hash ON product_images(content_hash);
CREATE INDEX IF NOT EXISTS idx_product_images_r2_key ON product_images(r2_key);

-- 3. Add deduplication column to product_files (deliverables)
-- ALTER TABLE product_files ADD COLUMN content_hash TEXT;
CREATE INDEX IF NOT EXISTS idx_product_files_content_hash ON product_files(content_hash);
