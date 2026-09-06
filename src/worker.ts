// ============================================
// src/worker.ts — Main Cloudflare Worker Entry
// Hono app: serves React SPA + all API routes
// ============================================

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'

// Public API Routes
import productsRoutes from './routes/products'
import categoriesRoutes from './routes/categories'
import blogRoutes from './routes/blog'
import checkoutRoutes from './routes/checkout'
import cashfreeWebhookRoute from './routes/cashfree-webhook'
import downloadRoutes from './routes/download'
import orderLookupRoute from './routes/order-lookup'
import searchRoute from './routes/search'
import contactRoute from './routes/contact'
import analyticsRoute from './routes/analytics'
import imagesRoute from './routes/images'
import settingsRoute from './routes/settings'
import couponsRoute from './routes/coupons'
import reviewsRoute from './routes/reviews'
import affiliatesRoute from './routes/affiliates'
import adsRoute from './routes/ads'

// Admin Routes (Firebase protected)
import adminAuthRoutes from './routes/admin/auth'
import adminProductsRoutes from './routes/admin/products'
import adminOrdersRoutes from './routes/admin/orders'
import adminBlogRoutes from './routes/admin/blog'
import adminAnalyticsRoutes from './routes/admin/analytics'
import adminSettingsRoutes from './routes/admin/settings'
import adminDownloadsRoutes from './routes/admin/downloads'
import adminAuditRoutes from './routes/admin/audit'
import adminCouponsRoutes from './routes/admin/coupons'
import adminReviewsRoutes from './routes/admin/reviews'
import adminUsersRoutes from './routes/admin/users'
import adminCustomersRoutes from './routes/admin/customers'
import adminAdsRoutes from './routes/admin/ads'
import adminAffiliatesRoutes from './routes/admin/affiliates'
import adminAiRoutes from './routes/admin/ai'

export type Env = {
  DB: D1Database
  R2: R2Bucket
  ASSETS: Fetcher
  CASHFREE_APP_ID: string
  CASHFREE_SECRET_KEY: string
  CASHFREE_WEBHOOK_SECRET: string
  CASHFREE_API_URL: string
  FIREBASE_PROJECT_ID: string
  FIREBASE_CLIENT_EMAIL: string
  FIREBASE_PRIVATE_KEY: string
  ADMIN_SECRET_KEY: string
  SITE_URL: string
  ENVIRONMENT: string
  RESEND_API_KEY?: string
  TURNSTILE_SECRET_KEY?: string
  GEMINI_API_KEY?: string
}

export type AdminVars = {
  adminUid: string
  adminEmail: string
  adminName?: string
  adminRole?: string
}

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

// ─── Global Error Handler ────────────────────
app.onError((err, c) => {
  console.error('[Worker Error]', err.message, err.stack)
  // If the request is for an API route, return JSON
  if (c.req.path.startsWith('/api/')) {
    return c.json({ error: 'Internal server error', message: err.message }, 500)
  }
  // For page routes, try to serve the SPA
  try {
    const indexUrl = new URL('/index.html', c.req.url)
    return c.env.ASSETS.fetch(new Request(indexUrl.toString()))
  } catch {
    return new Response(`<h1>Server Error</h1><pre>${err.message}</pre>`, {
      status: 500,
      headers: { 'Content-Type': 'text/html' }
    })
  }
})

// ─── Global Middleware ───────────────────────
app.use('*', logger())
app.use('*', secureHeaders({
  xFrameOptions: 'SAMEORIGIN',
  xContentTypeOptions: 'nosniff',
  referrerPolicy: 'strict-origin-when-cross-origin',
  contentSecurityPolicy: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'connect.facebook.net', 'challenges.cloudflare.com', 'sdk.cashfree.com'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: [
      "'self'",
      'https://api.cashfree.com',
      'https://sandbox.cashfree.com',
      'https://*.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://www.googleapis.com',
      'https://*.firebaseapp.com',
      'https://*.firebaseio.com',
    ],
    frameSrc: ["'self'", 'https://*.firebaseapp.com'],
  },
}))

