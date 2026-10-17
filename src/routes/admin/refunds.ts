// src/routes/admin/refunds.ts
// Admin Refund & Dispute Claims Management Engine
// Full control for Admin to review, approve, process, or reject refund requests

import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

// Ensure table exists defensively
async function ensureRefundTable(db: D1Database) {
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS refund_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      refund_id TEXT UNIQUE NOT NULL,
      order_number TEXT NOT NULL,
      utr_number TEXT NOT NULL,
      upi_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      details TEXT,
      amount REAL DEFAULT 0,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      status TEXT DEFAULT 'UNDER_REVIEW',
      admin_notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run()
}

// GET /api/admin/refunds — List all refund requests with metrics & filtering
app.get('/', async (c) => {
  try {
    await ensureRefundTable(c.env.DB)

    const status = c.req.query('status') || 'ALL'
    const search = (c.req.query('search') || '').trim()
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100)
    const offset = Math.max(parseInt(c.req.query('offset') || '0'), 0)

    let query = `SELECT * FROM refund_requests WHERE 1=1`
    const params: any[] = []

    if (status !== 'ALL') {
      query += ` AND status = ?`
      params.push(status.toUpperCase())
    }

    if (search) {
      query += ` AND (
        refund_id LIKE ? OR
        order_number LIKE ? OR
        utr_number LIKE ? OR
        upi_id LIKE ? OR
        customer_name LIKE ? OR
        customer_email LIKE ?
      )`
      const s = `%${search}%`
      params.push(s, s, s, s, s, s)
    }

    // Clone query for total count
    const countSql = query.replace('SELECT *', 'SELECT COUNT(*) as total, SUM(amount) as total_amount')
    const countRow: any = await c.env.DB.prepare(countSql).bind(...params).first()
    const total = countRow?.total ?? 0
    const filteredAmount = countRow?.total_amount ?? 0

    // Order by newest first
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`
    params.push(limit, offset)

    const result = await c.env.DB.prepare(query).bind(...params).all()
    const refunds = result.results || []

    // Fetch overarching stats
    const statsRow: any = await c.env.DB.prepare(`
      SELECT 
        COUNT(*) as total_claims,
        SUM(CASE WHEN status = 'UNDER_REVIEW' THEN 1 ELSE 0 END) as under_review_count,
        SUM(CASE WHEN status = 'APPROVED' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN status = 'PROCESSED' THEN 1 ELSE 0 END) as processed_count,
        SUM(CASE WHEN status = 'REJECTED' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN status = 'PROCESSED' THEN amount ELSE 0 END) as total_refunded_amount,
        SUM(amount) as all_claims_amount
      FROM refund_requests
    `).first()

    return c.json({
      success: true,
      refunds,
      total,
      filtered_amount: filteredAmount,
      limit,
      offset,
      stats: {
        total: statsRow?.total_claims || 0,
        under_review: statsRow?.under_review_count || 0,
        approved: statsRow?.approved_count || 0,
        processed: statsRow?.processed_count || 0,
        rejected: statsRow?.rejected_count || 0,
        total_refunded: statsRow?.total_refunded_amount || 0,
        all_claims_amount: statsRow?.all_claims_amount || 0,
      },
    })
  } catch (err: any) {
    console.error('[Admin Refunds List Error]', err)
    return c.json({ error: err.message || 'Failed to fetch refund claims' }, 500)
  }
})

// GET /api/admin/refunds/:id — Single refund claim detail
app.get('/:id', async (c) => {
  try {
    await ensureRefundTable(c.env.DB)
    const param = c.req.param('id').trim()

    const refund: any = await c.env.DB.prepare(`
      SELECT * FROM refund_requests
      WHERE id = ? OR refund_id = ?
      LIMIT 1
    `).bind(param, param).first()

    if (!refund) {
      return c.json({ error: 'Refund claim not found' }, 404)
    }

    // Try finding associated order
    const order: any = await c.env.DB.prepare(`
      SELECT o.*, p.title as product_title, p.price as product_price
      FROM orders o
      LEFT JOIN products p ON o.product_id = p.id
      WHERE o.order_number = ? OR o.order_number = ? OR o.order_number = ?
      ORDER BY o.created_at DESC LIMIT 1
    `).bind(
      refund.order_number,
      `OD${refund.order_number.replace(/^OD/, '')}`,
      `TVH-${refund.order_number.replace(/^TVH-/, '')}`
    ).first()

    return c.json({
      success: true,
      refund,
      order: order || null,
    })
  } catch (err: any) {
    return c.json({ error: err.message || 'Failed to fetch refund detail' }, 500)
  }
})

// POST /api/admin/refunds/:id/status — Admin controls status: APPROVED, PROCESSED, REJECTED, UNDER_REVIEW
app.post('/:id/status', async (c) => {
  try {
    await ensureRefundTable(c.env.DB)
    const param = c.req.param('id').trim()
    const body = await c.req.json<{
      status: 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSED' | 'REJECTED'
      admin_notes?: string
    }>()

    const validStatuses = ['UNDER_REVIEW', 'APPROVED', 'PROCESSED', 'REJECTED']
    const newStatus = (body.status || '').toUpperCase()

    if (!validStatuses.includes(newStatus)) {
      return c.json({ error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` }, 400)
    }

    const current: any = await c.env.DB.prepare(`
      SELECT * FROM refund_requests
      WHERE id = ? OR refund_id = ?
      LIMIT 1
    `).bind(param, param).first()

    if (!current) {
      return c.json({ error: 'Refund claim not found' }, 404)
    }

    const adminNotes = body.admin_notes !== undefined ? body.admin_notes : (current.admin_notes || '')

    // Update refund request status
    await c.env.DB.prepare(`
      UPDATE refund_requests
      SET status = ?, admin_notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(newStatus, adminNotes, current.id).run()

    // Sync with orders table
    const orderNumber = current.order_number
    const odAlt = orderNumber.startsWith('OD') ? orderNumber : `OD${orderNumber}`
    const tvhAlt = orderNumber.startsWith('TVH-') ? orderNumber : `TVH-${orderNumber}`

    if (newStatus === 'PROCESSED') {
      // Order is now refunded & download revoked
      await c.env.DB.prepare(`
        UPDATE orders
        SET status = 'REFUNDED', download_token = NULL, updated_at = datetime('now')
        WHERE order_number = ? OR order_number = ? OR order_number = ?
      `).bind(orderNumber, odAlt, tvhAlt).run()
    } else if (newStatus === 'APPROVED') {
      await c.env.DB.prepare(`
        UPDATE orders
        SET status = 'REFUND_APPROVED', updated_at = datetime('now')
        WHERE order_number = ? OR order_number = ? OR order_number = ?
      `).bind(orderNumber, odAlt, tvhAlt).run()
    } else if (newStatus === 'REJECTED') {
      // Revert order back to PAID if it was paid
      await c.env.DB.prepare(`
        UPDATE orders
        SET status = CASE WHEN payment_status = 'SUCCESS' THEN 'PAID' ELSE status END,
            updated_at = datetime('now')
        WHERE order_number = ? OR order_number = ? OR order_number = ?
      `).bind(orderNumber, odAlt, tvhAlt).run()
    }

    return c.json({
      success: true,
      message: `Refund claim ${current.refund_id} marked as ${newStatus}`,
      refund_id: current.refund_id,
      status: newStatus,
      admin_notes: adminNotes,
    })
  } catch (err: any) {
    console.error('[Admin Refund Status Update Error]', err)
    return c.json({ error: err.message || 'Failed to update refund status' }, 500)
  }
})

export default app
