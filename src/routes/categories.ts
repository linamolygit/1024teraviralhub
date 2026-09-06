// src/routes/categories.ts
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

app.get('/', async (c) => {
  const categories = await c.env.DB.prepare(`
    SELECT pc.*, COUNT(p.id) as product_count
    FROM product_categories pc
    LEFT JOIN products p ON p.category_id = pc.id AND p.is_published = 1
    GROUP BY pc.id
    ORDER BY pc.sort_order ASC
  `).all()
  return c.json({ categories: categories.results })
})

export default app
