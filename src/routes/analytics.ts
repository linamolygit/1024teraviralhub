// src/routes/analytics.ts — Frontend pixel event logging
import { Hono } from 'hono'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

app.post('/event', async (c) => {
  try {
    const body = await c.req.json() as {
      event_type: string
      product_id?: number
      session_id?: string
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      referrer?: string
      metadata?: Record<string, unknown> | string
    }

    if (!body.event_type) return c.json({ ok: false }, 400)

    const ip = c.req.header('CF-Connecting-IP') || c.req.header('x-real-ip')
    const ua = c.req.header('User-Agent')
    const metaStr = typeof body.metadata === 'object' ? JSON.stringify(body.metadata) : (body.metadata ?? null)

    await c.env.DB.prepare(`
      INSERT INTO analytics_events (
        event_type, product_id, session_id, ip_address, user_agent,
        utm_source, utm_medium, utm_campaign, referrer, metadata
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      body.event_type,
      body.product_id ?? null,
      body.session_id ?? null,
      ip ?? null,
      ua ?? null,
      body.utm_source ?? null,
      body.utm_medium ?? null,
      body.utm_campaign ?? null,
      body.referrer ?? null,
      metaStr
    ).run()

    return c.json({ ok: true })
  } catch (err: any) {
    console.error('Analytics error:', err?.message)
    return c.json({ ok: false }, 500)
  }
})

export default app
