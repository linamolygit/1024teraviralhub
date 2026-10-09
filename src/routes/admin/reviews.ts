// src/routes/admin/reviews.ts — Admin Product Reviews Moderation & Image Management
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env, AdminVars } from '../../worker'
import { logAdminAudit } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

const adminReviewSchema = z.object({
  product_id: z.number().int().positive(),
  customer_name: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(2).max(2000),
  image_url: z.string().optional().or(z.literal('')),
  helpful_count: z.number().int().min(0).optional(),
  is_verified_purchase: z.number().int().min(0).max(1).optional(),
  is_approved: z.number().int().min(0).max(1).optional(),
  created_at: z.string().optional(),
})

// GET /api/admin/reviews — List all reviews
app.get('/', async (c) => {
  const reviews = await c.env.DB.prepare(`
    SELECT r.id, r.product_id, r.customer_name, r.rating, r.title, r.comment,
           r.image_url, r.helpful_count, r.unhelpful_count, r.is_verified_purchase,
           r.is_approved, r.created_at, r.is_seed,
           p.title as product_title, p.slug as product_slug
    FROM product_reviews r
    JOIN products p ON r.product_id = p.id
    ORDER BY (CASE WHEN r.image_url IS NOT NULL AND r.image_url != '' THEN 0 ELSE 1 END), r.created_at DESC
    LIMIT 200
  `).all()
  return c.json({ reviews: reviews.results })
})

// POST /api/admin/reviews — Add a new review with customer photo from Google/web
app.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = adminReviewSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const d = parsed.data
  const title = d.title?.trim() || (d.rating === 5 ? 'Terrific' : d.rating === 4 ? 'Very Good' : 'Good')
  const helpfulCount = d.helpful_count ?? (d.rating >= 4 ? Math.floor(Math.random() * 5) + 1 : 0)
  const isVerified = d.is_verified_purchase ?? 1
  const isApproved = d.is_approved ?? 1
  const createdAt = d.created_at?.trim() || new Date().toISOString()
  const imageUrl = d.image_url?.trim() || null

  const result = await c.env.DB.prepare(`
    INSERT INTO product_reviews (
      product_id, customer_name, rating, title, comment, image_url,
      helpful_count, unhelpful_count, is_verified_purchase, is_approved, is_seed, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 0, ?)
  `).bind(
    d.product_id,
    d.customer_name.trim(),
    d.rating,
    title,
    d.comment.trim(),
    imageUrl,
    helpfulCount,
    isVerified,
    isApproved,
    createdAt
  ).run()

  const newId = result.meta.last_row_id

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'CREATE',
    resource_type: 'review',
    resource_id: String(newId),
    details: { message: `Added review for product #${d.product_id}` },
  })

  return c.json({ success: true, id: newId })
})

// PUT /api/admin/reviews/:id — Update existing review
app.put('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id) || id <= 0) return c.json({ error: 'Invalid ID' }, 400)

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = adminReviewSchema.partial().safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const d = parsed.data
  const existing = await c.env.DB.prepare(`SELECT * FROM product_reviews WHERE id = ?`).bind(id).first<any>()
  if (!existing) return c.json({ error: 'Review not found' }, 404)

  const updatedCustomerName = d.customer_name?.trim() ?? existing.customer_name
  const updatedRating = d.rating ?? existing.rating
  const updatedTitle = d.title?.trim() ?? existing.title
  const updatedComment = d.comment?.trim() ?? existing.comment
  const updatedImageUrl = d.image_url !== undefined ? (d.image_url.trim() || null) : existing.image_url
  const updatedHelpful = d.helpful_count ?? existing.helpful_count ?? 0
  const updatedVerified = d.is_verified_purchase ?? existing.is_verified_purchase ?? 1
  const updatedApproved = d.is_approved ?? existing.is_approved ?? 1

  await c.env.DB.prepare(`
    UPDATE product_reviews
    SET customer_name = ?, rating = ?, title = ?, comment = ?, image_url = ?,
        helpful_count = ?, is_verified_purchase = ?, is_approved = ?
    WHERE id = ?
  `).bind(
    updatedCustomerName,
    updatedRating,
    updatedTitle,
    updatedComment,
    updatedImageUrl,
    updatedHelpful,
    updatedVerified,
    updatedApproved,
    id
  ).run()

  return c.json({ success: true })
})

// PUT /api/admin/reviews/:id/approve
app.put('/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`UPDATE product_reviews SET is_approved = 1 WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// DELETE /api/admin/reviews/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM product_reviews WHERE id = ?`).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'DELETE',
    resource_type: 'review',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

// GET /api/admin/reviews/product/:productId/images — Fetch product's customer review images
app.get('/product/:productId/images', async (c) => {
  const productId = parseInt(c.req.param('productId'))
  const product = await c.env.DB.prepare(`
    SELECT id, title, review_images FROM products WHERE id = ?
  `).bind(productId).first<{ id: number; title: string; review_images: string | null }>()

  if (!product) return c.json({ error: 'Product not found' }, 404)

  let images: string[] = []
  if (product.review_images) {
    try {
      images = JSON.parse(product.review_images)
    } catch {
      images = product.review_images.split('\n').map((s) => s.trim()).filter((s) => s.length > 0)
    }
  }

  // Also fetch any review photos already attached to reviews for this product
  const reviewsWithPhotos = await c.env.DB.prepare(`
    SELECT id, customer_name, rating, title, image_url
    FROM product_reviews
    WHERE product_id = ? AND image_url IS NOT NULL AND image_url != ''
  `).bind(productId).all()

  return c.json({
    product_id: product.id,
    product_title: product.title,
    review_images: images,
    review_photos: reviewsWithPhotos.results || [],
  })
})

// PUT /api/admin/reviews/product/:productId/images — Save customer review images list for product
app.put('/product/:productId/images', async (c) => {
  const productId = parseInt(c.req.param('productId'))
  let body: any
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const imagesArray = Array.isArray(body?.images)
    ? body.images.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
    : []

  await c.env.DB.prepare(`
    UPDATE products SET review_images = ? WHERE id = ?
  `).bind(JSON.stringify(imagesArray), productId).run()

  return c.json({ success: true, count: imagesArray.length })
})

export default app