app.use('/api/*', cors({
  origin: (origin) => {
    // Allow all origins in development / workers.dev — tighten in production if needed
    if (!origin) return '*'
    // Allow localhost, workers.dev previews, and the production domain
    if (
      origin.startsWith('http://localhost') ||
      origin.startsWith('https://localhost') ||
      origin.endsWith('.workers.dev') ||
      origin === 'https://1024teraviralhub.com' ||
      origin === 'https://www.1024teraviralhub.com'
    ) {
      return origin
    }
    return 'https://1024teraviralhub.com'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
}))

// ─── Realtime No-Cache Header for API responses ───
app.use('/api/*', async (c, next) => {
  await next()
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')
})

// ─── Public API Routes ───────────────────────
app.route('/api/products', productsRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/blog', blogRoutes)
app.route('/api/checkout', checkoutRoutes)
app.route('/api/cashfree', cashfreeWebhookRoute)
app.route('/api/download', downloadRoutes)
app.route('/api/order-lookup', orderLookupRoute)
app.route('/api/search', searchRoute)
app.route('/api/contact', contactRoute)
app.route('/api/analytics', analyticsRoute)
app.route('/api/images', imagesRoute)
app.route('/images', imagesRoute)
app.route('/api/settings', settingsRoute)
app.route('/api/coupons', couponsRoute)
app.route('/api/reviews', reviewsRoute)
app.route('/api/affiliates', affiliatesRoute)
app.route('/api/ads', adsRoute)

// ─── Admin API Routes ────────────────────────
app.route('/api/admin/auth', adminAuthRoutes)
app.route('/api/admin/products', adminProductsRoutes)
app.route('/api/admin/orders', adminOrdersRoutes)
app.route('/api/admin/blog', adminBlogRoutes)
app.route('/api/admin/analytics', adminAnalyticsRoutes)
app.route('/api/admin/settings', adminSettingsRoutes)
app.route('/api/admin/downloads', adminDownloadsRoutes)
app.route('/api/admin/audit', adminAuditRoutes)
app.route('/api/admin/coupons', adminCouponsRoutes)
app.route('/api/admin/reviews', adminReviewsRoutes)
app.route('/api/admin/users', adminUsersRoutes)
app.route('/api/admin/customers', adminCustomersRoutes)
app.route('/api/admin/ads', adminAdsRoutes)
app.route('/api/admin/affiliates', adminAffiliatesRoutes)
app.route('/api/admin/ai', adminAiRoutes)

// ─── SEO: Dynamic Sitemap.xml ────────────────
app.get('/sitemap.xml', async (c) => {
  const products = await c.env.DB.prepare(`SELECT slug, updated_at FROM products WHERE is_published = 1`).all()
  const blogs = await c.env.DB.prepare(`SELECT slug, updated_at FROM blog_posts WHERE is_published = 1`).all()
  const siteUrl = c.env.SITE_URL || `${new URL(c.req.url).origin}`

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}/</loc><priority>1.0</priority></url>
  <url><loc>${siteUrl}/products</loc><priority>0.9</priority></url>
  <url><loc>${siteUrl}/blog</loc><priority>0.8</priority></url>
  <url><loc>${siteUrl}/about</loc><priority>0.5</priority></url>
  <url><loc>${siteUrl}/contact</loc><priority>0.5</priority></url>
  <url><loc>${siteUrl}/privacy-policy</loc><priority>0.3</priority></url>
  <url><loc>${siteUrl}/terms-and-conditions</loc><priority>0.3</priority></url>
  <url><loc>${siteUrl}/refund-policy</loc><priority>0.3</priority></url>
  <url><loc>${siteUrl}/shipping-policy</loc><priority>0.3</priority></url>
  <url><loc>${siteUrl}/pricing-products</loc><priority>0.3</priority></url>
  ${(products.results as { slug: string; updated_at?: string }[]).map(p => `
  <url>
    <loc>${siteUrl}/product/${p.slug}</loc>
    <lastmod>${p.updated_at ? p.updated_at.split(' ')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.8</priority>
  </url>`).join('')}
  ${(blogs.results as { slug: string; updated_at?: string }[]).map(b => `
  <url>
    <loc>${siteUrl}/blog/${b.slug}</loc>
    <lastmod>${b.updated_at ? b.updated_at.split(' ')[0] : new Date().toISOString().split('T')[0]}</lastmod>
    <priority>0.7</priority>
  </url>`).join('')}
</urlset>`

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml', 'Cache-Control': 'public, max-age=3600' }
  })
})

// ─── SEO: Robots.txt ─────────────────────────
app.get('/robots.txt', (c) => {
  const siteUrl = c.env.SITE_URL || `${new URL(c.req.url).origin}`
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /download/\nDisallow: /payment/\n\nSitemap: ${siteUrl}/sitemap.xml\n`
  return new Response(robots, {
    headers: { 'Content-Type': 'text/plain' }
  })
})

// ─── Health Check ────────────────────────────
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', ts: new Date().toISOString() })
})

// ─── SPA Fallback — serve React app ──────────
// Cloudflare ASSETS serves static files from ./dist
// For any unknown route (SPA client-side routes), serve index.html
app.get('*', async (c) => {
  const url = new URL(c.req.url)
  const path = url.pathname

  // Try to serve the exact static asset first
  try {
    const assetRes = await c.env.ASSETS.fetch(c.req.raw)
    // If asset found (not a 404), return it
    if (assetRes.status !== 404) {
      return assetRes
    }
  } catch {
    // ASSETS.fetch threw — fall through to index.html
  }

  // For all SPA routes (including /admin/*, /product/*, etc.), serve index.html
  try {
    const indexReq = new Request(`${url.origin}/index.html`, {
      headers: c.req.raw.headers,
    })
    return await c.env.ASSETS.fetch(indexReq)
  } catch (e) {
    console.error('Failed to serve index.html:', e)
    return new Response('Application failed to load. Please try again.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }
})

export default app
