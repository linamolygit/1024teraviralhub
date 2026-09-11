// src/routes/admin/media.ts — Production Media Library & Asset Storage Backend API
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware, type AdminVars } from './middleware'
import {
  uploadToR2,
  deleteFromR2,
  getVariantR2Key,
  MAX_IMAGE_SIZE,
  ALLOWED_IMAGE_TYPES,
} from '../../lib/r2'

const ALLOWED_MEDIA_TYPES = [
  // Images
  'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
  // Videos
  'video/mp4', 'video/webm', 'video/quicktime', 'video/x-matroska', 'video/ogg', 'video/x-msvideo', 'video/mpeg',
  // Documents / Archives
  'application/pdf', 'application/zip', 'application/x-zip-compressed',
]

const MAX_MEDIA_SIZE = 100 * 1024 * 1024 // 100 MB

function inferMimeType(filename: string, fallback: string = 'application/octet-stream'): string {
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    mkv: 'video/x-matroska',
    ogg: 'video/ogg',
    avi: 'video/x-msvideo',
    pdf: 'application/pdf',
    zip: 'application/zip',
  }
  return map[ext] || fallback
}

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

let mediaTablesEnsured = false

async function ensureMediaTables(db: D1Database) {
  if (mediaTablesEnsured) return
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS media_assets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        content_hash TEXT NOT NULL UNIQUE,
        r2_key TEXT NOT NULL,
        original_filename TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        variants_json TEXT,
        reference_count INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      );
    `)
  } catch {}

  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_media_assets_hash ON media_assets(content_hash);`)
  } catch {}
  try {
    await db.exec(`CREATE INDEX IF NOT EXISTS idx_media_assets_key ON media_assets(r2_key);`)
  } catch {}

  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN content_hash TEXT;`)
  } catch {}
  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN file_size INTEGER DEFAULT 0;`)
  } catch {}
  try {
    await db.exec(`ALTER TABLE product_images ADD COLUMN original_filename TEXT;`)
  } catch {}

  try {
    await db.exec(`ALTER TABLE product_files ADD COLUMN content_hash TEXT;`)
  } catch {}

  mediaTablesEnsured = true
}

