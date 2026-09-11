// ============================================
// src/lib/razorpay.ts — Razorpay Payment Client
// Server-side order creation, status verification,
// and HMAC-SHA256 signature validation
// ============================================

export interface RazorpayConfig {
  keyId: string
  keySecret: string
}

export interface CreateRazorpayOrderParams {
  orderId: string      // Our order number (e.g. TVH-20260908-1234)
  amount: number       // In standard INR (e.g. 49 -> 4900 paise)
  currency?: string
  receipt?: string
  notes?: Record<string, string>
}

export interface RazorpayOrder {
  id: string           // e.g. order_EKwxwAgItmmXdp
  entity: string
  amount: number       // in paise
  amount_paid: number
  amount_due: number
  currency: string
  receipt: string
  status: string       // 'created' | 'attempted' | 'paid'
  created_at: number
}

export interface RazorpayPayment {
  id: string           // pay_...
  entity: string
  amount: number
  currency: string
  status: string       // 'captured' | 'authorized' | 'failed'
  order_id: string
  method: string       // 'upi' | 'card' | 'netbanking' | 'wallet'
  email?: string
  contact?: string
  error_code?: string
  error_description?: string
  created_at: number
}

export interface CreateRazorpayPaymentLinkParams {
  amount: number       // In standard INR (e.g. 49)
  currency?: string
  referenceId: string  // Our order number (e.g. EXT-XXX)
  description?: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  callbackUrl?: string
  upiLink?: boolean
  notes?: Record<string, string>
}

export interface RazorpayPaymentLink {
  id: string           // plink_...
  order_id?: string    // order_...
  short_url: string    // https://rzp.io/i/...
  status: string       // 'created' | 'paid' | 'cancelled' | 'expired'
  amount: number       // in paise
  currency: string
}

export class RazorpayClient {
  private keyId: string
  private keySecret: string
  private baseUrl = 'https://api.razorpay.com/v1'

  constructor(config: RazorpayConfig) {
    this.keyId = (config.keyId || '').trim()
    this.keySecret = (config.keySecret || '').trim()
  }

  private get authHeader(): string {
    const credentials = `${this.keyId}:${this.keySecret}`
    return `Basic ${btoa(credentials)}`
  }

