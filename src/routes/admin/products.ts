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
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  download_limit: z.number().int().min(1).max(20).optional(),
  access_duration_hours: z.number().int().min(1).max(168).optional(),
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
      usage_instructions, button_text, google_drive_link, meta_title, meta_description, download_limit, access_duration_hours
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.slug, d.title, d.description, d.short_description ?? null,
    d.category_id ?? null, d.price, d.sale_price ?? null,
    d.is_published ? 1 : 0, d.is_featured ? 1 : 0,
    d.tags ? JSON.stringify(d.tags) : null,
    d.file_type ?? null, d.license_type ?? 'personal', d.license_info ?? null,
    d.usage_instructions ?? null, d.button_text ?? 'Buy', d.google_drive_link ?? null,
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

// POST /api/admin/products/:id/upload-image
app.post('/:id/upload-image', async (c) => {
  const id = parseInt(c.req.param('id'))
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null
  const isThumbnail = formData.get('thumbnail') === 'true'

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (file.size > MAX_IMAGE_SIZE) return c.json({ error: 'Image too large (max 10MB)' }, 400)
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return c.json({ error: 'Invalid image type' }, 400)

  const key = makeProductImageKey(id, file.name)
  const buffer = await file.arrayBuffer()
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

  const result = await c.env.DB.prepare(`
    INSERT INTO product_images (product_id, r2_key, alt_text, is_thumbnail, sort_order)
    VALUES (?, ?, ?, ?, 0)
  `).bind(id, key, file.name, isThumbnail ? 1 : 0).run()

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    key,
    url: `/api/images/${encodeURIComponent(key)}`
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

// DELETE /api/admin/products/:id/images/:imageId
app.delete('/:id/images/:imageId', async (c) => {
  const id = parseInt(c.req.param('id'))
  const imageId = parseInt(c.req.param('imageId'))

  const img = await c.env.DB.prepare('SELECT * FROM product_images WHERE id = ? AND product_id = ?')
    .bind(imageId, id)
    .first<{ r2_key: string; is_thumbnail: number }>()

  if (!img) return c.json({ error: 'Image not found for this product' }, 404)

  // Delete from R2 (original and variants)
  await deleteFromR2(c.env.R2, img.r2_key).catch(() => {})
  await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'thumb')).catch(() => {})
  await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'medium')).catch(() => {})
  await deleteFromR2(c.env.R2, getVariantR2Key(img.r2_key, 'large')).catch(() => {})

  // Delete from D1 database
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

  return c.json({ success: true })
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

// POST /api/admin/products/:id/upload-file
app.post('/:id/upload-file', async (c) => {
  const id = parseInt(c.req.param('id'))
  const formData = await c.req.formData()
  const file = formData.get('file') as File | null

  if (!file) return c.json({ error: 'No file provided' }, 400)
  if (file.size > MAX_PRODUCT_FILE_SIZE) return c.json({ error: 'File too large (max 500MB)' }, 400)

  const key = makeProductFileKey(id, file.name)
  const buffer = await file.arrayBuffer()
  await uploadToR2(c.env.R2, key, buffer, { contentType: file.type })

  const result = await c.env.DB.prepare(`
    INSERT INTO product_files (product_id, r2_key, original_filename, file_size, file_type, mime_type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, key, file.name, file.size, file.type.split('/')[0], file.type).run()

  return c.json({ success: true, id: result.meta.last_row_id })
})

// GET /api/images/:key — Serve images from R2
// (registered on root worker for public access)

export default app
