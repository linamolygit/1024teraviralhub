// ============================================
// src/routes/checkout.ts — Unified Multi-Gateway Checkout
// Supports Cashfree and Razorpay dynamically
// POST /api/checkout/create
// GET  /api/checkout/verify/:orderNumber
// ============================================

import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'
import { CashfreeClient, generateOrderNumber } from '../lib/cashfree'
import { RazorpayClient, getSanitizedCustomerPhone, type RazorpayPaymentLink } from '../lib/razorpay'
import {
  getProductById, createOrder, getSetting,
  updateOrderStatus, createDownloadToken, logAnalyticsEvent
} from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

async function getPaymentConfig(db: D1Database, env: Env) {
  const [
    activeGateway,
    defaultDualGateway,
    cfAppId, cfSecretKey, cfApiUrl, cfEnabled,
    rzpKeyId, rzpKeySecret, rzpEnabled
  ] = await Promise.all([
    getSetting<string>(db, 'active_payment_gateway', 'cashfree'),
    getSetting<string>(db, 'default_dual_gateway', 'cashfree'),
    getSetting<string>(db, 'cashfree_app_id', env.CASHFREE_APP_ID || ''),
    getSetting<string>(db, 'cashfree_secret_key', env.CASHFREE_SECRET_KEY || ''),
    getSetting<string>(db, 'cashfree_api_url', env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg'),
    getSetting<boolean>(db, 'cashfree_enabled', true),
    getSetting<string>(db, 'razorpay_key_id', ''),
    getSetting<string>(db, 'razorpay_key_secret', ''),
    getSetting<boolean>(db, 'razorpay_enabled', false),
  ])

  return {
    activeGateway: (activeGateway || 'cashfree').toLowerCase(),
    defaultDualGateway: (defaultDualGateway || 'cashfree').toLowerCase(),
    cashfree: {
      appId: cfAppId || env.CASHFREE_APP_ID || '',
      secretKey: cfSecretKey || env.CASHFREE_SECRET_KEY || '',
      apiUrl: cfApiUrl || env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg',
      enabled: cfEnabled ?? true,
    },
    razorpay: {
      keyId: rzpKeyId || '',
      keySecret: rzpKeySecret || '',
      enabled: rzpEnabled ?? false,
    },
  }
}

const checkoutSchema = z.object({
  product_id: z.number().int().positive(),
  customer_name: z.string().max(100).optional(),
  customer_email: z.string().email().optional().or(z.literal('')),
  customer_phone: z.string().optional().or(z.literal('')),
  preferred_gateway: z.enum(['cashfree', 'razorpay']).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  referrer_url: z.string().optional(),
})

// POST /api/checkout/create
app.post('/create', async (c) => {
  let body: unknown
  try { body = await c.req.json() } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const data = parsed.data

  // Fetch product to get authoritative price (never trust client-side price)
  const product = await getProductById(c.env.DB, data.product_id)
  if (!product) return c.json({ error: 'Product not found' }, 404)
  if (!product.is_published) return c.json({ error: 'Product not available' }, 404)

  const amount = product.sale_price ?? product.price
  const orderNumber = generateOrderNumber()

  // Sane fallbacks for frictionless 1-click guest purchase
  const randId = Math.floor(1000 + Math.random() * 9000)
  const hostDomain = c.req.header('host')?.replace(/:\d+$/, '') || 'store.local'
  const customerName = data.customer_name?.trim() || 'Guest Customer'
  const customerEmail = (data.customer_email && data.customer_email.trim().length > 0)
    ? data.customer_email.trim().toLowerCase()
    : `guest_${Date.now()}_${randId}@${hostDomain}`
  // 📱 AUTO-FILL MOBILE NUMBER: Realistic valid Indian mobile number if not provided
  const customerPhone = getSanitizedCustomerPhone(data.customer_phone, orderNumber)

  const config = await getPaymentConfig(c.env.DB, c.env)
  const siteUrl = c.env.SITE_URL || new URL(c.req.url).origin
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For')

  // Offline maintenance check
  if (config.activeGateway === 'offline') {
    return c.json({ error: 'Payment checkout is temporarily offline for maintenance. Please check back shortly.' }, 503)
  }

  // ── 1. Razorpay Gateway Flow ──
  const requestedGateway = data.preferred_gateway
  const shouldUseRazorpay =
    config.activeGateway === 'razorpay' ||
    (config.activeGateway === 'both' && requestedGateway === 'razorpay') ||
    (config.activeGateway === 'both' && !requestedGateway && config.defaultDualGateway === 'razorpay') ||
    (config.activeGateway === 'both' && !requestedGateway && Boolean(config.razorpay.keyId && !config.cashfree.appId)) ||
    (config.activeGateway === 'auto' && Boolean(config.razorpay.keyId && !config.cashfree.appId))

  if (shouldUseRazorpay) {
    if (!config.razorpay.keyId || !config.razorpay.keySecret) {
      return c.json({ error: 'Razorpay is not fully configured in settings.' }, 500)
    }

    const razorpay = new RazorpayClient({
      keyId: config.razorpay.keyId,
      keySecret: config.razorpay.keySecret,
    })

    // 🛡️ RAZORPAY 100% STEALTH ISOLATION & MASKING:
    // Real customer data and original product title remain 100% confidential in our internal database.
    // Razorpay audit logs only receive clean, generic digital media license metadata!
    const rzpCustomerEmail = `buyer_${orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
    const rzpCustomerPhone = customerPhone
    const rzpCustomerName = customerName !== 'Guest Customer' ? customerName : 'Verified Digital Buyer'

    let rzpOrder
    try {
      rzpOrder = await razorpay.createOrder({
        orderId: orderNumber,
        amount,
        currency: 'INR',
        receipt: orderNumber,
        // 🛡️ Zero sensitive keywords, zero customer PII in Razorpay's database!
        notes: {
          asset_type: 'digital_media_license',
          bundle_code: 'TVH_VIP_DOWNLOAD',
          merchant_channel: 'direct_web',
          order_ref: orderNumber,
        },
      })
    } catch (err: any) {
      console.error('Razorpay order creation error:', err)
      return c.json({ error: 'Payment gateway error. Please try again.' }, 502)
    }

    // 🚀 Native Direct Mobile UPI (100% Popup-Free Instant PhonePe/UPI Launch)
    let rzpPaymentLink: RazorpayPaymentLink | null = null
    try {
      rzpPaymentLink = await razorpay.createPaymentLink({
        amount,
        referenceId: orderNumber,
        description: `Digital Media License #${orderNumber}`,
        customerName: rzpCustomerName,
        customerEmail: rzpCustomerEmail,
        customerPhone: rzpCustomerPhone,
        callbackUrl: `${siteUrl}/payment/processing?order=${orderNumber}`,
        upiLink: true,
        notes: {
          order_number: orderNumber,
        },
      })
    } catch (linkErr) {
      console.warn('[Razorpay] Direct UPI link warning, fallback active:', linkErr)
    }

    const providerOrderId = rzpPaymentLink?.order_id || rzpOrder.id
    const sessionId = rzpPaymentLink?.id || rzpOrder.id
    const directUrl = rzpPaymentLink?.short_url || null

    // Save order in our DB with REAL customer details for internal fulfillment
    await createOrder(c.env.DB, {
      order_number: orderNumber,
      product_id: data.product_id,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      amount,
      cashfree_order_id: providerOrderId,
      payment_session_id: sessionId,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      referrer_url: data.referrer_url,
      ip_address: ip,
    })

    // Store gateway indicator and IDs
    await c.env.DB.prepare('UPDATE orders SET notes = ? WHERE order_number = ?')
      .bind(`gateway:razorpay;order_id:${rzpOrder.id};link_id:${rzpPaymentLink?.id || ''}`, orderNumber).run().catch(() => {})

    await logAnalyticsEvent(c.env.DB, {
      event_type: 'checkout_start',
      product_id: data.product_id,
      ip_address: ip,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium,
      utm_campaign: data.utm_campaign,
      metadata: { gateway: 'razorpay', order_id: providerOrderId },
    })

    return c.json({
      success: true,
      gateway: 'razorpay',
      order_number: orderNumber,
      amount: rzpOrder.amount, // in paise
      currency: 'INR',
      razorpay_key_id: config.razorpay.keyId,
      razorpay_order_id: providerOrderId,
      razorpay_payment_link_id: rzpPaymentLink?.id || null,
      payment_url: directUrl,
      upi_link: directUrl,
      upi_intent: directUrl ? {
        phonepe: directUrl,
        gpay: directUrl,
        paytm: directUrl,
        default: directUrl,
      } : null,
      stealth_name: rzpCustomerName,
      stealth_email: rzpCustomerEmail,
      stealth_phone: rzpCustomerPhone,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
    })
  }

  // ── 2. Cashfree Gateway Flow ──
  const cashfreeCustomerEmail = `buyer_${orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
  const cashfreeCustomerPhone = customerPhone

  const cashfree = new CashfreeClient({
    appId: config.cashfree.appId,
    secretKey: config.cashfree.secretKey,
    apiUrl: config.cashfree.apiUrl,
  })

  let cfOrder
  try {
    cfOrder = await cashfree.createOrder({
      orderId: orderNumber,
      amount,
      currency: 'INR',
      customerName: 'Verified Digital Buyer',
      customerEmail: cashfreeCustomerEmail,
      customerPhone: cashfreeCustomerPhone,
      returnUrl: `${siteUrl}/payment/processing?order=${orderNumber}`,
      notifyUrl: `${siteUrl}/api/cashfree/webhook`,
    })
  } catch (err) {
    console.error('Cashfree order creation error:', err)
    return c.json({ error: 'Payment gateway error. Please try again.' }, 502)
  }

  // Attempt to create UPI Intent / Deeplink session
  const upiSession = await cashfree.createUpiPaymentSession(cfOrder.payment_session_id, 'link')

  // Create order in our DB
  await createOrder(c.env.DB, {
    order_number: orderNumber,
    product_id: data.product_id,
    customer_name: customerName,
    customer_email: customerEmail,
    customer_phone: customerPhone,
    amount,
    cashfree_order_id: cfOrder.cf_order_id.toString(),
    payment_session_id: cfOrder.payment_session_id,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    referrer_url: data.referrer_url,
    ip_address: ip,
  })

  await c.env.DB.prepare('UPDATE orders SET notes = ? WHERE order_number = ?')
    .bind('gateway:cashfree', orderNumber).run().catch(() => {})

  // Log analytics event
  await logAnalyticsEvent(c.env.DB, {
    event_type: 'checkout_start',
    product_id: data.product_id,
    ip_address: ip,
    utm_source: data.utm_source,
    utm_medium: data.utm_medium,
    utm_campaign: data.utm_campaign,
    metadata: { gateway: 'cashfree', order_id: cfOrder.cf_order_id },
  })

  return c.json({
    success: true,
    gateway: 'cashfree',
    order_number: orderNumber,
    payment_session_id: cfOrder.payment_session_id,
    amount,
    currency: 'INR',
    upi_intent: upiSession?.data?.payload ?? null,
    upi_link: upiSession?.data?.link ?? null,
    upi_qrcode: upiSession?.data?.qrcode ?? null,
  })
})

// GET /api/checkout/verify/:orderNumber
// Called by frontend after payment redirect — verifies server-side
app.get('/verify/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')

  const order = await c.env.DB.prepare(
    `SELECT * FROM orders WHERE order_number = ?`
  ).bind(orderNumber).first() as {
    id: number; amount: number; status: string; cashfree_order_id: string;
    payment_session_id?: string;
    product_id: number; customer_email: string; customer_name: string; notes?: string
  } | null

  if (!order) return c.json({ error: 'Order not found' }, 404)

  // If already PAID, return existing download token
  if (order.status === 'PAID') {
    const token = await c.env.DB.prepare(
      `SELECT token, expires_at, download_count, max_downloads FROM download_tokens WHERE order_id = ? AND is_revoked = 0 ORDER BY created_at DESC LIMIT 1`
    ).bind(order.id).first() as { token: string; expires_at: string; download_count: number; max_downloads: number } | null

    return c.json({ success: true, status: 'PAID', download_token: token?.token })
  }

  const config = await getPaymentConfig(c.env.DB, c.env)

  // 1. Check if this is a Razorpay order
  const isRazorpay =
    order.notes?.includes('gateway:razorpay') ||
    order.cashfree_order_id?.startsWith('order_') ||
    order.cashfree_order_id?.startsWith('plink_') ||
    order.payment_session_id?.startsWith('order_') ||
    order.payment_session_id?.startsWith('plink_')

  if (isRazorpay) {
    const razorpay = new RazorpayClient({
      keyId: config.razorpay.keyId,
      keySecret: config.razorpay.keySecret,
    })

    try {
      const rzpOrderId = order.cashfree_order_id?.startsWith('order_')
        ? order.cashfree_order_id
        : order.payment_session_id?.startsWith('order_')
        ? order.payment_session_id
        : null

      const rzpLinkId = order.payment_session_id?.startsWith('plink_')
        ? order.payment_session_id
        : order.cashfree_order_id?.startsWith('plink_')
        ? order.cashfree_order_id
        : null

      let isPaid = false
      let paidAmount = order.amount

      if (rzpOrderId) {
        const rzpOrder = await razorpay.getOrder(rzpOrderId).catch(() => null)
        if (rzpOrder?.status === 'paid') {
          isPaid = true
          paidAmount = rzpOrder.amount ? rzpOrder.amount / 100 : order.amount
        } else if (rzpOrder?.status === 'attempted') {
          const payments = await razorpay.getOrderPayments(rzpOrderId).catch(() => ({ items: [] }))
          const captured = payments.items?.find((p) => p.status === 'captured')
          if (captured) {
            isPaid = true
            paidAmount = captured.amount ? captured.amount / 100 : order.amount
          }
        }
      }

      if (!isPaid && rzpLinkId) {
        const plink = await razorpay.getPaymentLink(rzpLinkId).catch(() => null)
        if (plink?.status === 'paid') {
          isPaid = true
          paidAmount = plink.amount ? plink.amount / 100 : order.amount
        }
      }

      if (isPaid) {
        await updateOrderStatus(c.env.DB, order.id, 'PAID')

        await c.env.DB.prepare(
          `UPDATE products SET total_sales = total_sales + 1, total_revenue = total_revenue + ? WHERE id = ?`
        ).bind(paidAmount, order.product_id).run()

        const product = await getProductById(c.env.DB, order.product_id)
        const expiryHours = product?.access_duration_hours ?? 12
        const maxDownloads = product?.download_limit ?? 3
        const token = await createDownloadToken(c.env.DB, order.id, expiryHours, maxDownloads)

        await logAnalyticsEvent(c.env.DB, {
          event_type: 'purchase',
          product_id: order.product_id,
          order_id: order.id,
          metadata: { gateway: 'razorpay', order_id: rzpOrderId || rzpLinkId },
        })

        return c.json({ success: true, status: 'PAID', download_token: token })
      }

      return c.json({ success: false, status: 'PENDING' })
    } catch (err) {
      console.error('Razorpay verification error:', err)
      return c.json({ error: 'Verification failed' }, 500)
    }
  }

  // 2. Cashfree Verification
  const cashfree = new CashfreeClient({
    appId: config.cashfree.appId,
    secretKey: config.cashfree.secretKey,
    apiUrl: config.cashfree.apiUrl,
  })

  try {
    const cfStatus = await cashfree.getOrderStatus(order.cashfree_order_id)

    if (cfStatus.order_status === 'PAID') {
      await updateOrderStatus(c.env.DB, order.id, 'PAID')

      // Update product stats
      await c.env.DB.prepare(
        `UPDATE products SET total_sales = total_sales + 1, total_revenue = total_revenue + ? WHERE id = ?`
      ).bind(cfStatus.order_amount, order.product_id).run()

      // Get product settings for download
      const product = await getProductById(c.env.DB, order.product_id)
      const expiryHours = product?.access_duration_hours ?? 12
      const maxDownloads = product?.download_limit ?? 3

      // Generate download token
      const token = await createDownloadToken(c.env.DB, order.id, expiryHours, maxDownloads)

      // Log purchase event
      await logAnalyticsEvent(c.env.DB, {
        event_type: 'purchase',
        product_id: order.product_id,
        order_id: order.id,
        metadata: { gateway: 'cashfree', order_id: order.cashfree_order_id },
      })

      return c.json({ success: true, status: 'PAID', download_token: token })
    }

    if (cfStatus.order_status === 'FAILED') {
      await updateOrderStatus(c.env.DB, order.id, 'FAILED')
      return c.json({ success: false, status: 'FAILED' })
    }

    return c.json({ success: false, status: cfStatus.order_status ?? 'PENDING' })
  } catch (err) {
    console.error('Payment verification error:', err)
    return c.json({ error: 'Verification failed' }, 500)
  }
})

// GET /api/checkout/order/:orderNumber
app.get('/order/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')

  const order = await c.env.DB.prepare(
    `SELECT o.*, p.title as product_title, p.slug as product_slug, p.price as product_price,
            p.sale_price as product_sale_price, p.file_count, p.file_type, p.access_duration_hours, p.download_limit
     FROM orders o
     JOIN products p ON o.product_id = p.id
     WHERE o.order_number = ?`
  ).bind(orderNumber).first() as any

  if (!order) return c.json({ error: 'Order not found' }, 404)

  const thumbnail = await c.env.DB.prepare(
    `SELECT r2_key FROM product_images WHERE product_id = ? AND is_thumbnail = 1 LIMIT 1`
  ).bind(order.product_id).first() as { r2_key: string } | null

  return c.json({
    order_number: order.order_number,
    status: order.status,
    amount: order.amount,
    currency: 'INR',
    customer_name: order.customer_name,
    customer_email: order.customer_email,
    customer_phone: order.customer_phone,
    payment_session_id: order.payment_session_id,
    created_at: order.created_at,
    product: {
      id: order.product_id,
      title: order.product_title,
      slug: order.product_slug,
      price: order.product_price,
      sale_price: order.product_sale_price,
      file_count: order.file_count,
      file_type: order.file_type,
      access_duration_hours: order.access_duration_hours,
      download_limit: order.download_limit,
      thumbnail_url: thumbnail ? `/api/images/${encodeURIComponent(thumbnail.r2_key)}` : null,
    },
  })
})

export default app
