// src/routes/search.ts
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const q = c.req.query('q')?.trim()
  if (!q || q.length < 2) return c.json({ products: [], posts: [] })

  const searchTerm = `%${q}%`

  const [products, posts] = await Promise.all([
    c.env.DB.prepare(`
      SELECT p.id, p.slug, p.title, p.short_description, p.price, p.sale_price, p.file_type
      FROM products p
      WHERE p.is_published = 1 AND (p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
      LIMIT 10
    `).bind(searchTerm, searchTerm, searchTerm).all(),
    c.env.DB.prepare(`
      SELECT id, slug, title, excerpt FROM blog_posts
      WHERE is_published = 1 AND (title LIKE ? OR content LIKE ?)
      LIMIT 5
    `).bind(searchTerm, searchTerm).all(),
  ])

  return c.json({ products: products.results, posts: posts.results })
})

export default app
