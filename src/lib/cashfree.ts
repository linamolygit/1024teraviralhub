// ============================================
// src/lib/cashfree.ts — Cashfree Payment Client
// Server-side order creation + verification
// ============================================

export interface CashfreeConfig {
  appId: string
  secretKey: string
  apiUrl: string
}

export interface CreateOrderParams {
  orderId: string
  amount: number
  currency?: string
  customerName: string
  customerEmail: string
  customerPhone: string
  returnUrl: string
  notifyUrl: string
  orderMeta?: Record<string, string>
  orderNote?: string
  orderTags?: Record<string, string>
}

export interface CashfreeOrder {
  cf_order_id: string
  order_id: string
  entity: string
  order_currency: string
  order_amount: number
  order_status: string
  payment_session_id: string
  order_expiry_time: string
}

export interface CashfreePaymentStatus {
  cf_order_id: string
  order_id: string
  order_status: string
  order_amount: number
  order_currency: string
  payments?: CashfreePayment[]
}

export interface CashfreePayment {
  cf_payment_id: string
  order_id: string
  entity: string
  payment_currency: string
  payment_amount: number
  payment_time: string
  payment_status: string
  payment_method: Record<string, unknown>
  payment_group: string
  bank_reference: string
  error_details?: {
    error_code: string
    error_description: string
  }
}

export class CashfreeClient {
  private config: CashfreeConfig

  constructor(config: CashfreeConfig) {
    this.config = config
  }

