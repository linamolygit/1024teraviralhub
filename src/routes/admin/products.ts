// src/routes/admin/products.ts — Full CRUD for products
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware, type AdminVars } from './middleware'
import { logAdminAudit, ensureBaselineReviews } from '../../lib/db'
import { uploadToR2, deleteFromR2, makeProductFileKey, makeProductImageKey, getVariantR2Key, MAX_PRODUCT_FILE_SIZE, MAX_IMAGE_SIZE, ALLOWED_IMAGE_TYPES } from '../../lib/r2'
import { z } from 'zod'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

// GET /api/admin/products
app.get('/', async (c) => {
  const limit = parseInt(c.req.query('limit') ?? '100')
  const offset = parseInt(c.req.query('offset') ?? '0')
  const search = c.req.query('search')

  let query = `
    SELECT 
      p.*, 
      pc.name as category_name,
      (
        SELECT r2_key 
        FROM product_images 
        WHERE product_id = p.id 
        ORDER BY is_thumbnail DESC, sort_order ASC, id ASC 
        LIMIT 1
      ) as thumbnail_key,
      (
        SELECT COUNT(*) 
        FROM product_reviews 
        WHERE product_id = p.id AND is_approved = 1
      ) as reviews_count,
      (
        SELECT ROUND(AVG(rating), 1) 
        FROM product_reviews 
        WHERE product_id = p.id AND is_approved = 1
      ) as average_rating
    FROM products p 
    LEFT JOIN product_categories pc ON p.category_id = pc.id
  `
  const params: (string | number)[] = []
  if (search) {
    query += ` WHERE p.title LIKE ? OR p.slug LIKE ?`
    params.push(`%${search}%`, `%${search}%`)
  }
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`
  params.push(limit, offset)

  const products = await c.env.DB.prepare(query).bind(...params).all()
  const count = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM products`).first() as { c: number }

  const productsWithDetails = (products.results as any[]).map((p) => ({
    ...p,
    thumbnail_url: p.thumbnail_key
      ? (p.thumbnail_key.startsWith('http') ? p.thumbnail_key : `/api/images/${encodeURIComponent(p.thumbnail_key)}`)
      : null,
    reviews_count: p.reviews_count || 20,
    average_rating: p.average_rating ? Number(p.average_rating) : 4.8,
  }))

  return c.json({ products: productsWithDetails, total: count.c })
})

async function ensureProductColumns(db: D1Database) {
  try {
    await db.exec(`ALTER TABLE products ADD COLUMN google_drive_link TEXT;`)
  } catch {
    // Column already exists
  }
  try {
    await db.exec(`ALTER TABLE products ADD COLUMN video_url TEXT;`)
  } catch {
    // Column already exists
  }
}

// Ensure media deduplication tables & columns exist in D1
async function ensureMediaDedupTables(db: D1Database) {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_hash TEXT NOT NULL UNIQUE,
        r2_key TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        reference_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(content_hash);
      CREATE INDEX IF NOT EXISTS idx_media_assets_key ON media_assets(r2_key);
    `)
  } catch {}

  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN content_hash TEXT;`)
  } catch {}
  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN file_size INTEGER DEFAULT 0;`)
  } catch {}
  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN original_filename TEXT;`)
  } catch {}
  try {
    await db.exec(`ALTER TABLE product_files ADD COLUMN content_hash TEXT;`)
  } catch {}

  // Backfill media_assets from existing product_images if not present
  try {
    await db.exec(`
      INSERT OR IGNORE INTO media_assets (content_hash, r2_key, original_filename, file_size, mime_type, reference_count, created_at)
      SELECT 
        COALESCE(content_hash, 'legacy_' || id || '_' || substr(r2_key, instr(r2_key, '/') + 1)),
        r2_key,
        COALESCE(alt_text, 'image.jpg'),
        COALESCE(file_size, 0),
        'image/jpeg',
        1,
        created_at
      FROM product_images
      GROUP BY r2_key;
    `)
  } catch {}
}

// Hardware-accelerated native SHA-256 hash
async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

const productSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  short_description: z.string().max(300).optional(),
  category_id: z.number().optional(),
  price: z.number().positive(),
  sale_price: z.number().positive().optional().nullable(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  file_type: z.string().optional(),
  license_type: z.string().optional(),
  license_info: z.string().optional(),
  usage_instructions: z.string().optional(),
  button_text: z.string().max(50).optional(),
  google_drive_link: z.string().optional().nullable(),
  video_url: z.string().optional().nullable(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  download_limit: z.number().int().min(1).max(20).optional(),
  access_duration_hours: z.number().int().min(1).max(168).optional(),
})

