// src/routes/images.ts — High-Performance Edge Optimized R2 Image Serving Route
import { Hono } from 'hono'
import type { Env } from '../worker'
import { getR2Object, getVariantR2Key, type ImageVariant } from '../lib/r2'

const app = new Hono<{ Bindings: Env }>()

app.get('/:key{.*}', async (c) => {
  const rawKey = c.req.param('key')
  if (!rawKey) return c.text('Not found', 404)

  const decodedKey = decodeURIComponent(rawKey)
  const query = c.req.query()
  const variantParam = (query.variant || query.size || '').toLowerCase()
  const widthParam = query.w ? parseInt(query.w, 10) : undefined

  // Determine requested variant
  let targetVariant: ImageVariant = 'original'
  if (variantParam === 'thumb' || variantParam === 'thumbnail' || (widthParam && widthParam <= 500)) {
    targetVariant = 'thumb'
  } else if (variantParam === 'medium' || (widthParam && widthParam > 500 && widthParam <= 1000)) {
    targetVariant = 'medium'
  } else if (variantParam === 'large' || (widthParam && widthParam > 1000)) {
    targetVariant = 'large'
  }

  // Check Cloudflare Edge Cache
  const cacheUrl = new URL(c.req.url)
  const cacheKey = new Request(cacheUrl.toString(), c.req.raw)
  // @ts-expect-error caches.default is standard in Cloudflare Workers runtime
  const cache = typeof caches !== 'undefined' ? caches.default : null

  if (cache) {
    try {
      const cachedResponse = await cache.match(cacheKey)
      if (cachedResponse) {
        return cachedResponse
      }
    } catch {
      // Ignore edge cache read failures
    }
  }

  // Attempt to retrieve pre-generated variant first if requested
  let object = null
  let servedVariant = 'original'

  if (targetVariant !== 'original') {
    const variantKey = getVariantR2Key(decodedKey, targetVariant)
    object = await getR2Object(c.env.R2, variantKey)
    if (object) {
      servedVariant = targetVariant
    }
  }

  // Fallback to original master image
  if (!object) {
    object = await getR2Object(c.env.R2, decodedKey)
  }

  if (!object) {
    return c.text('Image not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Cache-Control', 'public, max-age=31536000, immutable')
  headers.set('Vary', 'Accept, Accept-Encoding')
  headers.set('X-Image-Variant', servedVariant)

  // Ensure appropriate Content-Type for WebP variants
  if (servedVariant !== 'original' && !headers.get('content-type')) {
    headers.set('content-type', 'image/webp')
  }

  const response = new Response(object.body, { headers })

  // Save in edge cache
  if (cache && c.req.method === 'GET') {
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})

export default app
