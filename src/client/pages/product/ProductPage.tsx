// src/client/pages/product/ProductPage.tsx — Production High-Conversion Product Detail Page
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Download, Clock, Package, Sparkles, Heart, Star,
  RefreshCw, ShieldCheck, Mail, ChevronDown, Check, Zap,
  FolderDown, Lock
} from 'lucide-react'
import { api, type Product, type ProductDetail } from '../../lib/api'
import { formatPrice, discountPercent, formatFileSize, trackPixelEvent, getSavedUtmParams, getSanitizedCustomerPhone } from '../../lib/utils'
import ProductCard from '../../components/product/ProductCard'
import ProductGallery from '../../components/product/ProductGallery'
import ProductWhatIncluded from '../../components/product/ProductWhatIncluded'
import ProductSpecsTable from '../../components/product/ProductSpecsTable'
import ProductDeliveryPolicy from '../../components/product/ProductDeliveryPolicy'
import ProductFaqAccordion from '../../components/product/ProductFaqAccordion'
import { getUpiAppIcon } from '../../components/ui/UpiIcons'
import { useWishlistStore } from '../../lib/wishlist-store'
import { useSiteConfig } from '../../lib/site-config'
import ReviewGateModal from '../../components/product/ReviewGateModal'
import AdPlacement from '../../components/ads/AdPlacement'
import { detectInAppBrowser } from '../../lib/inAppBrowser'
import { trackPageView, trackUserClick, sendAnalyticsEvent } from '../../lib/analytics-tracker'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import { saveOrderSession, getSavedOrders, type SavedOrderSession } from '../../lib/orderSession'

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

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { siteName } = useSiteConfig()
  const { name: gatewayName, isRazorpay, isBoth, defaultDualGateway, errorConnectingMessage } = usePaymentGatewayInfo()

  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [reviewModal, setReviewModal] = useState<'gate' | 'success' | null>(null)
  const [verifyingOrderNumber, setVerifyingOrderNumber] = useState<string | null>(null)
  const [existingPaidOrder, setExistingPaidOrder] = useState<SavedOrderSession | null>(null)

  // Optional Contact Form (User can optionally type email for backup)
  const [optionalEmail, setOptionalEmail] = useState('')
  const [optionalPhone, setOptionalPhone] = useState('')
  const [optionalName, setOptionalName] = useState('')
  const [reviewForm, setReviewForm] = useState({ name: '', email: '', rating: 5, comment: '' })

  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()

  // Load Cashfree JS SDK on mount
  useEffect(() => {
    if (!document.getElementById('cashfree-js')) {
      const script = document.createElement('script')
      script.id = 'cashfree-js'
      script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
      document.head.appendChild(script)
    }
  }, [])

  // Fetch Product Data
  const {
    data: product,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.products.get(slug!),
    enabled: Boolean(slug),
  })

  // 1. Check if user already owns this product from past session / orders
  useEffect(() => {
    if (!product) return
    const saved = getSavedOrders().find(
      (o) => o.token && (
        o.productTitle?.toLowerCase() === product.title?.toLowerCase() ||
        (o as any).productId === product.id
      )
    )
    if (saved) {
      setExistingPaidOrder(saved)
    }
  }, [product])

  // 2. 🔄 ACTIVE ORDER RESUME & AUTOMATIC PAYMENT DETECTION:
  // When user returns from PhonePe / UPI app (or if page is restored / focused),
  // automatically verify pending order and immediately redirect to payment success / download!
  useEffect(() => {
    let poller: ReturnType<typeof setInterval> | null = null

    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem('tvh_active_order') || sessionStorage.getItem('tvh_active_order')
        if (!raw) return

        const active = JSON.parse(raw)
        // Must have order_number and must be within the last 1 hour
        if (!active?.order_number || Date.now() - (active.timestamp || 0) > 3600000) {
          return
        }

        setVerifyingOrderNumber(active.order_number)

        const res = await api.checkout.verify(active.order_number)
        if (res?.success && res.status === 'PAID' && res.download_token) {
          try {
            localStorage.removeItem('tvh_active_order')
            sessionStorage.removeItem('tvh_active_order')
            localStorage.removeItem('tvh_active_order_number')
            sessionStorage.removeItem('tvh_active_order_number')
          } catch { }

          saveOrderSession({
            orderNumber: active.order_number,
            token: res.download_token,
            productTitle: product?.title || active.title,
            amount: active.amount,
            createdAt: Date.now(),
          })

          navigate(`/payment/success?order=${encodeURIComponent(active.order_number)}&token=${encodeURIComponent(res.download_token)}`, { replace: true })
        }
      } catch { }
    }

    // Check immediately on mount/reload
    checkActiveOrder()

    // Check when user returns to browser tab from PhonePe / UPI app
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        checkActiveOrder()
      }
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', checkActiveOrder)

    // Periodic poll every 2.5s if an order is active or processing
    poller = setInterval(() => {
      const raw = localStorage.getItem('tvh_active_order') || sessionStorage.getItem('tvh_active_order')
      if (raw || isProcessing) {
        checkActiveOrder()
      }
    }, 2500)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', checkActiveOrder)
      if (poller) clearInterval(poller)
    }
  }, [navigate, product, isProcessing])

  // Fetch Public Settings for preferred UPI app
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
  })

  // Fetch Product Reviews
  const { data: reviewsData, refetch: refetchReviews } = useQuery({
    queryKey: ['product-reviews', product?.id],
    queryFn: () => api.reviews.getByProduct(product!.id),
    enabled: Boolean(product?.id),
  })

  // Dynamic Browser Page Title & Open Graph Meta Tags (for client-side SPA navigation)
  useEffect(() => {
    if (product?.title) {
      document.title = `${product.title} — ${siteName}`

      const setMeta = (property: string, content: string, isName = false) => {
        const selector = isName ? `meta[name="${property}"]` : `meta[property="${property}"]`
        let tag = document.querySelector(selector) as HTMLMetaElement | null
        if (!tag) {
          tag = document.createElement('meta')
          if (isName) tag.setAttribute('name', property)
          else tag.setAttribute('property', property)
          document.head.appendChild(tag)
        }
        tag.setAttribute('content', content)
      }

      const rawDesc = product.short_description || product.description || ''
      const plainDesc = rawDesc.replace(/<[^>]*>/g, '').replace(/[\r\n\t]+/g, ' ').trim().slice(0, 240)
      const primaryImg = product.images?.[0]?.url || ''
      const absImgUrl = primaryImg.startsWith('http')
        ? primaryImg
        : primaryImg ? `${window.location.origin}${primaryImg}` : ''

      setMeta('description', plainDesc, true)
      setMeta('og:title', `${product.title} — ${siteName}`)
      setMeta('og:description', plainDesc)
      setMeta('og:url', window.location.href)
      if (absImgUrl) {
        setMeta('og:image', absImgUrl)
        setMeta('og:image:secure_url', absImgUrl)
        setMeta('twitter:image', absImgUrl)
      }
      setMeta('twitter:card', 'summary_large_image', true)
      setMeta('twitter:title', `${product.title} — ${siteName}`, true)
      setMeta('twitter:description', plainDesc, true)
    }
  }, [product, siteName])

  // Track Product View Event & Pageview
  useEffect(() => {
    if (product?.id) {
      trackPageView(window.location.pathname, product.id)
      sendAnalyticsEvent({
        event_type: 'product_view',
        product_id: product.id,
        metadata: {
          title: product.title,
          price: product.sale_price ?? product.price,
        },
      })
    }
  }, [product?.id])

  const inWishlist = product ? isInWishlist(product.id) : false
  const hasDiscount = Boolean(product?.sale_price && product.sale_price < product.price)
  const effectivePrice = product?.sale_price ?? product?.price ?? 0
  const discountPct = product && hasDiscount ? discountPercent(product.price, product.sale_price!) : 0

  const originalPrice =
    product && product.price > effectivePrice
      ? product.price
      : Math.round((effectivePrice || 99) * 2.4)
  const calcDiscountPct = hasDiscount ? discountPct : Math.round(((originalPrice - effectivePrice) / originalPrice) * 100)
  const discountAmount = originalPrice - effectivePrice > 0 ? originalPrice - effectivePrice : 21

  // Action CTA Customization
  const rawBtnText = product?.button_text?.trim() || 'Buy'
  const mainCtaText = (() => {
    const lower = rawBtnText.toLowerCase()
    if (lower === 'buy') return 'BUY NOW'
    if (lower === 'pay') return 'PAY NOW'
    if (lower === 'download') return 'DOWNLOAD NOW'
    return rawBtnText.toUpperCase()
  })()
  const subVerb = (() => {
    const lower = rawBtnText.toLowerCase()
    if (lower === 'pay') return 'Pay'
    if (lower === 'download') return 'Download'
    return 'Buy'
  })()

  const preferredApp = publicSettings?.preferred_upi_app || 'phonepe'
  const isDirectUpiLaunch = publicSettings?.upi_direct_launch ?? true

  const upiAppName =
    preferredApp === 'phonepe'
      ? 'PhonePe'
      : preferredApp === 'gpay'
      ? 'Google Pay'
      : preferredApp === 'paytm'
      ? 'Paytm'
      : 'UPI'

  const upiGradient =
    preferredApp === 'phonepe'
      ? 'linear-gradient(135deg, #6739B7 0%, #5F259F 100%)'
      : preferredApp === 'gpay'
      ? 'linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)'
      : preferredApp === 'paytm'
      ? 'linear-gradient(135deg, #002E6E 0%, #001B44 100%)'
      : 'linear-gradient(135deg, #2874F0 0%, #1A5DC8 100%)'

  const upiShadow =
    preferredApp === 'phonepe'
      ? '0 8px 24px rgba(95, 37, 159, 0.45)'
      : preferredApp === 'gpay'
      ? '0 8px 24px rgba(26, 115, 232, 0.45)'
      : preferredApp === 'paytm'
      ? '0 8px 24px rgba(0, 46, 110, 0.45)'
      : '0 8px 24px rgba(40, 116, 240, 0.45)'

  // Handle Direct 1-Click Buy Now
  const handleInstantBuy = async () => {
    if (!product || isProcessing) return

    // 🚀 FAST-PATH: If customer has already purchased this product, take them directly to download!
    if (existingPaidOrder?.token && existingPaidOrder?.orderNumber) {
      navigate(`/payment/success?order=${encodeURIComponent(existingPaidOrder.orderNumber)}&token=${encodeURIComponent(existingPaidOrder.token)}`)
      return
    }

    setIsProcessing(true)
    setErrorMessage('')
    try {
      sessionStorage.setItem('tvh_buy_clicked', 'true')
    } catch {
      // ignore
    }

    trackPixelEvent('InitiateCheckout', {
      content_ids: [product.id],
      content_type: 'product',
      value: effectivePrice,
      currency: 'INR',
      content_name: product.title,
    })

    // Track Buy Button Click & Checkout Funnel Step
    trackUserClick('buy_now_click', {
      product_id: product.id,
      title: product.title,
      price: effectivePrice,
    }, product.id)
    sendAnalyticsEvent({
      event_type: 'checkout_start',
      product_id: product.id,
      metadata: {
        title: product.title,
        price: effectivePrice,
      },
    })

    const utm = getSavedUtmParams()

    try {
      const orderRes = await api.checkout.create({
        product_id: product.id,
        customer_name: optionalName || undefined,
        customer_email: optionalEmail || undefined,
        customer_phone: optionalPhone || undefined,
        preferred_gateway: isBoth ? (defaultDualGateway || 'razorpay') : isRazorpay ? 'razorpay' : 'cashfree',
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer_url: document.referrer,
      })

      if (!orderRes.success || !orderRes.order_number) {
        throw new Error('Could not initiate payment session.')
      }

      // 💾 SNAPSHOT ACTIVE ORDER: Saved in localStorage & sessionStorage before initiating payment!
      const pendingOrderData = {
        order_number: orderRes.order_number,
        product_id: product.id,
        product_slug: product.slug,
        title: product.title,
        amount: effectivePrice,
        timestamp: Date.now(),
      }
      try {
        localStorage.setItem('tvh_active_order', JSON.stringify(pendingOrderData))
        sessionStorage.setItem('tvh_active_order', JSON.stringify(pendingOrderData))
        localStorage.setItem('tvh_active_order_number', orderRes.order_number)
        sessionStorage.setItem('tvh_active_order_number', orderRes.order_number)
      } catch { }

      // Handle Razorpay Checkout Flow
      if (orderRes.gateway === 'razorpay') {
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        const directUpiUrl = orderRes.payment_url || orderRes.upi_link || orderRes.upi_intent?.phonepe || orderRes.upi_intent?.default

        // 🚀 DIRECT PHONE UPI: Instant direct PhonePe / UPI launch without popup on mobile!
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

        const stealthEmail = (orderRes as any).stealth_email || `buyer_${orderRes.order_number.toLowerCase().replace(/[^a-z0-9]/g, '_')}@1024teraviralhub.com`
        const stealthName = (orderRes as any).stealth_name || (optionalName.trim() || 'Verified Digital Buyer')
        const stealthPhone = (orderRes as any).stealth_phone || (orderRes as any).customer_phone || getSanitizedCustomerPhone(optionalPhone, orderRes.order_number)

        const appPriority = preferredApp === 'phonepe'
          ? ['phonepe']
          : preferredApp === 'gpay'
          ? ['google_pay']
          : preferredApp === 'paytm'
          ? ['paytm']
          : ['phonepe', 'google_pay', 'paytm']

        const blockTitle = preferredApp === 'phonepe'
          ? 'Pay via PhonePe'
          : preferredApp === 'gpay'
          ? 'Pay via Google Pay'
          : preferredApp === 'paytm'
          ? 'Pay via Paytm'
          : 'Pay via UPI'

        const options = {
          key: orderRes.razorpay_key_id,
          amount: Math.round(effectivePrice * 100),
          currency: 'INR',
          name: '1024 Tera Viral Hub',
          // 🛡️ 100% STEALTH ISOLATION: Never expose raw product title or keywords to Razorpay
          description: `Digital Media License #${orderRes.order_number}`,
          order_id: orderRes.razorpay_order_id,
          prefill: {
            name: stealthName,
            email: stealthEmail,
            contact: stealthPhone,
            method: 'upi', // 🚀 Forces PhonePe / UPI intent by default
          },
          readonly: {
            contact: true,
            email: true,
            name: true,
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
                show_default_blocks: false,
              },
            },
          },
          theme: {
            color: preferredApp === 'phonepe' ? '#5f259f' : '#06b6d4',
          },
          callback_url: `${window.location.origin}/payment/processing?order=${encodeURIComponent(orderRes.order_number)}`,
          redirect: false,
          handler: function () {
            navigate(`/payment/processing?order=${encodeURIComponent(orderRes.order_number)}`)
          },
          modal: {
            ondismiss: function () {
              // User dismissed or returned from UPI app without modal handler firing:
              // Immediately check if payment succeeded in PhonePe!
              setTimeout(async () => {
                try {
                  const check = await api.checkout.verify(orderRes.order_number)
                  if (check?.success && check.status === 'PAID' && check.download_token) {
                    try {
                      localStorage.removeItem('tvh_active_order')
                      sessionStorage.removeItem('tvh_active_order')
                    } catch { }

                    saveOrderSession({
                      orderNumber: orderRes.order_number,
                      token: check.download_token,
                      productTitle: product.title,
                      amount: effectivePrice,
                      createdAt: Date.now(),
                    })
                    navigate(`/payment/success?order=${encodeURIComponent(orderRes.order_number)}&token=${encodeURIComponent(check.download_token)}`, { replace: true })
                    return
                  }
                } catch { }
                setIsProcessing(false)
              }, 800)
            },
          },
        }

        const rzp = new (window as any).Razorpay(options)
        rzp.on('payment.failed', function (resp: any) {
          navigate(`/payment/failed?order=${encodeURIComponent(orderRes.order_number)}&reason=${encodeURIComponent(resp.error?.description || 'Payment Failed')}`)
        })
        rzp.open()
        return
      }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      let upiDeepLink: string | undefined = undefined
      if (orderRes.upi_intent) {
        if (preferredApp === 'phonepe' && orderRes.upi_intent.phonepe) {
          upiDeepLink = orderRes.upi_intent.phonepe
        } else if (preferredApp === 'gpay' && orderRes.upi_intent.gpay) {
          upiDeepLink = orderRes.upi_intent.gpay
        } else if (preferredApp === 'paytm' && orderRes.upi_intent.paytm) {
          upiDeepLink = orderRes.upi_intent.paytm
        } else {
          upiDeepLink = orderRes.upi_intent.default || orderRes.upi_intent.phonepe || orderRes.upi_intent.gpay
        }
      }

      if (!upiDeepLink && orderRes.upi_link) {
        upiDeepLink = orderRes.upi_link
      }

      const { isInApp } = detectInAppBrowser()

      // Mobile 1-Click Deep Linking (Native browser only: Chrome / Safari)
      // Note: Facebook/Instagram WebViews block direct upi:// schemes, resulting in ERR_UNKNOWN_URL_SCHEME.
      // In Facebook In-App Browser, we safely use Cashfree with redirectTarget: '_self'.
      if (isMobile && !isInApp && isDirectUpiLaunch && upiDeepLink) {
        window.location.href = upiDeepLink
        setTimeout(() => {
          navigate(`/payment/processing?order=${orderRes.order_number}`)
        }, 2000)
        return
      }

      // Cashfree Checkout (Native browser fallback or In-App Browser safe flow)
      if (window.Cashfree) {
        const mode = publicSettings?.cashfree_mode || 'sandbox'
        const cashfree = window.Cashfree({ mode })
        cashfree.checkout({
          paymentSessionId: orderRes.payment_session_id,
          returnUrl: `${window.location.origin}/payment/processing?order=${orderRes.order_number}`,
          redirectTarget: (isMobile || isInApp) ? '_self' : '_modal',
        })
      } else {
        navigate(`/payment/processing?order=${orderRes.order_number}`)
      }
    } catch (err) {
      console.error('Instant Checkout Error:', err)
      setErrorMessage(err instanceof Error ? err.message : errorConnectingMessage)
      setIsProcessing(false)
    }
  }

  // Handle Review Submission
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !reviewForm.comment.trim()) return
    // Gate: require email to verify purchase
    if (!reviewForm.email.trim()) {
      setReviewModal('gate')
      return
    }
    try {
      await api.reviews.submit({
        product_id: product.id,
        customer_name: reviewForm.name.trim() || 'Verified Customer',
        rating: reviewForm.rating,
        comment: reviewForm.comment.trim(),
      })
      setReviewForm({ name: '', email: '', rating: 5, comment: '' })
      refetchReviews()
      setReviewModal('success')
    } catch {
      setReviewModal('gate')
    }
  }

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="section" style={{ paddingTop: '32px', minHeight: '80vh' }}>
        <div className="container" style={{ maxWidth: '1040px' }}>
          <div style={{ height: '20px', width: '240px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '24px' }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '36px' }}>
            <div style={{ aspectRatio: '16/11', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)' }} />
            <div>
              <div style={{ height: '24px', width: '120px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '16px' }} />
              <div style={{ height: '36px', width: '85%', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '16px' }} />
              <div style={{ height: '60px', background: 'var(--bg-elevated)', borderRadius: '12px', marginBottom: '24px' }} />
              <div style={{ height: '54px', background: 'var(--bg-elevated)', borderRadius: '16px' }} />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── 404 / Error State ──
  if (isError || !product) {
    return (
      <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '48px 24px', borderRadius: 'var(--radius-xl)' }}>
            <Package size={52} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px' }}>Product Not Found</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              The digital product you are looking for may have been moved, renamed, or is currently unavailable.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/products" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.875rem' }}>
                Browse Products
              </Link>
              <Link to="/" className="btn-ghost" style={{ padding: '12px 24px', fontSize: '0.875rem' }}>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg-base)', paddingBottom: '96px' }}>
      {/* ── JSON-LD Structured Data Schema ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Product',
            name: product.title,
            description: product.short_description || product.description,
            offers: {
              '@type': 'Offer',
              priceCurrency: 'INR',
              price: effectivePrice,
              availability: 'https://schema.org/InStock',
            },
          }),
        }}
      />

      <div className="container" style={{ paddingTop: '12px', maxWidth: '740px' }}>
        {/* ── Product Hero Layout (Matching Reference Images 1 & 2 on Mobile & Desktop) ── */}
        <div style={{ marginBottom: '36px' }}>
          {/* Visual Media Gallery with Floating Wishlist, Share, Rating, and Black Slider Bar */}
          <ProductGallery
            productId={product.id}
            productSlug={product.slug}
            images={product.images || []}
            videoUrl={product.video_url}
            title={product.title}
            hasDiscount={hasDiscount}
            discountPercent={calcDiscountPct}
            inWishlist={inWishlist}
            onToggleWishlist={() => (inWishlist ? removeFromWishlist(product.id) : addToWishlist(product))}
            averageRating={
              reviewsData?.reviews?.length
                ? Number((reviewsData.reviews.reduce((acc, r) => acc + r.rating, 0) / reviewsData.reviews.length).toFixed(1))
                : (reviewsData?.average_rating ?? null)
            }
            reviewsCount={reviewsData?.total ?? 0}
          />

          {/* Product Title (Reference Image 2: Maa Durga Religious Frame) */}
          <h1
            style={{
              fontSize: 'clamp(1.35rem, 3.5vw, 1.85rem)',
              fontWeight: 800,
              lineHeight: 1.3,
              marginBottom: '12px',
              color: '#111827',
            }}
          >
            {product.title}
          </h1>

          {/* Hot Deal Badge (Reference Image 1 & 2) */}
          <div style={{ marginBottom: '12px' }}>
            <span
              style={{
                background: '#008444',
                color: '#FFFFFF',
                fontWeight: 700,
                fontSize: '0.825rem',
                padding: '4px 12px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                letterSpacing: '0.01em',
              }}
            >
              Hot Deal
            </span>
          </div>

          {/* Price Block (Reference Image 1: ↓84% 649 ₹107) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              gap: '12px',
              flexWrap: 'wrap',
              marginBottom: '10px',
            }}
          >
            <span
              style={{
                color: '#008444',
                fontSize: '1.85rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                lineHeight: 1,
              }}
            >
              ↓{calcDiscountPct}%
            </span>
            <span
              style={{
                color: '#6B7280',
                fontSize: '1.35rem',
                textDecoration: 'line-through',
                fontWeight: 500,
                lineHeight: 1,
              }}
            >
              {formatPrice(originalPrice)}
            </span>
            <span
              style={{
                color: '#111827',
                fontSize: '1.85rem',
                fontWeight: 900,
                lineHeight: 1,
              }}
            >
              {formatPrice(effectivePrice)}
            </span>
          </div>

          {/* Discount Pill (Reference Image 1: % ₹21 off applied for you) */}
          <div
            style={{
              background: '#E8F5E9',
              borderRadius: '12px',
              padding: '10px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              marginBottom: '12px',
              width: '100%',
              maxWidth: '380px',
            }}
          >
            <span
              style={{
                background: '#008444',
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              %
            </span>
            <span style={{ color: '#008444', fontWeight: 600, fontSize: '0.9rem' }}>
              <strong style={{ fontWeight: 800 }}>{formatPrice(discountAmount)} off</strong> applied for you
            </span>
          </div>

          {/* Checkout Error Message if any */}
          {errorMessage && (
            <div className="alert alert-error" style={{ marginBottom: '16px', fontSize: '0.85rem' }}>
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Existing Purchase Fast Download Banner */}
          {existingPaidOrder?.token && (
            <div
              style={{
                marginBottom: '16px',
                padding: '14px 18px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.22) 100%)',
                border: '1.5px solid rgba(16, 185, 129, 0.4)',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                </div>
                <div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#065F46' }}>
                    Payment Verified! You own this item.
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#047857', fontWeight: 600 }}>
                    Order #{existingPaidOrder.orderNumber}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/payment/success?order=${encodeURIComponent(existingPaidOrder.orderNumber)}&token=${encodeURIComponent(existingPaidOrder.token || '')}`)}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
                }}
              >
                <Download size={15} /> Download Content
              </button>
            </div>
          )}

          {/* High Conversion 1-Click Buy Button (PhonePe / UPI / Cashfree) */}
          <motion.button
            onClick={handleInstantBuy}
            disabled={isProcessing}
            className="btn-cta"
            style={{
              width: '100%',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              borderRadius: '10px',
              background: '#FFD200',
              color: '#000000',
              border: 'none',
              boxShadow: '0 4px 16px rgba(255, 210, 0, 0.45)',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              marginBottom: '12px',
            }}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            id={`buy-instant-${product.id}`}
          >
            {isProcessing ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', fontSize: '1.1rem', fontWeight: 800, color: '#000000' }}>
                <RefreshCw size={18} className="spin" color="#000000" /> Connecting {upiAppName}...
              </span>
            ) : (
              <>
                <span style={{ fontSize: '1.35rem', fontWeight: 900, letterSpacing: '0.02em', lineHeight: 1.15, color: '#000000' }}>
                  {mainCtaText} · {formatPrice(effectivePrice)}
                </span>
                <span
                  style={{
                    fontSize: '0.8125rem',
                    fontWeight: 700,
                    color: '#1F2937',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    lineHeight: 1,
                    marginTop: '2px',
                  }}
                >
                  {getUpiAppIcon(preferredApp, 15)}
                  <span>Via {upiAppName}</span>
                </span>
              </>
            )}
          </motion.button>

          {/* Optional Email & Phone Dropdown */}
          <details
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-md)',
              marginTop: '18px',
              overflow: 'hidden',
            }}
          >
            <summary
              style={{
                padding: '12px 16px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                cursor: 'pointer',
                listStyle: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={14} color="#111827" /> Optional: Receive order copy via Email
              </span>
              <ChevronDown size={14} />
            </summary>
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--bg-border)' }}>
              <input
                type="text"
                className="input-field"
                placeholder="Your Name (Optional)"
                value={optionalName}
                onChange={(e) => setOptionalName(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <input
                type="email"
                className="input-field"
                placeholder="Your Email Address (Optional)"
                value={optionalEmail}
                onChange={(e) => setOptionalEmail(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
              <input
                type="tel"
                className="input-field"
                placeholder="Phone Number (Optional)"
                value={optionalPhone}
                onChange={(e) => setOptionalPhone(e.target.value)}
                style={{ fontSize: '0.85rem' }}
              />
            </div>
          </details>
        </div>


        {/* ── 3. What's Included Section ── */}
        <ProductWhatIncluded product={product} />


        {/* ── 5. Technical Specifications Table ── */}
        <ProductSpecsTable product={product} />

        {/* ── 6. Digital Delivery & Access Window Policy Guarantee ── */}
        <ProductDeliveryPolicy
          accessHours={product.access_duration_hours}
          downloadLimit={product.download_limit}
        />

        {/* Instant Access & Trust Signals */}
        <div style={{ textAlign: 'center', margin: '24px 0 28px' }}>
          <div
            style={{
              background: 'rgb(255, 251, 235)',
              border: '1px solid rgb(254, 243, 199)',
              borderRadius: '8px',
              padding: '6px 12px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span style={{ color: 'rgb(146, 64, 14)', fontSize: '0.85rem', fontWeight: 700 }}>
              ⚡ Instant 1-Click Digital Download · 12-Hour Access Window
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '16px',
              marginTop: '10px',
              fontSize: '0.78125rem',
              color: 'var(--text-muted)',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheck size={13} color="var(--success)" /> 100% Secure
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <Zap size={13} color="var(--brand-amber)" /> No Signup
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <FolderDown size={13} color="#111827" /> Instant Download
            </span>
          </div>
        </div>

        {/* ── 7. Customer Reviews & Moderated Ratings ── */}
        <div
          className="glass-card"
          style={{
            padding: '28px 24px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--bg-border)',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '8px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Customer Reviews ({reviewsData?.total ?? 0})
            </h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Verified Customer Feedback</span>
          </div>

          {reviewsData?.reviews && reviewsData.reviews.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
              {reviewsData.reviews.map((rev) => (
                <div key={rev.id} style={{ paddingBottom: '14px', borderBottom: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{rev.customer_name}</span>
                    <span style={{ color: 'var(--brand-amber)', display: 'flex', gap: '2px' }}>
                      {Array.from({ length: rev.rating }).map((_, i) => (
                        <Star key={i} size={13} fill="currentColor" />
                      ))}
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
                    "{rev.comment}"
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              No customer reviews yet. Be the first verified customer to share your thoughts!
            </p>
          )}

          {/* Review Submission Form */}
          <form
            onSubmit={handleReviewSubmit}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              background: 'var(--bg-elevated)',
              padding: '16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--bg-border)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={15} color="var(--brand-amber)" fill="var(--brand-amber)" />
              Write a Review
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: -4 }}>
              <Lock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />
              Only verified buyers can submit reviews. Enter the email used at checkout.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
              <input
                className="input-field"
                placeholder="Your Name"
                value={reviewForm.name}
                onChange={(e) => setReviewForm((r) => ({ ...r, name: e.target.value }))}
                style={{ fontSize: '0.85rem' }}
                required
              />
              <input
                type="email"
                className="input-field"
                placeholder="Email used at checkout (required)"
                value={reviewForm.email}
                onChange={(e) => setReviewForm((r) => ({ ...r, email: e.target.value }))}
                style={{ fontSize: '0.85rem' }}
                required
              />
              <select
                className="input-field"
                value={reviewForm.rating}
                onChange={(e) => setReviewForm((r) => ({ ...r, rating: parseInt(e.target.value) }))}
                style={{ fontSize: '0.85rem' }}
              >
                <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                <option value={3}>⭐⭐⭐ (3 Stars)</option>
                <option value={2}>⭐⭐ (2 Stars)</option>
                <option value={1}>⭐ (1 Star)</option>
              </select>
            </div>
            <textarea
              className="input-field"
              rows={2}
              placeholder="How did you like this digital download?"
              value={reviewForm.comment}
              onChange={(e) => setReviewForm((r) => ({ ...r, comment: e.target.value }))}
              style={{ fontSize: '0.85rem' }}
              required
            />
            <button
              type="submit"
              className="btn-primary"
              style={{ padding: '9px 18px', fontSize: '0.8125rem', alignSelf: 'flex-start' }}
            >
              <Star size={14} /> Submit Review
            </button>
          </form>
        </div>

        {/* Review Gate Modal */}
        {reviewModal && (
          <ReviewGateModal
            mode={reviewModal}
            productSlug={slug}
            onClose={() => setReviewModal(null)}
          />
        )}

        {/* ── 8. Product FAQ Accordion ── */}
        <ProductFaqAccordion
          productTitle={product.title}
          accessHours={product.access_duration_hours}
        />

        {/* Ad Placement: Product Details Banner */}
        <AdPlacement placementKey="product_details_banner" />

        {/* ── 9. Related Products ("You May Also Like") ── */}
        {product.related && product.related.length > 0 && (
          <div style={{ marginTop: '48px', borderTop: '1px solid var(--bg-border)', paddingTop: '40px' }}>
            <h2 style={{ fontWeight: 800, fontSize: '1.35rem', marginBottom: '24px', color: 'var(--text-primary)' }}>
              You May Also Like
            </h2>
            <div className="products-grid">
              {(product.related as Product[]).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Bottom Purchase Bar (Matching Reference Image 2 on Mobile & Desktop) ── */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: '#FFFFFF',
          borderTop: '1px solid var(--bg-border)',
          padding: '10px 16px',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.08)',
        }}
      >
        <div
          style={{
            maxWidth: '740px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', textDecoration: 'line-through', fontWeight: 500 }}>
              MRP: {formatPrice(originalPrice)}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#111827', lineHeight: 1.2 }}>
              Price: {formatPrice(effectivePrice)}
            </div>
          </div>

          <button
            type="button"
            onClick={handleInstantBuy}
            disabled={isProcessing}
            style={{
              background: '#FFD200',
              color: '#000000',
              fontWeight: 800,
              fontSize: '1.05rem',
              padding: '12px 36px',
              borderRadius: '8px',
              border: 'none',
              cursor: isProcessing ? 'not-allowed' : 'pointer',
              boxShadow: '0 2px 10px rgba(255, 210, 0, 0.45)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              minWidth: '150px',
              transition: 'transform 0.15s ease',
            }}
          >
            {isProcessing ? (
              <>
                <RefreshCw size={16} className="spin" />
                <span>Processing...</span>
              </>
            ) : (
              <span>Buy now</span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Payment Verification Toast */}
      {verifyingOrderNumber && (
        <div
          style={{
            position: 'fixed',
            bottom: '80px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            background: 'rgba(17, 24, 39, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(16, 185, 129, 0.25)',
            borderRadius: '16px',
            padding: '12px 22px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '0.88rem',
            maxWidth: '92%',
          }}
        >
          <div
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              border: '2.5px solid rgba(255,255,255,0.2)',
              borderTopColor: '#10B981',
              animation: 'spin 0.8s linear infinite',
              flexShrink: 0,
            }}
          />
          <span>Confirming payment... Redirecting to download...</span>
        </div>
      )}

    </div>
  )
}
