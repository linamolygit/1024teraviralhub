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
          customer_id: params.customerEmail.replace(/[^a-zA-Z0-9]/g, '_'),
          customer_name: params.customerName,
          customer_email: params.customerEmail,
          customer_phone: params.customerPhone,
        },
        order_meta: {
          return_url: params.returnUrl,
          notify_url: params.notifyUrl,
          ...params.orderMeta,
        },
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
    channel: 'link' | 'intent' | 'qrcode' = 'link'
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
      }
      link?: string
      qrcode?: string
    }
  } | null> {
    try {
      const response = await fetch(`${this.config.apiUrl}/orders/sessions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          payment_session_id: paymentSessionId,
          payment_method: {
            upi: {
              channel,
            },
          },
        }),
      })

      if (!response.ok) {
        return null
      }

      return response.json()
    } catch (err) {
      console.warn('UPI session creation fallback:', err)
      return null
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

// Generate a unique order number
export function generateOrderNumber(): string {
  const date = new Date()
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.floor(Math.random() * 9999).toString().padStart(4, '0')
  return `TVH-${dateStr}-${random}`
}

// Validate phone number (Indian format)
export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone.replace(/\s+/g, ''))
}
