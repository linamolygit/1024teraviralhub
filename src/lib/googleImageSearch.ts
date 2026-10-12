// src/lib/googleImageSearch.ts — Automated Google CSE Image Search, R2 Caching & Review Photo Sync
// Uses user's Google Programmable Search Engine (CX) and Custom Search JSON API
// Downloads authentic images into Cloudflare R2 and links them to product reviews with resilient fallback

import { uploadToR2 } from './r2'
import { getSetting } from './db'
import { getThematicImagesForTitle } from './reviewDefaults'

export interface GoogleImageItem {
  title: string
  link: string
  thumbnailLink?: string
  width?: number
  height?: number
  mime?: string
}

export interface GoogleSearchResult {
  success: boolean
  items: GoogleImageItem[]
  query: string
  error?: string
  reason?: 'PERMISSION_DENIED' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'NO_RESULTS' | 'INVALID_CONFIG'
  enableUrl?: string
}

export interface SyncResult {
  success: boolean
  product_id: number
  product_title: string
  images: string[]
  count: number
  source: 'google' | 'fallback' | 'cached'
  warning?: string
  enable_url?: string
}

const DEFAULT_GOOGLE_CX = '83b5a1a30d4014e75'
const DEFAULT_GOOGLE_API_KEY = 'AIzaSyDYAhmgnLa7o1Ibp235YEg0dhga_OQ2Tw0'

/**
 * Perform Google Custom Search API query with searchType=image
 */
