// src/routes/admin/settings.ts
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware } from './middleware'
import { getSetting, setSetting } from '../../lib/db'
import { CashfreeClient } from '../../lib/cashfree'
import { RazorpayClient } from '../../lib/razorpay'

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
  return handleSaveSettings(c)
})

app.post('/', async (c) => {
  return handleSaveSettings(c)
})

async function handleSaveSettings(c: any) {
  try {
    const body = await c.req.json() as Record<string, unknown>
    if (!body || typeof body !== 'object') {
      return c.json({ error: 'Invalid settings body' }, 400)
    }

    const statements: D1PreparedStatement[] = []
    for (const [key, value] of Object.entries(body)) {
      if (value === undefined) continue
      const valStr = JSON.stringify(value)
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO website_settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
          ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')
        `).bind(key, valStr)
      )
    }

    if (statements.length > 0) {
      // Execute all statements atomically in a single D1 batch
      await c.env.DB.batch(statements)
    }

    return c.json({ success: true, count: statements.length })
  } catch (err: any) {
    console.error('[Settings Save Error]', err?.message, err?.stack)
    return c.json({ error: err?.message || 'Failed to save settings' }, 500)
  }
}

// ─── Payment Gateways Management ──────────────────────

function maskSecret(val?: string | null): string {
  if (!val || val.length <= 4) return ''
  return val.slice(0, 4) + '•'.repeat(Math.max(8, val.length - 8)) + val.slice(-4)
}

// GET /api/admin/settings/payment-gateways
app.get('/payment-gateways', async (c) => {
  const [
    activeGateway,
    defaultDualGateway,
    // Cashfree settings
    cfEnabled, cfMode, cfAppId, cfSecretKey, cfWebhookSecret, cfApiUrl,
    // Razorpay settings
    rzpEnabled, rzpMode, rzpKeyId, rzpKeySecret, rzpWebhookSecret,
    // UPI & UX
    upiDirect, preferredApp, guestCheckout
  ] = await Promise.all([
    getSetting<string>(c.env.DB, 'active_payment_gateway', 'cashfree'),
    getSetting<string>(c.env.DB, 'default_dual_gateway', 'cashfree'),
    getSetting<boolean>(c.env.DB, 'cashfree_enabled', true),
    getSetting<string>(c.env.DB, 'cashfree_mode', 'sandbox'),
    getSetting<string>(c.env.DB, 'cashfree_app_id', c.env.CASHFREE_APP_ID || ''),
    getSetting<string>(c.env.DB, 'cashfree_secret_key', c.env.CASHFREE_SECRET_KEY || ''),
    getSetting<string>(c.env.DB, 'cashfree_webhook_secret', c.env.CASHFREE_WEBHOOK_SECRET || ''),
    getSetting<string>(c.env.DB, 'cashfree_api_url', c.env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg'),
    getSetting<boolean>(c.env.DB, 'razorpay_enabled', false),
    getSetting<string>(c.env.DB, 'razorpay_mode', 'test'),
    getSetting<string>(c.env.DB, 'razorpay_key_id', ''),
    getSetting<string>(c.env.DB, 'razorpay_key_secret', ''),
    getSetting<string>(c.env.DB, 'razorpay_webhook_secret', ''),
    getSetting<boolean>(c.env.DB, 'upi_direct_launch', true),
    getSetting<string>(c.env.DB, 'preferred_upi_app', 'phonepe'),
    getSetting<string>(c.env.DB, 'guest_checkout_mode', 'instant'),
  ])

  const siteUrl = c.env.SITE_URL || new URL(c.req.url).origin

  return c.json({
    active_payment_gateway: activeGateway ?? 'cashfree',
    default_dual_gateway: defaultDualGateway ?? 'cashfree',
    cashfree: {
      enabled: cfEnabled ?? true,
      mode: cfMode ?? 'sandbox',
      app_id: cfAppId ?? '',
      secret_key: cfSecretKey ?? '',
      masked_secret_key: maskSecret(cfSecretKey),
      has_secret_key: Boolean(cfSecretKey && cfSecretKey.length > 0),
      webhook_secret: cfWebhookSecret ?? '',
      api_url: cfApiUrl ?? 'https://sandbox.cashfree.com/pg',
      webhook_url: `${siteUrl}/api/cashfree/webhook`,
    },
    razorpay: {
      enabled: rzpEnabled ?? false,
      mode: rzpMode ?? 'test',
      key_id: rzpKeyId ?? '',
      key_secret: rzpKeySecret ?? '',
      masked_key_secret: maskSecret(rzpKeySecret),
      has_key_secret: Boolean(rzpKeySecret && rzpKeySecret.length > 0),
      webhook_secret: rzpWebhookSecret ?? '',
      webhook_url: `${siteUrl}/api/razorpay/webhook`,
    },
    upi: {
      upi_direct_launch: upiDirect ?? true,
      preferred_upi_app: preferredApp ?? 'phonepe',
      guest_checkout_mode: guestCheckout ?? 'instant',
    },
    site_url: siteUrl,
  })
})

// POST /api/admin/settings/payment-gateways
app.post('/payment-gateways', async (c) => {
  const body = await c.req.json() as {
    active_payment_gateway?: string
    default_dual_gateway?: string
    cashfree?: {
      enabled?: boolean
      mode?: string
      app_id?: string
      secret_key?: string
      webhook_secret?: string
      api_url?: string
    }
    razorpay?: {
      enabled?: boolean
      mode?: string
      key_id?: string
      key_secret?: string
      webhook_secret?: string
    }
    upi?: {
      upi_direct_launch?: boolean
      preferred_upi_app?: string
      guest_checkout_mode?: string
    }
  }

  if (body.active_payment_gateway !== undefined) {
    await setSetting(c.env.DB, 'active_payment_gateway', body.active_payment_gateway)
  }

  if (body.default_dual_gateway !== undefined) {
    await setSetting(c.env.DB, 'default_dual_gateway', body.default_dual_gateway)
  }

  // Save Cashfree settings
  if (body.cashfree) {
    if (body.cashfree.enabled !== undefined) await setSetting(c.env.DB, 'cashfree_enabled', body.cashfree.enabled)
    if (body.cashfree.mode !== undefined) {
      await setSetting(c.env.DB, 'cashfree_mode', body.cashfree.mode)
      // Auto-set API URL if not explicitly customized
      if (!body.cashfree.api_url) {
        const defaultUrl = body.cashfree.mode === 'production' ? 'https://api.cashfree.com/pg' : 'https://sandbox.cashfree.com/pg'
        await setSetting(c.env.DB, 'cashfree_api_url', defaultUrl)
      }
    }
    if (body.cashfree.app_id !== undefined) await setSetting(c.env.DB, 'cashfree_app_id', body.cashfree.app_id.trim())
    if (body.cashfree.api_url !== undefined && body.cashfree.api_url.trim()) {
      await setSetting(c.env.DB, 'cashfree_api_url', body.cashfree.api_url.trim())
    }
    if (body.cashfree.webhook_secret !== undefined) {
      await setSetting(c.env.DB, 'cashfree_webhook_secret', body.cashfree.webhook_secret.trim())
    }
    // Only update secret key if user actually typed a new one (not masked bullet points)
    if (body.cashfree.secret_key && !body.cashfree.secret_key.includes('•')) {
      await setSetting(c.env.DB, 'cashfree_secret_key', body.cashfree.secret_key.trim())
    }
  }

  // Save Razorpay settings
  if (body.razorpay) {
    if (body.razorpay.enabled !== undefined) await setSetting(c.env.DB, 'razorpay_enabled', body.razorpay.enabled)
    if (body.razorpay.mode !== undefined) await setSetting(c.env.DB, 'razorpay_mode', body.razorpay.mode)
    if (body.razorpay.key_id !== undefined) await setSetting(c.env.DB, 'razorpay_key_id', body.razorpay.key_id.trim())
    if (body.razorpay.webhook_secret !== undefined) {
      await setSetting(c.env.DB, 'razorpay_webhook_secret', body.razorpay.webhook_secret.trim())
    }
    // Only update secret if user typed a new one (not masked)
    if (body.razorpay.key_secret && !body.razorpay.key_secret.includes('•')) {
      await setSetting(c.env.DB, 'razorpay_key_secret', body.razorpay.key_secret.trim())
    }
  }

  // Save UPI settings
  if (body.upi) {
    if (body.upi.upi_direct_launch !== undefined) await setSetting(c.env.DB, 'upi_direct_launch', body.upi.upi_direct_launch)
    if (body.upi.preferred_upi_app !== undefined) await setSetting(c.env.DB, 'preferred_upi_app', body.upi.preferred_upi_app)
    if (body.upi.guest_checkout_mode !== undefined) await setSetting(c.env.DB, 'guest_checkout_mode', body.upi.guest_checkout_mode)
  }

  return c.json({ success: true, message: 'Payment gateway configuration saved successfully.' })
})

// POST /api/admin/settings/payment-gateways/test
app.post('/payment-gateways/test', async (c) => {
  const { gateway, config } = await c.req.json() as {
    gateway: 'cashfree' | 'razorpay'
    config?: Record<string, string>
  }

  if (gateway === 'cashfree') {
    // Resolve credentials from payload or DB/env
    const appId = config?.app_id || (await getSetting<string>(c.env.DB, 'cashfree_app_id', c.env.CASHFREE_APP_ID || ''))
    let secretKey = config?.secret_key
    if (!secretKey || secretKey.includes('•')) {
      secretKey = await getSetting<string>(c.env.DB, 'cashfree_secret_key', c.env.CASHFREE_SECRET_KEY || '')
    }
    const apiUrl = config?.api_url || (await getSetting<string>(c.env.DB, 'cashfree_api_url', c.env.CASHFREE_API_URL || 'https://sandbox.cashfree.com/pg'))

    if (!appId || !secretKey) {
      return c.json({ success: false, message: 'Cashfree App ID and Secret Key are required to test.' }, 400)
    }

    const client = new CashfreeClient({ appId: appId!, secretKey: secretKey!, apiUrl: apiUrl! })
    const result = await client.testConnection()
    return c.json(result)
  }

  if (gateway === 'razorpay') {
    const keyId = config?.key_id || (await getSetting<string>(c.env.DB, 'razorpay_key_id', ''))
    let keySecret = config?.key_secret
    if (!keySecret || keySecret.includes('•')) {
      keySecret = await getSetting<string>(c.env.DB, 'razorpay_key_secret', '')
    }

    if (!keyId || !keySecret) {
      return c.json({ success: false, message: 'Razorpay Key ID and Key Secret are required to test.' }, 400)
    }

    const client = new RazorpayClient({ keyId: keyId!, keySecret: keySecret! })
    const result = await client.testConnection()
    return c.json(result)
  }

  return c.json({ success: false, message: 'Unsupported gateway' }, 400)
})

export default app

