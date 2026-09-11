// ============================================
// src/routes/download.ts — Secure Download Route
// GET /api/download/:token      — Verify + serve
// GET /api/download/file/:key   — Actual file stream
// ============================================

import { Hono } from 'hono'
import type { Env } from '../worker'
import { verifyDownloadToken, incrementDownloadCount, logDownload } from '../lib/db'
import { getR2Object } from '../lib/r2'
import { verifyAndFulfillOrder } from './checkout'

const app = new Hono<{ Bindings: Env }>()

// GET /api/download/purchases/access — returns all authorized purchases for guest session/tokens
app.get('/purchases/access', async (c) => {
  const tokenParam = c.req.query('tokens')
  const emailParam = c.req.query('email')?.toLowerCase().trim()
  const orderParam = c.req.query('order')?.trim() || c.req.query('orders')?.trim()

  let tokensToQuery: string[] = []
  if (tokenParam) {
    tokensToQuery = tokenParam.split(',').map((t) => t.trim()).filter(Boolean)
  }

  const orderNumsToQuery: string[] = []
  if (orderParam) {
    for (const num of orderParam.split(',').map((o) => o.trim()).filter(Boolean)) {
      if (!orderNumsToQuery.includes(num)) orderNumsToQuery.push(num)
    }
  }

  // Auto-detect saved purchases and recent orders from browser cookie
  const cookieHeader = c.req.header('cookie') || ''
  if (cookieHeader) {
    const cookieMatch = cookieHeader.match(/tvh_customer_orders=([^;]+)/) || cookieHeader.match(/tvh_orders=([^;]+)/)
    if (cookieMatch) {
      try {
        const decoded = decodeURIComponent(cookieMatch[1])
        const parsed = JSON.parse(decoded)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            if (item?.token && typeof item.token === 'string' && !tokensToQuery.includes(item.token.trim())) {
              tokensToQuery.push(item.token.trim())
            }
            if (item?.orderNumber && typeof item.orderNumber === 'string' && !orderNumsToQuery.includes(item.orderNumber.trim())) {
              orderNumsToQuery.push(item.orderNumber.trim())
            }
          }
        }
      } catch {
        // Ignore cookie parsing errors
      }
    }

    const lastOrderMatch = cookieHeader.match(/tvh_last_order=([^;]+)/)
    if (lastOrderMatch && lastOrderMatch[1]) {
      const lastOrd = decodeURIComponent(lastOrderMatch[1]).trim()
      if (lastOrd && !orderNumsToQuery.includes(lastOrd)) {
        orderNumsToQuery.push(lastOrd)
      }
    }
  }

  // Auto-verify and fulfill any referenced orders in real-time
  for (const ordNum of orderNumsToQuery) {
    const order = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE order_number = ?`
    ).bind(ordNum).first() as any

    if (order) {
      const verification = await verifyAndFulfillOrder(c.env.DB, c.env, order)
      if (verification.isPaid && verification.download_token) {
        if (!tokensToQuery.includes(verification.download_token)) {
          tokensToQuery.push(verification.download_token)
        }
      }
    }
  }

  if (emailParam) {
    const emailOrders = await c.env.DB.prepare(
      `SELECT * FROM orders WHERE LOWER(customer_email) = ? ORDER BY created_at DESC LIMIT 20`
    ).bind(emailParam).all()
    for (const ord of (emailOrders.results as any[] || [])) {
      const verification = await verifyAndFulfillOrder(c.env.DB, c.env, ord)
      if (verification.isPaid && verification.download_token) {
        if (!tokensToQuery.includes(verification.download_token)) {
          tokensToQuery.push(verification.download_token)
        }
      }
    }
  }

  // Fallback: If device has no stored cookies, check recent completed purchases from same IP (last 24 hours)
  if (tokensToQuery.length === 0) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
    if (ip) {
      const recentPaidOrders = await c.env.DB.prepare(
        `SELECT * FROM orders WHERE ip_address = ? AND status = 'PAID' AND created_at >= datetime('now', '-24 hours') ORDER BY created_at DESC LIMIT 5`
      ).bind(ip).all()
      for (const ord of (recentPaidOrders.results as any[] || [])) {
        const verification = await verifyAndFulfillOrder(c.env.DB, c.env, ord)
        if (verification.isPaid && verification.download_token) {
          if (!tokensToQuery.includes(verification.download_token)) {
            tokensToQuery.push(verification.download_token)
          }
        }
      }
    }
  }

  if (tokensToQuery.length === 0) {
    return c.json({
      active: [],
      expired: [],
    })
  }

  const activePurchases: any[] = []
  const expiredPurchases: any[] = []
  const now = new Date()

  for (const tok of tokensToQuery) {
    const tokenRecord = await c.env.DB.prepare(
      `SELECT dt.*, o.order_number, o.created_at as order_date, o.amount, o.customer_name,
              p.id as product_id, p.title as product_title, p.slug as product_slug, p.file_count, p.file_type, p.google_drive_link
       FROM download_tokens dt
       JOIN orders o ON dt.order_id = o.id
       JOIN products p ON dt.product_id = p.id
       WHERE dt.token = ? AND dt.is_revoked = 0`
    ).bind(tok).first() as any

    if (!tokenRecord) continue

    const expiresAt = new Date(tokenRecord.expires_at)
    const isExpired = expiresAt <= now || tokenRecord.download_count >= tokenRecord.max_downloads

    const thumbnail = await c.env.DB.prepare(
      `SELECT r2_key FROM product_images WHERE product_id = ? AND is_thumbnail = 1 LIMIT 1`
    ).bind(tokenRecord.product_id).first() as { r2_key: string } | null

    const files = await c.env.DB.prepare(
      `SELECT id, original_filename, file_size, file_type FROM product_files WHERE product_id = ? ORDER BY sort_order ASC`
    ).bind(tokenRecord.product_id).all()

    const item = {
      token: tokenRecord.token,
      order_number: tokenRecord.order_number,
      customer_name: tokenRecord.customer_name,
      amount: tokenRecord.amount,
      google_drive_link: tokenRecord.google_drive_link || null,
      product: {
        id: tokenRecord.product_id,
        title: tokenRecord.product_title,
        slug: tokenRecord.product_slug,
        file_count: tokenRecord.file_count,
        file_type: tokenRecord.file_type,
        thumbnail_url: thumbnail ? `/api/images/${encodeURIComponent(thumbnail.r2_key)}` : null,
      },
      purchased_at: tokenRecord.order_date || tokenRecord.created_at,
      expires_at: tokenRecord.expires_at,
      download_count: tokenRecord.download_count,
      max_downloads: tokenRecord.max_downloads,
      remaining_downloads: Math.max(0, tokenRecord.max_downloads - tokenRecord.download_count),
      status: isExpired ? 'EXPIRED' : 'ACTIVE',
      files: (files.results as any[]).map((f) => ({
        id: f.id,
        filename: f.original_filename,
        size: f.file_size,
        type: f.file_type,
        download_url: `/api/download/stream/${tokenRecord.token}/${f.id}`,
      })),
    }

    if (isExpired) {
      expiredPurchases.push(item)
    } else {
      activePurchases.push(item)
    }
  }

  return c.json({
    active: activePurchases,
    expired: expiredPurchases,
  })
})

// GET /api/download/:token — verify token and return file info + R2 stream URL
app.get('/:token', async (c) => {
  const token = c.req.param('token')

  const verification = await verifyDownloadToken(c.env.DB, token)

  if (!verification.valid) {
    return c.json({
      valid: false,
      reason: verification.reason,
    }, 403)
  }

  const { tokenRecord } = verification

  // Get product files and google drive link
  const [files, productExtra] = await Promise.all([
    c.env.DB.prepare(
      `SELECT pf.*, p.title as product_title
       FROM product_files pf
       JOIN products p ON pf.product_id = p.id
       WHERE pf.product_id = ?
       ORDER BY pf.sort_order ASC`
    ).bind(tokenRecord!.product_id).all(),
    c.env.DB.prepare(
      `SELECT title, slug, google_drive_link FROM products WHERE id = ?`
    ).bind(tokenRecord!.product_id).first() as Promise<{ title: string; slug: string; google_drive_link: string | null } | null>,
  ])

  const orderInfo = await c.env.DB.prepare(
    `SELECT customer_name, customer_email, order_number, amount FROM orders WHERE id = ?`
  ).bind(tokenRecord!.order_id).first() as {
    customer_name: string; customer_email: string; order_number: string; amount: number
  } | null

  return c.json({
    valid: true,
    expires_at: tokenRecord!.expires_at,
    download_count: tokenRecord!.download_count,
    max_downloads: tokenRecord!.max_downloads,
    remaining_downloads: tokenRecord!.max_downloads - tokenRecord!.download_count,
    google_drive_link: productExtra?.google_drive_link || null,
    order: orderInfo,
    files: (files.results as Array<{ id: number; original_filename: string; file_size: number | null; file_type: string | null; product_title: string }>).map(f => ({
      id: f.id,
      filename: f.original_filename,
      size: f.file_size,
      type: f.file_type,
      product: f.product_title,
      // Download URL goes through our proxy
      download_url: `/api/download/stream/${token}/${f.id}`,
    })),
  })
})

// GET /api/download/stream/:token/:fileId — Stream file from R2 after verification
app.get('/stream/:token/:fileId', async (c) => {
  const token = c.req.param('token')
  const fileId = parseInt(c.req.param('fileId'))

  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')
  const ua = c.req.header('User-Agent')

  const verification = await verifyDownloadToken(c.env.DB, token)

  if (!verification.valid) {
    await logDownload(c.env.DB, {
      token_id: 0,
      ip_address: ip,
      user_agent: ua,
      success: false,
    })
    return c.json({ error: verification.reason }, 403)
  }

  const { tokenRecord } = verification

  // Get the specific file
  const file = await c.env.DB.prepare(
    `SELECT * FROM product_files WHERE id = ? AND product_id = ?`
  ).bind(fileId, tokenRecord!.product_id).first() as {
    id: number; r2_key: string; original_filename: string; mime_type: string | null
  } | null

  if (!file) {
    return c.json({ error: 'File not found' }, 404)
  }

  // Get file from R2
  const r2Object = await getR2Object(c.env.R2, file.r2_key)
  if (!r2Object) {
    return c.json({ error: 'File not available' }, 404)
  }

  // Increment download count and log
  await incrementDownloadCount(c.env.DB, tokenRecord!.id)
  await logDownload(c.env.DB, {
    token_id: tokenRecord!.id,
    file_id: file.id,
    ip_address: ip,
    user_agent: ua,
    success: true,
  })

  // Stream the file
  const headers = new Headers()
  headers.set('Content-Disposition', `attachment; filename="${file.original_filename}"`)
  headers.set('Content-Type', file.mime_type ?? r2Object.httpMetadata?.contentType ?? 'application/octet-stream')
  if (r2Object.size) headers.set('Content-Length', r2Object.size.toString())
  headers.set('Cache-Control', 'no-store')

  return new Response(r2Object.body, { headers })
})

export default app