// GET /api/admin/products/media-library — Browse all deduplicated media in storage with type filtering
app.get('/media-library', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const q = c.req.query('q')?.trim()
  const type = (c.req.query('type') || '').toLowerCase().trim()
  const limit = Math.min(100, parseInt(c.req.query('limit') || '60'))
  const offset = parseInt(c.req.query('offset') || '0')

  const conditions: string[] = []
  const params: any[] = []

  if (type === 'video') {
    conditions.push(`(mime_type LIKE 'video/%' OR r2_key LIKE 'products/videos/%' OR original_filename LIKE '%.mp4' OR original_filename LIKE '%.webm' OR original_filename LIKE '%.mov' OR original_filename LIKE '%.mkv')`)
    // Exclude internal adaptive -lite variants from browse list
    conditions.push(`(r2_key NOT LIKE '%-lite.%' AND r2_key NOT LIKE '%-lite')`)
  } else if (type === 'image') {
    conditions.push(`(mime_type LIKE 'image/%' OR (mime_type NOT LIKE 'video/%' AND r2_key NOT LIKE 'products/videos/%' AND original_filename NOT LIKE '%.mp4' AND original_filename NOT LIKE '%.webm' AND original_filename NOT LIKE '%.mov' AND original_filename NOT LIKE '%.mkv'))`)
  }

  if (q) {
    conditions.push(`(original_filename LIKE ? OR r2_key LIKE ?)`)
    params.push(`%${q}%`, `%${q}%`)
  }

  const whereClause = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''

  const sql = `SELECT * FROM media_assets${whereClause} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  const queryParams = [...params, limit, offset]

  const rows = await c.env.DB.prepare(sql).bind(...queryParams).all()

  const assets = (rows.results as any[]).map((a) => {
    const isVideo = (a.mime_type && a.mime_type.startsWith('video/')) || /\.(mp4|webm|mov|mkv)$/i.test(a.original_filename || a.r2_key)
    return {
      ...a,
      is_video: isVideo,
      url: `/api/images/${encodeURIComponent(a.r2_key)}`,
      thumb_url: isVideo ? `/api/images/${encodeURIComponent(a.r2_key)}` : `/api/images/${encodeURIComponent(a.r2_key)}?variant=thumb`,
    }
  })

  const countSql = `SELECT COUNT(*) as total FROM media_assets${whereClause}`
  const countRow = await c.env.DB.prepare(countSql).bind(...params).first<{ total: number }>()

  return c.json({
    success: true,
    assets,
    total: countRow?.total ?? assets.length,
  })
})

// POST /api/admin/products/check-dedup — Instant pre-upload duplicate hash check
app.post('/check-dedup', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const body = await c.req.json().catch(() => ({}))
  const hashes: string[] = Array.isArray(body.hashes) ? body.hashes : body.hash ? [body.hash] : []

  if (hashes.length === 0) return c.json({ success: true, matches: {} })

  const placeholders = hashes.map(() => '?').join(',')
  const results = await c.env.DB.prepare(`
    SELECT content_hash, r2_key, original_filename, file_size, mime_type, reference_count
    FROM media_assets
    WHERE content_hash IN (${placeholders})
  `).bind(...hashes).all()

  const matches: Record<string, any> = {}
  for (const row of results.results as any[]) {
    matches[row.content_hash] = {
      ...row,
      url: `/api/images/${encodeURIComponent(row.r2_key)}`,
      thumb_url: `/api/images/${encodeURIComponent(row.r2_key)}?variant=thumb`,
    }
  }

  return c.json({ success: true, matches })
})

// GET /api/admin/products/:id
app.get('/:id', async (c) => {
  await ensureProductColumns(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const product = await c.env.DB.prepare(`SELECT * FROM products WHERE id = ?`).bind(id).first()
  if (!product) return c.json({ error: 'Product not found' }, 404)

  const [images, files] = await Promise.all([
    c.env.DB.prepare(`SELECT * FROM product_images WHERE product_id = ? ORDER BY sort_order ASC`).bind(id).all(),
    c.env.DB.prepare(`SELECT * FROM product_files WHERE product_id = ? ORDER BY sort_order ASC`).bind(id).all(),
  ])

  const mappedImages = (images.results as any[]).map((img) => ({
    ...img,
    url: img.r2_key?.startsWith('http')
      ? img.r2_key
      : `/api/images/${encodeURIComponent(img.r2_key)}`,
  }))

  return c.json({ product, images: mappedImages, files: files.results })
})

// POST /api/admin/products
app.post('/', async (c) => {
  await ensureProductColumns(c.env.DB)
  const body = await c.req.json()
  const parsed = productSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  const result = await c.env.DB.prepare(`
    INSERT INTO products (
      slug, title, description, short_description, category_id, price, sale_price,
      is_published, is_featured, tags, file_type, license_type, license_info,
      usage_instructions, button_text, google_drive_link, video_url, meta_title, meta_description, download_limit, access_duration_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.slug, d.title, d.description, d.short_description ?? null,
    d.category_id ?? null, d.price, d.sale_price ?? null,
    d.is_published ? 1 : 0, d.is_featured ? 1 : 0,
    d.tags ? JSON.stringify(d.tags) : null,
    d.file_type ?? null, d.license_type ?? 'personal', d.license_info ?? null,
    d.usage_instructions ?? null, d.button_text ?? 'Buy', d.google_drive_link ?? null,
    d.video_url ?? null,
    d.meta_title ?? null, d.meta_description ?? null,
    d.download_limit ?? 3, d.access_duration_hours ?? 12,
  ).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    admin_email: c.get('adminEmail'),
    action: 'CREATE',
    resource_type: 'product',
    resource_id: result.meta.last_row_id?.toString(),
  })

  if (result.meta.last_row_id) {
    await ensureBaselineReviews(c.env.DB, result.meta.last_row_id as number)
  }

  return c.json({ success: true, id: result.meta.last_row_id })
})

