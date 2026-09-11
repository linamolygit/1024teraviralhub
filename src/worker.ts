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
import razorpayWebhookRoute from './routes/razorpay-webhook'
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
import externalCheckoutRoutes from './routes/external-checkout'
import shareRoute from './routes/share'

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
import adminGatewaysRoutes from './routes/admin/gateways'
import adminMediaRoutes from './routes/admin/media'

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
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'connect.facebook.net', 'challenges.cloudflare.com', 'sdk.cashfree.com', 'checkout.razorpay.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
    imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
    connectSrc: [
      "'self'",
      'https://api.cashfree.com',
      'https://sandbox.cashfree.com',
      'https://api.razorpay.com',
      'https://lumberjack.razorpay.com',
      'https://lumberjack-cx.razorpay.com',
      'https://*.googleapis.com',
      'https://identitytoolkit.googleapis.com',
      'https://securetoken.googleapis.com',
      'https://www.googleapis.com',
      'https://*.firebaseapp.com',
      'https://*.firebaseio.com',
    ],
    frameSrc: ["'self'", 'https://*.firebaseapp.com', 'https://api.razorpay.com'],
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
      origin.includes('instatextpro.online') ||
      origin === 'https://1024teraviralhub.com' ||
      origin === 'https://www.1024teraviralhub.com'
    ) {
      return origin
    }
    return 'https://1024teraviralhub.com'
  },
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Partner-Key', 'x-partner-key'],
  credentials: true,
}))

// ─── Realtime No-Cache Header for API responses (excluding image/media assets) ───
app.use('/api/*', async (c, next) => {
  await next()
  if (!c.req.path.startsWith('/api/images')) {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
    c.header('Pragma', 'no-cache')
    c.header('Expires', '0')
  }
})

// ─── Public API Routes ───────────────────────
app.route('/api/products', productsRoutes)
app.route('/api/categories', categoriesRoutes)
app.route('/api/blog', blogRoutes)
app.route('/api/checkout', checkoutRoutes)
app.route('/api/cashfree', cashfreeWebhookRoute)
app.route('/api/razorpay', razorpayWebhookRoute)
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
app.route('/api/external', externalCheckoutRoutes)
app.route('/api/external-checkout', externalCheckoutRoutes)
app.route('/api/share', shareRoute)

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
app.route('/api/admin/gateways', adminGatewaysRoutes)
app.route('/api/admin/media', adminMediaRoutes)

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

