// ============================================
// src/lib/db.ts — Typed D1 Database Helpers
// ============================================

import type { Env } from '../worker'

export type DBContext = { DB: D1Database }

// ─── Products ───────────────────────────────

export async function getPublishedProducts(db: D1Database, opts?: {
  categorySlug?: string
  limit?: number
  offset?: number
  featured?: boolean
  q?: string
  sort?: string
}) {
  let query = `
    SELECT p.*, pc.name as category_name, pc.slug as category_slug
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.is_published = 1
  `
  const params: (string | number)[] = []

  if (opts?.categorySlug) {
    query += ` AND pc.slug = ?`
    params.push(opts.categorySlug)
  }
  if (opts?.featured) {
    query += ` AND p.is_featured = 1`
  }
  if (opts?.q) {
    query += ` AND (p.title LIKE ? OR p.description LIKE ?)`
    const term = `%${opts.q}%`
    params.push(term, term)
  }

  // Sorting
  if (opts?.sort === 'price_asc') {
    query += ` ORDER BY COALESCE(p.sale_price, p.price) ASC`
  } else if (opts?.sort === 'price_desc') {
    query += ` ORDER BY COALESCE(p.sale_price, p.price) DESC`
  } else if (opts?.sort === 'popular') {
    query += ` ORDER BY p.is_featured DESC, p.created_at DESC`
  } else {
    // Default newest
    query += ` ORDER BY p.sort_order ASC, p.created_at DESC`
  }

  if (opts?.limit) {
    query += ` LIMIT ?`
    params.push(opts.limit)
  }
  if (opts?.offset) {
    query += ` OFFSET ?`
    params.push(opts.offset)
  }

  const stmt = db.prepare(query)
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
  return result.results as unknown as Product[]
}