  private get headers(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-api-version': '2023-08-01',
      'x-client-id': this.config.appId,
      'x-client-secret': this.config.secretKey,
    }
  }

  // Create a new Cashfree order (server-side — secret key never exposed to client)
  async createOrder(params: CreateOrderParams): Promise<CashfreeOrder> {
    const response = await fetch(`${this.config.apiUrl}/orders`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        order_id: params.orderId,
        order_amount: params.amount,
        order_currency: params.currency ?? 'INR',
        customer_details: {
          customer_id: (params.customerPhone ? `cust_${params.customerPhone}` : params.customerEmail.replace(/[^a-zA-Z0-9]/g, '_')).slice(0, 45) || `cust_${Date.now()}`,
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone,
        },
        order_meta: {
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          payment_methods: 'upi',
          ...params.orderMeta,
        },
        ...(params.orderNote ? { order_note: params.orderNote } : {}),
        ...(params.orderTags ? { order_tags: params.orderTags } : {}),
      }),
    })

    if (!response.ok) {
      const error = await response.json() as { message?: string }
      throw new Error(`Cashfree order creation failed: ${error.message ?? response.statusText}`)
    }

    return response.json() as Promise<CashfreeOrder>
  }

  // Fetch order payment status (server-side verification)
  async getOrderStatus(cashfreeOrderId: string): Promise<CashfreePaymentStatus> {
    const response = await fetch(`${this.config.apiUrl}/orders/${cashfreeOrderId}`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(`Cashfree order status fetch failed: ${response.statusText}`)
    }

    return response.json() as Promise<CashfreePaymentStatus>
  }

  // Fetch payments for an order
  async getOrderPayments(cashfreeOrderId: string): Promise<CashfreePayment[]> {
    const response = await fetch(`${this.config.apiUrl}/orders/${cashfreeOrderId}/payments`, {
      method: 'GET',
      headers: this.headers,
    })

    if (!response.ok) {
      throw new Error(`Cashfree payments fetch failed: ${response.statusText}`)
    }

    return response.json() as Promise<CashfreePayment[]>
  }

  // Create UPI payment session for direct UPI Intent / Deep links (PhonePe, GPay, Paytm)
  async createUpiPaymentSession(
    paymentSessionId: string,
    channel: 'link' | 'intent' | 'qrcode' = 'link',
    returnUrl?: string
  ): Promise<{
    cf_payment_id?: number | string
    payment_method?: string
    channel?: string
    data?: {
      payload?: {
        phonepe?: string
        gpay?: string
        paytm?: string
        bhim?: string
        default?: string
        web?: string
        qrcode?: string
      }
      link?: string
      qrcode?: string
    }
  } | null> {
    try {
      const isSandbox = this.config.apiUrl.includes('sandbox')
      const sdkPayUrl = isSandbox
        ? 'https://sandbox.cashfree.com/pg/sdk/js/pay'
        : 'https://api.cashfree.com/pg/sdk/js/pay'

      const response = await fetch(sdkPayUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'origin': 'https://1024teraviralhub.com',
          'referer': 'https://1024teraviralhub.com/',
        },
        body: JSON.stringify({
          payment_session_id: paymentSessionId,
          payment_method: {
            upi: {
              channel,
            },
          },
          platform: 'jsxx-a-2026.10.05-x-m-c-120-a-14',
          return_url: returnUrl,
        }),
      })

      if (!response.ok) {
        console.warn('Cashfree JS pay endpoint returned:', response.status, await response.text())
        return null
      }

      const resData = await response.json() as any
      const payload = resData.data?.payload || {}

      return {
        cf_payment_id: resData.cf_payment_id,
        payment_method: resData.payment_method,
        channel: resData.channel,
        data: {
          payload: {
            phonepe: payload.phonepe || payload.default,
            gpay: payload.gpay || payload.default,
            paytm: payload.paytm || payload.default,
            bhim: payload.bhim || payload.default,
            default: payload.default || payload.phonepe,
            web: payload.web,
            qrcode: payload.qrcode,
          },
          link: payload.default || payload.phonepe || payload.web,
          qrcode: payload.qrcode,
        },
      }
    } catch (err) {
      console.warn('UPI session creation fallback:', err)
      return null
    }
  }

  // Test Cashfree credentials by making a lightweight API call
  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config.appId || !this.config.secretKey) {
      return { success: false, message: 'App ID and Secret Key are required.' }
    }

    try {
      // Ping Cashfree PG API with a lightweight dummy order lookup.
      // If credentials are valid, Cashfree authenticates successfully and returns 404 (order_not_found).
      // If credentials are invalid, Cashfree returns 401/403 (authentication_failed).
      const response = await fetch(`${this.config.apiUrl}/orders/cf_ping_healthcheck`, {
        method: 'GET',
        headers: this.headers,
      })

      if (response.status === 401 || response.status === 403) {
        return { success: false, message: 'Authentication failed. Please check your Cashfree App ID and Secret Key.' }
      }

      const isSandbox = this.config.apiUrl.includes('sandbox')

      // Cashfree returns 404 (order_not_found) when credentials are valid but the ping order doesn't exist.
      // This is the expected and confirmed authentication success response from Cashfree.
      if (response.status === 404 || response.ok) {
        return {
          success: true,
          message: `Successfully connected to Cashfree PG! (${isSandbox ? 'Sandbox Mode' : 'Production Mode'})`,
        }
      }

      const errJson = (await response.json().catch(() => ({}))) as any
      const msg = errJson?.message || `Cashfree error (HTTP ${response.status})`
      return { success: false, message: msg }
    } catch (err: any) {
      return { success: false, message: `Connection error: ${err.message}` }
    }
  }

  // Verify Cashfree webhook signature
  // Cashfree uses HMAC-SHA256: timestamp + rawBody
  async verifyWebhookSignature(
    rawBody: string,
    signature: string,
    timestamp: string,
    secret: string
  ): Promise<boolean> {
    const data = timestamp + rawBody
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    )
    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    const computedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)))
    return computedSignature === signature
  }
}

let orderSeqCounter = 0

// Generate an authentic Flipkart-style, collision-proof order number (OD + 18 digits, e.g. OD328762145892019100)
export function generateOrderNumber(): string {
  const now = Date.now()
  // 11-digit timestamp slice (ticks every millisecond, collision-free for 3+ years)
  const timeSlice = now.toString().slice(-11)
  orderSeqCounter = (orderSeqCounter + 1) % 1000
  const seqStr = orderSeqCounter.toString().padStart(3, '0')
  const randStr = Math.floor(100 + Math.random() * 900).toString()
  // Flipkart convention: 'OD' + '3' (series) + 11-digit time + 3-digit sequence + 3-digit random = OD + 18 digits (20 chars)
  return `OD3${timeSlice}${seqStr}${randStr}`
}

// Validate phone number (Indian format)
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))
}