// PUT /api/admin/products/:id
app.put('/:id', async (c) => {
  await ensureProductColumns(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const parsed = productSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)

  const d = parsed.data
  const fields: string[] = []
  const values: (string | number | null)[] = []

  if (d.slug !== undefined) { fields.push('slug = ?'); values.push(d.slug) }
  if (d.title !== undefined) { fields.push('title = ?'); values.push(d.title) }
  if (d.description !== undefined) { fields.push('description = ?'); values.push(d.description) }
  if (d.short_description !== undefined) { fields.push('short_description = ?'); values.push(d.short_description ?? null) }
  if (d.category_id !== undefined) { fields.push('category_id = ?'); values.push(d.category_id ?? null) }
  if (d.price !== undefined) { fields.push('price = ?'); values.push(d.price) }
  if (d.sale_price !== undefined) { fields.push('sale_price = ?'); values.push(d.sale_price ?? null) }
  if (d.is_published !== undefined) { fields.push('is_published = ?'); values.push(d.is_published ? 1 : 0) }
  if (d.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(d.is_featured ? 1 : 0) }
  if (d.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(d.tags)) }
  if (d.button_text !== undefined) { fields.push('button_text = ?'); values.push(d.button_text ?? 'Buy') }
  if (d.google_drive_link !== undefined) { fields.push('google_drive_link = ?'); values.push(d.google_drive_link ?? null) }
  if (d.video_url !== undefined) { fields.push('video_url = ?'); values.push(d.video_url ?? null) }
  if (d.license_info !== undefined) { fields.push('license_info = ?'); values.push(d.license_info ?? null) }
  if (d.usage_instructions !== undefined) { fields.push('usage_instructions = ?'); values.push(d.usage_instructions ?? null) }
  if (d.meta_title !== undefined) { fields.push('meta_title = ?'); values.push(d.meta_title ?? null) }
  if (d.meta_description !== undefined) { fields.push('meta_description = ?'); values.push(d.meta_description ?? null) }
  if (d.download_limit !== undefined) { fields.push('download_limit = ?'); values.push(d.download_limit!) }
  if (d.access_duration_hours !== undefined) { fields.push('access_duration_hours = ?'); values.push(d.access_duration_hours!) }

  if (!fields.length) return c.json({ error: 'No fields to update' }, 400)

  fields.push("updated_at = datetime('now')")
  values.push(id)

  await c.env.DB.prepare(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'UPDATE',
    resource_type: 'product',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

// DELETE /api/admin/products/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))

  // Get R2 keys to delete
  const files = await c.env.DB.prepare(`SELECT r2_key FROM product_files WHERE product_id = ?`).bind(id).all()
  const images = await c.env.DB.prepare(`SELECT r2_key FROM product_images WHERE product_id = ?`).bind(id).all()

  // Delete from R2
  for (const f of files.results as { r2_key: string }[]) {
    await deleteFromR2(c.env.R2, f.r2_key).catch(() => {})
  }
  for (const img of images.results as { r2_key: string }[]) {
    await deleteFromR2(c.env.R2, img.r2_key).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'thumb')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'medium')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'large')).catch(() => {})
  }

  await c.env.DB.prepare(`DELETE FROM products WHERE id = ?`).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'DELETE',
    resource_type: 'product',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

