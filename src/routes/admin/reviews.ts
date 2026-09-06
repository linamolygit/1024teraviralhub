// src/routes/admin/reviews.ts — Admin Product Reviews Moderation
import { Hono } from 'hono'
import type { Env, AdminVars } from '../../worker'
import { logAdminAudit } from '../../lib/db'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()

// GET /api/admin/reviews
app.get('/', async (c) => {
  const reviews = await c.env.DB.prepare(`
    SELECT r.*, p.title as product_title, p.slug as product_slug
    FROM product_reviews r
    JOIN products p ON r.product_id = p.id
    ORDER BY r.created_at DESC
    LIMIT 100
  `).all()
  return c.json({ reviews: reviews.results })
})

// PUT /api/admin/reviews/:id/approve
app.put('/:id/approve', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`UPDATE product_reviews SET is_approved = 1 WHERE id = ?`).bind(id).run()
  return c.json({ success: true })
})

// DELETE /api/admin/reviews/:id
app.delete('/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  await c.env.DB.prepare(`DELETE FROM product_reviews WHERE id = ?`).bind(id).run()

  await logAdminAudit(c.env.DB, {
    admin_uid: c.get('adminUid'),
    action: 'DELETE',
    resource_type: 'review',
    resource_id: id.toString(),
  })

  return c.json({ success: true })
})

export default app
