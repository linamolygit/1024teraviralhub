// ============================================================
// src/routes/share.ts — Dynamic Unique Share Links System
// Anti-Spam protection for Facebook/WhatsApp & Unmuted Video Autoplay Bridge
// ============================================================

import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'
import {
  getProductById,
  getProductBySlug,
  createShareLinkRecord,
  getShareLinkByUid,
  recordShareLinkClick,
  ensureShareLinksTable,
} from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

// Helper to generate unique viral share UID
function generateUniqueShareUid(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
  let randomPart = ''
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  const timePart = Date.now().toString(36).slice(-4)
  return `v${randomPart}${timePart}`
}

const createShareSchema = z.object({
  product_id: z.number().int().positive().optional(),
  slug: z.string().optional(),
  created_by: z.string().optional(),
})

// POST /api/share/create — Generates a fresh unique share link every single time
app.post('/create', async (c) => {
  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = createShareSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const { product_id, slug, created_by } = parsed.data
  if (!product_id && !slug) {
    return c.json({ error: 'Either product_id or slug is required' }, 400)
  }

  // Ensure table exists safely
  await ensureShareLinksTable(c.env.DB)

  // Fetch product
  let product: any = null
  if (product_id) {
    product = await getProductById(c.env.DB, product_id)
  } else if (slug) {
    product = await getProductBySlug(c.env.DB, slug)
  }

  if (!product) {
    return c.json({ error: 'Product not found' }, 404)
  }

  // Generate a brand new unique UID for this share instance
  const uid = generateUniqueShareUid()
  const siteUrl = (c.env.SITE_URL || new URL(c.req.url).origin).replace(/\/$/, '')

  try {
    await createShareLinkRecord(c.env.DB, {
      uid,
      productId: product.id,
      productSlug: product.slug,
      createdBy: created_by || 'user',
    })
  } catch (err: any) {
    console.error('[Share Link DB Insert Error]', err)
    return c.json({ error: 'Could not create share link. Please try again.' }, 500)
  }

  const shareUrl = `${siteUrl}/share/${uid}`

  return c.json({
    success: true,
    uid,
    share_url: shareUrl,
    product_slug: product.slug,
    title: product.title,
  })
})

// GET /api/share/:uid — Fetch target product details for the share bridge
app.get('/:uid', async (c) => {
  const uid = c.req.param('uid').trim()
  if (!uid) {
    return c.json({ error: 'UID is required' }, 400)
  }

  await ensureShareLinksTable(c.env.DB)

  const record = await getShareLinkByUid(c.env.DB, uid)
  if (!record) {
    return c.json({ error: 'Share link not found or expired' }, 404)
  }

  // Record click count
  await recordShareLinkClick(c.env.DB, uid)

  // Fetch full product details including image thumbnail and video URL
  const product = await c.env.DB.prepare(`
    SELECT 
      p.id, p.title, p.slug, p.price, p.sale_price, p.currency,
      p.short_description, p.description, p.video_url,
      (
        SELECT r2_key 
        FROM product_images 
        WHERE product_id = p.id 
        ORDER BY is_thumbnail DESC, sort_order ASC, id ASC 
        LIMIT 1
      ) as thumbnail_key
    FROM products p
    WHERE p.id = ? AND p.is_published = 1
  `).bind(record.product_id).first<any>()

  if (!product) {
    return c.json({ error: 'Product is no longer available' }, 404)
  }

  return c.json({
    success: true,
    uid: record.uid,
    product: {
      id: product.id,
      title: product.title,
      slug: product.slug,
      price: product.price,
      sale_price: product.sale_price,
      currency: product.currency || 'INR',
      thumbnail_key: product.thumbnail_key,
      video_url: product.video_url,
      short_description: product.short_description,
    },
    destination_url: `/product/${product.slug}?ref=share&uid=${encodeURIComponent(uid)}&play=1`,
  })
})

export default app
