// src/routes/blog.ts
import { Hono } from 'hono'
import type { Env } from '../worker'
import { getPublishedBlogPosts } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

// GET /api/blog — list published posts with category filtering & search
app.get('/', async (c) => {
  const limit = Math.min(parseInt(c.req.query('limit') ?? '12'), 50)
  const offset = parseInt(c.req.query('offset') ?? '0')
  const categorySlug = c.req.query('category')?.trim() || undefined
  const q = c.req.query('q')?.trim() || undefined

  const posts = await getPublishedBlogPosts(c.env.DB, {
    limit,
    offset,
    category_slug: categorySlug,
    q,
  })

  let countQuery = `
    SELECT COUNT(*) as count
    FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.is_published = 1
  `
  const countParams: string[] = []
  if (categorySlug) {
    countQuery += ` AND bc.slug = ?`
    countParams.push(categorySlug)
  }
  if (q) {
    countQuery += ` AND (bp.title LIKE ? OR bp.excerpt LIKE ? OR bp.content LIKE ?)`
    const term = `%${q}%`
    countParams.push(term, term, term)
  }

  const countStmt = c.env.DB.prepare(countQuery)
  const count = (countParams.length > 0
    ? await countStmt.bind(...countParams).first()
    : await countStmt.first()) as { count: number } | null

  return c.json({ posts, total: count?.count ?? 0, hasMore: offset + posts.length < (count?.count ?? 0) })
})

// GET /api/blog/categories — list all categories with active post count
app.get('/categories', async (c) => {
  const categories = await c.env.DB.prepare(`
    SELECT bc.id, bc.name, bc.slug, COUNT(bp.id) as post_count
    FROM blog_categories bc
    LEFT JOIN blog_posts bp ON bc.id = bp.category_id AND bp.is_published = 1
    GROUP BY bc.id
    ORDER BY post_count DESC, bc.name ASC
  `).all()

  return c.json({ categories: categories.results || [] })
})

app.get('/:slug', async (c) => {
  const slug = c.req.param('slug')
  const post = await c.env.DB.prepare(`
    SELECT bp.*, bc.name as category_name, bc.slug as category_slug
    FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.slug = ? AND bp.is_published = 1
  `).bind(slug).first() as any

  if (!post) return c.json({ error: 'Post not found' }, 404)

  // Increment views
  await c.env.DB.prepare(
    `UPDATE blog_posts SET view_count = view_count + 1 WHERE slug = ?`
  ).bind(slug).run()

  // Fetch real related posts (same category or recent, max 3, excluding current)
  const related = await c.env.DB.prepare(`
    SELECT bp.*, bc.name as category_name, bc.slug as category_slug
    FROM blog_posts bp
    LEFT JOIN blog_categories bc ON bp.category_id = bc.id
    WHERE bp.is_published = 1 AND bp.id != ?
    ORDER BY (CASE WHEN bp.category_id = ? THEN 0 ELSE 1 END), bp.published_at DESC
    LIMIT 3
  `).bind(post.id, post.category_id ?? 0).all()

  return c.json({ post, related_posts: related.results || [] })
})

export default app
