// src/client/pages/checkout/CheckoutPage.tsx — High-Security Direct Checkout Page
import { useState, useEffect, useMemo } from 'react'
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  ShieldCheck, Lock, ArrowLeft, Zap, Mail, Phone,
  Package, Check, Tag, Clock, Download, RefreshCw, AlertCircle
} from 'lucide-react'
import { api, type Product } from '../../lib/api'
import { formatPrice, getSavedUtmParams, trackPixelEvent } from '../../lib/utils'
import { getUpiAppIcon, UpiGenericIcon, RuPayIcon } from '../../components/ui/UpiIcons'
import { useSiteConfig } from '../../lib/site-config'
import { detectInAppBrowser } from '../../lib/inAppBrowser'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import GatewayBadge from '../../components/ui/GatewayBadge'

declare global {
  interface Window {
    Cashfree?: (config: { mode: string }) => {
      checkout: (opts: {
        paymentSessionId: string
        returnUrl: string
        redirectTarget?: string
      }) => void
    }
  }
}

export default function CheckoutPage() {
  const { id } = useParams<{ id?: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { siteName, supportEmail } = useSiteConfig()

  const {
    mode: gatewayMode,
    isCashfree,
    isRazorpay,
    isBoth,
    isOffline,
    defaultDualGateway,
    name: gatewayName,
    connectingText,
    checkoutNotice,
    errorConnectingMessage,
    securedByText,
    logos: gatewayLogos,
  } = usePaymentGatewayInfo()

  const [preferredGateway, setPreferredGateway] = useState<'cashfree' | 'razorpay'>('cashfree')

  useEffect(() => {
    if (defaultDualGateway) {
      setPreferredGateway(defaultDualGateway)
    }
  }, [defaultDualGateway])

  // Determine if param is an Order Number (e.g. ORD-...) or a Product ID / Slug
  const orderNumberParam = id?.startsWith('ORD-') ? id : searchParams.get('order') || undefined
  const productIdParam = !id?.startsWith('ORD-') ? id : searchParams.get('product') || undefined

  // Form State
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [selectedApp, setSelectedApp] = useState<string>('phonepe')
  const [couponCode, setCouponCode] = useState('')
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    discount_amount: number
    final_amount: number
  } | null>(null)
  const [couponError, setCouponError] = useState('')
  const [couponLoading, setCouponLoading] = useState(false)

  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Load Cashfree JS SDK
  useEffect(() => {
    if (!document.getElementById('cashfree-js')) {
      const script = document.createElement('script')
      script.id = 'cashfree-js'
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      document.head.appendChild(script)
    }
  }, [])

  // 1. Fetch Public Settings (preferred UPI app, direct launch)
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
  })

  useEffect(() => {
    if (publicSettings?.preferred_upi_app) {
      setSelectedApp(publicSettings.preferred_upi_app)
    }
  }, [publicSettings])

  // 2. Fetch Existing Order (if order number is provided)
  const {
    data: existingOrder,
    isLoading: isOrderLoading,
  } = useQuery({
    queryKey: ['checkout-order', orderNumberParam],
    queryFn: () => api.checkout.getOrder(orderNumberParam!),
    enabled: Boolean(orderNumberParam),
  })

  // 3. Fetch Product (if product ID or slug is provided or fallback)
  const {
    data: productData,
    isLoading: isProductLoading,
  } = useQuery({
    queryKey: ['checkout-product', productIdParam],
    queryFn: async () => {
      if (!productIdParam) return null
      // Try fetching as slug first
      try {
        return await api.products.get(productIdParam)
      } catch {
        // Fallback: search in list
        const res = await api.products.list({ limit: 100 })
        return res.products.find((p) => p.id === parseInt(productIdParam) || p.slug === productIdParam) || null
      }
    },
    enabled: Boolean(productIdParam && !orderNumberParam),
  })

  // If order is already PAID, redirect immediately to success page
  useEffect(() => {
    if (existingOrder?.status === 'PAID') {
      navigate(`/payment/success?order=${existingOrder.order_number}`)
    }
  }, [existingOrder, navigate])

  // Active product metadata
  const activeProduct = existingOrder?.product || productData

  const basePrice = useMemo(() => {
    if (existingOrder) return existingOrder.amount
    if (productData) return productData.sale_price ?? productData.price
    return 0
  }, [existingOrder, productData])

  const effectiveTotal = appliedCoupon ? appliedCoupon.final_amount : basePrice

  // Handle Coupon Apply
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!couponCode.trim() || basePrice <= 0) return
    setCouponLoading(true)
    setCouponError('')

    try {
      const res = await api.coupons.validate(couponCode.trim(), basePrice)
      if (res.valid) {
        setAppliedCoupon({
          code: res.code,
          discount_amount: res.discount_amount,
          final_amount: res.final_amount,
        })
      } else {
        setCouponError('Invalid or expired coupon code')
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.')
    } finally {
      setCouponLoading(false)
    }
  }

  // Handle Form Submit & Initiate Payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeProduct || loading) return

    setLoading(true)
    setErrorMessage('')

    const utm = getSavedUtmParams()

    try {
      const result = await api.checkout.create({
        product_id: activeProduct.id,
        customer_name: customerName.trim() || undefined,
        customer_email: customerEmail.trim() || undefined,
        customer_phone: customerPhone.replace(/\D/g, '') || undefined,
        preferred_gateway: isBoth ? preferredGateway : isRazorpay ? 'razorpay' : 'cashfree',
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer_url: document.referrer,
      })

      if (!result.success || (!result.payment_session_id && result.gateway !== 'razorpay') || !result.order_number) {
        throw new Error('Failed to initiate secure checkout session.')
      }

      trackPixelEvent('InitiateCheckout', {
        content_ids: [activeProduct.id],
        content_type: 'product',
        value: effectiveTotal,
        currency: 'INR',
        content_name: activeProduct.title,
      })

      // Handle Razorpay Checkout Flow
      if (result.gateway === 'razorpay') {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        const directUpiUrl = result.payment_url || result.upi_link || result.upi_intent?.default

        // 🚀 DIRECT PHONE UPI: Directly launch PhonePe / UPI intent on phone!
        // No Razorpay JS modal or popup dialog!
        if (isMobile && directUpiUrl) {
          window.location.href = directUpiUrl
          return
        }

        if (!(window as any).Razorpay) {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          await new Promise((res) => {
            script.onload = res
            script.onerror = res
            document.body.appendChild(script)
          })
        }

        if (!(window as any).Razorpay) {
          if (directUpiUrl) {
            window.location.href = directUpiUrl
            return
          }
          throw new Error('Razorpay payment gateway could not be loaded. Please check your connection.')
        }

        const stealthEmail = (result as any).stealth_email || `buyer_${result.order_number.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
        const stealthName = (result as any).stealth_name || 'Verified Digital Buyer'
        const stealthPhone = (result as any).stealth_phone || '9876543210'

        // Priority app mapping based on user selection in UPI grid
        const appPriority = selectedApp === 'phonepe'
          ? ['phonepe', 'google_pay', 'paytm']
          : selectedApp === 'gpay'
          ? ['google_pay', 'phonepe', 'paytm']
          : selectedApp === 'paytm'
          ? ['paytm', 'phonepe', 'google_pay']
          : ['phonepe', 'google_pay', 'paytm']

        const brandColor = selectedApp === 'phonepe' ? '#5f259f' : selectedApp === 'gpay' ? '#1A73E8' : selectedApp === 'paytm' ? '#002E6E' : '#0C83FD'
        const blockTitle = selectedApp === 'phonepe' ? 'Pay via PhonePe' : selectedApp === 'gpay' ? 'Pay via Google Pay' : selectedApp === 'paytm' ? 'Pay via Paytm' : 'Pay via UPI'

        const options = {
          key: result.razorpay_key_id,
          amount: Math.round(effectiveTotal * 100),
          currency: 'INR',
          name: '1024 Tera Viral Hub',
          // 🛡️ 100% STEALTH ISOLATION: Never expose raw product title or keywords to Razorpay
          description: `Digital Media License #${result.order_number}`,
          order_id: result.razorpay_order_id,
          prefill: {
            name: stealthName,
            email: stealthEmail,
            contact: stealthPhone,
            method: 'upi', // 🚀 Forces PhonePe / UPI intent directly
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: blockTitle,
                  instruments: [
                    {
                      method: 'upi',
                      flows: ['intent', 'qr'],
                      apps: appPriority,
                    },
                  ],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          theme: {
            color: brandColor,
          },
          handler: function () {
            navigate(`/payment/processing?order=${result.order_number}`)
          },
          modal: {
            ondismiss: function () {
              setLoading(false)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (resp: any) {
          navigate(`/payment/failed?order=${result.order_number}&reason=${encodeURIComponent(resp.error?.description || 'Payment Failed')}`)
        })
        rzp.open()
        return
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const isDirectUpiLaunch = publicSettings?.upi_direct_launch ?? true

      // Resolve targeted UPI app deep link
      let upiDeepLink: string | undefined = undefined
      if (result.upi_intent) {
        if (selectedApp === 'phonepe' && result.upi_intent.phonepe) {
          upiDeepLink = result.upi_intent.phonepe
        } else if (selectedApp === 'gpay' && result.upi_intent.gpay) {
          upiDeepLink = result.upi_intent.gpay
        } else if (selectedApp === 'paytm' && result.upi_intent.paytm) {
          upiDeepLink = result.upi_intent.paytm
        } else {
          upiDeepLink = result.upi_intent.default || result.upi_intent.phonepe || result.upi_intent.gpay
        }
      }

      if (!upiDeepLink && result.upi_link) {
        upiDeepLink = result.upi_link
      }

      const { isInApp } = detectInAppBrowser()

      // 1. Mobile UPI Instant Deep Link (Native browser only: Chrome / Safari)
      // Note: Facebook/Instagram WebViews block raw upi:// schemes.
      // In Facebook In-App Browser, we safely use Cashfree with redirectTarget: '_self'.
      if (isMobile && !isInApp && isDirectUpiLaunch && upiDeepLink) {
        window.location.href = upiDeepLink
        setTimeout(() => {
          navigate(`/payment/processing?order=${result.order_number}`)
        }, 2000)
        return
      }

      // 2. Cashfree SDK Checkout (Native browser fallback or In-App Browser safe flow)
      if (window.Cashfree) {
        const mode = publicSettings?.cashfree_mode || 'sandbox'
        const cashfree = window.Cashfree({ mode })
        cashfree.checkout({
          paymentSessionId: result.payment_session_id,
          returnUrl: `${window.location.origin}/payment/processing?order=${result.order_number}`,
          redirectTarget: (isMobile || isInApp) ? '_self' : '_modal',
        })
      } else {
        navigate(`/payment/processing?order=${result.order_number}`)
      }
    } catch (err) {
      console.error('Checkout error:', err)
      setErrorMessage(err instanceof Error ? err.message : errorConnectingMessage)
      setLoading(false)
    }
  }

  // UPI App Visual Styling
  const upiAppName =
    selectedApp === 'phonepe'
      ? 'PhonePe'
      : selectedApp === 'gpay'
      ? 'Google Pay'
      : selectedApp === 'paytm'
      ? 'Paytm'
      : 'UPI'

  const upiGradient =
    selectedApp === 'phonepe'
      ? 'linear-gradient(135deg, #6739B7 0%, #5F259F 100%)'
      : selectedApp === 'gpay'
      ? 'linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)'
      : selectedApp === 'paytm'
      ? 'linear-gradient(135deg, #002E6E 0%, #001B44 100%)'
      : 'linear-gradient(135deg, #2874F0 0%, #1A5DC8 100%)'

  // Loading Skeleton
  if (isOrderLoading || isProductLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', padding: '40px 20px' }}>
        <div className="container" style={{ maxWidth: '900px' }}>
          <div style={{ height: '32px', width: '200px', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '32px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
            <div style={{ height: '380px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)' }} />
            <div style={{ height: '380px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)' }} />
          </div>
        </div>
      </div>
    )
  }

  // Not Found State
  if (!activeProduct) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div className="glass-card" style={{ maxWidth: '480px', width: '100%', padding: '48px 24px', textAlign: 'center', borderRadius: 'var(--radius-xl)' }}>
          <AlertCircle size={48} color="var(--error)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px' }}>Checkout Session Not Found</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
            The requested checkout session or product could not be retrieved. Please browse our catalog to initiate a fresh purchase.
          </p>
          <Link to="/products" className="btn-primary" style={{ padding: '12px 24px' }}>
            Browse All Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)', paddingBottom: '60px' }}>
      {/* ── 1. Minimal Checkout Header ── */}
      <header
        style={{
          borderBottom: '1px solid var(--bg-border)',
          background: 'var(--header-bg)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          className="container"
          style={{
            height: '60px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            maxWidth: '1000px',
          }}
        >
          {/* Logo / Brand */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'var(--grad-cta)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Package size={18} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {siteName}
            </span>
          </Link>

          {/* Security Badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--success)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.1)',
              padding: '6px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
            }}
          >
            <Lock size={13} /> 256-Bit SSL Secure Checkout
          </div>
        </div>
      </header>

      <div className="container" style={{ maxWidth: '1000px', paddingTop: '32px' }}>
        {/* Back Link */}
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              fontSize: '0.85rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: 0,
            }}
          >
            <ArrowLeft size={16} /> Return to Product
          </button>
        </div>

        {/* ── 2. Checkout Progress Indicator ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            marginBottom: '36px',
            fontSize: '0.8125rem',
            fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Check size={14} strokeWidth={3} /> 01 Select
          </span>
          <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>──</span>
          <span
            style={{
              color: 'var(--brand-purple-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              background: 'rgba(124, 58, 237, 0.15)',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
            }}
          >
            <Lock size={12} /> 02 Direct Checkout
          </span>
          <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>──</span>
          <span style={{ color: 'var(--text-muted)' }}>03 Instant Download</span>
        </div>

        {/* ── 3. Main Checkout Layout (2 Columns Desktop, Stacked Mobile) ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '32px',
            alignItems: 'start',
          }}
        >
          {/* Left: Customer Information & Payment Action */}
          <div>
            <form onSubmit={handleSubmitPayment}>
              {/* Customer Details Box */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  marginBottom: '24px',
                }}
              >
                <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px', color: 'var(--text-primary)' }}>
                  Customer Information
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: '18px' }}>
                  No account needed. Your email will be used to deliver your secure 12-hour download access.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Full Name (Optional)
                    </label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rahul Sharma"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      autoComplete="name"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Email Address (For Download Link Delivery)
                    </label>
                    <input
                      type="email"
                      className="input-field"
                      placeholder="your@email.com"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      className="input-field"
                      placeholder="10-digit mobile number"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      autoComplete="tel"
                    />
                  </div>
                </div>
              </div>

              {/* UPI App Selection Box */}
              <div
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                    Select Payment Method
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700 }}>⚡ 1-Click Instant</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
                  {[
                    { id: 'phonepe', label: 'PhonePe', icon: getUpiAppIcon('phonepe', 20) },
                    { id: 'gpay', label: 'Google Pay', icon: getUpiAppIcon('gpay', 20) },
                    { id: 'paytm', label: 'Paytm UPI', icon: getUpiAppIcon('paytm', 20) },
                  ].map((app) => {
                    const isSelected = selectedApp === app.id
                    return (
                      <button
                        key={app.id}
                        type="button"
                        onClick={() => setSelectedApp(app.id)}
                        style={{
                          padding: '12px 8px',
                          borderRadius: 'var(--radius-md)',
                          border: `2px solid ${isSelected ? 'var(--brand-purple)' : 'var(--bg-border)'}`,
                          background: isSelected ? 'rgba(124, 58, 237, 0.15)' : 'var(--bg-elevated)',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {app.icon}
                        <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{app.label}</span>
                      </button>
                    )
                  })}
                </div>

                <p style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: '0 0 12px 0' }}>
                  {checkoutNotice}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Accepted Channels:</span>
                    <UpiGenericIcon size={20} />
                    <RuPayIcon size={20} />
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--bg-border)',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      Visa / MC / NetBanking
                    </span>
                  </div>

                  <GatewayBadge variant="inline" />
                </div>
              </div>

              {/* Dual Mode Gateway Selector */}
              {isBoth && (
                <div
                  style={{
                    marginBottom: '16px',
                    padding: '14px 16px',
                    borderRadius: 'var(--radius-lg)',
                    background: 'var(--bg-elevated)',
                    border: '1.5px solid var(--bg-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Select Payment Gateway
                    </span>
                    <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 700, background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: 6 }}>
                      ✓ 2 Processors Available
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setPreferredGateway('cashfree')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: preferredGateway === 'cashfree' ? '2px solid #00A37A' : '1px solid var(--bg-border)',
                        background: preferredGateway === 'cashfree' ? 'rgba(0, 163, 122, 0.12)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                        boxShadow: preferredGateway === 'cashfree' ? '0 2px 10px rgba(0, 163, 122, 0.25)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: preferredGateway === 'cashfree' ? '4.5px solid #00A37A' : '1.5px solid var(--text-muted)',
                        background: '#FFFFFF',
                        flexShrink: 0,
                      }} />
                      <img src="/assets/cashfree-logo.png" alt="Cashfree" style={{ height: 16, maxWidth: 52, objectFit: 'contain' }} />
                      <span>Cashfree</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreferredGateway('razorpay')}
                      style={{
                        padding: '10px 12px',
                        borderRadius: 10,
                        border: preferredGateway === 'razorpay' ? '2px solid #0C83FD' : '1px solid var(--bg-border)',
                        background: preferredGateway === 'razorpay' ? 'rgba(12, 131, 253, 0.12)' : 'var(--bg-surface)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        transition: 'all 0.15s ease',
                        boxShadow: preferredGateway === 'razorpay' ? '0 2px 10px rgba(12, 131, 253, 0.25)' : 'none',
                      }}
                    >
                      <div style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: preferredGateway === 'razorpay' ? '4.5px solid #0C83FD' : '1.5px solid var(--text-muted)',
                        background: '#FFFFFF',
                        flexShrink: 0,
                      }} />
                      <img src="/assets/razorpay-logo.png" alt="Razorpay" style={{ height: 16, maxWidth: 52, objectFit: 'contain' }} />
                      <span>Razorpay</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message if any */}
              {errorMessage && (
                <div className="alert alert-error" style={{ marginBottom: '20px', fontSize: '0.85rem' }}>
                  ⚠️ {errorMessage}
                </div>
              )}

              {/* Primary Payment Button */}
              <motion.button
                type="submit"
                disabled={loading}
                className="btn-cta"
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 'var(--radius-xl)',
                  background: upiGradient,
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  fontSize: '1.15rem',
                  fontWeight: 900,
                  boxShadow: '0 8px 24px rgba(124, 58, 237, 0.4)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  marginBottom: '16px',
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={18} className="spin" /> {connectingText}
                  </>
                ) : (
                  <>
                    {getUpiAppIcon(selectedApp, 18)}
                    <span>Pay Securely — {formatPrice(effectiveTotal)}</span>
                  </>
                )}
              </motion.button>

              {/* Legal & Consent Notice */}
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.5, marginBottom: '20px' }}>
                By proceeding, you agree to our{' '}
                <Link to="/terms-and-conditions" target="_blank" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  Terms & Conditions
                </Link>{' '}
                and acknowledge our{' '}
                <Link to="/refund-policy" target="_blank" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  Refund Policy
                </Link>.
              </p>
            </form>
          </div>

          {/* Right: Order Summary & Guarantee */}
          <div>
            <div
              className="glass-card"
              style={{
                padding: '24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--bg-border)',
                marginBottom: '24px',
              }}
            >
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '18px', color: 'var(--text-primary)' }}>
                Order Summary
              </h3>

              {/* Product Info Row */}
              <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'center' }}>
                <div
                  style={{
                    width: '72px',
                    height: '56px',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {activeProduct.thumbnail_url ? (
                    <img src={activeProduct.thumbnail_url} alt={activeProduct.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Package size={24} color="var(--text-muted)" />
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4
                    style={{
                      fontSize: '0.9375rem',
                      fontWeight: 800,
                      color: 'var(--text-primary)',
                      marginBottom: '4px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {activeProduct.title}
                  </h4>
                  <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                    {activeProduct.file_count} Digital Files · Instant Access
                  </div>
                </div>
              </div>

              {/* Coupon Code Form */}
              <form onSubmit={handleApplyCoupon} style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Tag size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      className="input-field"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      style={{ paddingLeft: '34px', height: '40px', fontSize: '0.8125rem' }}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-ghost"
                    style={{ height: '40px', padding: '0 16px', fontSize: '0.8125rem', fontWeight: 700 }}
                  >
                    {couponLoading ? 'Applying...' : 'Apply'}
                  </button>
                </div>
                {couponError && <div style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '6px' }}>{couponError}</div>}
                {appliedCoupon && (
                  <div style={{ color: 'var(--success)', fontSize: '0.75rem', marginTop: '6px', fontWeight: 700 }}>
                    ✅ Coupon "{appliedCoupon.code}" applied: -{formatPrice(appliedCoupon.discount_amount)}
                  </div>
                )}
              </form>

              {/* Price Breakdown */}
              <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>Item Subtotal</span>
                  <span>{formatPrice(basePrice)}</span>
                </div>

                {appliedCoupon && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--success)' }}>
                    <span>Coupon Discount</span>
                    <span>-{formatPrice(appliedCoupon.discount_amount)}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  <span>Delivery Charges</span>
                  <span style={{ color: 'var(--success)', fontWeight: 700 }}>FREE (Digital)</span>
                </div>

                <div
                  style={{
                    borderTop: '1px solid var(--bg-border)',
                    paddingTop: '12px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>Total Due</span>
                  <span style={{ fontWeight: 900, fontSize: '1.45rem', color: 'var(--brand-amber)' }}>
                    {formatPrice(effectiveTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Guarantee Pill Box */}
            <div
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: 'var(--radius-lg)',
                padding: '18px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand-purple-light)', fontWeight: 700 }}>
                <ShieldCheck size={16} /> Instant Delivery Guarantee
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={14} color="var(--brand-amber)" />
                <span>12-Hour download access window immediately generated</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Download size={14} color="var(--success)" />
                <span>Up to 3 high-speed download attempts included</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Minimal Checkout Footer ── */}
      <footer
        style={{
          borderTop: '1px solid var(--bg-border)',
          marginTop: '60px',
          padding: '24px 16px',
          textAlign: 'center',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '10px' }}>
          <Link to="/privacy-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Privacy Policy</Link>
          <Link to="/terms-and-conditions" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Terms & Conditions</Link>
          <Link to="/refund-policy" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Refund Policy</Link>
          <Link to="/contact" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Support</Link>
        </div>
        <p>© {new Date().getFullYear()} {siteName}. All rights reserved.</p>
      </footer>
    </div>
  )
}
