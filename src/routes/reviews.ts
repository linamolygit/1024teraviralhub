// src/routes/reviews.ts — Public Product Reviews API (Enhanced Flipkart-Style)
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'
import { ensureBaselineReviews, getSetting } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

const reviewSubmitSchema = z.object({
  product_id: z.number().int().positive(),
  customer_name: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(5).max(1000),
  image_url: z.string().optional(),
  order_number: z.string().optional(),
})

// GET /api/reviews/product/:productId
app.get('/product/:productId', async (c) => {
  const productId = parseInt(c.req.param('productId'))
  if (isNaN(productId) || productId <= 0) {
    return c.json({ error: 'Invalid product ID' }, 400)
  }

  const showSeedReviews = (await getSetting<boolean>(c.env.DB, 'show_seed_reviews', true)) ?? true

  // Fetch product review_images column
  const productRow = await c.env.DB.prepare(`
    SELECT id, title, review_images FROM products WHERE id = ?
  `).bind(productId).first<{ id: number; title: string; review_images: string | null }>()

  let extraImages: string[] = []
  if (productRow?.review_images) {
    try {
      const parsed = JSON.parse(productRow.review_images)
      if (Array.isArray(parsed)) {
        extraImages = parsed.filter((u: any) => typeof u === 'string' && u.trim().length > 0)
      }
    } catch {
      extraImages = productRow.review_images
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
    }
  }

  const selectCols = `id, product_id, customer_name, rating, title, comment, image_url, helpful_count, unhelpful_count, is_verified_purchase, created_at`

  let reviewsList: any[] = []
  let total = 0
  let avgRating: number | null = null

  if (!showSeedReviews) {
    const reviewsRes = await c.env.DB.prepare(`
      SELECT ${selectCols}
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1 AND is_seed = 0
      ORDER BY (CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 0 ELSE 1 END), created_at DESC
      LIMIT 60
    `).bind(productId).all()

    const stats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1 AND is_seed = 0
    `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }

    reviewsList = reviewsRes.results || []
    total = stats?.total_reviews ?? 0
    avgRating = stats?.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : null
  } else {
    // Seed reviews + real reviews
    let stats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1
    `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }

    if (!stats || stats.total_reviews < 15) {
      await ensureBaselineReviews(c.env.DB, productId)
      stats = await c.env.DB.prepare(`
        SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
        FROM product_reviews
        WHERE product_id = ? AND is_approved = 1
      `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }
    }

    const reviewsRes = await c.env.DB.prepare(`
      SELECT ${selectCols}
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY (CASE WHEN image_url IS NOT NULL AND image_url != '' THEN 0 ELSE 1 END), created_at DESC
      LIMIT 60
    `).bind(productId).all()

    reviewsList = reviewsRes.results || []
    total = stats?.total_reviews ?? 20
    avgRating = stats?.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : 4.4
  }

  // Compile customer review photos for the Flipkart collage
  const customerPhotos: {
    url: string
    review_id?: number
    customer_name: string
    rating: number
    title: string
    comment: string
    created_at: string
    helpful_count: number
    unhelpful_count: number
  }[] = []

  // 1. Gather all photos attached to reviews
  for (const r of reviewsList) {
    if (r.image_url && typeof r.image_url === 'string' && r.image_url.trim().length > 0) {
      customerPhotos.push({
        url: r.image_url.trim(),
        review_id: r.id,
        customer_name: r.customer_name || 'Verified Buyer',
        rating: r.rating || 5,
        title: r.title || (r.rating === 5 ? 'Terrific' : r.rating === 4 ? 'Very Good' : 'Good'),
        comment: r.comment || '',
        created_at: r.created_at,
        helpful_count: r.helpful_count || 0,
        unhelpful_count: r.unhelpful_count || 0,
      })
    }
  }

  // 2. Add extra product review images if provided
  for (let idx = 0; idx < extraImages.length; idx++) {
    const imgUrl = extraImages[idx]
    if (!customerPhotos.some((p) => p.url === imgUrl)) {
      const fallbackNames = ['Shiv Mohan', 'Aarav Sharma', 'Priya Patel', 'Vikram Malhotra', 'Sneha Verma']
      customerPhotos.push({
        url: imgUrl,
        customer_name: fallbackNames[idx % fallbackNames.length],
        rating: 5,
        title: idx === 0 ? 'Terrific' : idx === 1 ? 'Perfect' : 'Mind-blowing purchase',
        comment: 'Best quality product! Exactly as shown, totally satisfied with the purchase.',
        created_at: new Date(Date.now() - (idx + 1) * 7 * 86400000).toISOString(),
        helpful_count: 2 + idx,
        unhelpful_count: 0,
      })
    }
  }

  // Compute Flipkart aspect ratings
  const baseAvg = avgRating || 4.4
  const aspectRatings = {
    quality: parseFloat(Math.min(5, Math.max(3.8, baseAvg - 0.2)).toFixed(1)),
    design: parseFloat(Math.min(5, Math.max(3.9, baseAvg - 0.1)).toFixed(1)),
    look_and_feel: parseFloat(Math.min(5, Math.max(3.8, baseAvg - 0.4)).toFixed(1)),
    value_for_money: parseFloat(Math.min(5, Math.max(4.0, baseAvg - 0.2)).toFixed(1)),
    service: parseFloat(Math.min(5, Math.max(3.9, baseAvg - 0.3)).toFixed(1)),
  }

  return c.json({
    reviews: reviewsList,
    total,
    average_rating: baseAvg,
    rating_label: baseAvg >= 4.5 ? 'Excellent' : baseAvg >= 4.0 ? 'Very Good' : baseAvg >= 3.5 ? 'Good' : 'Average',
    customer_photos: customerPhotos,
    product_review_images: extraImages,
    aspect_ratings: aspectRatings,
    show_seed: showSeedReviews,
  })
})