  // Test credentials by making a lightweight API call
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.keyId || !this.keySecret) {
      return { success: false, message: 'Key ID and Key Secret are required.' }
    }

    try {
      const res = await fetch(`${this.baseUrl}/payments?count=1`, {
        method: 'GET',
        headers: {
          Authorization: this.authHeader,
        },
      })

      if (res.status === 401) {
        return { success: false, message: 'Authentication failed. Please verify your Razorpay Key ID and Key Secret.' }
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as any
        const msg = errorData?.error?.description || `Razorpay error (HTTP ${res.status})`
        return { success: false, message: msg }
      }

      return {
        success: true,
        message: `Successfully connected to Razorpay! (${this.keyId.startsWith('rzp_live') ? 'Live Mode' : 'Test Mode'})`,
      }
    } catch (err: any) {
      return { success: false, message: `Connection error: ${err.message}` }
    }
  }

  // Create order via Razorpay Orders API
  async createOrder(params: CreateRazorpayOrderParams): Promise<RazorpayOrder> {
    const amountInPaise = Math.round(params.amount * 100)

    const payload = {
      amount: amountInPaise,
      currency: params.currency || 'INR',
      receipt: (params.receipt || params.orderId).slice(0, 40),
      notes: {
        order_number: params.orderId,
        ...params.notes,
      },
    }

    const res = await fetch(`${this.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Razorpay Order Error]', res.status, errorText)
      throw new Error(`Razorpay order creation failed (HTTP ${res.status}): ${errorText}`)
    }

    return res.json() as Promise<RazorpayOrder>
  }

  // Fetch order status from Razorpay
  async getOrder(orderId: string): Promise<RazorpayOrder> {
    const res = await fetch(`${this.baseUrl}/orders/${orderId}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to fetch Razorpay order: ${errorText}`)
    }

    return res.json() as Promise<RazorpayOrder>
  }

  // Fetch payments for an order
  async getOrderPayments(orderId: string): Promise<{ items: RazorpayPayment[] }> {
    const res = await fetch(`${this.baseUrl}/orders/${orderId}/payments`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    })

    if (!res.ok) {
      throw new Error(`Failed to fetch Razorpay order payments (HTTP ${res.status})`)
    }

    return res.json() as Promise<{ items: RazorpayPayment[] }>
  }

  // Create hosted payment link (Direct 1-Click checkout & UPI deep link)
  async createPaymentLink(params: CreateRazorpayPaymentLinkParams): Promise<RazorpayPaymentLink> {
    const amountInPaise = Math.round(params.amount * 100)

    const basePayload: any = {
      amount: amountInPaise,
      currency: params.currency || 'INR',
      reference_id: params.referenceId.slice(0, 40),
      description: params.description || 'Digital Media License',
      customer: {
        name: params.customerName || 'Digital Media Buyer',
        email: params.customerEmail,
        contact: params.customerPhone,
      },
      notify: {
        sms: false,
        email: false,
      },
      reminder_enable: false,
      notes: {
        order_number: params.referenceId,
        store_domain: '1024teraviralhub.com',
        ...params.notes,
      },
      callback_url: params.callbackUrl,
      callback_method: 'get',
    }

    const shouldTryUpiLink = params.upiLink ?? this.keyId.startsWith('rzp_live')

    // 1. Try dedicated UPI Payment Link (Live Mode / Explicit) for direct mobile UPI Intent without popup
    if (shouldTryUpiLink) {
      try {
        const upiPayload = {
          ...basePayload,
          upi_link: true,
        }

        const upiRes = await fetch(`${this.baseUrl}/payment_links`, {
          method: 'POST',
          headers: {
            Authorization: this.authHeader,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(upiPayload),
        })

        if (upiRes.ok) {
          return await upiRes.json() as RazorpayPaymentLink
        }

        const upiErrText = await upiRes.text()
        console.warn('[Razorpay UPI Link Fallback] Could not create upi_link, falling back to standard link:', upiRes.status, upiErrText)
      } catch (upiErr) {
        console.warn('[Razorpay UPI Link Fallback] Network error on upi_link creation:', upiErr)
      }
    }

    // 2. Standard Payment Link Fallback
    const standardPayload = {
      ...basePayload,
      accept_partial: false,
      options: {
        checkout: {
          name: '1024TeraViralHub',
          theme: {
            color: '#1E50D8',
          },
          method: {
            upi: true,
            card: true,
            netbanking: false,
            wallet: false,
          },
        },
      },
    }

    const res = await fetch(`${this.baseUrl}/payment_links`, {
      method: 'POST',
      headers: {
        Authorization: this.authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(standardPayload),
    })

    if (!res.ok) {
      const errorText = await res.text()
      console.error('[Razorpay Payment Link Error]', res.status, errorText)
      throw new Error(`Razorpay payment link failed (HTTP ${res.status}): ${errorText}`)
    }

    return res.json() as Promise<RazorpayPaymentLink>
  }

  // Fetch payment link status
  async getPaymentLink(linkId: string): Promise<RazorpayPaymentLink> {
    const res = await fetch(`${this.baseUrl}/payment_links/${linkId}`, {
      method: 'GET',
      headers: {
        Authorization: this.authHeader,
      },
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`Failed to fetch Razorpay payment link: ${errorText}`)
    }

    return res.json() as Promise<RazorpayPaymentLink>
  }

  // Validate webhook signature using HMAC-SHA256
  async verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): Promise<boolean> {
    if (!signature || !webhookSecret) return false

    try {
      const encoder = new TextEncoder()
      const keyData = encoder.encode(webhookSecret)
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(rawBody)
      )

      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      return expectedSignature === signature.toLowerCase().trim()
    } catch (e) {
      console.error('[Razorpay Signature Error]', e)
      return false
    }
  }

  // Validate payment signature returned by Razorpay Checkout modal
  async verifyPaymentSignature(params: {
    orderId: string
    paymentId: string
    signature: string
  }): Promise<boolean> {
    const { orderId, paymentId, signature } = params
    if (!orderId || !paymentId || !signature) return false

    try {
      const payload = `${orderId}|${paymentId}`
      const encoder = new TextEncoder()
      const keyData = encoder.encode(this.keySecret)
      const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      )

      const signatureBytes = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(payload)
      )

      const expectedSignature = Array.from(new Uint8Array(signatureBytes))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')

      return expectedSignature === signature.toLowerCase().trim()
    } catch (e) {
      console.error('[Razorpay Payment Signature Error]', e)
      return false
    }
  }
}
