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

  // Determine if this is a video or media file that requires Range streaming
  const isVideoOrAudio = /\.(mp4|webm|mov|mkv|ogg|avi|mp3|wav|m4a)$/i.test(decodedKey)
  const rangeHeader = c.req.header('range')

  // Check Cloudflare Edge Cache (only for full GET requests, not Range requests)
  const cacheUrl = new URL(c.req.url)
  const cacheKey = new Request(cacheUrl.toString(), c.req.raw)
  // @ts-expect-error caches.default is standard in Cloudflare Workers runtime
  const cache = typeof caches !== 'undefined' ? caches.default : null

  if (cache && !rangeHeader && !isVideoOrAudio) {
    try {
      const cachedResponse = await cache.match(cacheKey)
      if (cachedResponse) {
        return cachedResponse
      }
    } catch {
      // Ignore edge cache read failures
    }
  }

  // Attempt to retrieve pre-generated variant first if requested (images or adaptive video)
  let object: R2ObjectBody | null = null
  let servedVariant = 'original'

  const qualityParam = (query.quality || query.variant || '').toLowerCase()
  const isLiteQualityRequested = qualityParam === 'lite' || qualityParam === 'low' || qualityParam === '480p' || qualityParam === 'mobile'

  // Adaptive Video Streaming: Check if -lite variant exists in R2
  if (isVideoOrAudio && isLiteQualityRequested) {
    const dotIndex = decodedKey.lastIndexOf('.')
    if (dotIndex !== -1) {
      const liteKey = `${decodedKey.substring(0, dotIndex)}-lite${decodedKey.substring(dotIndex)}`
      try {
        if (rangeHeader) {
          const liteObj = await c.env.R2.get(liteKey, { range: c.req.raw.headers })
          if (liteObj) {
            object = liteObj
            servedVariant = 'lite'
          }
        } else {
          const liteObj = await getR2Object(c.env.R2, liteKey)
          if (liteObj) {
            object = liteObj
            servedVariant = 'lite'
          }
        }
      } catch {
        // Fallback gracefully to master video if lite variant not available
      }
    }
  }

  if (targetVariant !== 'original' && !isVideoOrAudio) {
    const variantKey = getVariantR2Key(decodedKey, targetVariant)
    object = await getR2Object(c.env.R2, variantKey)
    if (object) {
      servedVariant = targetVariant
    }
  }

  // Fallback to original master image or stream video with optional HTTP Range
  if (!object) {
    if (rangeHeader) {
      // Pass range to Cloudflare R2 for instant video chunk streaming & seeking
      object = await c.env.R2.get(decodedKey, { range: c.req.raw.headers })
    } else {
      object = await getR2Object(c.env.R2, decodedKey)
    }
  }

  if (!object) {
    return c.text('Media not found', 404)
  }

  const headers = new Headers()
  object.writeHttpMetadata(headers)
  headers.set('etag', object.httpEtag)
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', isVideoOrAudio ? 'public, max-age=31536000, immutable' : 'public, max-age=31536000, immutable')
  headers.set('Vary', 'Accept, Accept-Encoding, Range')
  headers.set('X-Media-Variant', servedVariant)

  // Ensure appropriate Content-Type for videos and variants
  if (!headers.get('content-type') || headers.get('content-type') === 'application/octet-stream') {
    if (/\.mp4$/i.test(decodedKey)) headers.set('content-type', 'video/mp4')
    else if (/\.webm$/i.test(decodedKey)) headers.set('content-type', 'video/webm')
    else if (/\.mov$/i.test(decodedKey)) headers.set('content-type', 'video/quicktime')
    else if (/\.mkv$/i.test(decodedKey)) headers.set('content-type', 'video/x-matroska')
    else if (/\.pdf$/i.test(decodedKey)) headers.set('content-type', 'application/pdf')
    else if (/\.zip$/i.test(decodedKey)) headers.set('content-type', 'application/zip')
    else if (servedVariant !== 'original') headers.set('content-type', 'image/webp')
  }

  // If R2 served a partial range, return 206 Partial Content with precise Content-Range header
  const isPartial = rangeHeader && 'range' in object && object.range
  if (isPartial && 'range' in object && object.range) {
    let start = 0
    let end = object.size - 1
    let length = object.size
    const rangeObj = object.range as any
    if (rangeObj.offset !== undefined) {
      start = rangeObj.offset
      length = rangeObj.length ?? (object.size - start)
      end = start + length - 1
    } else if (rangeObj.suffix !== undefined) {
      start = Math.max(0, object.size - rangeObj.suffix)
      length = rangeObj.suffix
      end = object.size - 1
    }
    headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`)
    headers.set('Content-Length', `${length}`)
  } else {
    headers.set('Content-Length', `${object.size}`)
  }

  const response = new Response(object.body, {
    status: isPartial ? 206 : 200,
    headers,
  })

  // Save full image responses in edge cache
  if (cache && c.req.method === 'GET' && !rangeHeader && !isVideoOrAudio) {
    c.executionCtx.waitUntil(cache.put(cacheKey, response.clone()))
  }

  return response
})

export default app
