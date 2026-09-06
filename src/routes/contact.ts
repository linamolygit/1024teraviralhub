// src/routes/contact.ts
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

const contactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  inquiry_type: z.string().optional(),
  order_reference: z.string().max(100).optional(),
  subject: z.string().max(200).optional(),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000),
})

app.post('/', async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch {
    return c.json({ error: 'Invalid request body' }, 400)
  }

  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)

  const { name, email, inquiry_type, order_reference, subject, message } = parsed.data
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')

  const finalSubject = inquiry_type
    ? `[${inquiry_type.toUpperCase()}] ${subject?.trim() || 'Customer Inquiry'}`
    : subject?.trim() || 'General Inquiry'

  const finalMessage = order_reference?.trim()
    ? `[Order/Payment Ref: ${order_reference.trim()}]\n\n${message.trim()}`
    : message.trim()

  await c.env.DB.prepare(
    `INSERT INTO contact_messages (name, email, subject, message, ip_address) VALUES (?, ?, ?, ?, ?)`
  ).bind(name.trim(), email.trim().toLowerCase(), finalSubject, finalMessage, ip ?? null).run()

  return c.json({ success: true, message: "Thank you for contacting us. We've received your message and will review your request." })
})

export default app
