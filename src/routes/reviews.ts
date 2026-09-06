// src/routes/reviews.ts — Public Product Reviews API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'

import { ensureBaselineReviews, getSetting } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

const reviewSubmitSchema = z.object({
  product_id: z.number().int().positive(),
  customer_name: z.string().min(2).max(100),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000),
  order_number: z.string().optional(),
})

// GET /api/reviews/product/:productId
app.get('/product/:productId', async (c) => {
  const productId = parseInt(c.req.param('productId'))
  const showSeedReviews = (await getSetting<boolean>(c.env.DB, 'show_seed_reviews', true)) ?? true

  if (!showSeedReviews) {
    // Strictly Real Buyer Reviews Only (is_seed = 0)
    const reviews = await c.env.DB.prepare(`
      SELECT id, product_id, customer_name, rating, comment, is_verified_purchase, created_at
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1 AND is_seed = 0
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(productId).all()

    const stats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1 AND is_seed = 0
    `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }

    const total = stats?.total_reviews ?? 0
    const avgRating = stats?.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : null

    return c.json({
      reviews: reviews.results,
      total,
      average_rating: avgRating,
      show_seed: false,
    })
  }

  // Boosted / Social Proof Mode (Seed reviews + real buyer reviews)
  let reviews = await c.env.DB.prepare(`
    SELECT id, product_id, customer_name, rating, comment, is_verified_purchase, created_at
    FROM product_reviews
    WHERE product_id = ? AND is_approved = 1
    ORDER BY created_at DESC
    LIMIT 50
  `).bind(productId).all()

  let stats = await c.env.DB.prepare(`
    SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
    FROM product_reviews
    WHERE product_id = ? AND is_approved = 1
  `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }

  if (!stats || stats.total_reviews < 15) {
    await ensureBaselineReviews(c.env.DB, productId)
    reviews = await c.env.DB.prepare(`
      SELECT id, product_id, customer_name, rating, comment, is_verified_purchase, created_at
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
      LIMIT 50
    `).bind(productId).all()

    stats = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating
      FROM product_reviews
      WHERE product_id = ? AND is_approved = 1
    `).bind(productId).first() as { total_reviews: number; avg_rating: number | null }
  }

  return c.json({
    reviews: reviews.results,
    total: stats?.total_reviews ?? 20,
    average_rating: stats?.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : 4.8,
    show_seed: true,
  })
})

// POST /api/reviews
app.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = reviewSubmitSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const d = parsed.data
  let isVerified = 0

  if (d.order_number) {
    const verifiedOrder = await c.env.DB.prepare(`
      SELECT id FROM orders WHERE order_number = ? AND product_id = ? AND status = 'PAID'
    `).bind(d.order_number.trim(), d.product_id).first()
    if (verifiedOrder) isVerified = 1
  }

  const result = await c.env.DB.prepare(`
    INSERT INTO product_reviews (product_id, customer_name, rating, comment, is_verified_purchase, is_approved, is_seed)
    VALUES (?, ?, ?, ?, ?, 1, 0)
  `).bind(d.product_id, d.customer_name, d.rating, d.comment, isVerified).run()

  return c.json({ success: true, id: result.meta.last_row_id, is_verified_purchase: isVerified === 1 })
})

export default app
