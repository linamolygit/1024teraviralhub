// src/routes/analytics.ts — Frontend pixel event logging
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

app.post('/event', async (c) => {
  try {
    const body = await c.req.json() as {
      event_type: string
      product_id?: number
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      referrer?: string
    }

    if (!body.event_type) return c.json({ ok: false }, 400)

    const ip = c.req.header('CF-Connecting-IP')

    await c.env.DB.prepare(`
      INSERT INTO analytics_events (event_type, product_id, ip_address, utm_source, utm_medium, utm_campaign, referrer)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.event_type, body.product_id ?? null, ip ?? null,
      body.utm_source ?? null, body.utm_medium ?? null,
      body.utm_campaign ?? null, body.referrer ?? null,
    ).run()

    return c.json({ ok: true })
  } catch {
    return c.json({ ok: false }, 500)
  }
})

export default app
