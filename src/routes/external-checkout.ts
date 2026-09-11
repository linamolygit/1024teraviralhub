// ============================================================
// src/routes/external-checkout.ts — Multi-Site White-Label Partner Gateway
// Universal Multi-Gateway Support (Cashfree & Razorpay) with 100% Stealth Mode
// ============================================================

import { Hono } from 'hono'
import { z } from 'zod'
import type { Env } from '../worker'
import { CashfreeClient } from '../lib/cashfree'
import { RazorpayClient, getSanitizedCustomerPhone } from '../lib/razorpay'

type PartnerRecord = {
  id: number
  partner_id: string
  site_name: string
  site_url: string
  api_key: string
  webhook_url?: string
  status: string
}

type Variables = {
  partner?: PartnerRecord
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// Helper to get setting from website_settings
async function getSettingValue(db: D1Database, key: string, fallback: string): Promise<string> {
  try {
    const row = await db.prepare(`SELECT value FROM website_settings WHERE key = ?`).bind(key).first() as { value: string } | null
    if (!row || row.value === undefined || row.value === null) return fallback
    try {
      const parsed = JSON.parse(row.value)
      return typeof parsed === 'string' ? parsed : String(row.value)
    } catch {
      return String(row.value)
    }
  } catch {
    return fallback
  }
}

// Universal payment configuration loader for external checkout
async function getExternalPaymentConfig(db: D1Database, env: Env) {
  const [
    activeGateway,
    cfAppId, cfSecretKey, cfApiUrl, cfEnabled,
    rzpKeyId, rzpKeySecret, rzpEnabled
  ] = await Promise.all([
    getSettingValue(db, 'active_payment_gateway', 'cashfree'),
    getSettingValue(db, 'cashfree_app_id', env.CASHFREE_APP_ID || ''),
    getSettingValue(db, 'cashfree_secret_key', env.CASHFREE_SECRET_KEY || ''),
    getSettingValue(db, 'cashfree_api_url', env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg'),
    getSettingValue(db, 'cashfree_enabled', 'true'),
    getSettingValue(db, 'razorpay_key_id', ''),
    getSettingValue(db, 'razorpay_key_secret', ''),
    getSettingValue(db, 'razorpay_enabled', 'false'),
  ])

  const cashfreeAppId = (cfAppId || env.CASHFREE_APP_ID || '').trim()
  const cashfreeSecretKey = (cfSecretKey || env.CASHFREE_SECRET_KEY || '').trim()
  const cashfreeApiUrl = (cfApiUrl || env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg').trim()
  const razorpayKeyId = (rzpKeyId || '').trim()
  const razorpayKeySecret = (rzpKeySecret || '').trim()

  return {
    activeGateway: (activeGateway || 'cashfree').toLowerCase().trim(),
    cashfree: {
      appId: cashfreeAppId,
      secretKey: cashfreeSecretKey,
      apiUrl: cashfreeApiUrl,
      enabled: cfEnabled !== 'false' && cfEnabled !== '0',
      isConfigured: Boolean(cashfreeAppId && cashfreeSecretKey),
    },
    razorpay: {
      keyId: razorpayKeyId,
      keySecret: razorpayKeySecret,
      enabled: rzpEnabled === 'true' || rzpEnabled === '1',
      isConfigured: Boolean(razorpayKeyId && razorpayKeySecret),
    },
  }
}

// Forward signed HMAC webhook to partner site upon payment confirmation
async function forwardWebhookToPartner(db: D1Database, order: {
  id: number
  order_number: string
  item_id: string
  chat_session_id?: string | null
  amount: number
  origin_site: string
  webhook_url?: string | null
}, gateway: string) {
  if (!order.webhook_url) return

  try {
    const partner = await db.prepare(
      `SELECT * FROM external_partners WHERE site_url = ? OR ? LIKE ('%' || site_url || '%') LIMIT 1`
    ).bind(order.origin_site, order.origin_site).first() as { id: number; api_key: string } | null

    let secretKey = partner?.api_key
    if (!secretKey) {
      const partnerKeyRow = await db.prepare(
        `SELECT value FROM website_settings WHERE key = 'external_partner_api_key'`
      ).first() as { value: string } | null
      secretKey = partnerKeyRow?.value || ''
    }

    const notifyPayload = JSON.stringify({
      event: 'PAYMENT_SUCCESS',
      status: 'PAID',
      order_number: order.order_number,
      item_id: order.item_id,
      chat_session_id: order.chat_session_id || '',
      amount: order.amount,
      currency: 'INR',
      gateway,
      timestamp: new Date().toISOString(),
    })

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (secretKey) {
      const enc = new TextEncoder()
      const cryptoKey = await crypto.subtle.importKey(
        'raw', enc.encode(secretKey),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
      )
      const sigBuf = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(notifyPayload))
      const sigHex = Array.from(new Uint8Array(sigBuf)).map(b => b.toString(16).padStart(2, '0')).join('')
      headers['X-Gateway-Signature'] = sigHex
    }

    const forwardRes = await fetch(order.webhook_url, {
      method: 'POST',
      headers,
      body: notifyPayload,
    })

    await db.prepare(
      `UPDATE external_orders SET webhook_delivered = ?, webhook_response = ? WHERE id = ?`
    ).bind(forwardRes.ok ? 1 : 0, `HTTP ${forwardRes.status}`, order.id).run().catch(() => {})
  } catch (fwdErr: any) {
    console.error('[Webhook Forwarder Error]', fwdErr)
  }
}

// ─── Stealth Return Endpoint (Public Browser Redirect) ───
// PhonePe / Cashfree / Razorpay lands here after payment completion.
// Gateways ONLY see 1024teraviralhub.com. We immediately 302-redirect to partner's chat.
app.get('/return', async (c) => {
  const orderNumber = c.req.query('order') || c.req.query('order_id')
  if (!orderNumber) {
    return c.redirect(c.env.SITE_URL || 'https://1024teraviralhub.com', 302)
  }

  const order = await c.env.DB.prepare(
    `SELECT order_number, return_url, status FROM external_orders WHERE order_number = ?`
  ).bind(orderNumber).first() as { order_number: string; return_url: string; status: string } | null

  if (!order || !order.return_url) {
    return c.redirect(c.env.SITE_URL || 'https://1024teraviralhub.com', 302)
  }

  try {
    const targetUrl = new URL(order.return_url)
    if (!targetUrl.searchParams.has('order')) {
      targetUrl.searchParams.set('order', order.order_number)
    }
    return c.redirect(targetUrl.toString(), 302)
  } catch {
    return c.redirect(order.return_url, 302)
  }
})

// ─── Middleware: Multi-Partner Authentication ───
app.use('*', async (c, next) => {
  if (c.req.method === 'OPTIONS') return next()

  // Skip auth for public return redirect
  if (c.req.path.endsWith('/return')) {
    return next()
  }

  // 1. Check Global Master Switch
  const enabled = await getSettingValue(c.env.DB, 'external_payments_enabled', '1')
  if (enabled === '0' || enabled === 'false') {
    return c.json({ error: 'External partner gateway is currently disabled by administrator' }, 503)
  }

  // 2. Validate Partner API Key (Header: X-Partner-Key or Authorization Bearer)
  const partnerKeyHeader = c.req.header('X-Partner-Key') || c.req.header('x-partner-key')
  const authHeader = c.req.header('Authorization')
  const providedKey = partnerKeyHeader || (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!providedKey) {
    return c.json({ error: 'Unauthorized: Invalid or missing X-Partner-Key' }, 401)
  }

  // Check multi-tenant external_partners table first
  let partner = await c.env.DB.prepare(`
    SELECT * FROM external_partners WHERE api_key = ?
  `).bind(providedKey.trim()).first() as PartnerRecord | null

  // Fallback: check legacy website_settings key
  if (!partner) {
    const legacyKey = await getSettingValue(c.env.DB, 'external_partner_api_key', '')
    if (legacyKey && providedKey.trim() === legacyKey.trim()) {
      partner = {
        id: 0,
        partner_id: 'partner_legacy',
        site_name: 'InstaTextPro',
        site_url: 'https://instatextpro.online',
        api_key: legacyKey,
        status: 'active',
      }
    }
  }

  if (!partner) {
    return c.json({ error: 'Unauthorized: Invalid or unknown X-Partner-Key' }, 401)
  }

  if (partner.status === 'paused') {
    return c.json({ error: `Partner checkout for ${partner.site_name} is currently paused` }, 403)
  }

  c.set('partner', partner)
  await next()
})

// Validation Schema for External Orders
const createExternalOrderSchema = z.object({
  item_id: z.string().min(1, 'item_id is required'),
  item_name: z.string().optional().default('AI Chat Media Unlock'),
  chat_session_id: z.string().optional().default(''),
  amount: z.number().positive('amount must be greater than 0'),
  origin_site: z.string().optional(),
  customer_name: z.string().optional().default('AI Chat Customer'),
  customer_email: z.string().optional(),
  customer_phone: z.string().optional(),
  return_url: z.string().url().optional(),
  webhook_url: z.string().url().optional(),
  gateway: z.enum(['cashfree', 'razorpay']).optional(),
  preferred_gateway: z.enum(['cashfree', 'razorpay']).optional(),
})

// POST /api/external/create-order
// Universal 1-Click Multi-Gateway Endpoint (Cashfree + Razorpay) with 100% Stealth Isolation
app.post('/create-order', async (c) => {
  const partner = c.get('partner')

  let body: unknown
  try {
    body = await c.req.json()
  } catch {
    return c.json({ error: 'Invalid JSON body' }, 400)
  }

  const parsed = createExternalOrderSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: 'Validation failed', details: parsed.error.errors }, 400)
  }

  const data = parsed.data
  const randCode = Math.floor(1000 + Math.random() * 9000)
  const orderNumber = `EXT-${Date.now().toString(36).toUpperCase()}-${randCode}`

  // Customer Fallbacks (Strict internal domain fallback for Gateway Stealth Isolation)
  const customerName = data.customer_name?.trim() || 'Digital Media Buyer'
  const customerEmail = (data.customer_email && data.customer_email.includes('@'))
    ? data.customer_email.trim().toLowerCase()
    : `buyer_${Date.now()}_${randCode}@1024teraviralhub.com`
  // 📱 AUTO-FILL MOBILE NUMBER: Realistic valid Indian mobile number if not provided
  const customerPhone = getSanitizedCustomerPhone(data.customer_phone, orderNumber)

  const siteUrl = c.env.SITE_URL || 'https://1024teraviralhub.com'
  const originSite = partner?.site_url || data.origin_site || 'https://instatextpro.online'
  const partnerReturnUrl = data.return_url || `${originSite}/chat?session=${encodeURIComponent(data.chat_session_id)}&order=${orderNumber}`
  const partnerWebhookUrl = data.webhook_url || partner?.webhook_url || `${originSite}/api/webhook/payment`

  // 🛡️ 100% STEALTH RETURN URL:
  // Gateways require return_url to match registered merchant domain (1024teraviralhub.com).
  // Gateways never see third-party external domains!
  const stealthReturnUrl = `${siteUrl}/api/external/return?order=${encodeURIComponent(orderNumber)}`

  // Load gateway configurations
  const config = await getExternalPaymentConfig(c.env.DB, c.env)

  if (config.activeGateway === 'offline') {
    return c.json({ error: 'External partner gateway is currently disabled for maintenance' }, 503)
  }

  const requestedGateway = (data.preferred_gateway || data.gateway)?.toLowerCase() as 'cashfree' | 'razorpay' | undefined

  // Determine active gateway
  let chosenGateway: 'cashfree' | 'razorpay'

  if (requestedGateway === 'razorpay' && config.razorpay.isConfigured) {
    chosenGateway = 'razorpay'
  } else if (requestedGateway === 'cashfree' && config.cashfree.isConfigured) {
    chosenGateway = 'cashfree'
  } else if (config.activeGateway === 'razorpay') {
    chosenGateway = 'razorpay'
  } else if (config.activeGateway === 'cashfree') {
    chosenGateway = 'cashfree'
  } else if (config.activeGateway === 'both') {
    // In both mode: if only one gateway is approved/configured, smoothly use it!
    if (config.razorpay.isConfigured && !config.cashfree.isConfigured) {
      chosenGateway = 'razorpay'
    } else {
      chosenGateway = 'cashfree'
    }
  } else {
    // Fallback: whichever is configured
    if (config.razorpay.isConfigured && !config.cashfree.isConfigured) {
      chosenGateway = 'razorpay'
    } else {
      chosenGateway = 'cashfree'
    }
  }

  // Helper for executing Razorpay flow
  const executeRazorpay = async () => {
    if (!config.razorpay.isConfigured) {
      throw new Error('Razorpay Gateway is not configured with Key ID and Secret')
    }

    const razorpay = new RazorpayClient({
      keyId: config.razorpay.keyId,
      keySecret: config.razorpay.keySecret,
    })

    const rzpCustomerEmail = `buyer_${orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
    const rzpCustomerPhone = customerPhone

    let plink: any = null
    let rzpOrder: any = null

    try {
      // 1. Create Razorpay Payment Link (Native 1-Click hosted checkout & UPI app link)
      plink = await razorpay.createPaymentLink({
        amount: data.amount,
        currency: 'INR',
        referenceId: orderNumber,
        description: 'Digital Media License',
        customerName: 'Verified Digital Buyer',
        customerEmail: rzpCustomerEmail,
        customerPhone: rzpCustomerPhone,
        callbackUrl: stealthReturnUrl,
        upiLink: true,
        notes: {
          order_number: orderNumber,
          asset_type: 'digital_media_license',
          bundle_code: 'TVH_VIP_DOWNLOAD',
          merchant_channel: 'direct_web',
          store_domain: '1024teraviralhub.com',
        },
      })
    } catch (linkErr: any) {
      console.warn('[External Gateway] Razorpay payment link error, falling back to standard order:', linkErr.message)
      // 2. Fallback to standard order if payment link API unavailable
      rzpOrder = await razorpay.createOrder({
        orderId: orderNumber,
        amount: data.amount,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          order_number: orderNumber,
          asset_type: 'digital_media_license',
          bundle_code: 'TVH_VIP_DOWNLOAD',
          merchant_channel: 'direct_web',
          store_domain: '1024teraviralhub.com',
        },
      })
    }

    const paymentUrl = plink?.short_url || `${siteUrl}/payment/external-pay?order=${encodeURIComponent(orderNumber)}`
    const providerOrderId = plink?.order_id || rzpOrder?.id || plink?.id || orderNumber
    const sessionId = plink?.id || rzpOrder?.id || orderNumber

    const upiIntentJson = JSON.stringify({
      gateway: 'razorpay',
      link: paymentUrl,
      short_url: plink?.short_url || null,
      razorpay_order_id: providerOrderId,
      razorpay_key_id: config.razorpay.keyId,
    })

    // Save in external_orders table
    await c.env.DB.prepare(`
      INSERT INTO external_orders (
        order_number, origin_site, item_id, item_name, chat_session_id,
        amount, currency, status, customer_name, customer_email, customer_phone,
        cashfree_order_id, payment_session_id, phonepe_deep_link, upi_intent_json,
        return_url, webhook_url
      ) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber,
      originSite,
      data.item_id,
      data.item_name,
      data.chat_session_id,
      data.amount,
      customerName,
      customerEmail,
      customerPhone,
      providerOrderId,
      sessionId,
      paymentUrl,
      upiIntentJson,
      partnerReturnUrl,
      partnerWebhookUrl
    ).run()

    if (partner && partner.id > 0) {
      await c.env.DB.prepare(`
        UPDATE external_partners SET total_orders = total_orders + 1, updated_at = datetime('now') WHERE id = ?
      `).bind(partner.id).run().catch(() => {})
    }

    return {
      success: true,
      gateway: 'razorpay',
      order_number: orderNumber,
      amount: data.amount,
      currency: 'INR',
      phonepe_deep_link: paymentUrl,
      gpay_deep_link: paymentUrl,
      paytm_deep_link: paymentUrl,
      upi_intent: paymentUrl,
      qr_code: null,
      payment_url: paymentUrl,
      razorpay_key_id: config.razorpay.keyId,
      razorpay_order_id: providerOrderId,
      return_url: partnerReturnUrl,
    }
  }

  // Execute Gateway
  if (chosenGateway === 'razorpay') {
    try {
      const res = await executeRazorpay()
      return c.json(res)
    } catch (err: any) {
      console.error('[External Gateway] Razorpay creation failed:', err)
      return c.json({ error: 'Razorpay Gateway error: ' + (err.message || 'Failed to create order') }, 502)
    }
  }

  // ─── Cashfree Flow (with Automatic Failover to Razorpay) ───
  if (!config.cashfree.isConfigured) {
    if (config.razorpay.isConfigured) {
      try {
        const res = await executeRazorpay()
        return c.json(res)
      } catch (rzpErr: any) {
        return c.json({ error: 'Payment gateway error: ' + rzpErr.message }, 502)
      }
    }
    return c.json({ error: 'Cashfree Gateway is not configured with App ID and Secret' }, 500)
  }

  const cashfree = new CashfreeClient({
    appId: config.cashfree.appId,
    secretKey: config.cashfree.secretKey,
    apiUrl: config.cashfree.apiUrl,
  })

  const cashfreeCustomerEmail = `buyer_${orderNumber.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
  const cashfreeCustomerPhone = customerPhone

  let cfOrder
  try {
    cfOrder = await cashfree.createOrder({
      orderId: orderNumber,
      amount: data.amount,
      currency: 'INR',
      customerName: 'Digital Media Buyer',
      customerEmail: cashfreeCustomerEmail,
      customerPhone: cashfreeCustomerPhone,
      returnUrl: stealthReturnUrl,
      notifyUrl: `${siteUrl}/api/cashfree/webhook`,
      orderMeta: {
        asset_type: 'digital_media_license',
        bundle_code: 'TVH_VIP_DOWNLOAD',
        channel: 'direct_web',
      },
    })
  } catch (err: any) {
    console.error('[External Gateway] Cashfree Order creation failed:', err)

    // Seamless failover: If Cashfree fails and Razorpay is configured, automatically fallback to Razorpay!
    if (config.razorpay.isConfigured) {
      try {
        console.log('[External Gateway] Cashfree failed, performing automatic failover to Razorpay...')
        const rzpRes = await executeRazorpay()
        return c.json(rzpRes)
      } catch (fallbackErr: any) {
        console.error('[External Gateway] Razorpay failover also failed:', fallbackErr)
      }
    }

    return c.json({ error: 'Cashfree Gateway error: ' + (err.message || 'Failed to create order') }, 502)
  }

  // Request direct UPI Intent Sessions for native PhonePe launch
  const upiIntentSession = await cashfree.createUpiPaymentSession(cfOrder.payment_session_id, 'intent')
  const upiLinkSession = await cashfree.createUpiPaymentSession(cfOrder.payment_session_id, 'link')

  // Extract PhonePe and generic UPI links
  const phonepeIntent = upiIntentSession?.data?.payload?.phonepe || upiLinkSession?.data?.payload?.phonepe || null
  const gpayIntent = upiIntentSession?.data?.payload?.gpay || upiLinkSession?.data?.payload?.gpay || null
  const paytmIntent = upiIntentSession?.data?.payload?.paytm || upiLinkSession?.data?.payload?.paytm || null
  const defaultUpi = upiIntentSession?.data?.payload?.default || upiLinkSession?.data?.payload?.default || phonepeIntent || null
  const qrCode = upiIntentSession?.data?.qrcode || upiLinkSession?.data?.qrcode || null
  const webLink = upiLinkSession?.data?.link || `https://payments.cashfree.com/links/${cfOrder.payment_session_id}`

  const upiIntentJson = JSON.stringify({
    gateway: 'cashfree',
    phonepe: phonepeIntent,
    gpay: gpayIntent,
    paytm: paytmIntent,
    default: defaultUpi,
    link: webLink,
    qrcode: qrCode,
  })

  // Save in external_orders table
  try {
    await c.env.DB.prepare(`
      INSERT INTO external_orders (
        order_number, origin_site, item_id, item_name, chat_session_id,
        amount, currency, status, customer_name, customer_email, customer_phone,
        cashfree_order_id, payment_session_id, phonepe_deep_link, upi_intent_json,
        return_url, webhook_url
      ) VALUES (?, ?, ?, ?, ?, ?, 'INR', 'PENDING', ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      orderNumber,
      originSite,
      data.item_id,
      data.item_name,
      data.chat_session_id,
      data.amount,
      customerName,
      customerEmail,
      customerPhone,
      cfOrder.cf_order_id.toString(),
      cfOrder.payment_session_id,
      phonepeIntent || defaultUpi,
      upiIntentJson,
      partnerReturnUrl,
      partnerWebhookUrl
    ).run()

    if (partner && partner.id > 0) {
      await c.env.DB.prepare(`
        UPDATE external_partners SET total_orders = total_orders + 1, updated_at = datetime('now') WHERE id = ?
      `).bind(partner.id).run().catch(() => {})
    }
  } catch (dbErr: any) {
    console.error('[External Gateway] Database insert error:', dbErr)
  }

  return c.json({
    success: true,
    gateway: 'cashfree',
    order_number: orderNumber,
    amount: data.amount,
    currency: 'INR',
    phonepe_deep_link: phonepeIntent || defaultUpi,
    gpay_deep_link: gpayIntent,
    paytm_deep_link: paytmIntent,
    upi_intent: defaultUpi,
    qr_code: qrCode,
    payment_url: webLink,
    return_url: partnerReturnUrl,
  })
})

// GET /api/external/verify-order/:orderNumber
// Verify if order has been paid across either Cashfree or Razorpay
app.get('/verify-order/:orderNumber', async (c) => {
  const orderNumber = c.req.param('orderNumber')

  const order = await c.env.DB.prepare(
    `SELECT * FROM external_orders WHERE order_number = ?`
  ).bind(orderNumber).first() as {
    id: number
    order_number: string
    status: string
    amount: number
    item_id: string
    chat_session_id: string
    cashfree_order_id: string
    origin_site: string
    webhook_url?: string
  } | null

  if (!order) {
    return c.json({ error: 'Order not found' }, 404)
  }

  if (order.status === 'PAID') {
    return c.json({
      success: true,
      order_number: order.order_number,
      status: 'PAID',
      unlocked: true,
      item_id: order.item_id,
      chat_session_id: order.chat_session_id,
      amount: order.amount,
    })
  }

  const config = await getExternalPaymentConfig(c.env.DB, c.env)
  const isRazorpayOrder = Boolean(
    order.cashfree_order_id &&
    (order.cashfree_order_id.startsWith('order_') || order.cashfree_order_id.startsWith('plink_'))
  )

  let isPaid = false
  let orderStatusString = 'PENDING'

  if (isRazorpayOrder && config.razorpay.isConfigured) {
    const razorpay = new RazorpayClient({
      keyId: config.razorpay.keyId,
      keySecret: config.razorpay.keySecret,
    })

    try {
      if (order.cashfree_order_id.startsWith('plink_')) {
        const plink = await razorpay.getPaymentLink(order.cashfree_order_id)
        orderStatusString = plink.status
        isPaid = plink.status === 'paid'
      } else {
        const rzpOrder = await razorpay.getOrder(order.cashfree_order_id)
        orderStatusString = rzpOrder.status
        isPaid = rzpOrder.status === 'paid'
        if (!isPaid) {
          const payments = await razorpay.getOrderPayments(order.cashfree_order_id).catch(() => ({ items: [] }))
          isPaid = payments.items.some(p => p.status === 'captured' || p.status === 'authorized')
        }
      }
    } catch (err: any) {
      console.warn('[External Gateway] Razorpay verify error:', err.message)
    }
  } else if (config.cashfree.isConfigured) {
    const cashfree = new CashfreeClient({
      appId: config.cashfree.appId,
      secretKey: config.cashfree.secretKey,
      apiUrl: config.cashfree.apiUrl,
    })

    try {
      let cfStatus: any
      try {
        cfStatus = await cashfree.getOrderStatus(order.order_number)
      } catch {
        cfStatus = await cashfree.getOrderStatus(order.cashfree_order_id)
      }
      orderStatusString = cfStatus?.order_status || 'PENDING'
      isPaid = cfStatus?.order_status === 'PAID'
    } catch (err: any) {
      console.warn('[External Gateway] Cashfree verify error:', err.message)
    }
  }

  if (isPaid) {
    await c.env.DB.prepare(
      `UPDATE external_orders SET status = 'PAID', updated_at = datetime('now') WHERE id = ?`
    ).bind(order.id).run()

    // Update partner revenue & paid count
    await c.env.DB.prepare(`
      UPDATE external_partners
      SET paid_orders = paid_orders + 1,
          total_revenue = total_revenue + ?,
          updated_at = datetime('now')
      WHERE site_url = ? OR ? LIKE ('%' || site_url || '%')
    `).bind(order.amount, order.origin_site, order.origin_site).run().catch(() => {})

    // Forward signed webhook to partner
    await forwardWebhookToPartner(c.env.DB, order, isRazorpayOrder ? 'razorpay' : 'cashfree')

    return c.json({
      success: true,
      order_number: order.order_number,
      status: 'PAID',
      unlocked: true,
      item_id: order.item_id,
      chat_session_id: order.chat_session_id,
      amount: order.amount,
    })
  }

  return c.json({
    success: true,
    order_number: order.order_number,
    status: orderStatusString || 'PENDING',
    unlocked: false,
  })
})

// GET /api/external/stats
// Quick stats helper for the calling partner
app.get('/stats', async (c) => {
  const partner = c.get('partner')

  let statsQuery = `SELECT COUNT(*) as total_orders, SUM(CASE WHEN status = 'PAID' THEN 1 ELSE 0 END) as paid_orders, COALESCE(SUM(CASE WHEN status = 'PAID' THEN amount ELSE 0 END), 0) as total_revenue FROM external_orders`
  if (partner && partner.id > 0) {
    statsQuery += ` WHERE origin_site = '${partner.site_url}' OR origin_site LIKE '%${partner.site_url}%'`
  }

  const stats = await c.env.DB.prepare(statsQuery).first() as {
    total_orders: number
    paid_orders: number
    total_revenue: number
  } | null

  return c.json({
    total_orders: stats?.total_orders ?? 0,
    paid_orders: stats?.paid_orders ?? 0,
    total_revenue: stats?.total_revenue ?? 0,
  })
})

export default app
