// src/routes/coupons.ts — Public Coupon Validation API
import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'

const app = new Hono<{ Bindings: Env }>()

const validateSchema = z.object({
  code: z.string().min(2).max(30),
  amount: z.number().positive(),
})

export interface CouponRow {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_spend: number
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: number
}

// POST /api/coupons/validate
app.post('/validate', async (c) => {
  const body = await c.req.json()
  const parsed = validateSchema.safeParse(body)
  if (!parsed.success) return c.json({ error: 'Invalid coupon request' }, 400)

  const { code, amount } = parsed.data
  const coupon = await c.env.DB.prepare(`
    SELECT * FROM coupons WHERE UPPER(code) = UPPER(?) AND is_active = 1
  `).bind(code.trim()).first() as CouponRow | null

  if (!coupon) {
    return c.json({ error: 'Invalid or inactive coupon code' }, 404)
  }

  // Check expiry
  if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
    return c.json({ error: 'This coupon has expired' }, 400)
  }

  // Check max uses
  if (coupon.max_uses > 0 && coupon.used_count >= coupon.max_uses) {
    return c.json({ error: 'This coupon usage limit has been reached' }, 400)
  }

  // Check min spend
  if (coupon.min_spend > 0 && amount < coupon.min_spend) {
    return c.json({ error: `Minimum purchase of ₹${coupon.min_spend} required for this coupon` }, 400)
  }

  let discountAmount = 0
  if (coupon.discount_type === 'percent') {
    discountAmount = Math.round((amount * coupon.discount_value) / 100)
  } else {
    discountAmount = coupon.discount_value
  }

  // Discount cannot exceed order amount
  discountAmount = Math.min(discountAmount, amount)
  const finalAmount = Math.max(1, amount - discountAmount)

  return c.json({
    valid: true,
    code: coupon.code,
    discount_type: coupon.discount_type,
    discount_value: coupon.discount_value,
    discount_amount: discountAmount,
    final_amount: finalAmount,
  })
})

export default app