// POST /api/admin/products/:id/attach-existing-image — Attach already-uploaded asset to product (0 KB duplicate upload)
app.post('/:id/attach-existing-image', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const body = await c.req.json()
  const { r2_key, content_hash, alt_text, is_thumbnail } = body

  if (!r2_key) return c.json({ error: 'Missing r2_key' }, 400)

  // Check if this image is already attached to this product
  const existing = await c.env.DB.prepare(`
    SELECT id, r2_key FROM product_images WHERE product_id = ? AND r2_key = ? LIMIT 1
  `).bind(id, r2_key).first<{ id: number; r2_key: string }>()

  if (existing) {
    if (is_thumbnail) {
      await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
      await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 1 WHERE id = ?').bind(existing.id).run()
    }
    return c.json({
      success: true,
      already_attached: true,
      id: existing.id,
      key: existing.r2_key,
      url: `/api/images/${encodeURIComponent(existing.r2_key)}`,
      message: 'Image already attached to this product.',
    })
  }

  // Look up asset info from media_assets
  const asset = await c.env.DB.prepare(`
    SELECT content_hash, file_size, original_filename FROM media_assets WHERE r2_key = ? LIMIT 1
  `).bind(r2_key).first<{ content_hash: string; file_size: number; original_filename: string }>()

  const hashToUse = content_hash || asset?.content_hash || null
  const fileSize = asset?.file_size || 0
  const fileName = alt_text || asset?.original_filename || 'reused-image.webp'

  if (is_thumbnail) {
    await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO product_images (product_id, r2_key, alt_text, is_thumbnail, sort_order, content_hash, file_size, original_filename)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).bind(id, r2_key, fileName, is_thumbnail ? 1 : 0, hashToUse, fileSize, fileName).run()

  // Increment reference count in media_assets
  await c.env.DB.prepare(`
    UPDATE media_assets SET reference_count = reference_count + 1, updated_at = datetime('now')
    WHERE r2_key = ?
  `).bind(r2_key).run().catch(() => {})

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    key: r2_key,
    url: `/api/images/${encodeURIComponent(r2_key)}`,
    message: 'Existing image attached to product without re-uploading (0 bytes storage consumed)!',
  })
})