export async function getProductBySlug(db: D1Database, slug: string) {
  const product = await db.prepare(`
    SELECT p.*, pc.name as category_name, pc.slug as category_slug
    FROM products p
    LEFT JOIN product_categories pc ON p.category_id = pc.id
    WHERE p.slug = ? AND p.is_published = 1
  `).bind(slug).first() as Product | null

  if (!product) return null

  const [images, files] = await Promise.all([
    db.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`)
      .bind(product.id).all(),
    db.prepare(`SELECT id, product_id, original_filename, file_size, file_type, sort_order FROM product_files WHERE product_id = ? ORDER BY sort_order ASC`)
      .bind(product.id).all(),
  ])

  return {
    ...product,
    images: images.results as unknown as ProductImage[],
    files: files.results as unknown as Omit<ProductFile, 'r2_key'>[],
  }
}

export async function getProductById(db: D1Database, id: number) {
  return db.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first() as Promise<Product | null>
}

// ─── Orders ─────────────────────────────────

export async function createOrder(db: D1Database, data: {
  order_number: string
  product_id: number
  customer_name: string
  customer_email: string
  customer_phone?: string
  amount: number
  cashfree_order_id: string
  payment_session_id: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  referrer_url?: string
  ip_address?: string
}) {
  const result = await db.prepare(`
    INSERT INTO orders (
      order_number, product_id, customer_name, customer_email, customer_phone,
      amount, cashfree_order_id, payment_session_id,
      utm_source, utm_medium, utm_campaign, referrer_url, ip_address, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')
  `).bind(
    data.order_number,
    data.product_id,
    data.customer_name,
    data.customer_email,
    data.customer_phone ?? null,
    data.amount,
    data.cashfree_order_id,
    data.payment_session_id,
    data.utm_source ?? null,
    data.utm_medium ?? null,
    data.utm_campaign ?? null,
    data.referrer_url ?? null,
    data.ip_address ?? null,
  ).run()

  return result.meta.last_row_id as number
}

export async function getOrderByNumber(db: D1Database, orderNumber: string) {
  return db.prepare(`SELECT * FROM orders WHERE order_number = ?`)
    .bind(orderNumber).first() as Promise<Order | null>
}

export async function getOrderByCashfreeId(db: D1Database, cashfreeOrderId: string) {
  return db.prepare(`SELECT * FROM orders WHERE cashfree_order_id = ?`)
    .bind(cashfreeOrderId).first() as Promise<Order | null>
}

export async function updateOrderStatus(db: D1Database, orderId: number, status: string) {
  await db.prepare(`
    UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(status, orderId).run()
}

// ─── Download Tokens ─────────────────────────

export async function createDownloadToken(db: D1Database, orderId: number, expiryHours: number, maxDownloads: number) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString()

  await db.prepare(`
    INSERT INTO download_tokens (order_id, token, expires_at, max_downloads)
    VALUES (?, ?, ?, ?)
  `).bind(orderId, token, expiresAt, maxDownloads).run()

  return token
}

export async function verifyDownloadToken(db: D1Database, token: string) {
  const tokenRecord = await db.prepare(`
    SELECT dt.*, o.status as order_status, o.product_id
    FROM download_tokens dt
    JOIN orders o ON dt.order_id = o.id
    WHERE dt.token = ? AND dt.is_revoked = 0
  `).bind(token).first() as (DownloadToken & { order_status: string; product_id: number }) | null

  if (!tokenRecord) return { valid: false, reason: 'Token not found' }
  if (tokenRecord.order_status !== 'PAID') return { valid: false, reason: 'Payment not verified' }
  if (new Date(tokenRecord.expires_at) < new Date()) return { valid: false, reason: 'Download link expired' }
  if (tokenRecord.download_count >= tokenRecord.max_downloads) return { valid: false, reason: 'Download limit reached' }

  return { valid: true, tokenRecord }
}

export async function incrementDownloadCount(db: D1Database, tokenId: number) {
  await db.prepare(`
    UPDATE download_tokens SET download_count = download_count + 1 WHERE id = ?
  `).bind(tokenId).run()
}

export async function logDownload(db: D1Database, data: {
  token_id: number
  file_id?: number
  ip_address?: string
  user_agent?: string
  success?: boolean
}) {
  await db.prepare(`
    INSERT INTO download_logs (token_id, file_id, ip_address, user_agent, success)
    VALUES (?, ?, ?, ?, ?)
  `).bind(
    data.token_id,
    data.file_id ?? null,
    data.ip_address ?? null,
    data.user_agent ?? null,
    data.success !== false ? 1 : 0,
  ).run()
}

// ─── Settings ────────────────────────────────

export async function getSetting<T = unknown>(db: D1Database, key: string, defaultValue?: T): Promise<T | null> {
  const row = await db.prepare(`SELECT value FROM website_settings WHERE key = ?`)
    .bind(key).first() as { value: string } | null
  if (!row) return defaultValue !== undefined ? defaultValue : null
  try { return JSON.parse(row.value) as T } catch { return row.value as unknown as T }
}

export async function setSetting(db: D1Database, key: string, value: unknown) {
  await db.prepare(`
    INSERT INTO website_settings (key, value) VALUES (?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
  `).bind(key, JSON.stringify(value)).run()
}

// ─── Blog ────────────────────────────────────

export async function getPublishedBlogPosts(db: D1Database, opts?: { limit?: number; offset?: number; category_slug?: string; q?: string; is_featured?: boolean }) {
  let query = `
    SELECT bp.*, bc.name as category_name, bc.slug as category_slug
    FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.is_published = 1
  `
  const params: (string | number)[] = []
  if (opts?.category_slug) {
    query += ` AND bc.slug = ?`
    params.push(opts.category_slug)
  }
  if (opts?.q) {
    query += ` AND (bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)`
    const term = `%${opts.q}%`
    params.push(term, term, term)
  }
  if (opts?.is_featured !== undefined) {
    query += ` AND bp.is_featured = ?`
    params.push(opts.is_featured ? 1 : 0)
  }
  query += ` ORDER BY bp.published_at DESC, bp.created_at DESC`
  if (opts?.limit) { query += ` LIMIT ?`; params.push(opts.limit) }
  if (opts?.offset) { query += ` OFFSET ?`; params.push(opts.offset) }

  const stmt = db.prepare(query)
  const result = params.length > 0 ? await stmt.bind(...params).all() : await stmt.all()
  return result.results as unknown as BlogPost[]
}

// ─── Analytics ───────────────────────────────

export async function logAnalyticsEvent(db: D1Database, data: {
  event_type: string
  product_id?: number
  order_id?: number
  ip_address?: string
  referrer?: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  metadata?: Record<string, unknown>
}) {
  await db.prepare(`
    INSERT INTO analytics_events (event_type, product_id, order_id, ip_address, referrer, utm_source, utm_medium, utm_campaign, metadata)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.event_type,
    data.product_id ?? null,
    data.order_id ?? null,
    data.ip_address ?? null,
    data.referrer ?? null,
    data.utm_source ?? null,
    data.utm_medium ?? null,
    data.utm_campaign ?? null,
    data.metadata ? JSON.stringify(data.metadata) : null,
  ).run()
}

// ─── Audit Log ───────────────────────────────

export async function logAdminAudit(db: D1Database, data: {
  admin_uid: string
  admin_email?: string
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, unknown>
  ip_address?: string
}) {
  await db.prepare(`
    INSERT INTO admin_audit_logs (admin_uid, admin_email, action, resource_type, resource_id, details, ip_address)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(
    data.admin_uid || 'admin_system',
    data.admin_email ?? null,
    data.action,
    data.resource_type ?? null,
    data.resource_id ?? null,
    data.details ? JSON.stringify(data.details) : null,
    data.ip_address ?? null,
  ).run()
}

// ─── Product Reviews Baseline (15-25 Reviews, 4.0-4.8 Stars) ───

export async function ensureBaselineReviews(db: D1Database, productId: number) {
  try {
    const existing = await db.prepare(
      'SELECT COUNT(*) as c FROM product_reviews WHERE product_id = ?'
    ).bind(productId).first<{ c: number }>()

    if (existing && existing.c >= 15) {
      return
    }

    const seedReviews = [
      { name: 'Aarav Sharma', rating: 5, comment: 'Bohot hi sundar aur HD quality wallpaper hai. Mobile aur PC dono pe crystal clear lagta hai.' },
      { name: 'Priya Patel', rating: 5, comment: 'Instant download link mil gaya payment ke turant baad. Quality ekdum super!' },
      { name: 'Vikram Malhotra', rating: 4, comment: 'Great quality artwork. Resolution is truly 4K and crisp. Highly recommended.' },
      { name: 'Sneha Verma', rating: 5, comment: 'Mandir background ke liye print karwaya, colors bohot vibrant aur clear aaye hain.' },
      { name: 'Rohan Deshmukh', rating: 5, comment: 'Value for money! UPI payment was smooth and fast download on PhonePe.' },
      { name: 'Ananya Sen', rating: 4, comment: 'Bahut accha collection hai. Very high resolution digital file with great clarity.' },
      { name: 'Kunal Joshi', rating: 5, comment: 'Har Har Mahadev! Best high definition pack I have purchased so far.' },
      { name: 'Pooja Reddy', rating: 5, comment: 'Downloaded within seconds on my phone. Very happy with the purchase experience.' },
      { name: 'Amitabh Gupta', rating: 4, comment: 'Finishing aur clarity top notch hai. Paisa vasool digital asset.' },
      { name: 'Meera Iyer', rating: 5, comment: 'Divine and peaceful aesthetic. Looks stunning on lockscreen.' },
      { name: 'Deepak Nair', rating: 5, comment: '100% genuine instant delivery. Direct Google Drive and fast direct links.' },
      { name: 'Rajesh Tiwari', rating: 4, comment: 'Superb quality graphic assets. Highly recommended for devotional wallpapers.' },
      { name: 'Shreya Ghosh', rating: 5, comment: 'So beautiful! My family loved it too. Highly recommended!' },
      { name: 'Nikhil Agarwal', rating: 5, comment: 'Super clear details even when zoomed in. Excellent work and high dpi.' },
      { name: 'Kavita Choudhary', rating: 4, comment: 'Very easy to download and set as wallpaper. 4.5/5 rating from me.' },
      { name: 'Manish Bhatt', rating: 5, comment: 'Fast UPI payment via PhonePe and instant download. Awesome!' },
      { name: 'Ritu Saxena', rating: 5, comment: 'Divine and beautiful collection. Definitely worth buying.' },
      { name: 'Sanjay Kulkarni', rating: 4, comment: 'High quality file format and fast server download speed.' },
      { name: 'Tarun Kapoor', rating: 5, comment: 'Brilliant colors and sacred aesthetic. Very satisfied!' },
      { name: 'Sunita Dubey', rating: 5, comment: 'Great experience, no hassle at all. Smooth transaction.' },
    ]

    for (let i = 0; i < seedReviews.length; i++) {
      const r = seedReviews[i]
      const daysAgo = (i % 25) + 1
      await db.prepare(`
        INSERT INTO product_reviews (product_id, customer_name, rating, comment, is_verified_purchase, is_approved, is_seed, created_at)
        VALUES (?, ?, ?, ?, 1, 1, 1, datetime('now', '-' || ? || ' days'))
      `).bind(productId, r.name, r.rating, r.comment, daysAgo).run()
    }
  } catch (err) {
    console.error('Error in ensureBaselineReviews:', err)
  }
}

// ─── Types ───────────────────────────────────

export interface Product {
  id: number
  slug: string
  title: string
  description: string
  short_description: string
  category_id: number
  category_name?: string
  category_slug?: string
  price: number
  sale_price: number | null
  currency: string
  is_published: number
  is_featured: number
  tags: string | null
  file_type: string
  file_count: number
  total_file_size: number | null
  license_type: string
  license_info: string | null
  meta_title: string | null
  meta_description: string | null
  og_image_key: string | null
  button_text: string | null
  google_drive_link?: string | null
  video_url?: string | null
  download_limit: number
  access_duration_hours: number
  total_sales: number
  total_revenue: number
  view_count: number
  created_at: string
  updated_at: string
}

export interface ProductImage {
  id: number
  product_id: number
  r2_key: string
  alt_text: string | null
  is_thumbnail: number
  sort_order: number
}

export interface ProductFile {
  id: number
  product_id: number
  r2_key: string
  original_filename: string
  file_size: number | null
  file_type: string | null
  mime_type: string | null
  sort_order: number
}

export interface Order {
  id: number
  order_number: string
  product_id: number
  customer_name: string
  customer_email: string
  customer_phone: string | null
  amount: number
  currency: string
  status: string
  cashfree_order_id: string
  payment_session_id: string
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  created_at: string
  updated_at: string
}

export interface DownloadToken {
  id: number
  order_id: number
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
  is_revoked: number
  created_at: string
}

export interface BlogPost {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string | null
  author_name: string
  category_id: number | null
  category_name?: string
  category_slug?: string
  thumbnail_key: string | null
  is_published: number
  is_featured: number
  view_count: number
  meta_title: string | null
  meta_description: string | null
  tags: string | null
  published_at: string | null
  created_at: string
}
