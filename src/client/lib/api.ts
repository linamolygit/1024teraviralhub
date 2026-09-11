// ============================================
// src/client/lib/api.ts — API Client
// ============================================

const BASE = '/api'

async function req<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json', ...opts?.headers },
    ...opts,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string }
    throw new Error(err.error ?? `HTTP ${res.status}`)
  }
  return res.json() as Promise<T>
}

// Authed admin request
async function adminReq<T>(url: string, token: string, opts?: RequestInit): Promise<T> {
  return req<T>(url, {
    ...opts,
    headers: {
      Authorization: `Bearer ${token}`,
      ...opts?.headers,
    },
  })
}

// ─── Public API ──────────────────────────

export const api = {
  products: {
    list: (params?: { category?: string; featured?: boolean; q?: string; sort?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.category) q.set('category', params.category)
      if (params?.featured) q.set('featured', 'true')
      if (params?.q) q.set('q', params.q)
      if (params?.sort) q.set('sort', params.sort)
      if (params?.limit) q.set('limit', params.limit.toString())
      if (params?.offset) q.set('offset', params.offset.toString())
      return req<{ products: Product[]; total: number }>(`/products?${q}`)
    },
    get: (slug: string) => req<ProductDetail>(`/products/${slug}`),
  },

  categories: {
    list: () => req<{ categories: Category[] }>('/categories'),
  },

  blog: {
    list: (params?: { limit?: number; offset?: number; category?: string; q?: string }) => {
      const q = new URLSearchParams()
      if (params?.limit) q.set('limit', params.limit.toString())
      if (params?.offset) q.set('offset', params.offset.toString())
      if (params?.category) q.set('category', params.category)
      if (params?.q) q.set('q', params.q)
      return req<{ posts: BlogPost[]; total: number; hasMore?: boolean }>(`/blog?${q}`)
    },
    categories: () =>
      req<{ categories: Array<{ id: number; name: string; slug: string; post_count: number }> }>('/blog/categories'),
    get: (slug: string) => req<{ post: BlogPost; related_posts?: BlogPost[] }>(`/blog/${slug}`),
  },

  checkout: {
    create: (data: {
      product_id: number
      customer_name?: string
      customer_email?: string
      customer_phone?: string
      preferred_gateway?: 'cashfree' | 'razorpay'
      utm_source?: string
      utm_medium?: string
      utm_campaign?: string
      referrer_url?: string
    }) => req<{
      success: boolean
      gateway?: 'cashfree' | 'razorpay' | string
      order_number: string
      payment_session_id?: string
      amount: number
      currency?: string
      razorpay_key_id?: string
      razorpay_order_id?: string
      razorpay_payment_link_id?: string | null
      payment_url?: string | null
      customer_name?: string
      customer_email?: string
      customer_phone?: string
      upi_intent?: {
        phonepe?: string
        gpay?: string
        paytm?: string
        bhim?: string
        default?: string
      } | null
      upi_link?: string | null
      upi_qrcode?: string | null
    }>('/checkout/create', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    verify: (orderNumber: string) =>
      req<{ success: boolean; status: string; download_token?: string }>(`/checkout/verify/${orderNumber}`),
    getOrder: (orderNumber: string) =>
      req<{
        order_number: string
        status: string
        amount: number
        currency: string
        customer_name?: string
        customer_email?: string
        customer_phone?: string
        payment_session_id?: string
        created_at: string
        product: {
          id: number
          title: string
          slug: string
          price: number
          sale_price?: number | null
          file_count: number
          file_type?: string | null
          access_duration_hours: number
          download_limit: number
          thumbnail_url?: string | null
        }
      }>(`/checkout/order/${orderNumber}`),
  },

  share: {
    create: (params: { product_id?: number; slug?: string; created_by?: string }) =>
      req<{
        success: boolean
        uid: string
        share_url: string
        product_slug: string
        title: string
      }>('/share/create', {
        method: 'POST',
        body: JSON.stringify(params),
      }),
    getByUid: (uid: string) =>
      req<{
        success: boolean
        uid: string
        product: {
          id: number
          title: string
          slug: string
          price: number
          sale_price?: number | null
          currency: string
          thumbnail_key?: string | null
          video_url?: string | null
          short_description?: string | null
        }
        destination_url: string
      }>(`/share/${encodeURIComponent(uid)}`),
  },

  settings: {
    getPublic: () => req<{
      upi_direct_launch: boolean
      preferred_upi_app: string
      guest_checkout_mode: string
      announcement_text: string
      site_name?: string
      site_url?: string
      support_email?: string
      site_tagline?: string
      currency_symbol?: string
      site_theme?: string
      show_seed_reviews?: boolean
      active_payment_gateway?: 'cashfree' | 'razorpay' | 'auto' | 'offline' | string
      cashfree_mode?: 'sandbox' | 'production'
      razorpay_mode?: 'test' | 'live'
      razorpay_key_id?: string
      // Google Services & Monetization
      gsc_enabled?: boolean
      gsc_verification_tag?: string
      ga4_enabled?: boolean
      ga4_measurement_id?: string
      ga4_ecommerce_tracking?: boolean
      adsense_enabled?: boolean
      adsense_publisher_id?: string
      adsense_auto_ads?: boolean
      adsense_head_code?: string
      adx_enabled?: boolean
      adx_network_code?: string
      adx_head_code?: string
    }>('/settings/public'),
  },

  coupons: {
    validate: (code: string, amount: number) =>
      req<{
        valid: boolean
        code: string
        discount_type: 'percent' | 'fixed'
        discount_value: number
        discount_amount: number
        final_amount: number
      }>('/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code, amount }),
      }),
  },

  reviews: {
    getByProduct: (productId: number) =>
      req<{ reviews: Review[]; total: number; average_rating: number }>(`/reviews/product/${productId}`),
    submit: (data: { product_id: number; customer_name: string; rating: number; comment: string; order_number?: string }) =>
      req<{ success: boolean; id: number; is_verified_purchase: boolean }>('/reviews', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
  },

  download: {
    verify: (token: string) => req<DownloadPageData>(`/download/${token}`),
    getPurchases: (params?: { tokens?: string; email?: string; order?: string; orders?: string }) => {
      const q = new URLSearchParams()
      if (params?.tokens) q.set('tokens', params.tokens)
      if (params?.email) q.set('email', params.email)
      if (params?.order) q.set('order', params.order)
      if (params?.orders) q.set('orders', params.orders)
      const qs = q.toString()
      return req<{
        active: PurchasedDownloadItem[]
        expired: PurchasedDownloadItem[]
      }>(`/download/purchases/access${qs ? `?${qs}` : ''}`)
    },
  },

  orderLookup: (
    orderOrParams: string | { order?: string; phone?: string; email?: string; q?: string },
    orderOrEmail2?: string
  ) => {
    let order = ''
    let email = ''
    let phone = ''
    let qStr = ''

    if (typeof orderOrParams === 'string') {
      if (orderOrEmail2) {
        if (orderOrParams.includes('@')) {
          email = orderOrParams
          order = orderOrEmail2
        } else {
          order = orderOrParams
          email = orderOrEmail2
        }
      } else {
        order = orderOrParams
      }
    } else if (orderOrParams && typeof orderOrParams === 'object') {
      order = orderOrParams.order || ''
      email = orderOrParams.email || ''
      phone = orderOrParams.phone || ''
      qStr = orderOrParams.q || ''
    }

    const params = new URLSearchParams()
    if (order && order.trim()) params.set('order', order.trim())
    if (email && email.trim()) params.set('email', email.trim())
    if (phone && phone.trim()) params.set('phone', phone.trim())
    if (qStr && qStr.trim()) params.set('q', qStr.trim())
    return req<OrderLookupResult>(`/order-lookup?${params.toString()}`)
  },

  search: (q: string) => req<{ products: Product[]; posts: BlogPost[] }>(`/search?q=${encodeURIComponent(q)}`),

  contact: (data: { name: string; email: string; inquiry_type?: string; order_reference?: string; subject?: string; message: string }) =>
    req<{ success: boolean; message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  analytics: (event: { event_type: string; product_id?: number; utm_source?: string; utm_medium?: string; utm_campaign?: string }) =>
    req('/analytics/event', { method: 'POST', body: JSON.stringify(event) }).catch(() => {}),

  ads: {
    getActive: () => req<ActiveAdsResponse>('/ads/active'),
  },
}

// ─── Admin API ───────────────────────────

export const adminApi = {
  auth: {
    me: (token: string) => adminReq<{ admin: AdminUser }>('/admin/auth/me', token),
    setup: (data: { firebase_uid: string; email: string; name?: string; secret: string }) =>
      req<{ success: boolean }>('/admin/auth/setup', { method: 'POST', body: JSON.stringify(data) }),
  },

  products: {
    list: (token: string, params?: { limit?: number; offset?: number; search?: string }) => {
      const q = new URLSearchParams()
      if (params?.limit) q.set('limit', params.limit.toString())
      if (params?.search) q.set('search', params.search)
      return adminReq<{ products: Product[]; total: number }>(`/admin/products?${q}`, token)
    },
    get: (token: string, id: number) =>
      adminReq<{ product: Product; images: ProductImage[]; files: ProductFile[] }>(`/admin/products/${id}`, token),
    create: (token: string, data: Partial<Product>) =>
      adminReq<{ success: boolean; id: number }>('/admin/products', token, {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (token: string, id: number, data: Partial<Product>) =>
      adminReq<{ success: boolean }>(`/admin/products/${id}`, token, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/products/${id}`, token, { method: 'DELETE' }),
    uploadImage: (
      token: string,
      id: number,
      file: File,
      thumbnail = false,
      variants?: { thumb?: Blob; medium?: Blob; large?: Blob; blurDataUrl?: string }
    ) => {
      const form = new FormData()
      form.append('file', file)
      if (thumbnail) form.append('thumbnail', 'true')
      if (variants?.thumb) form.append('thumb', variants.thumb, 'thumb.webp')
      if (variants?.medium) form.append('medium', variants.medium, 'medium.webp')
      if (variants?.large) form.append('large', variants.large, 'large.webp')
      if (variants?.blurDataUrl) form.append('blur_data_url', variants.blurDataUrl)
      return adminReq<{ success: boolean; id: number; url: string; deduplicated?: boolean; bytes_saved?: number; message?: string }>(`/admin/products/${id}/upload-image`, token, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as HeadersInit,
        body: form,
      })
    },
    checkDedup: (token: string, hashes: string[]) =>
      adminReq<{ success: boolean; matches: Record<string, any> }>('/admin/products/check-dedup', token, {
        method: 'POST',
        body: JSON.stringify({ hashes }),
      }),
    getMediaLibrary: (token: string, params?: { q?: string; limit?: number; offset?: number; type?: 'image' | 'video' | 'all' }) => {
      const sp = new URLSearchParams()
      if (params?.q) sp.set('q', params.q)
      if (params?.limit) sp.set('limit', params.limit.toString())
      if (params?.offset) sp.set('offset', params.offset.toString())
      if (params?.type && params.type !== 'all') sp.set('type', params.type)
      const qs = sp.toString() ? `?${sp.toString()}` : ''
      return adminReq<{
        success: boolean
        assets: Array<{
          id: number
          content_hash: string
          r2_key: string
          url: string
          thumb_url: string
          original_filename: string
          file_size: number
          mime_type: string
          reference_count: number
          created_at: string
        }>
        total: number
      }>(`/admin/products/media-library${qs}`, token)
    },
    attachExistingImage: (
      token: string,
      productId: number,
      data: { r2_key: string; content_hash?: string; alt_text?: string; is_thumbnail?: boolean }
    ) =>
      adminReq<{
        success: boolean
        id: number
        key: string
        url: string
        already_attached?: boolean
        message?: string
      }>(`/admin/products/${productId}/attach-existing-image`, token, {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    attachVariants: (token: string, imageId: number, variants: { thumb?: Blob; medium?: Blob; large?: Blob }) => {
      const form = new FormData()
      if (variants.thumb) form.append('thumb', variants.thumb, 'thumb.webp')
      if (variants.medium) form.append('medium', variants.medium, 'medium.webp')
      if (variants.large) form.append('large', variants.large, 'large.webp')
      return adminReq<{ success: boolean }>(`/admin/products/images/${imageId}/variants`, token, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as HeadersInit,
        body: form,
      })
    },
    deleteImage: (token: string, productId: number, imageId: number) =>
      adminReq<{ success: boolean; r2_retained?: boolean }>(`/admin/products/${productId}/images/${imageId}`, token, { method: 'DELETE' }),
    setThumbnail: (token: string, productId: number, imageId: number) =>
      adminReq<{ success: boolean }>(`/admin/products/${productId}/images/${imageId}/thumbnail`, token, { method: 'PUT' }),
    uploadFile: (token: string, id: number, file: File) => {
      const form = new FormData()
      form.append('file', file)
      return adminReq<{ success: boolean; id: number; deduplicated?: boolean; bytes_saved?: number; message?: string }>(`/admin/products/${id}/upload-file`, token, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as HeadersInit,
        body: form,
      })
    },
    uploadVideo: (token: string, file: File, liteFile?: File) => {
      const form = new FormData()
      form.append('file', file)
      if (liteFile) {
        form.append('lite_file', liteFile)
      }
      return adminReq<{
        success: boolean
        url: string
        lite_url?: string
        key: string
        lite_key?: string
        file_size: number
        lite_size?: number
        deduplicated?: boolean
        message?: string
      }>('/admin/products/upload-video', token, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as HeadersInit,
        body: form,
      })
    },
  },

  ai: {
    generateProduct: (token: string, payload: { prompt?: string; title?: string; category_name?: string; file_type?: string; apiKey?: string }) =>
      adminReq<{
        success: boolean
        data: {
          title: string
          slug: string
          short_description: string
          description: string
          suggested_price: number
          suggested_sale_price?: number
          tags: string[]
          meta_title?: string
          meta_description?: string
          is_fallback?: boolean
        }
        source?: string
        note?: string
      }>('/admin/ai/generate-product', token, {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    enhanceText: (token: string, text: string, type?: string) =>
      adminReq<{ success: boolean; text: string }>('/admin/ai/enhance-text', token, {
        method: 'POST',
        body: JSON.stringify({ text, type }),
      }),
    testKey: (token: string, apiKey: string) =>
      adminReq<{ success: boolean; message?: string; error?: string; status?: number; details?: string }>('/admin/ai/test-key', token, {
        method: 'POST',
        body: JSON.stringify({ apiKey }),
      }),
  },

  orders: {
    list: (token: string, params?: { status?: string; limit?: number; offset?: number; search?: string; sort?: string; date_range?: string }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.limit) q.set('limit', params.limit.toString())
      if (params?.offset) q.set('offset', params.offset.toString())
      if (params?.search) q.set('search', params.search)
      if (params?.sort) q.set('sort', params.sort)
      if (params?.date_range) q.set('date_range', params.date_range)
      return adminReq<{
        orders: Order[]
        total: number
        stats?: {
          total_orders: number
          total_revenue: number
          paid_count: number
          pending_count: number
          failed_count: number
        }
      }>(`/admin/orders?${q}`, token)
    },
    get: (token: string, id: string | number) =>
      adminReq<OrderDetail>(`/admin/orders/${id}`, token),
  },

  analytics: {
    get: (token: string, period?: string) => adminReq<AnalyticsData>(`/admin/analytics${period ? `?period=${period}` : ''}`, token),
  },

  settings: {
    get: (token: string) => adminReq<{ settings: Record<string, unknown> }>('/admin/settings', token),
    update: (token: string, data: Record<string, unknown>) =>
      adminReq<{ success: boolean }>('/admin/settings', token, {
        method: 'PUT', body: JSON.stringify(data),
      }),
  },

  paymentGateways: {
    get: (token: string) => adminReq<PaymentGatewaysConfig>('/admin/settings/payment-gateways', token),
    update: (token: string, data: PaymentGatewaysConfigUpdate) =>
      adminReq<{ success: boolean; message: string }>('/admin/settings/payment-gateways', token, {
        method: 'POST', body: JSON.stringify(data),
      }),
    test: (token: string, gateway: 'cashfree' | 'razorpay', config?: Record<string, string>) =>
      adminReq<{ success: boolean; message: string; details?: unknown }>('/admin/settings/payment-gateways/test', token, {
        method: 'POST', body: JSON.stringify({ gateway, config }),
      }),
  },

  downloads: {
    list: (token: string) => adminReq<{ logs: DownloadLog[]; suspicious_ips: unknown[] }>('/admin/downloads', token),
  },

  blog: {
    list: (token: string) => adminReq<{ posts: BlogPost[] }>('/admin/blog', token),
    create: (token: string, data: Partial<BlogPost>) =>
      adminReq<{ success: boolean; id: number }>('/admin/blog', token, {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (token: string, id: number, data: Partial<BlogPost>) =>
      adminReq<{ success: boolean }>(`/admin/blog/${id}`, token, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/blog/${id}`, token, { method: 'DELETE' }),
  },

  audit: {
    list: (token: string) => adminReq<{ logs: AuditLog[]; total: number }>('/admin/audit', token),
  },

  coupons: {
    list: (token: string) => adminReq<{ coupons: Coupon[] }>('/admin/coupons', token),
    create: (token: string, data: Partial<Coupon>) =>
      adminReq<{ success: boolean; id: number }>('/admin/coupons', token, {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (token: string, id: number, data: Partial<Coupon>) =>
      adminReq<{ success: boolean }>(`/admin/coupons/${id}`, token, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/coupons/${id}`, token, { method: 'DELETE' }),
  },

  reviews: {
    list: (token: string) => adminReq<{ reviews: Review[] }>('/admin/reviews', token),
    approve: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/reviews/${id}/approve`, token, { method: 'PUT' }),
    delete: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/reviews/${id}`, token, { method: 'DELETE' }),
  },

  users: {
    list: (token: string) => adminReq<{ users: AdminStaffUser[] }>('/admin/users', token),
    create: (token: string, data: { firebase_uid: string; email: string; name?: string; role: string }) =>
      adminReq<{ success: boolean; id: number }>('/admin/users', token, {
        method: 'POST', body: JSON.stringify(data),
      }),
    update: (token: string, id: number, data: { name?: string; role?: string; is_active?: boolean }) =>
      adminReq<{ success: boolean }>(`/admin/users/${id}`, token, {
        method: 'PUT', body: JSON.stringify(data),
      }),
    delete: (token: string, id: number) =>
      adminReq<{ success: boolean }>(`/admin/users/${id}`, token, { method: 'DELETE' }),
  },

  customers: {
    list: (token: string, params?: { search?: string; type?: string; limit?: number; offset?: number }) => {
      const q = new URLSearchParams()
      if (params?.search) q.set('search', params.search)
      if (params?.type) q.set('type', params.type)
      if (params?.limit) q.set('limit', params.limit.toString())
      if (params?.offset) q.set('offset', params.offset.toString())
      return adminReq<{
        customers: CustomerSummary[]
        total: number
        stats: {
          total_customers: number
          guest_buyers: number
          paying_customers: number
          total_spent_all: number
        }
      }>(`/admin/customers?${q}`, token)
    },
    get: (token: string, email: string) =>
      adminReq<{
        customer: CustomerSummary
        orders: Order[]
        download_tokens: Array<DownloadToken & { order_number: string; product_title?: string }>
      }>(`/admin/customers/${encodeURIComponent(email)}`, token),
  },

  ads: {
    overview: (token: string) =>
      adminReq<{
        metrics: {
          active_networks: number
          active_placements: number
          active_campaigns: number
          total_impressions: number
          total_clicks: number
          estimated_revenue: number
          estimated_rpm: number
        }
        networks: AdNetwork[]
        placements: AdPlacement[]
        campaigns: AdCampaign[]
      }>('/admin/ads/overview', token),

    networks: {
      list: (token: string) => adminReq<{ networks: AdNetwork[] }>('/admin/ads/networks', token),
      create: (token: string, data: Partial<AdNetwork>) =>
        adminReq<{ success: boolean; id: number }>('/admin/ads/networks', token, {
          method: 'POST', body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<AdNetwork>) =>
        adminReq<{ success: boolean }>(`/admin/ads/networks/${id}`, token, {
          method: 'PUT', body: JSON.stringify(data),
        }),
      delete: (token: string, id: number) =>
        adminReq<{ success: boolean }>(`/admin/ads/networks/${id}`, token, { method: 'DELETE' }),
    },

    placements: {
      list: (token: string) => adminReq<{ placements: AdPlacement[] }>('/admin/ads/placements', token),
      create: (token: string, data: Partial<AdPlacement>) =>
        adminReq<{ success: boolean; id: number }>('/admin/ads/placements', token, {
          method: 'POST', body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<AdPlacement>) =>
        adminReq<{ success: boolean }>(`/admin/ads/placements/${id}`, token, {
          method: 'PUT', body: JSON.stringify(data),
        }),
      delete: (token: string, id: number) =>
        adminReq<{ success: boolean }>(`/admin/ads/placements/${id}`, token, { method: 'DELETE' }),
    },

    campaigns: {
      list: (token: string) => adminReq<{ campaigns: AdCampaign[] }>('/admin/ads/campaigns', token),
      create: (token: string, data: Partial<AdCampaign>) =>
        adminReq<{ success: boolean; id: number }>('/admin/ads/campaigns', token, {
          method: 'POST', body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<AdCampaign>) =>
        adminReq<{ success: boolean }>(`/admin/ads/campaigns/${id}`, token, {
          method: 'PUT', body: JSON.stringify(data),
        }),
      delete: (token: string, id: number) =>
        adminReq<{ success: boolean }>(`/admin/ads/campaigns/${id}`, token, { method: 'DELETE' }),
    },

    rules: {
      get: (token: string) => adminReq<{ rules: AdRules }>('/admin/ads/rules', token),
      update: (token: string, data: Partial<AdRules>) =>
        adminReq<{ success: boolean }>('/admin/ads/rules', token, {
          method: 'PUT', body: JSON.stringify(data),
        }),
    },
  },

  gateways: {
    stats: (token: string) =>
      adminReq<{
        total_partners: number
        active_partners: number
        total_orders: number
        paid_orders: number
        total_revenue: number
        global_enabled: boolean
        stealth_mode_active: boolean
      }>('/admin/gateways/stats', token),
    toggleGlobal: (token: string, enabled: boolean) =>
      adminReq<{ success: boolean; enabled: boolean }>('/admin/gateways/toggle-global', token, {
        method: 'POST', body: JSON.stringify({ enabled }),
      }),
    partners: {
      list: (token: string) =>
        adminReq<{ partners: ExternalPartner[] }>('/admin/gateways/partners', token),
      create: (token: string, data: { site_name: string; site_url: string; webhook_url?: string; notes?: string }) =>
        adminReq<{ success: boolean; partner: ExternalPartner }>('/admin/gateways/partners', token, {
          method: 'POST', body: JSON.stringify(data),
        }),
      update: (token: string, id: number, data: Partial<ExternalPartner>) =>
        adminReq<{ success: boolean; partner: ExternalPartner }>(`/admin/gateways/partners/${id}`, token, {
          method: 'PUT', body: JSON.stringify(data),
        }),
      regenerateKey: (token: string, id: number) =>
        adminReq<{ success: boolean; api_key: string }>(`/admin/gateways/partners/${id}/regenerate-key`, token, {
          method: 'POST',
        }),
      delete: (token: string, id: number) =>
        adminReq<{ success: boolean }>(`/admin/gateways/partners/${id}`, token, {
          method: 'DELETE',
        }),
    },
    transactions: (token: string, params?: { status?: string; partner_id?: string; limit?: number }) => {
      const q = new URLSearchParams()
      if (params?.status) q.set('status', params.status)
      if (params?.partner_id) q.set('partner_id', params.partner_id)
      if (params?.limit) q.set('limit', params.limit.toString())
      return adminReq<{ transactions: ExternalTransaction[] }>(`/admin/gateways/transactions?${q}`, token)
    },
  },

  media: {
    list: (token: string, params?: { q?: string; filter?: string; type?: string; sort?: string; limit?: number; offset?: number }) => {
      const sp = new URLSearchParams()
      if (params?.q) sp.set('q', params.q)
      if (params?.filter) sp.set('filter', params.filter)
      if (params?.type) sp.set('type', params.type)
      if (params?.sort) sp.set('sort', params.sort)
      if (params?.limit) sp.set('limit', params.limit.toString())
      if (params?.offset) sp.set('offset', params.offset.toString())
      const qs = sp.toString() ? `?${sp.toString()}` : ''
      return adminReq<AdminMediaListResponse>(`/admin/media${qs}`, token)
    },
    upload: (token: string, file: File, variants?: { thumb?: Blob; medium?: Blob; large?: Blob }) => {
      const form = new FormData()
      form.append('file', file)
      if (variants?.thumb) form.append('thumb', variants.thumb, 'thumb.webp')
      if (variants?.medium) form.append('medium', variants.medium, 'medium.webp')
      if (variants?.large) form.append('large', variants.large, 'large.webp')
      return adminReq<AdminMediaUploadResponse>('/admin/media/upload', token, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` } as HeadersInit,
        body: form,
      })
    },
    delete: (token: string, id: number, force = false) => {
      const qs = force ? '?force=true' : ''
      return adminReq<{ success: boolean; deleted_key?: string; message?: string }>(`/admin/media/${id}${qs}`, token, {
        method: 'DELETE',
      })
    },
    syncSizes: (token: string) =>
      adminReq<{ success: boolean; updated_count: number; duplicates_merged?: number; bytes_saved?: number; message: string }>('/admin/media/sync-sizes', token, {
        method: 'POST',
      }),
  },
}

export interface AdminMediaAsset {
  id: number
  content_hash: string
  r2_key: string
  original_filename: string
  file_size: number
  mime_type: string
  reference_count: number
  created_at: string
  updated_at?: string
  url: string
  thumb_url: string
  medium_url: string
  large_url: string
  is_video?: boolean
  products_linked: Array<{
    id: number
    title: string
    slug: string
    is_thumbnail: boolean
    link_type?: string
  }>
  live_reference_count: number
}

export interface AdminMediaMetrics {
  total_assets: number
  total_size_bytes: number
  storage_saved_bytes: number
  total_references: number
  total_images?: number
  total_videos?: number
  duplicates_prevented?: number
}

export interface AdminMediaListResponse {
  success: boolean
  assets: AdminMediaAsset[]
  total: number
  metrics: AdminMediaMetrics
}

export interface AdminMediaUploadResponse {
  success: boolean
  deduplicated: boolean
  asset: AdminMediaAsset
  bytes_saved: number
  message: string
}

export interface ExternalPartner {
  id: number
  partner_id: string
  site_name: string
  site_url: string
  api_key: string
  webhook_url?: string
  status: 'active' | 'paused'
  total_orders: number
  paid_orders: number
  total_revenue: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface ExternalTransaction {
  id: number
  order_number: string
  origin_site: string
  item_id: string
  item_name?: string
  chat_session_id?: string
  amount: number
  currency: string
  status: 'PENDING' | 'PAID' | 'FAILED'
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  phonepe_deep_link?: string
  return_url?: string
  webhook_url?: string
  webhook_delivered?: number
  webhook_response?: string
  created_at: string
}

export interface Coupon {
  id: number
  code: string
  discount_type: 'percent' | 'fixed'
  discount_value: number
  min_spend: number
  max_uses: number
  used_count: number
  expires_at: string | null
  is_active: number | boolean
  created_at: string
}

export interface Review {
  id: number
  product_id: number
  product_title?: string
  product_slug?: string
  customer_name: string
  rating: number
  comment: string
  is_verified_purchase: number
  is_approved: number
  created_at: string
}

export interface AdminStaffUser {
  id: number
  firebase_uid: string
  email: string
  name: string | null
  role: 'super_admin' | 'admin' | 'content_manager' | 'support_manager'
  is_active: number
  last_login: string | null
  created_at: string
}

// ─── Types ───────────────────────────────

export interface Product {
  id: number
  slug: string
  title: string
  description: string
  short_description: string
  category_id: number
  category_name?: string
  category_slug?: string
  price: number
  sale_price: number | null
  effective_price?: number
  currency: string
  is_published: number | boolean
  is_featured: number | boolean
  tags: string | string[] | null
  file_type: string
  file_count: number
  total_file_size: number | null
  license_type: string
  license_info?: string | null
  usage_instructions?: string | null
  button_text?: string | null
  google_drive_link?: string | null
  video_url?: string | null
  meta_title?: string | null
  meta_description?: string | null
  download_limit: number
  access_duration_hours: number
  total_sales: number
  total_revenue: number
  view_count: number
  thumbnail_url?: string | null
  reviews_count?: number
  average_rating?: number | null
  created_at: string
  updated_at: string
}

export interface ProductDetail extends Product {
  images: ProductImage[]
  files: ProductFile[]
  related: Partial<Product>[]
}

export interface ProductImage {
  id: number
  product_id: number
  r2_key: string
  url: string
  alt_text: string | null
  is_thumbnail: number
  sort_order: number
}

export interface ProductFile {
  id: number
  product_id: number
  original_filename: string
  file_size: number | null
  file_type: string | null
  sort_order: number
}

export interface Category {
  id: number
  name: string
  slug: string
  description: string | null
  icon: string | null
  product_count: number
}

export interface BlogPost {
  id: number
  slug: string
  title: string
  content: string
  excerpt: string | null
  author_name: string
  category_id?: number | null
  category_name?: string | null
  category_slug?: string | null
  thumbnail_key: string | null
  is_published: number
  is_featured: number
  view_count: number
  meta_title: string | null
  meta_description: string | null
  tags: string | null
  published_at: string | null
  created_at: string
}

export interface Order {
  id: number
  order_number: string
  product_id: number
  product_title?: string
  customer_name: string
  customer_email: string
  customer_phone: string | null
  amount: number
  currency: string
  status: string
  cashfree_order_id: string
  created_at: string
}

export interface OrderDetail {
  order: Order
  payments: Payment[]
  download_token: DownloadToken | null
  download_logs: DownloadLog[]
}

export interface Payment {
  id: number
  cashfree_payment_id: string
  status: string
  amount: number
  payment_method: string | null
  error_code: string | null
  created_at: string
}

export interface DownloadToken {
  id: number
  token: string
  expires_at: string
  download_count: number
  max_downloads: number
}

export interface DownloadPageData {
  valid: boolean
  reason?: string
  expires_at?: string
  download_count?: number
  max_downloads?: number
  remaining_downloads?: number
  google_drive_link?: string | null
  order?: { customer_name: string; customer_email: string; order_number: string; amount: number }
  files?: DownloadFile[]
}

export interface DownloadFile {
  id: number
  filename: string
  size: number | null
  type: string | null
  product?: string
  download_url: string
}

export interface PurchasedDownloadItem {
  token: string
  order_number: string
  customer_name?: string
  amount?: number
  product: {
    id: number
    title: string
    slug: string
    file_count: number
    file_type: string | null
    thumbnail_url: string | null
  }
  google_drive_link?: string | null
  purchased_at: string
  expires_at: string
  download_count: number
  max_downloads: number
  remaining_downloads: number
  status: 'ACTIVE' | 'EXPIRED' | 'LIMIT_REACHED' | 'REVOKED'
  files: DownloadFile[]
}

export interface OrderLookupResult {
  order_number: string
  status: string
  amount: number
  original_price?: number
  sale_price?: number
  product: string
  created_at: string
  download_token: string | null
  download_expired: boolean
}

export interface AdminUser {
  firebase_uid: string
  email: string
  name: string | null
  role: string
  last_login: string | null
  created_at: string
}

export interface AnalyticsData {
  revenue: { total: number; today: number; week: number; month: number }
  orders: { total: number; paid: number; failed: number; pending: number }
  active_products?: number
  conversion: {
    product_views: number
    checkout_starts: number
    purchases: number
    checkout_rate: number
    purchase_rate: number
  }
  top_products: Array<{ title: string; slug: string; total_sales: number; total_revenue: number }>
  daily_revenue: Array<{ day: string; revenue: number; orders: number }>
  recent_orders: Order[]
  period?: string
  live_visitors?: number
  traffic?: {
    total_visitors: number
    total_pageviews: number
    new_visitors: number
    returning_visitors: number
    new_visitor_pct: number
    avg_dwell_seconds: number
    dwell_time_formatted: string
    total_clicks: number
    buy_now_clicks: number
    buy_now_ctr: number
  }
  funnel?: Array<{
    stage: string
    count: number
    pctOfTotal: number
    dropoffPct: number
  }>
  traffic_sources?: Array<{
    source: string
    total_events: number
    unique_visitors: number
    percentage: number
  }>
}

export interface DownloadLog {
  id: number
  ip_address: string | null
  user_agent: string | null
  success: number
  order_number: string
  customer_name: string
  product_title: string
  created_at: string
}

export interface AuditLog {
  id: number
  admin_uid: string
  admin_email: string
  action: string
  resource_type: string | null
  resource_id: string | null
  details: string | null
  ip_address: string | null
  created_at: string
}

export interface CustomerSummary {
  email: string
  name: string | null
  phone: string | null
  customer_type: 'registered' | 'guest'
  orders_count?: number
  total_orders?: number
  paid_orders_count?: number
  paid_orders?: number
  total_spent: number
  first_order_at?: string
  first_purchased_at?: string
  last_order_at?: string
  last_purchased_at?: string
}

export interface AdNetwork {
  id: number
  name: string
  provider_type: string
  status: 'active' | 'paused' | 'disabled'
  integration_type: 'banner' | 'native' | 'direct_link' | 'interstitial' | 'multi_tag' | 'popunder'
  config?: string | null
  created_at: string
  updated_at?: string
}

export interface AdPlacement {
  id: number
  name: string
  placement_key: string
  network_id?: number | null
  network_name?: string | null
  network_provider?: string | null
  ad_type: string
  status: 'active' | 'paused' | 'disabled'
  suppress_on_high_intent: number | boolean
  suppress_on_checkout: number | boolean
  frequency_cap_session: number
  custom_code?: string | null
  created_at: string
}

export interface AdCampaign {
  id: number
  name: string
  network_id?: number | null
  network_name?: string | null
  placement_id?: number | null
  placement_name?: string | null
  status: 'active' | 'paused' | 'archived'
  target_rule: 'all' | 'low_intent' | 'non_buyers'
  max_impressions_day: number
  created_at: string
}

export interface AdRules {
  enable_high_intent_suppression: string
  suppress_on_buy_click: string
  suppress_on_checkout: string
  max_impressions_per_session: string
  cooldown_hours: string
  non_buyer_ads_enabled?: string
  non_buyer_direct_link_url?: string
  non_buyer_trigger_mode?: string
  non_buyer_frequency_minutes?: string
  global_header_script?: string
  product_page_back_button_ad?: string
}

export interface ActiveAdsResponse {
  networks: Array<{
    id: number
    name: string
    provider_type: string
    integration_type: string
    config?: string | null
  }>
  placements: Record<string, {
    id: number
    name: string
    placement_key: string
    network_id?: number | null
    ad_type: string
    suppress_on_high_intent: number | boolean
    suppress_on_checkout: number | boolean
    frequency_cap_session: number
    custom_code?: string | null
    network_name?: string | null
    network_provider?: string | null
  }>
  rules: {
    global_header_script: string
    non_buyer_ads_enabled: boolean
    non_buyer_direct_link_url: string
    non_buyer_trigger_mode: string
    non_buyer_frequency_minutes: number
    suppress_on_checkout: boolean
    product_page_back_button_ad: boolean
  }
}

export interface PaymentGatewaysConfig {
  active_payment_gateway: 'cashfree' | 'razorpay' | 'both' | 'offline' | string
  default_dual_gateway?: 'cashfree' | 'razorpay' | string
  cashfree: {
    enabled: boolean
    mode: 'sandbox' | 'production' | string
    app_id: string
    secret_key?: string
    masked_secret_key: string
    has_secret_key: boolean
    webhook_secret: string
    api_url: string
    webhook_url: string
  }
  razorpay: {
    enabled: boolean
    mode: 'test' | 'live' | string
    key_id: string
    key_secret?: string
    masked_key_secret: string
    has_key_secret: boolean
    webhook_secret: string
    webhook_url: string
  }
  upi: {
    upi_direct_launch: boolean
    preferred_upi_app: string
    guest_checkout_mode: string
  }
  site_url: string
}

export interface PaymentGatewaysConfigUpdate {
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