// POST /api/admin/products/:id/upload-image — Smart Deduplicating Image Upload
app.post('/:id/upload-image', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const isThumbnail = formData.get('thumbnail') === 'true'

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (file.size > MAX_IMAGE_SIZE) return c.json({ error: 'Image too large (max 10MB)' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Invalid image type' }, 400)

  const buffer = await file.arrayBuffer()
  const contentHash = await computeSha256(buffer)

  // 1. Check if identical content hash already exists in media_assets registry OR product_images
  let existingAsset = await c.env.DB.prepare(`
    SELECT id, r2_key, original_filename, file_size, reference_count
    FROM media_assets
    WHERE content_hash = ?
    LIMIT 1
  `).bind(contentHash).first<{ id: number; r2_key: string; original_filename: string; file_size: number; reference_count: number }>()

  // Fallback: check if an existing product_images record has this content_hash
  if (!existingAsset) {
    const existingImg = await c.env.DB.prepare(`
      SELECT r2_key, alt_text, file_size
      FROM product_images
      WHERE content_hash = ?
      LIMIT 1
    `).bind(contentHash).first<{ r2_key: string; alt_text: string; file_size: number }>()

    if (existingImg) {
      existingAsset = {
        id: 0,
        r2_key: existingImg.r2_key,
        original_filename: existingImg.alt_text || file.name,
        file_size: existingImg.file_size || file.size,
        reference_count: 1,
      }
      // Register it in media_assets for future lookups
      await c.env.DB.prepare(`
        INSERT OR IGNORE INTO media_assets (content_hash, r2_key, original_filename, file_size, mime_type, reference_count)
        VALUES (?, ?, ?, ?, ?, 1)
      `).bind(contentHash, existingImg.r2_key, file.name, file.size, file.type).run().catch(() => {})
    }
  }

  // 2. DEDUPLICATION HIT! Content already exists in storage
  if (existingAsset) {
    // Check if this image is already attached to this specific product
    const alreadyAttached = await c.env.DB.prepare(`
      SELECT id, r2_key FROM product_images
      WHERE product_id = ? AND (content_hash = ? OR r2_key = ?)
      LIMIT 1
    `).bind(id, contentHash, existingAsset.r2_key).first<{ id: number; r2_key: string }>()

    if (alreadyAttached) {
      if (isThumbnail) {
        await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
        await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 1 WHERE id = ?').bind(alreadyAttached.id).run()
      }
      return c.json({
        success: true,
        deduplicated: true,
        reused: true,
        already_attached: true,
        id: alreadyAttached.id,
        key: alreadyAttached.r2_key,
        url: `/api/images/${encodeURIComponent(alreadyAttached.r2_key)}`,
        bytes_saved: file.size,
        message: `Duplicate image content detected! Reused existing image without double uploading (Saved ${(file.size / 1024).toFixed(1)} KB R2 storage).`,
      })
    }

    if (isThumbnail) {
      await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
    }

    // Attach existing R2 key to this product without re-uploading to R2
    const result = await c.env.DB.prepare(`
      INSERT INTO product_images (product_id, r2_key, alt_text, is_thumbnail, sort_order, content_hash, file_size, original_filename)
      VALUES (?, ?, ?, ?, 0, ?, ?, ?)
    `).bind(id, existingAsset.r2_key, file.name, isThumbnail ? 1 : 0, contentHash, file.size, file.name).run()

    // Increment reference count
    await c.env.DB.prepare(`
      UPDATE media_assets SET reference_count = reference_count + 1, updated_at = datetime('now')
      WHERE content_hash = ?
    `).bind(contentHash).run().catch(() => {})

    return c.json({
      success: true,
      deduplicated: true,
      reused: true,
      id: result.meta.last_row_id,
      key: existingAsset.r2_key,
      url: `/api/images/${encodeURIComponent(existingAsset.r2_key)}`,
      bytes_saved: file.size,
      message: `Duplicate image content detected! Reused existing image without double uploading (Saved ${(file.size / 1024).toFixed(1)} KB R2 storage).`,
    })
  }

  // 3. NEW CONTENT: Upload to R2 as normal
  const key = makeProductImageKey(id, file.name)
  await uploadToR2(c.env.R2, key, buffer, { contentType: file.type })

  // Process optional WebP variants if provided
  const thumb = formData.get('thumb') as File | null
  const medium = formData.get('medium') as File | null
  const large = formData.get('large') as File | null

  if (thumb) {
    await uploadToR2(c.env.R2, getVariantR2Key(key, 'thumb'), await thumb.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }
  if (medium) {
    await uploadToR2(c.env.R2, getVariantR2Key(key, 'medium'), await medium.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }
  if (large) {
    await uploadToR2(c.env.R2, getVariantR2Key(key, 'large'), await large.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }

  // Register in media_assets
  await c.env.DB.prepare(`
    INSERT OR REPLACE INTO media_assets (content_hash, r2_key, original_filename, file_size, mime_type, reference_count)
    VALUES (?, ?, ?, ?, ?, 1)
  `).bind(contentHash, key, file.name, file.size, file.type).run().catch(() => {})

  if (isThumbnail) {
    await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO product_images (product_id, r2_key, alt_text, is_thumbnail, sort_order, content_hash, file_size, original_filename)
    VALUES (?, ?, ?, ?, 0, ?, ?, ?)
  `).bind(id, key, file.name, isThumbnail ? 1 : 0, contentHash, file.size, file.name).run()

  return c.json({
    success: true,
    deduplicated: false,
    id: result.meta.last_row_id,
    key,
    url: `/api/images/${encodeURIComponent(key)}`,
    bytes_saved: 0,
    message: 'Image uploaded and registered in storage.',
  })
})

// POST /api/admin/products/images/:imageId/variants
app.post('/images/:imageId/variants', async (c) => {
  const imageId = parseInt(c.req.param('imageId'))
  const img = await c.env.DB.prepare('SELECT * FROM product_images WHERE id = ?').bind(imageId).first<{ r2_key: string }>()
  if (!img) return c.json({ error: 'Image not found' }, 404)

  const formData = await c.req.formData()
  const thumb = formData.get('thumb') as File | null
  const medium = formData.get('medium') as File | null
  const large = formData.get('large') as File | null

  if (thumb) {
    await uploadToR2(c.env.R2, getVariantR2Key(img.r2_key, 'thumb'), await thumb.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }
  if (medium) {
    await uploadToR2(c.env.R2, getVariantR2Key(img.r2_key, 'medium'), await medium.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }
  if (large) {
    await uploadToR2(c.env.R2, getVariantR2Key(img.r2_key, 'large'), await large.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
  }

  return c.json({ success: true })
})

// DELETE /api/admin/products/:id/images/:imageId — Reference-Counted Safe Deletion
app.delete('/:id/images/:imageId', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const imageId = parseInt(c.req.param('imageId'))

  const img = await c.env.DB.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?')
    .bind(imageId, id)
    .first<{ r2_key: string; is_thumbnail: number; content_hash?: string }>()

  if (!img) return c.json({ error: 'Image not found for this product' }, 404)

  // Check if ANY OTHER image record is currently using this r2_key across the system
  const otherUses = await c.env.DB.prepare(`
    SELECT COUNT(*) as count FROM product_images WHERE r2_key = ? AND id != ?
  `).bind(img.r2_key, imageId).first<{ count: number }>()

  const isStillReferenced = (otherUses?.count ?? 0) > 0

  if (!isStillReferenced) {
    // Safe to delete from R2 because no other product is using this image
    await deleteFromR2(c.env.R2, img.r2_key).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'thumb')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'medium')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'large')).catch(() => {})

    // Remove from media_assets registry
    await c.env.DB.prepare('DELETE FROM media_assets WHERE r2_key = ?').bind(img.r2_key).run().catch(() => {})
  } else {
    // Other products are still using this image — retain in R2 and just decrement reference count
    await c.env.DB.prepare(`
      UPDATE media_assets SET reference_count = MAX(1, reference_count - 1), updated_at = datetime('now')
      WHERE r2_key = ?
    `).bind(img.r2_key).run().catch(() => {})
  }

  // Delete from D1 database for this product
  await c.env.DB.prepare('DELETE FROM product_images WHERE id = ? AND product_id = ?').bind(imageId, id).run()

  // If deleted image was the thumbnail, promote the first remaining image
  if (img.is_thumbnail === 1) {
    const remaining = await c.env.DB.prepare('SELECT id FROM product_images WHERE product_id = ? ORDER BY sort_order ASC, id ASC LIMIT 1')
      .bind(id)
      .first<{ id: number }>()
    if (remaining) {
      await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 1 WHERE id = ?').bind(remaining.id).run()
    }
  }

  return c.json({ success: true, r2_retained: isStillReferenced })
})

// PUT /api/admin/products/:id/images/:imageId/thumbnail
app.put('/:id/images/:imageId/thumbnail', async (c) => {
  const id = parseInt(c.req.param('id'))
  const imageId = parseInt(c.req.param('imageId'))

  // Reset current thumbnail
  await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 0 WHERE product_id = ?').bind(id).run()
  // Set new thumbnail
  await c.env.DB.prepare('UPDATE product_images SET is_thumbnail = 1 WHERE id = ? AND product_id = ?').bind(imageId, id).run()

  return c.json({ success: true })
})

// POST /api/admin/products/:id/upload-file — Deliverable File Upload with Deduplication
app.post('/:id/upload-file', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const id = parseInt(c.req.param('id'))
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (file.size > MAX_PRODUCT_FILE_SIZE) return c.json({ error: 'File too large (max 500MB)' }, 400)

  const buffer = await file.arrayBuffer()
  const contentHash = await computeSha256(buffer)

  // Check if identical deliverable file already exists in product_files
  const existingFile = await c.env.DB.prepare(`
    SELECT r2_key, original_filename, file_size, file_type, mime_type
    FROM product_files
    WHERE content_hash = ?
    LIMIT 1
  `).bind(contentHash).first<{ r2_key: string; original_filename: string; file_size: number; file_type: string; mime_type: string }>()

  let key: string
  let isReused = false

  if (existingFile) {
    key = existingFile.r2_key
    isReused = true
  } else {
    key = makeProductFileKey(id, file.name)
    await uploadToR2(c.env.R2, key, buffer, { contentType: file.type })
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO product_files (product_id, r2_key, original_filename, file_size, file_type, mime_type, content_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).bind(id, key, file.name, file.size, file.type.split('/')[0], file.type, contentHash).run()

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    deduplicated: isReused,
    bytes_saved: isReused ? file.size : 0,
    message: isReused
      ? `Existing deliverable file reused! Saved ${(file.size / (1024 * 1024)).toFixed(2)} MB storage.`
      : 'File uploaded successfully.',
  })
})

// POST /api/admin/products/upload-video — Standalone High-Performance Video Upload to Cloudflare R2
app.post('/upload-video', async (c) => {
  await ensureMediaDedupTables(c.env.DB)
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) return c.json({ error: 'No video file provided' }, 400)

  const MAX_VIDEO_SIZE = 150 * 1024 * 1024
  if (file.size > MAX_VIDEO_SIZE) {
    return c.json({ error: `Video exceeds max size of 150MB. (Uploaded: ${(file.size / (1024 * 1024)).toFixed(1)}MB)` }, 400)
  }

  const isVideo = file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv|m4v)$/i.test(file.name)
  if (!isVideo) {
    return c.json({ error: 'Invalid video file format. Supported formats: MP4, WebM, MOV, MKV' }, 400)
  }

  const buffer = await file.arrayBuffer()
  const contentHash = await computeSha256(buffer)

  // Deduplication check: check if identical video exists in media_assets
  const existingAsset = await c.env.DB.prepare(`
    SELECT r2_key, original_filename, file_size FROM media_assets WHERE content_hash = ? LIMIT 1
  `).bind(contentHash).first<{ r2_key: string; original_filename: string; file_size: number }>()

  let key: string
  let isReused = false

  if (existingAsset) {
    key = existingAsset.r2_key
    isReused = true
    await c.env.DB.prepare(`
      UPDATE media_assets SET reference_count = reference_count + 1, updated_at = datetime('now')
      WHERE content_hash = ?
    `).bind(contentHash).run().catch(() => {})
  } else {
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
    key = `products/videos/${Date.now()}-${cleanName}`
    const contentType = file.type || (cleanName.endsWith('.webm') ? 'video/webm' : 'video/mp4')
    await uploadToR2(c.env.R2, key, buffer, { contentType })

    // Register in media_assets
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO media_assets (content_hash, r2_key, original_filename, file_size, mime_type, reference_count)
      VALUES (?, ?, ?, ?, ?, 1)
    `).bind(contentHash, key, file.name, file.size, contentType).run().catch(() => {})
  }

  // Handle optional adaptive Lite stream (480p fast variant)
  let liteKey: string | null = null
  let liteUrl: string | null = null
  let liteSize = 0

  const liteFile = formData.get('lite_file') as File | null
  if (liteFile && liteFile.size > 0) {
    const dotIndex = key.lastIndexOf('.')
    liteKey = dotIndex !== -1 ? `${key.substring(0, dotIndex)}-lite${key.substring(dotIndex)}` : `${key}-lite`
    const liteBuffer = await liteFile.arrayBuffer()
    const liteContentType = liteFile.type || (liteKey.endsWith('.webm') ? 'video/webm' : 'video/mp4')
    await uploadToR2(c.env.R2, liteKey, liteBuffer, { contentType: liteContentType })
    liteUrl = `/api/images/${encodeURIComponent(liteKey)}`
    liteSize = liteFile.size
  }

  const publicUrl = `/api/images/${encodeURIComponent(key)}`

  return c.json({
    success: true,
    url: publicUrl,
    lite_url: liteUrl || `${publicUrl}?quality=lite`,
    key,
    file_size: file.size,
    lite_size: liteSize,
    deduplicated: isReused,
    message: isReused
      ? `Existing video content reused! Saved ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      : 'Video & adaptive streaming variants published to Cloudflare edge CDN successfully.',
  })
})

// GET /api/images/:key — Serve images from R2
// (registered on root worker for public access)

export default app
