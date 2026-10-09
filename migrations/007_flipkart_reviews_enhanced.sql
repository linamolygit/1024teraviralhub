-- 007_flipkart_reviews_enhanced.sql
-- Add customer review photos, titles, and helpful counts for Flipkart-style review UI
ALTER TABLE product_reviews ADD COLUMN image_url TEXT;
ALTER TABLE product_reviews ADD COLUMN title TEXT;
ALTER TABLE product_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN unhelpful_count INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN review_images TEXT;
