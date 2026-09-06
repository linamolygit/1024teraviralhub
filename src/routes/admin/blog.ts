// src/routes/admin/blog.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware, type AdminVars } from './middleware'
import { logAdminAudit } from '../../lib/db'
import { z } from 'zod'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const posts = await c.env.DB.prepare(`
    SELECT bp.*, bc.name as category_name FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    ORDER BY bp.created_at DESC
  `).all()
  return c.json({ posts: posts.results })
})

const postSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  title: z.string().min(3),
  content: z.string().min(10),
  excerpt: z.string().optional(),
  category_id: z.number().optional().nullable(),
  is_published: z.boolean().optional(),
  is_featured: z.boolean().optional(),
  meta_title: z.string().max(70).optional(),
  meta_description: z.string().max(160).optional(),
  tags: z.array(z.string()).optional(),
  author_name: z.string().optional(),
})

app.post('/', async (c) => {
  const body = await c.req.json()
  const parsed = postSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)
  const d = parsed.data
  const result = await c.env.DB.prepare(`
    INSERT INTO blog_posts (slug, title, content, excerpt, category_id, is_published, is_featured,
      meta_title, meta_description, tags, author_name, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    d.slug, d.title, d.content, d.excerpt ?? null, d.category_id ?? null,
    d.is_published ? 1 : 0, d.is_featured ? 1 : 0,
    d.meta_title ?? null, d.meta_description ?? null,
    d.tags ? JSON.stringify(d.tags) : null,
    d.author_name ?? 'Admin',
    d.is_published ? new Date().toISOString() : null,
  ).run()
  await logAdminAudit(c.env.DB, { admin_uid: c.get('adminUid'), action: 'CREATE', resource_type: 'blog_post', resource_id: result.meta.last_row_id?.toString() })
  return c.json({ success: true, id: result.meta.last_row_id })
})

app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const parsed = postSchema.partial().safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed' }, 400)
  const d = parsed.data
  await c.env.DB.prepare(`
    UPDATE blog_posts SET
      slug = COALESCE(?, slug), title = COALESCE(?, title), content = COALESCE(?, content),
      excerpt = COALESCE(?, excerpt), is_published = COALESCE(?, is_published),
      meta_title = COALESCE(?, meta_title), meta_description = COALESCE(?, meta_description),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(
    d.slug ?? null, d.title ?? null, d.content ?? null, d.excerpt ?? null,
    d.is_published !== undefined ? (d.is_published ? 1 : 0) : null,
    d.meta_title ?? null, d.meta_description ?? null, id
  ).run()
  return c.json({ success: true })
})

app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  await c.env.DB.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(id).run()
  await logAdminAudit(c.env.DB, { admin_uid: c.get('adminUid'), action: 'DELETE', resource_type: 'blog_post', resource_id: id })
  return c.json({ success: true })
})

export default app