async function computeSha256(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// GET /api/admin/media — List all media assets with linked product details and storage metrics
app.get('/', async (c) => {
  try {
    await ensureMediaTables(c.env.DB)
    const q = c.req.query('q')?.trim()
    const filter = (c.req.query('filter') || 'all').toLowerCase()
    const mediaType = (c.req.query('type') || 'all').toLowerCase()
    const sort = (c.req.query('sort') || 'newest').toLowerCase()
    const limit = Math.min(150, parseInt(c.req.query('limit') || '80'))
    const offset = parseInt(c.req.query('offset') || '0')

    // Auto-heal legacy 0-byte file sizes by checking Cloudflare R2
    try {
      const zeroItems = await c.env.DB.prepare(
        'SELECT id, r2_key, original_filename, mime_type FROM media_assets WHERE file_size <= 0 LIMIT 50'
      ).all<{ id: number; r2_key: string; original_filename: string; mime_type: string }>()

      if (zeroItems.results && zeroItems.results.length > 0) {
        await Promise.all(
          zeroItems.results.map(async (item) => {
            try {
              const head = await c.env.R2.head(item.r2_key)
              if (head && head.size > 0) {
                const correctedMime = inferMimeType(item.original_filename, head.httpMetadata?.contentType || item.mime_type)
                await c.env.DB.prepare('UPDATE media_assets SET file_size = ?, mime_type = ? WHERE id = ?').bind(head.size, correctedMime, item.id).run()
                await c.env.DB.prepare('UPDATE product_images SET file_size = ? WHERE r2_key = ?').bind(head.size, item.r2_key).run().catch(() => {})
                await c.env.DB.prepare('UPDATE product_files SET file_size = ? WHERE r2_key = ?').bind(head.size, item.r2_key).run().catch(() => {})
              }
            } catch (err) {
              console.warn(`Could not head R2 key ${item.r2_key}:`, err)
            }
          })
        )
      }
    } catch (healErr) {
      console.warn('Auto-heal sizes warning:', healErr)
    }

    // Calculate storage and deduplication metrics
    let metricsData = {
      total_assets: 0,
      total_size_bytes: 0,
      storage_saved_bytes: 0,
      total_references: 0,
      total_images: 0,
      total_videos: 0,
      duplicates_prevented: 0,
    }

    try {
      const stats = await c.env.DB.prepare(`
        SELECT 
          COUNT(*) as total_assets,
          COALESCE(SUM(file_size), 0) as total_size_bytes,
          COALESCE(SUM(CASE WHEN reference_count > 1 THEN (reference_count - 1) * file_size ELSE 0 END), 0) as storage_saved_bytes,
          COALESCE(SUM(reference_count), 0) as total_references,
          COALESCE(SUM(CASE WHEN mime_type LIKE 'image/%' OR (mime_type NOT LIKE 'video/%' AND original_filename NOT LIKE '%.mp4' AND original_filename NOT LIKE '%.webm' AND original_filename NOT LIKE '%.mov') THEN 1 ELSE 0 END), 0) as total_images,
          COALESCE(SUM(CASE WHEN mime_type LIKE 'video/%' OR original_filename LIKE '%.mp4' OR original_filename LIKE '%.webm' OR original_filename LIKE '%.mov' OR original_filename LIKE '%.mkv' THEN 1 ELSE 0 END), 0) as total_videos,
          COALESCE(SUM(CASE WHEN reference_count > 1 THEN (reference_count - 1) ELSE 0 END), 0) as duplicates_prevented
        FROM media_assets
      `).first<{
        total_assets: number
        total_size_bytes: number
        storage_saved_bytes: number
        total_references: number
        total_images: number
        total_videos: number
        duplicates_prevented: number
      }>()

      if (stats) {
        metricsData = stats
      }
    } catch (statErr) {
      console.warn('Failed to fetch media stats:', statErr)
    }

    let baseSql = `SELECT * FROM media_assets`
    const conditions: string[] = []
    const conditionParams: any[] = []

    if (q) {
      conditions.push(`(original_filename LIKE ? OR r2_key LIKE ? OR content_hash LIKE ?)`)
      conditionParams.push(`%${q}%`, `%${q}%`, `%${q}%`)
    }

    // Media type filter
    if (mediaType === 'image' || mediaType === 'images') {
      conditions.push(`(mime_type LIKE 'image/%' OR (mime_type NOT LIKE 'video/%' AND original_filename NOT LIKE '%.mp4' AND original_filename NOT LIKE '%.webm' AND original_filename NOT LIKE '%.mov' AND original_filename NOT LIKE '%.mkv'))`)
    } else if (mediaType === 'video' || mediaType === 'videos') {
      conditions.push(`(mime_type LIKE 'video/%' OR original_filename LIKE '%.mp4' OR original_filename LIKE '%.webm' OR original_filename LIKE '%.mov' OR original_filename LIKE '%.mkv')`)
    }

    // Reference count filter
    if (filter === 'reused') {
      conditions.push(`reference_count > 1`)
    } else if (filter === 'single') {
      conditions.push(`reference_count = 1`)
    } else if (filter === 'unused') {
      conditions.push(`reference_count = 0`)
    }

    if (conditions.length > 0) {
      baseSql += ` WHERE ${conditions.join(' AND ')}`
    }

    if (sort === 'oldest') {
      baseSql += ` ORDER BY created_at ASC`
    } else if (sort === 'size_desc') {
      baseSql += ` ORDER BY file_size DESC`
    } else if (sort === 'size_asc') {
      baseSql += ` ORDER BY file_size ASC`
    } else if (sort === 'references_desc') {
      baseSql += ` ORDER BY reference_count DESC, created_at DESC`
    } else {
      // default newest
      baseSql += ` ORDER BY created_at DESC`
    }

    baseSql += ` LIMIT ? OFFSET ?`
    const queryParams = [...conditionParams, limit, offset]

    const assetsRows = await c.env.DB.prepare(baseSql).bind(...queryParams).all()
    const assetsList = (assetsRows.results || []) as any[]

    // Fetch linked products for each asset across BOTH product_images and product_files
    const allR2Keys = assetsList.map((a) => a.r2_key).filter(Boolean)
    const uniqueKeys = Array.from(new Set(allR2Keys))
    const productMap: Record<string, Array<{ id: number; title: string; slug: string; is_thumbnail: boolean; link_type: string }>> = {}

    if (uniqueKeys.length > 0) {
      try {
        const placeholders = uniqueKeys.map(() => '?').join(',')
        
        // Query product_images
        const imageLinks = await c.env.DB.prepare(`
          SELECT pi.r2_key, pi.is_thumbnail, p.id as product_id, p.title as product_title, p.slug as product_slug, 'image' as link_type
          FROM product_images pi
          JOIN products p ON pi.product_id = p.id
          WHERE pi.r2_key IN (${placeholders})
        `).bind(...uniqueKeys).all()

        // Query product_files (videos, downloadable files, trailers)
        const fileLinks = await c.env.DB.prepare(`
          SELECT pf.r2_key, 0 as is_thumbnail, p.id as product_id, p.title as product_title, p.slug as product_slug, 'file' as link_type
          FROM product_files pf
          JOIN products p ON pf.product_id = p.id
          WHERE pf.r2_key IN (${placeholders})
        `).bind(...uniqueKeys).all()

        const combinedLinks = [
          ...((imageLinks.results || []) as any[]),
          ...((fileLinks.results || []) as any[]),
        ]

        for (const link of combinedLinks) {
          if (!productMap[link.r2_key]) {
            productMap[link.r2_key] = []
          }
          // Avoid duplicate product entry for the same r2_key
          if (!productMap[link.r2_key].some((p) => p.id === link.product_id && p.link_type === link.link_type)) {
            productMap[link.r2_key].push({
              id: link.product_id,
              title: link.product_title,
              slug: link.product_slug,
              is_thumbnail: Boolean(link.is_thumbnail),
              link_type: link.link_type,
            })
          }
        }
      } catch (linkErr) {
        console.warn('Failed to query product links for media:', linkErr)
      }
    }

    const enrichedAssets = assetsList.map((asset) => {
      const products = productMap[asset.r2_key] || []
      const isVideo = asset.mime_type?.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|ogg)$/i.test(asset.original_filename)
      return {
        ...asset,
        is_video: isVideo,
        mime_type: asset.mime_type || inferMimeType(asset.original_filename),
        url: `/api/images/${encodeURIComponent(asset.r2_key)}`,
        thumb_url: isVideo ? `/api/images/${encodeURIComponent(asset.r2_key)}` : `/api/images/${encodeURIComponent(asset.r2_key)}?variant=thumb`,
        medium_url: isVideo ? `/api/images/${encodeURIComponent(asset.r2_key)}` : `/api/images/${encodeURIComponent(asset.r2_key)}?variant=medium`,
        large_url: isVideo ? `/api/images/${encodeURIComponent(asset.r2_key)}` : `/api/images/${encodeURIComponent(asset.r2_key)}?variant=large`,
        products_linked: products,
        live_reference_count: products.length || asset.reference_count,
      }
    })

    // Count matching total
    let totalCount = enrichedAssets.length
    try {
      if (conditions.length > 0) {
        const countSql = `SELECT COUNT(*) as total FROM media_assets WHERE ${conditions.join(' AND ')}`
        const countResult = await c.env.DB.prepare(countSql).bind(...conditionParams).first<{ total: number }>()
        totalCount = countResult?.total ?? enrichedAssets.length
      } else {
        const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as total FROM media_assets`).first<{ total: number }>()
        totalCount = countResult?.total ?? enrichedAssets.length
      }
    } catch (countErr) {
      console.warn('Failed to count total media assets:', countErr)
    }

    return c.json({
      success: true,
      assets: enrichedAssets,
      total: totalCount,
      metrics: metricsData,
    })
  } catch (err: any) {
    console.error('Fatal error in GET /api/admin/media:', err)
    return c.json({
      success: false,
      error: err.message || 'Internal Server Error',
      assets: [],
      total: 0,
      metrics: { total_assets: 0, total_size_bytes: 0, storage_saved_bytes: 0, total_references: 0, total_images: 0, total_videos: 0, duplicates_prevented: 0 },
    }, 500)
  }
})

// POST /api/admin/media/upload — Standalone upload directly to media library (Images & Videos)
app.post('/upload', async (c) => {
  try {
    await ensureMediaTables(c.env.DB)
    const formData = await c.req.formData()
    const file = formData.get('file') as File | null

    if (!file) return c.json({ error: 'No file provided' }, 400)
    if (file.size > MAX_MEDIA_SIZE) return c.json({ error: 'File too large (max 100MB)' }, 400)

    const detectedMime = file.type || inferMimeType(file.name)
    const isVideo = detectedMime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi|ogg)$/i.test(file.name)
    const isImage = detectedMime.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(file.name)

    const buffer = await file.arrayBuffer()
    const contentHash = await computeSha256(buffer)

    // Check if identical file already exists in media storage
    const existing = await c.env.DB.prepare(`
      SELECT * FROM media_assets WHERE content_hash = ? LIMIT 1
    `).bind(contentHash).first<{
      id: number
      content_hash: string
      r2_key: string
      original_filename: string
      file_size: number
      mime_type: string
      reference_count: number
    }>()

    if (existing) {
      return c.json({
        success: true,
        deduplicated: true,
        asset: {
          ...existing,
          url: `/api/images/${encodeURIComponent(existing.r2_key)}`,
          thumb_url: `/api/images/${encodeURIComponent(existing.r2_key)}?variant=thumb`,
        },
        bytes_saved: file.size,
        message: `⚡ Instant Deduplication: ${isVideo ? 'Video' : 'Asset'} already exists in storage! Reused existing file (0 KB duplicate waste).`,
      })
    }

    // Upload new media file to R2
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
    const subfolder = isVideo ? 'videos' : 'images'
    const key = `media/${subfolder}/${Date.now()}-${sanitizedName}`

    await uploadToR2(c.env.R2, key, buffer, { contentType: detectedMime })

    // Process optional WebP variants for images
    if (isImage) {
      const thumb = formData.get('thumb') as File | null
      const medium = formData.get('medium') as File | null
      const large = formData.get('large') as File | null

      if (thumb) {
        await uploadToR2(c.env.R2, getVariantR2Key(key, 'thumb'), await thumb.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
      }
      if (medium) {
        await uploadToR2(c.env.R2, getVariantR2Key(key, 'medium'), await medium.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
      }
      if (large) {
        await uploadToR2(c.env.R2, getVariantR2Key(key, 'large'), await large.arrayBuffer(), { contentType: 'image/webp' }).catch(() => {})
      }
    }

    const result = await c.env.DB.prepare(`
      INSERT INTO media_assets (content_hash, r2_key, original_filename, file_size, mime_type, reference_count)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(contentHash, key, file.name, file.size, detectedMime).run()

    const newAsset = {
      id: result.meta.last_row_id,
      content_hash: contentHash,
      r2_key: key,
      original_filename: file.name,
      file_size: file.size,
      mime_type: detectedMime,
      reference_count: 0,
      url: `/api/images/${encodeURIComponent(key)}`,
      thumb_url: isVideo ? `/api/images/${encodeURIComponent(key)}` : `/api/images/${encodeURIComponent(key)}?variant=thumb`,
    }

    return c.json({
      success: true,
      deduplicated: false,
      asset: newAsset,
      bytes_saved: 0,
      message: `${isVideo ? 'Video' : 'Media'} asset uploaded and indexed in storage.`,
    })
  } catch (err: any) {
    console.error('Upload media error:', err)
    return c.json({ error: err.message || 'Upload failed' }, 500)
  }
})

// DELETE /api/admin/media/:id — Delete media asset from storage
app.delete('/:id', async (c) => {
  try {
    await ensureMediaTables(c.env.DB)
    const id = parseInt(c.req.param('id'))
    const force = c.req.query('force') === 'true'

    const asset = await c.env.DB.prepare(`SELECT * FROM media_assets WHERE id = ?`).bind(id).first<{
      id: number
      r2_key: string
      content_hash: string
      original_filename: string
    }>()

    if (!asset) return c.json({ error: 'Media asset not found' }, 404)

    // Check if any product images or files currently use this asset
    const inUseImages = await c.env.DB.prepare(`
      SELECT pi.id, pi.product_id, p.title as product_title
      FROM product_images pi
      JOIN products p ON pi.product_id = p.id
      WHERE pi.r2_key = ?
    `).bind(asset.r2_key).all()

    const inUseFiles = await c.env.DB.prepare(`
      SELECT pf.id, pf.product_id, p.title as product_title
      FROM product_files pf
      JOIN products p ON pf.product_id = p.id
      WHERE pf.r2_key = ?
    `).bind(asset.r2_key).all()

    const allInUse = [...(inUseImages.results || []), ...(inUseFiles.results || [])]
    const productCount = allInUse.length

    if (productCount > 0 && !force) {
      return c.json({
        error: 'In Use',
        in_use: true,
        product_count: productCount,
        products: allInUse,
        message: `This asset is actively used by ${productCount} product catalog reference(s). To delete, pass ?force=true or unlink from products first.`,
      }, 409)
    }

    // If force deleting, remove references from product_images and product_files as well
    if (productCount > 0 && force) {
      await c.env.DB.prepare(`DELETE FROM product_images WHERE r2_key = ?`).bind(asset.r2_key).run()
      await c.env.DB.prepare(`DELETE FROM product_files WHERE r2_key = ?`).bind(asset.r2_key).run()
    }

    // Delete from R2 (original + WebP variants)
    await deleteFromR2(c.env.R2, asset.r2_key).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(asset.r2_key, 'thumb')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(asset.r2_key, 'medium')).catch(() => {})
    await deleteFromR2(c.env.R2, getVariantR2Key(asset.r2_key, 'large')).catch(() => {})

    // Delete from media_assets table
    await c.env.DB.prepare(`DELETE FROM media_assets WHERE id = ?`).bind(id).run()

    return c.json({
      success: true,
      message: `Asset "${asset.original_filename}" deleted from storage.`,
    })
  } catch (err: any) {
    console.error('Delete media error:', err)
    return c.json({ error: err.message || 'Delete failed' }, 500)
  }
})

// POST /api/admin/media/sync-sizes — Deep Re-sync file sizes & Auto-Deduplicate legacy duplicate files
app.post('/sync-sizes', async (c) => {
  try {
    await ensureMediaTables(c.env.DB)
    const all = await c.env.DB.prepare('SELECT id, r2_key, content_hash, file_size, original_filename, mime_type FROM media_assets').all<{
      id: number
      r2_key: string
      content_hash: string
      file_size: number
      original_filename: string
      mime_type: string
    }>()

    let updatedSizes = 0
    let duplicatesMerged = 0
    let savedBytesFromMerge = 0

    // Cache computed hashes to merge identical files
    const knownHashMap = new Map<string, { id: number; r2_key: string; file_size: number }>()

    for (const item of (all.results || [])) {
      try {
        const head = await c.env.R2.head(item.r2_key)
        let actualSize = item.file_size
        const correctedMime = inferMimeType(item.original_filename, head?.httpMetadata?.contentType || item.mime_type)

        if (head && head.size > 0 && head.size !== item.file_size) {
          actualSize = head.size
          await c.env.DB.prepare('UPDATE media_assets SET file_size = ?, mime_type = ? WHERE id = ?').bind(head.size, correctedMime, item.id).run()
          await c.env.DB.prepare('UPDATE product_images SET file_size = ? WHERE r2_key = ?').bind(head.size, item.r2_key).run().catch(() => {})
          await c.env.DB.prepare('UPDATE product_files SET file_size = ? WHERE r2_key = ?').bind(head.size, item.r2_key).run().catch(() => {})
          updatedSizes++
        }

        // Check if item needs real content hash computation
        let currentHash = item.content_hash
        if (currentHash.startsWith('legacy_') || currentHash.startsWith('file_')) {
          const obj = await c.env.R2.get(item.r2_key)
          if (obj) {
            const buf = await obj.arrayBuffer()
            currentHash = await computeSha256(buf)
            actualSize = buf.byteLength
          }
        }

        if (knownHashMap.has(currentHash)) {
          // DUPLICATE DETECTED! Merge duplicate asset into the master asset
          const master = knownHashMap.get(currentHash)!
          
          // Re-point references in product_images and product_files to master R2 key
          await c.env.DB.prepare('UPDATE product_images SET r2_key = ?, content_hash = ? WHERE r2_key = ?').bind(master.r2_key, currentHash, item.r2_key).run().catch(() => {})
          await c.env.DB.prepare('UPDATE product_files SET r2_key = ?, content_hash = ? WHERE r2_key = ?').bind(master.r2_key, currentHash, item.r2_key).run().catch(() => {})

          // Increment reference count on master asset
          await c.env.DB.prepare('UPDATE media_assets SET reference_count = reference_count + 1 WHERE id = ?').bind(master.id).run()

          // Delete duplicate row from media_assets
          await c.env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(item.id).run()

          // Delete duplicate file from R2
          await deleteFromR2(c.env.R2, item.r2_key).catch(() => {})

          duplicatesMerged++
          savedBytesFromMerge += actualSize
        } else {
          // Record as master
          knownHashMap.set(currentHash, { id: item.id, r2_key: item.r2_key, file_size: actualSize })
          if (currentHash !== item.content_hash) {
            await c.env.DB.prepare('UPDATE media_assets SET content_hash = ?, file_size = ?, mime_type = ? WHERE id = ?').bind(currentHash, actualSize, correctedMime, item.id).run()
            await c.env.DB.prepare('UPDATE product_images SET content_hash = ? WHERE r2_key = ?').bind(currentHash, item.r2_key).run().catch(() => {})
            await c.env.DB.prepare('UPDATE product_files SET content_hash = ? WHERE r2_key = ?').bind(currentHash, item.r2_key).run().catch(() => {})
          }
        }
      } catch (itemErr) {
        console.warn(`Error syncing item ${item.r2_key}:`, itemErr)
      }
    }

    const savedMb = (savedBytesFromMerge / (1024 * 1024)).toFixed(2)
    return c.json({
      success: true,
      updated_count: updatedSizes,
      duplicates_merged: duplicatesMerged,
      bytes_saved: savedBytesFromMerge,
      message: duplicatesMerged > 0
        ? `Synced ${updatedSizes} file sizes and merged ${duplicatesMerged} duplicate files, saving ${savedMb} MB R2 storage!`
        : `Synced ${updatedSizes} file sizes directly from Cloudflare R2.`,
    })
  } catch (err: any) {
    console.error('Deep sync sizes error:', err)
    return c.json({ error: err.message || 'Failed to sync sizes' }, 500)
  }
})

export default app
