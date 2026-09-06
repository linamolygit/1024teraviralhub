// ============================================
// src/routes/products.ts — Public Products API
// GET /api/products
// GET /api/products/:slug
// ============================================

import { Hono } from 'hono'
import type { Env } from '../worker'
import { getPublishedProducts, getProductBySlug, logAnalyticsEvent, getSetting } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

// GET /api/products
app.get('/', async (c) => {
  const category = c.req.query('category')
  const featured = c.req.query('featured') === 'true'
  const q = c.req.query('q')
  const sort = c.req.query('sort')
  const limit = Math.min(parseInt(c.req.query('limit') ?? '24'), 100)
  const offset = parseInt(c.req.query('offset') ?? '0')

  const products = await getPublishedProducts(c.env.DB, {
    categorySlug: category,
    featured,
    q,
    sort,
    limit,
    offset,
  })

  // Get total count
  let countQuery = `SELECT COUNT(*) as count FROM products p LEFT JOIN product_categories pc ON p.category_id = pc.id WHERE p.is_published = 1`
  const countParams: string[] = []
  if (category) { countQuery += ` AND pc.slug = ?`; countParams.push(category) }
  if (featured) { countQuery += ` AND p.is_featured = 1` }
  if (q) {
    countQuery += ` AND (p.title LIKE ? OR p.description LIKE ?)`
    countParams.push(`%${q}%`, `%${q}%`)
  }

  const countStmt = c.env.DB.prepare(countQuery)
  const countResult = countParams.length > 0
    ? await countStmt.bind(...countParams).first() as { count: number }
    : await countStmt.first() as { count: number }

  // Check seed reviews toggle
  const showSeedReviews = (await getSetting<boolean>(c.env.DB, 'show_seed_reviews', true)) ?? true

  // Attach thumbnail URLs & review stats
  const productsWithImages = await Promise.all(products.map(async (p) => {
    const statsQuery = showSeedReviews
      ? `SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM product_reviews WHERE product_id = ? AND is_approved = 1`
      : `SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM product_reviews WHERE product_id = ? AND is_approved = 1 AND is_seed = 0`

    const [thumbnail, stats] = await Promise.all([
      c.env.DB.prepare(
        `SELECT r2_key FROM product_images WHERE product_id = ? ORDER BY is_thumbnail DESC, sort_order ASC, id ASC LIMIT 1`
      ).bind(p.id).first<{ r2_key: string }>(),
      c.env.DB.prepare(statsQuery).bind(p.id).first<{ total_reviews: number; avg_rating: number | null }>(),
    ])

    const totalReviews = stats?.total_reviews ?? 0
    const avgRating = stats?.avg_rating ? parseFloat(stats.avg_rating.toFixed(1)) : null

    return {
      ...p,
      thumbnail_url: thumbnail ? `/api/images/${encodeURIComponent(thumbnail.r2_key)}` : null,
      effective_price: p.sale_price ?? p.price,
      reviews_count: showSeedReviews ? (totalReviews || 20) : totalReviews,
      average_rating: showSeedReviews ? (avgRating || 4.8) : avgRating,
    }
  }))

  return c.json({
    products: productsWithImages,
    total: countResult?.count ?? 0,
    limit,
    offset,
  })
})

// GET /api/products/:slug
app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const product = await getProductBySlug(c.env.DB, slug)

  if (!product) return c.json({ error: 'Product not found' }, 404)

  // Log product view
  const ip = c.req.header('CF-Connecting-IP')
  await logAnalyticsEvent(c.env.DB, {
    event_type: 'product_view',
    product_id: product.id,
    ip_address: ip,
    referrer: c.req.header('Referer'),
  })

  // Increment view count
  await c.env.DB.prepare(
    `UPDATE products SET view_count = view_count + 1 WHERE id = ?`
  ).bind(product.id).run()

  // Map image keys to URLs
  const imagesWithUrls = product.images.map(img => ({
    ...img,
    url: `/api/images/${encodeURIComponent(img.r2_key)}`,
  }))

  // Related products (same category, different product)
  const related = await c.env.DB.prepare(`
    SELECT p.id, p.slug, p.title, p.price, p.sale_price, p.file_type
    FROM products p
    WHERE p.category_id = ? AND p.id != ? AND p.is_published = 1
    ORDER BY p.total_sales DESC
    LIMIT 4
  `).bind(product.category_id, product.id).all()

  return c.json({
    ...product,
    images: imagesWithUrls,
    effective_price: product.sale_price ?? product.price,
    related: related.results,
  })
})

export default app