export async function searchGoogleImages(
  query: string,
  cx?: string,
  apiKey?: string,
  count = 8
): Promise<GoogleSearchResult> {
  const activeCx = (cx && cx.trim().length > 0) ? cx.trim() : DEFAULT_GOOGLE_CX
  const activeKey = (apiKey && apiKey.trim().length > 0) ? apiKey.trim() : DEFAULT_GOOGLE_API_KEY

  if (!activeCx || !activeKey) {
    return {
      success: false,
      items: [],
      query,
      reason: 'INVALID_CONFIG',
      error: 'Google CSE ID (CX) or API Key is missing',
    }
  }

  const cleanQuery = query.trim()
  const num = Math.min(10, Math.max(1, count))
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(cleanQuery)}&cx=${encodeURIComponent(activeCx)}&key=${encodeURIComponent(activeKey)}&searchType=image&num=${num}&safe=active`

  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(8000),
    })

    const data: any = await res.json().catch(() => null)

    if (!res.ok || data?.error) {
      const err = data?.error
      const message = err?.message || `Google API returned HTTP ${res.status}`
      console.warn(`[Google CSE Error] Status ${res.status}: ${message}`)

      if (res.status === 403 || message.includes('Custom Search JSON API') || message.includes('PERMISSION_DENIED')) {
        return {
          success: false,
          items: [],
          query: cleanQuery,
          reason: 'PERMISSION_DENIED',
          error: 'Google Cloud Console me "Custom Search API" enable nahi hai.',
          enableUrl: 'https://console.cloud.google.com/apis/library/customsearch.googleapis.com',
        }
      }

      if (res.status === 429 || message.toLowerCase().includes('quota')) {
        return {
          success: false,
          items: [],
          query: cleanQuery,
          reason: 'QUOTA_EXCEEDED',
          error: 'Google Custom Search daily limit (100 free queries) reached.',
        }
      }

      return {
        success: false,
        items: [],
        query: cleanQuery,
        reason: 'NETWORK_ERROR',
        error: message,
      }
    }

    const rawItems: any[] = data?.items || []
    const items: GoogleImageItem[] = rawItems
      .filter((item) => item?.link && typeof item.link === 'string')
      .map((item) => ({
        title: item.title || '',
        link: item.link,
        thumbnailLink: item.image?.thumbnailLink || item.thumbnailLink,
        width: item.image?.width,
        height: item.image?.height,
        mime: item.mime || 'image/jpeg',
      }))

    if (items.length === 0) {
      return {
        success: false,
        items: [],
        query: cleanQuery,
        reason: 'NO_RESULTS',
        error: 'No image results found for this search term',
      }
    }

    return {
      success: true,
      items,
      query: cleanQuery,
    }
  } catch (err: any) {
    console.error('[Google Search Exception]', err?.message)
    return {
      success: false,
      items: [],
      query: cleanQuery,
      reason: 'NETWORK_ERROR',
      error: err?.message || 'Network connection to Google API timed out',
    }
  }
}

/**
 * Downloads image bytes from external URL and saves directly into Cloudflare R2 bucket.
 * Returns local `/api/images/...` URL on success, or null if download fails.
 */
export async function downloadAndSaveToR2(
  r2: R2Bucket,
  imageUrl: string,
  productId: number,
  index: number
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Referer': 'https://www.google.com/',
      },
      signal: AbortSignal.timeout(6000),
    })

    if (!res.ok) return null

    const buffer = await res.arrayBuffer()
    if (!buffer || buffer.byteLength < 500) return null // ignore invalid tiny responses

    let contentType = res.headers.get('content-type') || 'image/jpeg'
    if (contentType.includes(';')) contentType = contentType.split(';')[0].trim()

    let ext = 'jpg'
    if (contentType.includes('png')) ext = 'png'
    else if (contentType.includes('webp')) ext = 'webp'
    else if (contentType.includes('gif')) ext = 'gif'

    const hash = Math.random().toString(36).substring(2, 8)
    const key = `reviews/${productId}/${Date.now()}-${index}-${hash}.${ext}`

    await uploadToR2(r2, key, buffer, { contentType })
    return `/api/images/${encodeURIComponent(key)}`
  } catch (err: any) {
    console.warn(`[Image Download Failed] ${imageUrl}:`, err?.message)
    return null
  }
}

/**
 * Automatically fetch, download, and synchronize Google Images for a product.
 * Saves results in D1 (`products.review_images`) and attaches to top reviews.
 */
export async function syncProductReviewImagesFromGoogle(
  db: D1Database,
  r2: R2Bucket,
  productId: number,
  productTitle: string,
  opts?: {
    customQuery?: string
    forceOverwrite?: boolean
    maxImages?: number
  }
): Promise<SyncResult> {
  const force = opts?.forceOverwrite ?? false
  const targetCount = opts?.maxImages ?? 5

  // 1. Check existing images in D1 if not forcing overwrite
  if (!force) {
    const row = await db.prepare(`SELECT review_images FROM products WHERE id = ?`).bind(productId).first<{ review_images: string | null }>()
    if (row?.review_images) {
      try {
        const parsed = JSON.parse(row.review_images)
        if (Array.isArray(parsed) && parsed.length >= 3) {
          return {
            success: true,
            product_id: productId,
            product_title: productTitle,
            images: parsed,
            count: parsed.length,
            source: 'cached',
          }
        }
      } catch {
        // proceed
      }
    }
  }

  // 2. Retrieve CSE credentials from database settings
  const [cseIdSetting, cseKeySetting] = await Promise.all([
    getSetting<string>(db, 'google_cse_id', DEFAULT_GOOGLE_CX),
    getSetting<string>(db, 'google_cse_api_key', DEFAULT_GOOGLE_API_KEY),
  ])

  const cx = cseIdSetting || DEFAULT_GOOGLE_CX
  const apiKey = cseKeySetting || DEFAULT_GOOGLE_API_KEY

  // 3. Build smart search query
  const cleanTitle = productTitle.replace(/[^\w\s-]/g, '').trim()
  const searchQuery = opts?.customQuery || `${cleanTitle} wallpaper image`

  // 4. Call Google Custom Search
  const googleRes = await searchGoogleImages(searchQuery, cx, apiKey, 8)

  let savedUrls: string[] = []
  let usedSource: 'google' | 'fallback' = 'google'
  let warningMessage: string | undefined = undefined

  if (googleRes.success && googleRes.items.length > 0) {
    // Download up to targetCount images into R2
    for (let i = 0; i < googleRes.items.length && savedUrls.length < targetCount; i++) {
      const item = googleRes.items[i]
      // Try direct link first
      let r2Url = await downloadAndSaveToR2(r2, item.link, productId, savedUrls.length + 1)
      // Fallback to thumbnail link if direct link blocked by hotlinking
      if (!r2Url && item.thumbnailLink) {
        r2Url = await downloadAndSaveToR2(r2, item.thumbnailLink, productId, savedUrls.length + 1)
      }
      if (r2Url) {
        savedUrls.push(r2Url)
      }
    }
  } else {
    // Google API failed (e.g. 403 Permission Denied or Quota)
    usedSource = 'fallback'
    warningMessage = googleRes.error || 'Google search could not return images'
    console.warn(`[Review Sync Fallback] Product #${productId} using high-res thematic fallbacks. Reason: ${warningMessage}`)

    // Download/attach title-matched thematic images to ensure flawless experience
    const thematic = getThematicImagesForTitle(productTitle)
    for (let i = 0; i < thematic.length && savedUrls.length < targetCount; i++) {
      const url = thematic[i]
      // Try to download into R2 for permanent local serving
      const r2Url = await downloadAndSaveToR2(r2, url, productId, savedUrls.length + 1)
      savedUrls.push(r2Url || url)
    }
  }

  // If still fewer than target, complete with thematic URLs directly
  if (savedUrls.length < 3) {
    const thematic = getThematicImagesForTitle(productTitle)
    for (const url of thematic) {
      if (!savedUrls.includes(url)) {
        savedUrls.push(url)
        if (savedUrls.length >= targetCount) break
      }
    }
  }

  // 5. Save array of URLs in D1 `products.review_images`
  if (savedUrls.length > 0) {
    await db.prepare(`
      UPDATE products SET review_images = ? WHERE id = ?
    `).bind(JSON.stringify(savedUrls), productId).run()

    // 6. Automatically attach saved photos to top customer reviews
    const topReviews = await db.prepare(`
      SELECT id, image_url FROM product_reviews
      WHERE product_id = ? AND is_approved = 1
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(productId, savedUrls.length).all<{ id: number; image_url: string | null }>()

    if (topReviews?.results && topReviews.results.length > 0) {
      for (let idx = 0; idx < topReviews.results.length && idx < savedUrls.length; idx++) {
        const rev = topReviews.results[idx]
        // Only override if image_url is missing or force update
        if (!rev.image_url || force) {
          await db.prepare(`
            UPDATE product_reviews SET image_url = ? WHERE id = ?
          `).bind(savedUrls[idx], rev.id).run().catch(() => {})
        }
      }
    }
  }

  return {
    success: true,
    product_id: productId,
    product_title: productTitle,
    images: savedUrls,
    count: savedUrls.length,
    source: usedSource,
    warning: warningMessage,
    enable_url: googleRes.enableUrl,
  }
}