// ─── Dynamic Open Graph / SEO Tag Injector ────
interface SeoMetaParams {
  title: string
  description: string
  url: string
  imageUrl: string
  imageType?: string
  type?: 'product' | 'article' | 'website'
  price?: number
  currency?: string
  siteName?: string
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function injectSeoTags(html: string, meta: SeoMetaParams): string {
  const titleTag = `<title>${escapeHtml(meta.title)}</title>`
  const descTag = `<meta name="description" content="${escapeHtml(meta.description)}" />`

  // Replace <title>
  let newHtml = html.replace(/<title>[\s\S]*?<\/title>/i, titleTag)
  // Replace <meta name="description" ... />
  newHtml = newHtml.replace(/<meta\s+name=["']description["'][\s\S]*?>/i, descTag)

  const ogBlock = `
    <!-- Dynamic Open Graph / Facebook / WhatsApp -->
    <meta property="og:site_name" content="${escapeHtml(meta.siteName || '1024TeraViralHub')}" />
    <meta property="og:type" content="${meta.type || 'website'}" />
    <meta property="og:url" content="${escapeHtml(meta.url)}" />
    <meta property="og:title" content="${escapeHtml(meta.title)}" />
    <meta property="og:description" content="${escapeHtml(meta.description)}" />
    <meta property="og:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(meta.imageUrl)}" />
    <meta property="og:image:type" content="${escapeHtml(meta.imageType || 'image/jpeg')}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${escapeHtml(meta.title)}" />
    ${meta.price !== undefined ? `<meta property="product:price:amount" content="${meta.price}" />
    <meta property="product:price:currency" content="${escapeHtml(meta.currency || 'INR')}" />` : ''}

    <!-- Twitter / X Card -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:site" content="@1024teraviralhub" />
    <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
    <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
    <meta name="twitter:image" content="${escapeHtml(meta.imageUrl)}" />
    <meta name="twitter:image:alt" content="${escapeHtml(meta.title)}" />
    <link rel="canonical" href="${escapeHtml(meta.url)}" />
`

  // Safely strip only Open Graph, Twitter, and canonical tags (NEVER touch <script> or <link rel="stylesheet">)
  newHtml = newHtml.replace(/<meta\s+property=["']og:[^"']*["'][^>]*>/gi, '')
  newHtml = newHtml.replace(/<meta\s+property=["']product:[^"']*["'][^>]*>/gi, '')
  newHtml = newHtml.replace(/<meta\s+name=["']twitter:[^"']*["'][^>]*>/gi, '')
  newHtml = newHtml.replace(/<link\s+rel=["']canonical["'][^>]*>/gi, '')
  newHtml = newHtml.replace(/<!--\s*(Open Graph|Twitter)[^>]*-->/gi, '')

  // Safely insert new OG block right before </head>
  newHtml = newHtml.replace('</head>', `${ogBlock}\n</head>`)

  // If product, append JSON-LD structured data schema
  if (meta.type === 'product' && meta.price !== undefined) {
    const jsonLd = `
    <script type="application/ld+json">
    ${JSON.stringify({
      '@context': 'https://schema.org/',
      '@type': 'Product',
      name: meta.title,
      image: [meta.imageUrl],
      description: meta.description,
      offers: {
        '@type': 'Offer',
        priceCurrency: meta.currency || 'INR',
        price: meta.price,
        availability: 'https://schema.org/InStock',
        url: meta.url,
      },
    })}
    </script>`
    newHtml = newHtml.replace('</head>', `${jsonLd}\n</head>`)
  }

  return newHtml
}

// ─── SSR Google Suite & Search Console Verification Injector ─────
async function injectGoogleSuite(html: string, db: D1Database): Promise<string> {
  try {
    const rows = await db.prepare(
      `SELECT key, value FROM website_settings WHERE key IN ('gsc_enabled', 'gsc_verification_tag', 'ga4_enabled', 'ga4_measurement_id', 'adsense_enabled', 'adsense_publisher_id', 'adsense_head_code', 'adx_enabled', 'adx_head_code')`
    ).all()

    const settings: Record<string, any> = {}
    for (const r of (rows.results || []) as { key: string; value: string }[]) {
      try { settings[r.key] = JSON.parse(r.value) } catch { settings[r.key] = r.value }
    }

    let headTags = ''

    // 1. Google Search Console Verification Meta Tag (Mandatory for Googlebot ownership check)
    if (settings.gsc_enabled !== false && settings.gsc_verification_tag) {
      let raw = String(settings.gsc_verification_tag).trim()
      if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
        try {
          const p = JSON.parse(raw)
          if (typeof p === 'string') raw = p.trim()
        } catch {}
      }
      raw = raw.replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\\"/g, '"')
      const match = raw.match(/content=\\?["']([^"'\\]+)\\?["']/i)
      const token = match && match[1] ? match[1].trim() : raw.replace(/<[^>]*>/g, '').replace(/["'\\]/g, '').trim()
      if (token) {
        headTags += `\n    <!-- Google Search Console Verification -->\n    <meta name="google-site-verification" content="${token}" />`
      }
    }

    // 2. Google Analytics 4 (GA4) Tag
    if (settings.ga4_enabled !== false && settings.ga4_measurement_id) {
      let ga4Id = String(settings.ga4_measurement_id).trim()
      if ((ga4Id.startsWith('"') && ga4Id.endsWith('"')) || (ga4Id.startsWith("'") && ga4Id.endsWith("'"))) {
        try {
          const p = JSON.parse(ga4Id)
          if (typeof p === 'string') ga4Id = p.trim()
        } catch {}
      }
      if (ga4Id && ga4Id.startsWith('G-')) {
        headTags += `\n    <!-- Google Analytics 4 (GA4) -->\n    <script async src="https://www.googletagmanager.com/gtag/js?id=${ga4Id}"></script>\n    <script>\n      window.dataLayer = window.dataLayer || [];\n      function gtag(){dataLayer.push(arguments);}\n      gtag('js', new Date());\n      gtag('config', '${ga4Id}', { send_page_view: true });\n    </script>`
      }
    }

    // 3. Google AdSense Auto-Ads Tag
    if (settings.adsense_enabled && settings.adsense_publisher_id) {
      let pubId = String(settings.adsense_publisher_id).trim()
      if (pubId.startsWith('pub-') && !pubId.startsWith('ca-pub-')) pubId = `ca-${pubId}`
      if (pubId.startsWith('ca-pub-')) {
        headTags += `\n    <!-- Google AdSense -->\n    <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}" crossorigin="anonymous"></script>`
      }
      if (settings.adsense_head_code) {
        headTags += `\n    ${settings.adsense_head_code}`
      }
    }

    // 4. Google Ad Manager / AdX Tag
    if (settings.adx_enabled) {
      headTags += `\n    <!-- Google Ad Manager / AdX -->\n    <script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" crossorigin="anonymous"></script>`
      if (settings.adx_head_code) {
        headTags += `\n    ${settings.adx_head_code}`
      }
    }

    if (headTags) {
      return html.replace('</head>', `${headTags}\n</head>`)
    }
  } catch (e) {
    console.error('[Google Suite Server Injection Error]', e)
  }
  return html
}

// ─── SPA Fallback — serve React app with Dynamic Open Graph / SEO ──
app.get('*', async (c) => {
  const url = new URL(c.req.url)
  const path = url.pathname

  // 1. Try to serve exact static assets first (.js, .css, .ico, /assets/*, etc.)
  try {
    const assetRes = await c.env.ASSETS.fetch(c.req.raw)
    // If asset found (not a 404), return it immediately
    if (assetRes.status !== 404) {
      return assetRes
    }
  } catch {
    // ASSETS.fetch threw — fall through to index.html
  }

  // 2. Fetch index.html template from ASSETS
  let html = ''
  try {
    const indexReq = new Request(new URL('/index.html', c.req.url).toString(), {
      headers: c.req.raw.headers,
    })
    const indexRes = await c.env.ASSETS.fetch(indexReq)
    html = await indexRes.text()
  } catch (e) {
    console.error('Failed to serve index.html:', e)
    return new Response('Application failed to load. Please try again.', {
      status: 503,
      headers: { 'Content-Type': 'text/plain' },
    })
  }

  // Fast-path: Admin routes do not need Open Graph injection; serve clean SPA bundle directly
  if (path.startsWith('/admin')) {
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    })
  }

  // Inject Google Suite & GSC verification tag server-side for search engines & crawlers
  html = await injectGoogleSuite(html, c.env.DB)

  // Determine site base origin for absolute OG image & canonical URLs
  const siteOrigin = (url.hostname.endsWith('.workers.dev') || url.hostname === 'localhost')
    ? url.origin
    : (c.env.SITE_URL || url.origin).replace(/\/$/, '')

  // 3. Dynamic Product Preview: /product/:slug
  const productMatch = path.match(/^\/product\/([^/?#]+)/)
  if (productMatch) {
    const slug = decodeURIComponent(productMatch[1])
    try {
      const product = await c.env.DB.prepare(`
        SELECT 
          p.id, p.title, p.slug, p.short_description, p.description, 
          p.price, p.sale_price, p.currency, p.og_image_key, p.meta_title, p.meta_description,
          (
            SELECT r2_key 
            FROM product_images 
            WHERE product_id = p.id 
            ORDER BY is_thumbnail DESC, sort_order ASC, id ASC 
            LIMIT 1
          ) as thumbnail_key
        FROM products p 
        WHERE p.slug = ? AND p.is_published = 1
      `).bind(slug).first<any>()

      if (product) {
        const imageKey = product.og_image_key || product.thumbnail_key
        let ogImageUrl = `${siteOrigin}/assets/collection-section-image.png`
        let mimeType = 'image/jpeg'

        if (imageKey) {
          if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
            ogImageUrl = imageKey
          } else {
            ogImageUrl = `${siteOrigin}/api/images/${encodeURIComponent(imageKey)}`
          }
          if (/\.png$/i.test(imageKey)) mimeType = 'image/png'
          else if (/\.webp$/i.test(imageKey)) mimeType = 'image/webp'
          else if (/\.gif$/i.test(imageKey)) mimeType = 'image/gif'
          else mimeType = 'image/jpeg'
        }

        const title = product.meta_title || `${product.title} — 1024TeraViralHub`
        const rawDesc = product.meta_description || product.short_description || product.description || 'Instant digital download for premium wallpapers, templates, and digital assets.'
        const plainDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240)
        const canonicalUrl = `${siteOrigin}/product/${product.slug}`
        const effectivePrice = product.sale_price ?? product.price
        const currency = product.currency || 'INR'

        html = injectSeoTags(html, {
          title,
          description: plainDesc,
          url: canonicalUrl,
          imageUrl: ogImageUrl,
          imageType: mimeType,
          type: 'product',
          price: effectivePrice,
          currency,
          siteName: '1024TeraViralHub',
        })

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        })
      }
    } catch (e) {
      console.error('[OG Product Injection Error]', e)
    }
  }

  // 3.5 Dynamic Share Link Preview & Anti-Spam SEO: /share/:uid
  const shareMatch = path.match(/^\/share\/([^/?#]+)/)
  if (shareMatch) {
    const uid = decodeURIComponent(shareMatch[1])
    try {
      const shareRecord = await c.env.DB.prepare(`
        SELECT s.uid, s.product_id, s.product_slug,
          p.id, p.title, p.slug, p.short_description, p.description, 
          p.price, p.sale_price, p.currency, p.og_image_key, p.meta_title, p.meta_description,
          (
            SELECT r2_key 
            FROM product_images 
            WHERE product_id = p.id 
            ORDER BY is_thumbnail DESC, sort_order ASC, id ASC 
            LIMIT 1
          ) as thumbnail_key
        FROM share_links s
        JOIN products p ON s.product_id = p.id
        WHERE s.uid = ? AND p.is_published = 1
      `).bind(uid).first<any>()

      if (shareRecord) {
        const imageKey = shareRecord.og_image_key || shareRecord.thumbnail_key
        let ogImageUrl = `${siteOrigin}/assets/collection-section-image.png`
        let mimeType = 'image/jpeg'

        if (imageKey) {
          if (imageKey.startsWith('http://') || imageKey.startsWith('https://')) {
            ogImageUrl = imageKey
          } else {
            ogImageUrl = `${siteOrigin}/api/images/${encodeURIComponent(imageKey)}`
          }
          if (/\.png$/i.test(imageKey)) mimeType = 'image/png'
          else if (/\.webp$/i.test(imageKey)) mimeType = 'image/webp'
          else if (/\.gif$/i.test(imageKey)) mimeType = 'image/gif'
          else mimeType = 'image/jpeg'
        }

        const title = shareRecord.meta_title || `${shareRecord.title} — 1024TeraViralHub`
        const rawDesc = shareRecord.meta_description || shareRecord.short_description || shareRecord.description || 'Instant digital download for premium wallpapers, templates, and digital assets.'
        const plainDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240)
        const canonicalUrl = `${siteOrigin}/share/${shareRecord.uid}`
        const effectivePrice = shareRecord.sale_price ?? shareRecord.price
        const currency = shareRecord.currency || 'INR'

        html = injectSeoTags(html, {
          title,
          description: plainDesc,
          url: canonicalUrl,
          imageUrl: ogImageUrl,
          imageType: mimeType,
          type: 'product',
          price: effectivePrice,
          currency,
          siteName: '1024TeraViralHub',
        })

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        })
      }
    } catch (e) {
      console.error('[OG Share Injection Error]', e)
    }
  }

  // 4. Dynamic Blog Post Preview: /blog/:slug
  const blogMatch = path.match(/^\/blog\/([^/?#]+)/)
  if (blogMatch) {
    const slug = decodeURIComponent(blogMatch[1])
    try {
      const post = await c.env.DB.prepare(`
        SELECT title, slug, excerpt, content, cover_image, meta_title, meta_description
        FROM blog_posts
        WHERE slug = ? AND is_published = 1
      `).bind(slug).first<any>()

      if (post) {
        let ogImageUrl = `${siteOrigin}/assets/collection-section-image.png`
        let mimeType = 'image/jpeg'

        if (post.cover_image) {
          if (post.cover_image.startsWith('http://') || post.cover_image.startsWith('https://')) {
            ogImageUrl = post.cover_image
          } else {
            ogImageUrl = `${siteOrigin}/api/images/${encodeURIComponent(post.cover_image)}`
          }
          if (/\.png$/i.test(post.cover_image)) mimeType = 'image/png'
          else if (/\.webp$/i.test(post.cover_image)) mimeType = 'image/webp'
          else mimeType = 'image/jpeg'
        }

        const title = post.meta_title || `${post.title} — 1024TeraViralHub Blog`
        const rawDesc = post.meta_description || post.excerpt || post.content || ''
        const plainDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240)
        const canonicalUrl = `${siteOrigin}/blog/${post.slug}`

        html = injectSeoTags(html, {
          title,
          description: plainDesc,
          url: canonicalUrl,
          imageUrl: ogImageUrl,
          imageType: mimeType,
          type: 'article',
          siteName: '1024TeraViralHub',
        })

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'public, max-age=60, s-maxage=300',
          },
        })
      }
    } catch (e) {
      console.error('[OG Blog Injection Error]', e)
    }
  }

  // 5. Fallback for all other routes
  html = injectSeoTags(html, {
    title: '1024TeraViralHub — Premium Digital Downloads & Assets',
    description: 'Instant, secure digital downloads for premium wallpapers, photo packs, creative templates, and digital assets. No account required, pay and download in seconds.',
    url: `${siteOrigin}${path}`,
    imageUrl: `${siteOrigin}/assets/collection-section-image.png`,
    imageType: 'image/png',
    type: 'website',
    siteName: '1024TeraViralHub',
  })

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60, s-maxage=300',
    },
  })
})

export default app