// POST /api/reviews
app.post('/', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = reviewSubmitSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const d = parsed.data
  let isVerified = 0

  if (d.order_number) {
    const verifiedOrder = await c.env.DB.prepare(`
      SELECT id FROM orders WHERE order_number = ? AND product_id = ? AND status = 'PAID'
    `).bind(d.order_number.trim(), d.product_id).first()
    if (verifiedOrder) isVerified = 1
  }

  const defaultTitle = d.title?.trim() || (d.rating === 5 ? 'Terrific' : d.rating === 4 ? 'Very Good' : 'Good')

  const result = await c.env.DB.prepare(`
    INSERT INTO product_reviews (product_id, customer_name, rating, title, comment, image_url, is_verified_purchase, is_approved, is_seed, helpful_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0)
  `).bind(d.product_id, d.customer_name.trim(), d.rating, defaultTitle, d.comment.trim(), d.image_url?.trim() || null, isVerified).run()

  return c.json({
    success: true,
    id: result.meta.last_row_id,
    is_verified_purchase: isVerified === 1,
  })
})

// POST /api/reviews/:id/vote — Thumbs up or down
app.post('/:id/vote', async (c) => {
  const id = parseInt(c.req.param('id'))
  if (isNaN(id) || id <= 0) return c.json({ error: 'Invalid review ID' }, 400)

  let body: any = {}
  try {
    body = await c.req.json()
  } catch {}

  const type = body?.type === 'down' ? 'down' : 'up'

  if (type === 'down') {
    await c.env.DB.prepare(`
      UPDATE product_reviews SET unhelpful_count = COALESCE(unhelpful_count, 0) + 1 WHERE id = ?
    `).bind(id).run()
  } else {
    await c.env.DB.prepare(`
      UPDATE product_reviews SET helpful_count = COALESCE(helpful_count, 0) + 1 WHERE id = ?
    `).bind(id).run()
  }

  const updated = await c.env.DB.prepare(`
    SELECT id, helpful_count, unhelpful_count FROM product_reviews WHERE id = ?
  `).bind(id).first()

  return c.json({ success: true, updated })
})

export default app
