// src/routes/admin/settings.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'
import { getSetting, setSetting } from '../../lib/db'

const app = new Hono<{ Bindings: Env }>()
app.use('*', adminAuthMiddleware)

app.get('/', async (c) => {
  const settings = await c.env.DB.prepare(`SELECT key, value FROM website_settings`).all()
  const result: Record<string, unknown> = {}
  for (const row of settings.results as {key: string; value: string}[]) {
    try { result[row.key] = JSON.parse(row.value) } catch { result[row.key] = row.value }
  }
  return c.json({ settings: result })
})

app.put('/', async (c) => {
  const body = await c.req.json() as Record<string, unknown>
  for (const [key, value] of Object.entries(body)) {
    await setSetting(c.env.DB, key, value)
  }
  return c.json({ success: true })
})

export default app
