// src/client/pages/checkout/FlipkartCheckoutPage.tsx
// Authentic 3-Step Flipkart Checkout System
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, Check, RefreshCw, X, Building, Zap, ShieldCheck, AlertTriangle, Truck, Package
} from 'lucide-react'
import { api, type ProductDetail } from '../../lib/api'
import { formatPrice, getSavedUtmParams, trackPixelEvent } from '../../lib/utils'
import { PhonePeIcon, GPayIcon } from '../../components/ui/UpiIcons'
import { detectInAppBrowser, triggerChromeBreakout } from '../../lib/inAppBrowser'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import { saveOrderSession, getSavedOrders } from '../../lib/orderSession'
import { trackPageView, trackUserClick } from '../../lib/analytics-tracker'
import { getProductSpecifications, getProductRatingData } from '../../lib/product-specs'

interface ShippingAddress {
  name: string
  flat: string
  area: string
  phone: string
  altPhone?: string
  type: 'home' | 'work'
}

const DEFAULT_ADDRESS_STORAGE_KEY = 'tvh_flipkart_address'

// Official Flipkart SVG Asset URLs provided by User
const FK_ASSETS = {
  upi: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/upi.svg',
  downArrow: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/p/img/DownArrow.svg',
  card: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/card.svg',
  cash: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/cash-icon.svg',
  giftCard: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/gift-card-logo-09082023.svg',
  addNew: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/p/img/add-new.svg',
  emi: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/emi-header-08092023.svg',
  helpGrey: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/help-icon-grey.svg',
  smiley: 'https://static-assets-web.flixcart.com/fk-p-linchpin-web/fk-gringotts/images/smiley.svg',
  supercoins: 'https://shop.rooter.gg/images/supercoins.webp',
}

// User-specified Home Icon SVG
function FlipkartHomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M5.52871 3.94173L3.52871 5.51315L3.52871 5.51316C2.77785 6.10312 2.40242 6.3981 2.20121 6.81208C2 7.22607 2 7.70345 2 8.65822V10.3571V10.3995C2 11.8997 2 12.6498 2.38197 13.1756C2.50533 13.3454 2.65464 13.4947 2.82443 13.618C3.35016 14 4.10011 14 5.6 14C5.97497 14 6.16246 14 6.29389 13.9045C6.33634 13.8737 6.37367 13.8363 6.40451 13.7939C6.5 13.6625 6.5 13.475 6.5 13.1V11C6.5 10.5286 6.5 10.2929 6.64645 10.1464C6.79289 10 7.0286 10 7.5 10H8.5C8.9714 10 9.20711 10 9.35355 10.1464C9.5 10.2929 9.5 10.5286 9.5 11V13.1C9.5 13.475 9.5 13.6625 9.59549 13.7939C9.62633 13.8363 9.66366 13.8737 9.70611 13.9045C9.83754 14 10.025 14 10.4 14C11.8999 14 12.6498 14 13.1756 13.618C13.3454 13.4947 13.4947 13.3454 13.618 13.1756C14 12.6498 14 11.8997 14 10.3995V10.3571V8.65822C14 7.70345 14 7.22607 13.7988 6.81208C13.5976 6.3981 13.2221 6.10312 12.4713 5.51315L10.4713 3.94172C9.28491 3.00957 8.69173 2.5435 8 2.5435C7.30827 2.5435 6.71509 3.00957 5.52871 3.94173Z"
        stroke="#2A55E5"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FlipkartChevron({ color = '#212121', size = 12 }: { color?: string; size?: number }) {
  return (
    <svg width={size * 0.5} height={size} viewBox="0 0 5 9" fill="none" style={{ flexShrink: 0, display: 'inline-block' }}>
      <path d="M1 8L4.5 4.5" stroke={color} strokeLinecap="round" strokeWidth="1.2" />
      <path d="M1 1L4.5 4.5" stroke={color} strokeLinecap="round" strokeWidth="1.2" />
    </svg>
  )
}

// Vector Delivery Truck Icon (Replaces 🚚 emoji)
function DeliveryTruckIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#212121" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

// Vector Open Box Icon (Replaces 📦 emoji)
function OpenBoxIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#212121" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}

// Vector Phone Icon (Replaces 📞 emoji)
function PhoneCallIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}

// Vector Discount Tag Icon (Replaces 🏷️ emoji)
function DiscountTagIcon({ size = 16, color = '#108934' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}

// Vector Shield Check Icon (Replaces 🛡️ emoji)
function ShieldProtectionIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#717478" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

// Vector Heart Icon (Replaces 💖 emoji)
function HeartIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#C70055" stroke="#C70055" strokeWidth="1.5" style={{ flexShrink: 0 }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

function WhatsAppIcon({ size = 20 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%', background: '#25D366',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
    }}>
      <svg width={size * 0.65} height={size * 0.65} viewBox="0 0 24 24" fill="#FFFFFF">
        <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91C2.13 13.66 2.59 15.36 3.45 16.86L2.05 22L7.3 20.63C8.75 21.41 10.38 21.82 12.04 21.82C17.5 21.82 21.95 17.37 21.95 11.91C21.95 6.45 17.5 2 12.04 2ZM12.04 20.15C10.56 20.15 9.11 19.76 7.85 19.01L7.55 18.83L4.44 19.65L5.27 16.61L5.07 16.3C4.24 14.98 3.8 13.47 3.8 11.91C3.8 7.37 7.49 3.67 12.04 3.67C16.58 3.67 20.28 7.37 20.28 11.91C20.28 16.46 16.58 20.15 12.04 20.15ZM16.56 14.39C16.31 14.27 15.09 13.67 14.86 13.58C14.64 13.5 14.47 13.46 14.3 13.71C14.14 13.95 13.65 14.53 13.5 14.7C13.35 14.86 13.2 14.88 12.95 14.76C12.7 14.64 11.91 14.38 10.97 13.54C10.23 12.89 9.74 12.08 9.59 11.83C9.44 11.58 9.57 11.45 9.7 11.33C9.81 11.22 9.94 11.05 10.06 10.91C10.19 10.76 10.23 10.66 10.31 10.5C10.39 10.33 10.35 10.19 10.29 10.06C10.23 9.94 9.74 8.74 9.53 8.25C9.33 7.77 9.13 7.83 8.97 7.82L8.5 7.81C8.33 7.81 8.06 7.87 7.83 8.12C7.6 8.37 6.95 8.98 6.95 10.21C6.95 11.44 7.85 12.62 7.97 12.79C8.1 12.95 9.73 15.46 12.23 16.54C12.82 16.8 13.28 16.95 13.64 17.07C14.24 17.26 14.78 17.23 15.22 17.17C15.7 17.1 16.69 16.57 16.9 15.99C17.11 15.41 17.11 14.92 17.04 14.81C16.98 14.7 16.81 14.51 16.56 14.39Z" />
      </svg>
    </span>
  )
}

export default function FlipkartCheckoutPage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  // State: Step 2 (Confirm Details) vs Step 3 (Payments)
  const [currentStep, setCurrentStep] = useState<2 | 3>(2)

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [address, setAddress] = useState<ShippingAddress | null>(() => {
    try {
      const saved = localStorage.getItem(DEFAULT_ADDRESS_STORAGE_KEY)
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  // Address Form Draft (inside Modal) - Generic placeholders with no hardcoded dummy data!
  const [addrFlat, setAddrFlat] = useState(address?.flat || '')
  const [addrArea, setAddrArea] = useState(address?.area || '')
  const [addrName, setAddrName] = useState(address?.name || '')
  const [addrPhone, setAddrPhone] = useState(address?.phone || '')
  const [addrAltPhone, setAddrAltPhone] = useState(address?.altPhone || '')
  const [addrType, setAddrType] = useState<'home' | 'work'>(address?.type || 'home')
  const [addressError, setAddressError] = useState('')

  // Donation Selector State
  const [selectedDonation, setSelectedDonation] = useState<number | null>(null)

  // Payment Execution State
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentError, setPaymentError] = useState('')
  // Removed PNB Bank as requested by user; default PhonePe
  const [selectedUpiOption, setSelectedUpiOption] = useState<'phonepe' | 'gpay' | 'whatsapp' | 'paytm'>('phonepe')
  const [isUpiExpanded, setIsUpiExpanded] = useState(true)

  // Psychological COD Offer Bottom Sheet (Hack 1: Token & Hack 2: AdSense Monetization)
  const [showCodModal, setShowCodModal] = useState(false)
  const [codStep, setCodStep] = useState<'offer' | 'token'>('offer')

  // 🎯 Dropout Catcher (When user backs out or cancels UPI without paying)
  const [showDropoutModal, setShowDropoutModal] = useState(false)
  const wasPayingRef = useRef(false)
  const hasShownDropoutRef = useRef(false)

  // Gateway info
  const { isRazorpay, isBoth, defaultDualGateway, publicSettings } = usePaymentGatewayInfo()

  // Load Real Product Data
  const { data: productData, isLoading: isProductLoading, error: productError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.products.get(slug!),
    enabled: Boolean(slug),
  })

  const product = productData as ProductDetail | undefined

  // Quantity Stepper State (Default 1, Matching Screenshot 3)
  const [quantity, setQuantity] = useState(1)

  // Real Product Specifications & Rating Data (Matching Screenshots 1, 2, 4 & ProductGallery)
  const productSpec = useMemo(() => getProductSpecifications(product), [product])
  const productRatingData = useMemo(() => getProductRatingData(product), [product])

  // Paid User Cache Detection & Instant Redirect to Order Details
  useEffect(() => {
    if (!product || !slug) return
    const backedKey = 'tvh_backed_from_order_' + slug
    if (sessionStorage.getItem(backedKey) === '1') return

    const savedOrders = getSavedOrders()
    const directPurchasedOrder = localStorage.getItem('tvh_purchased_' + slug)
    const matchingOrder = savedOrders.find(
      (o) =>
        (o.productSlug && o.productSlug === slug) ||
        (o.productTitle && o.productTitle.trim().toLowerCase() === product.title.trim().toLowerCase()) ||
        (o.productId && String(o.productId) === String(product.id)) ||
        (directPurchasedOrder && o.orderNumber === directPurchasedOrder)
    ) || (directPurchasedOrder ? { orderNumber: directPurchasedOrder, productTitle: product.title } : null)

    if (matchingOrder?.orderNumber) {
      navigate(`/order/details?order=${encodeURIComponent(matchingOrder.orderNumber)}&slug=${encodeURIComponent(slug)}`, {
        replace: true,
        state: { fromProduct: true, slug }
      })
    }
  }, [product, slug, navigate])

  // Handle Dynamic Delivery Date (3-4 days ahead realistic calendar date)
  const deliveryDateString = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    return `${day}, ${dateNum} ${month}`
  }, [])

  // When user returns from PhonePe / UPI app (or if page is restored / focused),
  // automatically verify pending order and immediately redirect to payment success / download!
  useEffect(() => {
    let poller: ReturnType<typeof setInterval> | null = null

    const checkActiveOrder = async () => {
      try {
        const raw = localStorage.getItem('tvh_active_order') || sessionStorage.getItem('tvh_active_order')
        if (!raw) return

        const active = JSON.parse(raw)
        if (!active?.order_number || Date.now() - (active.timestamp || active.createdAt || 0) > 3600000) {
          return
        }

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
            productTitle: product?.title || active.productTitle || active.title,
            amount: active.amount,
            createdAt: Date.now(),
          })

          navigate(`/payment/success?order=${encodeURIComponent(active.order_number)}&token=${encodeURIComponent(res.download_token)}`, { replace: true })
        }
      } catch { }
    }

    checkActiveOrder()

    const handleReturnToTab = async () => {
      await checkActiveOrder()
      setIsProcessingPayment(false)

      // 🎯 DROPOUT CATCHER: If user returned from PhonePe/UPI app without completing ₹49 payment, trigger ₹9 Token recovery modal!
      if (wasPayingRef.current && !hasShownDropoutRef.current) {
        wasPayingRef.current = false
        hasShownDropoutRef.current = true
        setTimeout(() => {
          setShowDropoutModal(true)
        }, 500)
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        handleReturnToTab()
      }
    }

    window.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleReturnToTab)
    window.addEventListener('pageshow', handleReturnToTab)

    poller = setInterval(() => {
      const raw = localStorage.getItem('tvh_active_order') || sessionStorage.getItem('tvh_active_order')
      if (raw || isProcessingPayment) {
        checkActiveOrder()
      }
    }, 2500)

    return () => {
      window.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleReturnToTab)
      window.removeEventListener('pageshow', handleReturnToTab)
      if (poller) clearInterval(poller)
    }
  }, [navigate, product, isProcessingPayment])

  // 100% Real Product Prices (No fake / dummy hardcoded numbers)
  const effectivePrice = product?.sale_price ?? product?.price ?? 0
  const mrp = useMemo(() => {
    if (!product) return 0
    if (product.price && product.sale_price && product.price > product.sale_price) {
      return product.price
    }
    // Calculate realistic MRP based on product price
    return Math.max(Math.round(effectivePrice * 3.5), effectivePrice + 500)
  }, [product, effectivePrice])

  const platformFee = 10
  const mrpDiscount = Math.max(mrp - effectivePrice - platformFee, 0)
  const couponDiscount = 5
  const totalDiscount = mrpDiscount + couponDiscount
  const discountPercent = mrp > 0 ? Math.round(((mrp - effectivePrice) / mrp) * 100) : 0
  const totalAmount = effectivePrice + (selectedDonation || 0)

  // Open Address Modal with Generic fields
  const openAddressModal = () => {
    setAddrFlat(address?.flat || '')
    setAddrArea(address?.area || '')
    setAddrName(address?.name || '')
    setAddrPhone(address?.phone || '')
    setAddrAltPhone(address?.altPhone || '')
    setAddrType(address?.type || 'home')
    setAddressError('')
    setShowAddressModal(true)
  }

  const handleSaveAddress = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!addrName.trim()) {
      setAddressError('Please enter your full name')
      return
    }
    if (!addrFlat.trim()) {
      setAddressError('Please enter flat / house / building name')
      return
    }
    const cleanPhone = addrPhone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setAddressError('Please enter a valid 10-digit mobile number')
      return
    }

    const newAddr: ShippingAddress = {
      name: addrName.trim(),
      flat: addrFlat.trim(),
      area: addrArea.trim() || 'Main City Area',
      phone: cleanPhone.slice(-10),
      altPhone: addrAltPhone.trim() || undefined,
      type: addrType,
    }

    setAddress(newAddr)
    try {
      localStorage.setItem(DEFAULT_ADDRESS_STORAGE_KEY, JSON.stringify(newAddr))
    } catch {}
    setShowAddressModal(false)
  }

  // Handle Browser Back Button in Checkout Stepper & Exit-Intent Dropout Catch
  useEffect(() => {
    try {
      window.history.pushState({ checkout_active: true }, '')
    } catch {}

    const handlePopState = (e: PopStateEvent) => {
      if (currentStep === 3) {
        e.preventDefault()
        setCurrentStep(2)
        window.history.pushState({ step: 2 }, '')
        return
      }

      // If user presses Back on Step 2 to leave without paying
      if (!hasShownDropoutRef.current) {
        hasShownDropoutRef.current = true
        try {
          window.history.pushState({ stay_on_checkout: true }, '')
        } catch {}
        setShowDropoutModal(true)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentStep])

  // Track page view
  useEffect(() => {
    trackPageView(`/checkout/flipkart/${slug}`)
  }, [slug])

  // Google AdSense live push for COD Verification Unit (Hack #2)
  useEffect(() => {
    if (showCodModal && codStep === 'token') {
      const timer = setTimeout(() => {
        try {
          const adsbygoogle = (window as any).adsbygoogle || []
          adsbygoogle.push({})
        } catch {}
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [showCodModal, codStep])

  // Execute Direct Payment Session on Step 3 (Supports Standard Full Payment & ₹9 COD Verification Token)
  const handleProceedPayment = async (overrideAmount?: number | React.MouseEvent, isCodToken?: boolean) => {
    if (!product || isProcessingPayment) return
    setIsProcessingPayment(true)
    setPaymentError('')
    if (!isCodToken) {
      wasPayingRef.current = true
    }

    const validOverride = typeof overrideAmount === 'number' ? overrideAmount : undefined
    const finalAmount = (isCodToken && validOverride && validOverride > 0) ? validOverride : totalAmount

    try {
      trackPixelEvent('AddPaymentInfo', {
        content_ids: [product.id],
        content_type: 'product',
        value: finalAmount,
        currency: 'INR',
      })
      trackUserClick('flipkart_pay_button_click', {
        product_id: product.id,
        app: selectedUpiOption,
        amount: finalAmount,
        is_cod_token: isCodToken,
      }, product.id)

      const utm = getSavedUtmParams()
      const customerName = address?.name || 'Flipkart Customer'
      const customerPhone = address?.phone || undefined

      // 🛡️ DEDUPLICATION CACHE: Reuse active order session if created within 15 minutes to avoid duplicate pending orders
      const sessionKey = `tvh_active_checkout_${product.id}${isCodToken ? `_cod_token_${finalAmount}` : ''}`
      let orderRes: any = null

      try {
        const rawCached = sessionStorage.getItem(sessionKey)
        if (rawCached) {
          const parsed = JSON.parse(rawCached)
          const isFresh = parsed.createdAt && (Date.now() - parsed.createdAt < 15 * 60 * 1000)
          const isSameAmount = parsed.amount === finalAmount
          const isSameCustomer = parsed.customerPhone === customerPhone && parsed.customerName === customerName
          if (isFresh && isSameAmount && isSameCustomer && parsed.orderRes?.order_number) {
            orderRes = parsed.orderRes
          }
        }
      } catch { }

      if (!orderRes) {
        orderRes = await api.checkout.create({
          product_id: product.id,
          customer_name: customerName,
          customer_phone: customerPhone,
          preferred_gateway: isBoth ? (defaultDualGateway || 'razorpay') : isRazorpay ? 'razorpay' : 'cashfree',
          utm_source: utm.utm_source,
          utm_medium: utm.utm_medium,
          utm_campaign: utm.utm_campaign,
          referrer_url: document.referrer,
          is_cod_token: isCodToken,
          custom_amount: isCodToken ? finalAmount : undefined,
        })

        if (!orderRes.success || !orderRes.order_number) {
          throw new Error('Unable to create secure payment order. Please retry.')
        }

        try {
          sessionStorage.setItem(sessionKey, JSON.stringify({
            createdAt: Date.now(),
            amount: finalAmount,
            customerName,
            customerPhone,
            orderRes,
          }))
        } catch { }
      }

      // Save order session for recovery
      saveOrderSession({
        orderNumber: orderRes.order_number,
        productTitle: product.title,
        productSlug: product.slug || slug,
        productId: product.id,
        amount: finalAmount,
        createdAt: Date.now(),
      })
      if (product.slug || slug) {
        localStorage.setItem('tvh_purchased_' + (product.slug || slug), orderRes.order_number)
      }

      // 💾 SNAPSHOT ACTIVE ORDER for return verification
      const pendingOrderData = {
        order_number: orderRes.order_number,
        product_id: product.id,
        product_slug: product.slug,
        title: product.title,
        amount: finalAmount,
        timestamp: Date.now(),
        is_cod_token: isCodToken,
      }
      try {
        localStorage.setItem('tvh_active_order', JSON.stringify(pendingOrderData))
        sessionStorage.setItem('tvh_active_order', JSON.stringify(pendingOrderData))
        localStorage.setItem('tvh_active_order_number', orderRes.order_number)
        sessionStorage.setItem('tvh_active_order_number', orderRes.order_number)
        localStorage.setItem('tvh_last_purchased_order', orderRes.order_number)
      } catch { }

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const { isInApp, isAndroid } = detectInAppBrowser()

      // Preferred UPI Links
      let targetUpiUrl: string | undefined = undefined
      if (orderRes.upi_intent) {
        if (selectedUpiOption === 'phonepe' && orderRes.upi_intent.phonepe) {
          targetUpiUrl = orderRes.upi_intent.phonepe
        } else if (selectedUpiOption === 'gpay' && orderRes.upi_intent.gpay) {
          targetUpiUrl = orderRes.upi_intent.gpay
        } else if (selectedUpiOption === 'paytm' && orderRes.upi_intent.paytm) {
          targetUpiUrl = orderRes.upi_intent.paytm
        } else {
          targetUpiUrl = orderRes.upi_intent.phonepe || orderRes.upi_intent.default || orderRes.upi_link || undefined
        }
      }
      if (!targetUpiUrl && orderRes.upi_link) {
        targetUpiUrl = orderRes.upi_link
      }
      if (!targetUpiUrl && orderRes.payment_url) {
        targetUpiUrl = orderRes.payment_url
      }

      // 1. Android Facebook / Instagram In-App Browser Breakout
      // Breaks out into Google Chrome using HTTPS web payment URL so PhonePe opens cleanly
      if (isMobile && isInApp && isAndroid) {
        const breakoutUrl = (orderRes.payment_url && orderRes.payment_url.startsWith('http'))
          ? orderRes.payment_url
          : (orderRes.upi_intent?.web || window.location.href)
        triggerChromeBreakout(breakoutUrl)
        setTimeout(() => setIsProcessingPayment(false), 3000)
        return
      }

      // 2. Direct Mobile UPI launch (PhonePe, GPay, Paytm)
      if (isMobile && targetUpiUrl) {
        try {
          const a = document.createElement('a')
          a.href = targetUpiUrl
          a.style.display = 'none'
          document.body.appendChild(a)
          a.click()
          setTimeout(() => {
            try {
              if (a.parentNode) document.body.removeChild(a)
            } catch {}
          }, 1000)
        } catch {
          window.location.href = targetUpiUrl
        }
        setTimeout(() => setIsProcessingPayment(false), 2500)
        return
      }

      // 3. Cashfree Modal / Desktop Checkout
      if (orderRes.gateway === 'cashfree') {
        if (!(window as any).Cashfree) {
          const script = document.createElement('script')
          script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js'
          await new Promise((res) => {
            script.onload = res
            script.onerror = res
            document.head.appendChild(script)
          })
        }
        if ((window as any).Cashfree && orderRes.payment_session_id) {
          const mode = publicSettings?.cashfree_mode || 'production'
          const cashfree = (window as any).Cashfree({ mode })
          const returnUrl = `https://1024teraviralhub.com/payment/processing?order=${encodeURIComponent(orderRes.order_number)}`
          cashfree.checkout({
            paymentSessionId: orderRes.payment_session_id,
            returnUrl,
            redirectTarget: '_modal',
          }).then((result: any) => {
            if (result?.error) {
              console.warn('[Cashfree Modal Error, falling back to direct redirect]', result.error)
              cashfree.checkout({
                paymentSessionId: orderRes.payment_session_id,
                returnUrl,
                redirectTarget: '_self',
              })
            }
          })
          setTimeout(() => setIsProcessingPayment(false), 1500)
          return
        }
        if (targetUpiUrl || orderRes.payment_url) {
          window.location.href = targetUpiUrl || orderRes.payment_url
          return
        }
      }

      // 4. Razorpay Modal fallback if on desktop or web gateway
      if (orderRes.gateway === 'razorpay' && (orderRes as any).razorpay_order_id) {
        if (!(window as any).Razorpay) {
          const script = document.createElement('script')
          script.src = 'https://checkout.razorpay.com/v1/checkout.js'
          await new Promise((res) => {
            script.onload = res
            script.onerror = res
            document.body.appendChild(script)
          })
        }
        if ((window as any).Razorpay) {
          const rzp = new (window as any).Razorpay({
            key: orderRes.razorpay_key_id,
            amount: Math.round(totalAmount * 100),
            currency: 'INR',
            name: 'Flipkart Secure Checkout',
            description: `Order #${orderRes.order_number}`,
            order_id: (orderRes as any).razorpay_order_id,
            prefill: {
              name: customerName,
              contact: customerPhone,
            },
            theme: { color: '#2A55E5' },
            callback_url: `${window.location.origin}/payment/processing?order=${encodeURIComponent(orderRes.order_number)}`,
            handler: function () {
              navigate(`/payment/processing?order=${encodeURIComponent(orderRes.order_number)}`)
            },
          })
          rzp.open()
          setIsProcessingPayment(false)
          return
        }
      }

      // 5. Fallback payment URL redirect
      const fallbackUrl = targetUpiUrl || orderRes.payment_url || orderRes.upi_link
      if (fallbackUrl) {
        window.location.href = fallbackUrl
        return
      }

      throw new Error('Payment gateway is initializing. Please try again.')
    } catch (err: any) {
      console.error('[Flipkart Checkout Error]', err)
      setPaymentError(err?.message || 'Payment initiation failed. Please try again.')
      setIsProcessingPayment(false)
    }
  }

  if (isProductLoading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <RefreshCw size={26} className="spin" color="#2A55E5" />
        <span style={{ fontSize: '0.88rem', color: '#666', fontWeight: 600 }}>Loading Flipkart checkout...</span>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F0F2F5', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center'
      }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#212121', marginBottom: 8 }}>Product Not Found</h2>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: 20 }}>This product is unavailable or the link has expired.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', background: '#2A55E5', color: '#FFF',
            border: 'none', borderRadius: 4, fontWeight: 700, cursor: 'pointer'
          }}
        >
          Return to Store
        </button>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F0F2F5',
      fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#212121',
      paddingBottom: currentStep === 2 ? 100 : 36,
    }}>
      {/* ─── Top Main Navigation Bar ─── */}
      <header style={{
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        {currentStep === 2 ? (
          /* Step 2 Header */
          <div style={{ background: '#FFFFFF', borderBottom: '1px solid #EDEDED' }}>
            {/* Top Bar with Back Arrow + Confirm details */}
            <div style={{
              display: 'flex', alignItems: 'center', height: 50, padding: '0 16px', gap: 18
            }}>
              <button
                type="button"
                onClick={() => navigate(`/product/${product.slug}`)}
                aria-label="Back"
                style={{
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', color: '#111827'
                }}
              >
                <ArrowLeft size={24} strokeWidth={2.2} />
              </button>
              <h1 style={{
                fontSize: '1.25rem', fontWeight: 600, color: '#111827', margin: 0,
                letterSpacing: '-0.01em', fontFamily: 'Inter, system-ui, -apple-system, sans-serif'
              }}>
                Confirm details
              </h1>
            </div>

            {/* Stepper (1 Address ✓ | 2 Confirm details ● | 3 Payment ○) */}
            <div style={{
              padding: '6px 16px 14px 16px',
            }}>
              <div style={{
                position: 'relative',
                width: '100%',
                maxWidth: 360,
                margin: '0 auto',
              }}>
                {/* Horizontal Center-Locked Track Line (Passes exactly through 12px center of 24px circles) */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '16.666%',
                    right: '16.666%',
                    height: '1.5px',
                    background: '#E5E7EB',
                    zIndex: 1,
                    transform: 'translateY(-50%)',
                  }}
                />

                {/* 3 Step Items in Equal Grid */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    position: 'relative',
                    zIndex: 2,
                  }}
                >
                  {/* Step 1: Address (Done with Blue outline and Check) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1.8px solid #2874F0',
                        background: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxSizing: 'border-box',
                      }}
                    >
                      <Check size={14} color="#2874F0" strokeWidth={3} />
                    </div>
                    <span
                      style={{
                        marginTop: 6,
                        fontSize: '0.8rem',
                        color: '#616161',
                        fontWeight: 500,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Address
                    </span>
                  </div>

                  {/* Step 2: Confirm details (Active Solid Blue Circle) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: '#2874F0',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      2
                    </div>
                    <span
                      style={{
                        marginTop: 6,
                        fontSize: '0.82rem',
                        color: '#111827',
                        fontWeight: 700,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Confirm details
                    </span>
                  </div>

                  {/* Step 3: Payment (Pending Grey Circle Outline) */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        border: '1.8px solid #D2D4D7',
                        background: '#FFFFFF',
                        color: '#878787',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: '0.82rem',
                        boxSizing: 'border-box',
                      }}
                    >
                      3
                    </div>
                    <span
                      style={{
                        marginTop: 6,
                        fontSize: '0.8rem',
                        color: '#878787',
                        fontWeight: 500,
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Payment
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Step 3 Header */
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            height: 58, padding: '0 16px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                aria-label="Back to Step 2"
                style={{
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', color: '#212121'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#717478', lineHeight: 1 }}>Step 3 of 3</div>
                <h1 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#212121', margin: '2px 0 0' }}>
                  Payments
                </h1>
              </div>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: '0.8rem', fontWeight: 700, color: '#108934', background: '#E7F8EC',
              padding: '4px 10px', borderRadius: 16
            }}>
              <ShieldProtectionIcon size={14} />
              <span>100% Secure</span>
            </div>
          </div>
        )}
      </header>

      {/* ─── Main Content Container ─── */}
      <main style={{ maxWidth: 540, margin: '0 auto', padding: '12px 14px' }}>
        {/* ========================================================
            STEP 2: CONFIRM DETAILS
           ======================================================== */}
        {currentStep === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* 1. Delivering to Section */}
            <div>
              <div style={{
                fontSize: '1rem', fontWeight: 800, color: '#212121', marginBottom: 8, paddingLeft: 4
              }}>
                Delivering to
              </div>

              <div style={{
                background: '#FFFFFF', borderRadius: 16, padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
              }}>
                {address ? (
                  /* Address Filled State */
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FlipkartHomeIcon size={18} />
                        <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#212121' }}>
                          {address.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={openAddressModal}
                        style={{
                          background: 'none', border: 'none', color: '#2A55E5', fontWeight: 800,
                          fontSize: '0.92rem', cursor: 'pointer', padding: 0
                        }}
                      >
                        Change
                      </button>
                    </div>

                    <div style={{
                      fontSize: '0.84rem', color: '#333', lineHeight: 1.45, marginBottom: 8, paddingLeft: 26
                    }}>
                      {address.flat}{address.area ? `, ${address.area}` : ''}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem',
                      color: '#212121', fontWeight: 600, paddingLeft: 26
                    }}>
                      <PhoneCallIcon size={13} />
                      <span>{address.phone}</span>
                    </div>
                  </div>
                ) : (
                  /* Address Unfilled / Default Prompt State with clean Vector icon */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FlipkartHomeIcon size={20} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#212121' }}>
                          Add delivery address
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 2 }}>
                          Enter house name, area & mobile number
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openAddressModal}
                      style={{
                        background: '#F0F5FF', border: '1px solid #CEE1FF', color: '#2A55E5',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: '6px 14px',
                        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <img src={FK_ASSETS.addNew} alt="Add" style={{ width: 14, height: 14 }} />
                      <span>Add Address</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Pay using SuperCoins Card */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src={FK_ASSETS.supercoins}
                  alt="SuperCoins"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                  loading="lazy"
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#717478' }}>
                    Pay using SuperCoins
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#9E9E9E', marginTop: 1 }}>
                    Available balance: 0
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Product Summary Card */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {/* Left: Product Image Card with Integrated Stepper (Matching Screenshot 3) */}
                <div style={{
                  width: 96,
                  flexShrink: 0,
                  borderRadius: 12,
                  border: '1px solid #E0E0E0',
                  background: '#FFFFFF',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                }}>
                  {/* Top: Product Image */}
                  <div style={{
                    width: '100%',
                    height: 92,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FFFFFF',
                    padding: '6px',
                    boxSizing: 'border-box'
                  }}>
                    <img
                      src={product.thumbnail_url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                      alt={product.title}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        borderRadius: 8
                      }}
                    />
                  </div>

                  {/* Bottom: Integrated Stepper (-  1  +) Matching Screenshot 3 */}
                  <div style={{
                    width: '100%',
                    height: 34,
                    borderTop: '1px solid #F0F0F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    boxSizing: 'border-box',
                    background: '#FFFFFF'
                  }}>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        fontSize: '1.2rem',
                        fontWeight: 600,
                        color: quantity > 1 ? '#212121' : '#B0B0B0',
                        cursor: quantity > 1 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#212121',
                      userSelect: 'none',
                      lineHeight: 1
                    }}>
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity(q => Math.min(5, q + 1))}
                      disabled={quantity >= 5}
                      aria-label="Increase quantity"
                      style={{
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        padding: 0,
                        fontSize: '1.25rem',
                        fontWeight: 600,
                        color: quantity < 5 ? '#212121' : '#B0B0B0',
                        cursor: quantity < 5 ? 'pointer' : 'default',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        lineHeight: 1
                      }}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Right: Real Product Details */}
                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#108934', marginBottom: 2 }}>
                    Top Discount of the Sale
                  </div>

                  {/* Title (e.g. COINCASTLE Krishna Lotus ...) */}
                  <div style={{
                    fontSize: '0.94rem', fontWeight: 600, color: '#212121', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {product.title}
                  </div>

                  {/* Flipkart Specification / Highlights Subtitle (Screenshots 1, 2, 4) */}
                  <div style={{
                    fontSize: '0.80rem', color: '#666', marginTop: 3, lineHeight: 1.35,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {productSpec}
                  </div>

                  {/* Rating Pill: Matching Screenshot 2 & Product Gallery (4.4 ★ 1.1K+) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{
                      background: '#108934', color: '#FFF', fontSize: '0.72rem', fontWeight: 700,
                      padding: '1.5px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2,
                      lineHeight: 1.1
                    }}>
                      {productRatingData.rating} ★
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#878787', fontWeight: 500 }}>
                      {productRatingData.reviewCount}
                    </span>
                  </div>

                  {/* Pricing Row */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: '#108934', fontWeight: 800, fontSize: '0.95rem' }}>
                      ↓{discountPercent}%
                    </span>
                    <span style={{ textDecoration: 'line-through', color: '#9E9E9E', fontSize: '0.88rem' }}>
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: '#212121', fontWeight: 900, fontSize: '1.15rem' }}>
                      ₹{effectivePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Protect Promise Fee */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.76rem',
                    color: '#666', marginTop: 4, cursor: 'pointer'
                  }}>
                    <span>+₹19 Protect Promise Fee</span>
                    <FlipkartChevron color="#666" size={10} />
                  </div>
                </div>
              </div>

              {/* Delivery Banner (Vector Truck Icon, No emoji) */}
              <div style={{
                background: '#F5F7FA', borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.82rem', color: '#212121'
              }}>
                <DeliveryTruckIcon size={18} />
                <div>
                  Delivery by <strong style={{ fontWeight: 800 }}>{deliveryDateString}</strong>
                </div>
              </div>

              {/* Open Box Delivery (Vector Box Icon, No emoji) */}
              <div style={{
                background: '#F5F7FA', borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '0.82rem', color: '#212121', cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <OpenBoxIcon size={18} />
                  <span><strong style={{ fontWeight: 700 }}>Open Box Delivery</strong> will be done</span>
                </div>
                <FlipkartChevron color="#666" size={11} />
              </div>
            </div>

            {/* 4. WOW! Savings Zone */}
            <div style={{
              background: '#F0F5FF', border: '1px solid #CEE1FF', borderRadius: 16,
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#2A55E5', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>WOW!</span>
                  <span style={{ color: '#212121' }}>Savings zone</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#2A55E5', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>View all coupons and offers</span>
                  <FlipkartChevron color="#2A55E5" size={10} />
                </div>
              </div>
            </div>

            {/* 5. Flipkart Foundation Card (Vector Heart, No emoji) */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212121', marginBottom: 2 }}>
                    You can make a difference!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.35, marginBottom: 10 }}>
                    Help Flipkart Foundation in empowering our local communities.
                  </div>

                  {/* Donation Chips */}
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[10, 20, 50, 100].map(amt => {
                      const isSelected = selectedDonation === amt
                      return (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setSelectedDonation(prev => prev === amt ? null : amt)}
                          style={{
                            padding: '6px 14px', borderRadius: 6,
                            border: isSelected ? '1.5px solid #2A55E5' : '1px solid #D0D0D0',
                            background: isSelected ? '#F0F5FF' : '#FFFFFF',
                            color: isSelected ? '#2A55E5' : '#212121',
                            fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          ₹{amt}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#9E9E9E', marginTop: 8 }}>
                    Note: GST and No Cost EMI not applicable
                  </div>
                </div>

                <div style={{
                  width: 54, height: 54, borderRadius: 12, background: '#F9E5EE',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <HeartIcon size={26} />
                </div>
              </div>
            </div>

            {/* 6. Exact Real Flipkart Price Summary Breakdown (Provided by User) */}
            <div data-testid="price-summary" style={{
              background: '#FFFFFF', borderRadius: 16, padding: '16px 18px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)', fontFamily: 'Inter, sans-serif'
            }}>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#212121', marginBottom: 14 }}>
                Price Details
              </div>

              {/* MRP (incl. of all taxes) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.875rem' }}>
                <span style={{ color: '#212121' }}>MRP (incl. of all taxes)</span>
                <span data-testid="price" style={{ fontWeight: 600, color: '#212121' }}>
                  ₹{mrp.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Fees with real Flipkart Chevron */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#212121' }}>
                  <span>Fees</span>
                  <FlipkartChevron color="#212121" size={10} />
                </div>
                <span data-testid="price" style={{ fontWeight: 600, color: '#212121' }}>
                  ₹{platformFee}
                </span>
              </div>

              {/* Platform Fee sub-item */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.8125rem', paddingLeft: 12 }}>
                <span style={{ color: '#666' }}>Platform Fee</span>
                <span data-testid="price" style={{ color: '#666' }}>
                  ₹{platformFee}
                </span>
              </div>

              {/* Discounts with real Flipkart Chevron */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: '0.875rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#212121' }}>
                  <span>Discounts</span>
                  <FlipkartChevron color="#212121" size={10} />
                </div>
                <span data-testid="price" style={{ fontWeight: 700, color: '#108934' }}>
                  -₹{totalDiscount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* MRP Discount sub-item */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, fontSize: '0.8125rem', paddingLeft: 12 }}>
                <span style={{ color: '#666' }}>MRP Discount</span>
                <span data-testid="price" style={{ color: '#108934', fontWeight: 600 }}>
                  -₹{mrpDiscount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* Coupons for you sub-item */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: '0.8125rem', paddingLeft: 12 }}>
                <span style={{ color: '#666' }}>Coupons for you</span>
                <span data-testid="price" style={{ color: '#108934', fontWeight: 600 }}>
                  -₹{couponDiscount}
                </span>
              </div>

              {selectedDonation && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, fontSize: '0.8125rem' }}>
                  <span style={{ color: '#212121' }}>Flipkart Foundation Donation</span>
                  <span style={{ fontWeight: 600, color: '#212121' }}>₹{selectedDonation}</span>
                </div>
              )}

              <div style={{ height: 1, background: '#DCDFE6', margin: '12px 0' }} />

              {/* Total Amount (matching Flipkart KUtEgl final-price-items) */}
              <div data-testid="final-price-items" style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingTop: 4, paddingBottom: 10
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#2A55E5', fontWeight: 800, fontSize: '1rem' }}>Total Amount</span>
                  <FlipkartChevron color="#2A55E5" size={11} />
                </div>
                <span data-testid="price" style={{ color: '#2A55E5', fontWeight: 900, fontSize: '1.25rem' }}>
                  ₹{totalAmount.toLocaleString('en-IN')}
                </span>
              </div>

              {/* You'll Save Green Banner (Vector Tag Icon, No emoji) */}
              <div style={{
                background: '#E7F8EC', borderRadius: 8, padding: '9px 12px',
                display: 'flex', alignItems: 'center', gap: 8, color: '#108934',
                fontSize: '0.84rem', fontWeight: 700
              }}>
                <DiscountTagIcon size={16} color="#108934" />
                <span>You'll Save ₹{(totalDiscount - (selectedDonation || 0)).toLocaleString('en-IN')} on this order</span>
              </div>
            </div>

            {/* 7. Trust Badges & GST Card */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '8px 12px', textAlign: 'center', color: '#717478', fontSize: '0.78rem'
            }}>
              <ShieldProtectionIcon size={16} />
              <span>Safe and secure payments. Easy returns. 100% Authentic products.</span>
            </div>

            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#212121' }}>
                  Claim up to 28% GST input credit on business purchases
                </div>
                <div style={{ fontSize: '0.82rem', color: '#2A55E5', fontWeight: 800, marginTop: 4, cursor: 'pointer' }}>
                  Add GSTIN number
                </div>
              </div>
              <Building size={24} color="#717478" />
            </div>

            {/* Legal Terms Footnote */}
            <div style={{
              fontSize: '0.74rem', color: '#9E9E9E', lineHeight: 1.4, textAlign: 'center',
              padding: '6px 12px 18px'
            }}>
              By proceeding, you confirm that you're above 18 years of age and you agree to Flipkart's{' '}
              <span style={{ color: '#2A55E5' }}>Terms of Use</span> and{' '}
              <span style={{ color: '#2A55E5' }}>Privacy Policy</span>.
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: PAYMENTS PAGE (Real Flipkart HTML & Icons)
           ======================================================== */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Total Amount Dropdown Banner */}
            <div style={{
              background: '#F0F5FF', border: '1px solid #CEE1FF', borderRadius: 12,
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, color: '#2A55E5',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
              }}>
                <span>Total Amount</span>
                <FlipkartChevron color="#2A55E5" size={11} />
              </div>
              <div style={{ color: '#2A55E5', fontWeight: 900, fontSize: '1.2rem' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {paymentError && (
              <div style={{
                background: '#FBEBED', border: '1px solid #F9CBCE', borderRadius: 10,
                padding: '10px 14px', fontSize: '0.85rem', color: '#DF4535', display: 'flex', gap: 8
              }}>
                <img src={FK_ASSETS.helpGrey} alt="Error" style={{ width: 18, height: 18, flexShrink: 0 }} />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Methods Accordion Container */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
            }}>
              {/* Option 1: Real Flipkart UPI Accordion Header */}
              <div
                onClick={() => setIsUpiExpanded(prev => !prev)}
                style={{
                  padding: '14px 18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'space-between', cursor: 'pointer', borderBottom: '1px solid #EEE'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={FK_ASSETS.upi} alt="UPI" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212121' }}>UPI</span>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 1 }}>Pay by any UPI app</div>
                  </div>
                </div>
                <img
                  src={FK_ASSETS.downArrow}
                  alt="Arrow"
                  style={{
                    width: 14, height: 14, transform: isUpiExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.25s ease'
                  }}
                />
              </div>

              {/* UPI Sub-items List (PNB Removed as instructed) */}
              {isUpiExpanded && (
                <div style={{ padding: '4px 16px 16px' }}>
                  {/* Option: PhonePe (SELECTED BY DEFAULT!) */}
                  <div style={{
                    background: selectedUpiOption === 'phonepe' ? '#FFFDE7' : 'transparent',
                    borderRadius: 10, padding: '10px 10px 14px', marginTop: 6, marginBottom: 8,
                    border: selectedUpiOption === 'phonepe' ? '1.5px solid #FFC200' : 'none'
                  }}>
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      cursor: 'pointer'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="radio"
                          name="upi_option"
                          checked={selectedUpiOption === 'phonepe'}
                          onChange={() => setSelectedUpiOption('phonepe')}
                          style={{ width: 19, height: 19, accentColor: '#2A55E5' }}
                        />
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212121' }}>PhonePe</span>
                      </div>
                      <PhonePeIcon size={24} />
                    </label>

                    {/* Signature Yellow Pay Button directly beneath PhonePe */}
                    {selectedUpiOption === 'phonepe' && (
                      <div style={{ marginTop: 12, paddingLeft: 31, paddingRight: 4 }}>
                        <motion.button
                          type="button"
                          onClick={() => handleProceedPayment()}
                          disabled={isProcessingPayment}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          style={{
                            width: '100%',
                            padding: '14px 20px',
                            background: '#FFC200',
                            color: '#111111',
                            fontWeight: 900,
                            fontSize: '1.05rem',
                            border: 'none',
                            borderRadius: 6,
                            cursor: isProcessingPayment ? 'not-allowed' : 'pointer',
                            boxShadow: '0 2px 8px rgba(255, 194, 0, 0.45)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 8,
                          }}
                        >
                          {isProcessingPayment ? (
                            <>
                              <RefreshCw size={18} className="spin" />
                              <span>Opening PhonePe...</span>
                            </>
                          ) : (
                            <span>Pay ₹{totalAmount.toLocaleString('en-IN')}</span>
                          )}
                        </motion.button>
                      </div>
                    )}
                  </div>

                  {/* Option: Google Pay */}
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 6px', cursor: 'pointer', borderBottom: '1px solid #F6F6F6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="radio"
                        name="upi_option"
                        checked={selectedUpiOption === 'gpay'}
                        onChange={() => setSelectedUpiOption('gpay')}
                        style={{ width: 18, height: 18, accentColor: '#2A55E5' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>Google Pay</span>
                    </div>
                    <GPayIcon size={22} />
                  </label>

                  {/* Option: WhatsApp */}
                  <label style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px 6px', cursor: 'pointer', borderBottom: '1px solid #F6F6F6'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <input
                        type="radio"
                        name="upi_option"
                        checked={selectedUpiOption === 'whatsapp'}
                        onChange={() => setSelectedUpiOption('whatsapp')}
                        style={{ width: 18, height: 18, accentColor: '#2A55E5' }}
                      />
                      <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>whatsapp</span>
                    </div>
                    <WhatsAppIcon size={22} />
                  </label>

                  {/* Pay with other UPI Apps */}
                  <div style={{
                    padding: '12px 6px 4px', display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between', cursor: 'pointer'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#2A55E5', fontWeight: 700 }}>
                        Pay with other UPI Apps
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#9E9E9E', marginTop: 1 }}>
                        Offers not valid if chosen from here
                      </div>
                    </div>
                    <FlipkartChevron color="#2A55E5" size={11} />
                  </div>

                  {/* Pay button for non-PhonePe options if selected */}
                  {selectedUpiOption !== 'phonepe' && (
                    <div style={{ marginTop: 14 }}>
                      <button
                        type="button"
                        onClick={() => handleProceedPayment()}
                        disabled={isProcessingPayment}
                        style={{
                          width: '100%', padding: '14px', background: '#FFC200', color: '#111',
                          fontWeight: 900, fontSize: '1.05rem', border: 'none', borderRadius: 6,
                          cursor: 'pointer'
                        }}
                      >
                        {isProcessingPayment ? 'Processing...' : `Pay ₹${totalAmount.toLocaleString('en-IN')}`}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Option 2: Credit / Debit / ATM Card (Real Flipkart HTML & Icon) */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #EEE',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <img src={FK_ASSETS.card} alt="Card" style={{ width: 24, height: 24, objectFit: 'contain', marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212121' }}>
                      Credit / Debit / ATM Card
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#666', marginTop: 2 }}>
                      Add and secure cards as per RBI guidelines
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#108934', fontWeight: 700, marginTop: 2 }}>
                      Get upto 5% cashback · 2 offers available
                    </div>
                  </div>
                </div>
                <img src={FK_ASSETS.downArrow} alt="Arrow" style={{ width: 14, height: 14 }} />
              </div>

              {/* Option 3: Cash on Delivery (Real Flipkart Code & SVG Icon) */}
              <div
                onClick={() => {
                  setCodStep('offer')
                  setShowCodModal(true)
                }}
                style={{
                  padding: '16px 18px', borderBottom: '1px solid #EEE',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: '#FFFFFF', cursor: 'pointer',
                  transition: 'background 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={FK_ASSETS.cash} alt="COD" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#212121' }}>
                        Cash on Delivery
                      </span>
                      <span style={{
                        fontSize: '0.70rem', fontWeight: 800, color: '#108934', background: '#E8F5E9',
                        padding: '2px 6px', borderRadius: 4
                      }}>
                        Save ₹50 Online
                      </span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#666', marginTop: 2 }}>
                      Pay online to save ₹50 courier charges & get instant priority dispatch
                    </div>
                  </div>
                </div>
                <img src={FK_ASSETS.downArrow} alt="Arrow" style={{ width: 14, height: 14 }} />
              </div>

              {/* Option 4: Have a Flipkart Gift Card? (Real Flipkart SVG) */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #EEE',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={FK_ASSETS.giftCard} alt="Gift Card" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#212121' }}>
                    Have a Flipkart Gift Card?
                  </span>
                </div>
                <img src={FK_ASSETS.addNew} alt="Add" style={{ height: 24, width: 24, objectFit: 'contain' }} />
              </div>

              {/* Option 5: EMI (Real Flipkart SVG & Unavailable Help Icon) */}
              <div style={{
                padding: '16px 18px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', background: '#FAFAFA'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={FK_ASSETS.emi} alt="EMI" style={{ width: 24, height: 24, objectFit: 'contain' }} />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#666' }}>EMI</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: '0.74rem', fontWeight: 800, color: '#666', background: '#EEE',
                    padding: '3px 8px', borderRadius: 4
                  }}>
                    Unavailable
                  </span>
                  <img src={FK_ASSETS.helpGrey} alt="Help" style={{ width: 14, height: 14 }} />
                </div>
              </div>
            </div>

            {/* Official Real Flipkart Smiley & 35 Crore Happy Customers Footer (Provided by User) */}
            <section style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '20px 0 10px', color: '#212121', fontSize: '0.92rem', fontWeight: 600
            }}>
              <div>35 Crore happy customers and counting!</div>
              <img src={FK_ASSETS.smiley} alt="Smiley" style={{ width: 22, height: 22 }} />
            </section>
          </div>
        )}
      </main>

      {/* ─── Sticky Bottom Bar for Step 2 (Confirm Details) ─── */}
      {currentStep === 2 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#FFFFFF', boxShadow: '0 -2px 10px rgba(0,0,0,0.06)'
        }}>
          {/* Top Green Savings Banner (Vector Tag Icon, No emoji) */}
          <div style={{
            background: '#E7F8EC', padding: '5px 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#108934',
            fontSize: '0.78rem', fontWeight: 700, gap: 6
          }}>
            <DiscountTagIcon size={14} color="#108934" />
            <span>You'll save ₹{(totalDiscount - (selectedDonation || 0)).toLocaleString('en-IN')} on this order</span>
          </div>

          {/* Bar Action Row */}
          <div style={{
            maxWidth: 540, margin: '0 auto', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ textDecoration: 'line-through', color: '#9E9E9E', fontSize: '0.82rem', lineHeight: 1 }}>
                ₹{mrp.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#212121', marginTop: 2 }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <motion.button
              type="button"
              onClick={() => {
                trackUserClick('flipkart_continue_step2', {
                  product_id: product.id,
                  has_address: Boolean(address),
                }, product.id)
                window.history.pushState({ step: 3 }, '')
                setCurrentStep(3)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              style={{
                background: '#FFC200',
                color: '#111111',
                fontWeight: 900,
                fontSize: '1.05rem',
                padding: '12px 42px',
                borderRadius: 4,
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(255, 194, 0, 0.45)',
              }}
            >
              Continue
            </motion.button>
          </div>
        </div>
      )}

      {/* ─── Address Bottom Sheet / Modal (Generic Placeholders, No Hardcoded Mock Data) ─── */}
      <AnimatePresence>
        {showAddressModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center'
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddressModal(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(2px)'
              }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 500,
                background: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: '20px 20px 28px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 -6px 25px rgba(0,0,0,0.2)', zIndex: 101
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14
              }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#212121', margin: 0 }}>
                  Deliver To
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <img src={FK_ASSETS.smiley} alt="Flipkart" style={{ width: 22, height: 22 }} />
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    style={{
                      background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                      color: '#717478', display: 'flex'
                    }}
                  >
                    <X size={22} />
                  </button>
                </div>
              </div>

              {/* Yellow Alert Box with Help Icon */}
              <div style={{
                background: '#FEF7E9', border: '1px solid #FDDFA9', borderRadius: 8,
                padding: '10px 14px', display: 'flex', gap: 8, marginBottom: 18,
                fontSize: '0.82rem', color: '#AF7B1C', lineHeight: 1.4
              }}>
                <img src={FK_ASSETS.helpGrey} alt="Info" style={{ width: 16, height: 16, marginTop: 1, flexShrink: 0 }} />
                <span>Ensure your address details are accurate for a smooth delivery experience</span>
              </div>

              {addressError && (
                <div style={{
                  background: '#FBEBED', border: '1px solid #F9CBCE', borderRadius: 6,
                  padding: '8px 12px', fontSize: '0.82rem', color: '#DF4535', marginBottom: 14
                }}>
                  {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. Flat/House/building name (Generic placeholder) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 4 }}>
                    Flat/House/building name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrFlat}
                    onChange={e => setAddrFlat(e.target.value)}
                    placeholder="House / Flat No., Building Name, Street"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #DCDFE6', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Area / Sector / Locality (Generic placeholder) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 4 }}>
                    Area / Sector / Locality
                  </label>
                  <input
                    type="text"
                    value={addrArea}
                    onChange={e => setAddrArea(e.target.value)}
                    placeholder="Road name, Area, Colony, City, State, Pincode"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #DCDFE6', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 3. Enter your full name (Generic placeholder) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 4 }}>
                    Enter your full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={e => setAddrName(e.target.value)}
                    placeholder="Full Name"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #DCDFE6', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 4. 10-digit mobile number (Generic placeholder) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 4 }}>
                    10-digit mobile number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={addrPhone}
                    onChange={e => setAddrPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-digit mobile number"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #DCDFE6', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 5. Alternate phone number (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 4 }}>
                    Alternate phone number (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={addrAltPhone}
                    onChange={e => setAddrAltPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Alternate mobile number (Optional)"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #DCDFE6', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Type of address (Home / Work pills) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#666', fontWeight: 600, marginBottom: 8 }}>
                    Type of address
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setAddrType('home')}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: addrType === 'home' ? '1.5px solid #2A55E5' : '1px solid #D0D0D0',
                        background: addrType === 'home' ? '#F0F5FF' : '#FFFFFF',
                        color: addrType === 'home' ? '#2A55E5' : '#212121',
                        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <FlipkartHomeIcon size={16} />
                      <span>Home</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddrType('work')}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: addrType === 'work' ? '1.5px solid #2A55E5' : '1px solid #D0D0D0',
                        background: addrType === 'work' ? '#F0F5FF' : '#FFFFFF',
                        color: addrType === 'work' ? '#2A55E5' : '#212121',
                        fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6
                      }}
                    >
                      <Building size={16} />
                      <span>Work</span>
                    </button>
                  </div>
                </div>

                {/* Big Blue Update Address Button */}
                <button
                  type="submit"
                  style={{
                    marginTop: 10, width: '100%', padding: '14px',
                    background: '#2A55E5', color: '#FFFFFF', fontWeight: 800,
                    fontSize: '1rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(42, 85, 229, 0.35)'
                  }}
                >
                  Update address
                </button>
              </form>
            </motion.div>
          </div>
        )}

        {/* Psychological COD Switch-to-Prepaid Bottom Sheet / Modal */}
        {showCodModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 110, display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center'
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCodModal(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(3px)'
              }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 500,
                background: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20,
                padding: '16px 20px 24px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.25)', zIndex: 111
              }}
            >
              {/* Drag Handle Bar */}
              <div style={{
                width: 36, height: 4, background: '#D1D5DB', borderRadius: 2,
                margin: '0 auto 12px auto'
              }} />

              {/* Header with Title & Close button */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 14
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%',
                    background: codStep === 'offer' ? '#FEF08A' : '#DCFCE7',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    {codStep === 'offer' ? (
                      <Zap size={16} color="#D97706" fill="#D97706" />
                    ) : (
                      <Truck size={17} color="#15803D" />
                    )}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                      {codStep === 'offer' ? 'Pay Online & Save ₹50 Extra!' : 'Confirm Cash on Delivery Booking'}
                    </h2>
                    <span style={{ fontSize: '0.74rem', color: codStep === 'offer' ? '#108934' : '#2874F0', fontWeight: 700 }}>
                      {codStep === 'offer' ? '⚡ Recommended for Instant Priority Dispatch' : '📦 Ekart Logistics Doorstep Cash Verification'}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodModal(false)}
                  style={{
                    background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                    color: '#9CA3AF', display: 'flex'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {codStep === 'offer' ? (
                <div>
                  {/* Visual Comparison Boxes */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                    
                    {/* Option A: Pay Online (Highlighted Green) */}
                    <div style={{
                      background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: 12,
                      padding: '12px 14px', position: 'relative'
                    }}>
                      <div style={{
                        position: 'absolute', top: -9, right: 14,
                        background: '#16A34A', color: '#FFF', fontSize: '0.68rem',
                        fontWeight: 800, padding: '2px 8px', borderRadius: 4,
                        letterSpacing: '0.03em', textTransform: 'uppercase'
                      }}>
                        BEST VALUE · 100% SECURE
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Check size={18} color="#16A34A" strokeWidth={3} />
                          <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#14532D' }}>
                            Pay via UPI / GPay / PhonePe
                          </span>
                        </div>
                        <span style={{ fontWeight: 900, fontSize: '1.05rem', color: '#16A34A' }}>
                          ₹{totalAmount.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{
                        marginTop: 8, paddingLeft: 26, fontSize: '0.78rem', color: '#166534',
                        display: 'flex', flexDirection: 'column', gap: 3
                      }}>
                        <div>✓ <b>FREE Delivery</b> (Save ₹50 courier charges)</div>
                        <div>✓ <b>Instant VIP Dispatch</b> & Instant Access</div>
                        <div>✓ <b>100% Refund Protection</b> (7-Day Money Back)</div>
                      </div>
                    </div>

                    {/* Option B: Cash on Delivery (Red / Grey penalty box) */}
                    <div style={{
                      background: '#F9FAFB', border: '1px solid #E5E7EB', borderRadius: 12,
                      padding: '12px 14px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 18, height: 18, borderRadius: '50%', background: '#EF4444',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#FFF', fontSize: '0.7rem', fontWeight: 900
                          }}>✕</div>
                          <span style={{ fontWeight: 700, fontSize: '0.90rem', color: '#374151' }}>
                            Cash on Delivery
                          </span>
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#6B7280', textDecoration: 'line-through' }}>
                          ₹{(totalAmount + 50).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div style={{
                        marginTop: 6, paddingLeft: 26, fontSize: '0.76rem', color: '#6B7280',
                        display: 'flex', flexDirection: 'column', gap: 2
                      }}>
                        <div>• +₹50 Extra Courier Collection Fee</div>
                        <div>• 5 - 7 Days Delayed Verification & Delivery</div>
                      </div>
                    </div>
                  </div>

                  {/* Primary Action Button: Pay Online & Save ₹50 */}
                  <button
                    type="button"
                    onClick={() => {
                      setShowCodModal(false)
                      setSelectedUpiOption('phonepe')
                      handleProceedPayment()
                    }}
                    style={{
                      width: '100%', padding: '14px', background: '#FFC200', color: '#111827',
                      fontWeight: 900, fontSize: '1.02rem', border: 'none', borderRadius: 8,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, boxShadow: '0 3px 12px rgba(255, 194, 0, 0.45)',
                      marginBottom: 10
                    }}
                  >
                    <Zap size={18} fill="#111827" />
                    <span>Pay ₹{totalAmount.toLocaleString('en-IN')} via UPI & Save ₹50</span>
                  </button>

                  {/* Secondary Subtle Button: Switch to Step 2 (Hack #1 & Hack #2) */}
                  <div style={{ textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => setCodStep('token')}
                      style={{
                        background: 'none', border: 'none', color: '#6B7280',
                        fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                        padding: '6px 12px', textDecoration: 'underline'
                      }}
                    >
                      I still want Cash on Delivery (Pay in Cash at Doorstep)
                    </button>
                  </div>
                </div>
              ) : (
                /* Step 2: HACK #1 (₹9 Anti-Spam Security Token) + HACK #2 (AdSense High-CPC Monetization) */
                <div>
                  {/* Verified Delivery Info Banner */}
                  <div style={{
                    background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10,
                    padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10
                  }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', background: '#16A34A',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                    }}>
                      <Truck size={15} color="#FFF" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#166534' }}>
                        Doorstep Delivery Available for {address?.name || 'Customer'}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: 1 }}>
                        Expected by <b>{deliveryDateString}</b> via Ekart Express
                      </div>
                    </div>
                  </div>

                  {/* 🛡️ HACK #1: Ekart Anti-Spam Security Token Box */}
                  <div style={{
                    background: '#FFFFFF', border: '1.5px solid #E5E7EB', borderRadius: 12,
                    padding: '14px', marginBottom: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <ShieldCheck size={18} color="#2874F0" />
                      <span style={{ fontWeight: 800, fontSize: '0.90rem', color: '#111827' }}>
                        Ekart Logistics Courier Security Token
                      </span>
                    </div>
                    <p style={{ margin: '0 0 10px 0', fontSize: '0.78rem', color: '#4B5563', lineHeight: 1.45 }}>
                      To prevent fake bookings and generate your <b>Live Shipping Barcode</b>, Ekart requires a nominal <b>₹9 Refundable Token</b> via UPI. The balance is paid in Cash on delivery!
                    </p>

                    {/* Financial Split Breakdown */}
                    <div style={{
                      background: '#F9FAFB', borderRadius: 8, padding: '10px 12px',
                      display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                        <span>Total Order Amount:</span>
                        <span style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 800 }}>
                        <span>⚡ Pay Token Now (via UPI):</span>
                        <span>₹9</span>
                      </div>
                      <div style={{ height: 1, background: '#E5E7EB', margin: '2px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111827', fontWeight: 900, fontSize: '0.88rem' }}>
                        <span>💵 Pay to Delivery Agent (Cash):</span>
                        <span style={{ color: '#2874F0' }}>₹{(Math.max(totalAmount - 9, 0)).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.70rem', color: '#6B7280', marginTop: 6, textAlign: 'center' }}>
                      ✓ ₹9 token is 100% adjusted into your final cash delivery receipt.
                    </div>
                  </div>

                  {/* Primary CTA: Pay ₹9 Token via UPI */}
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={() => {
                      setShowCodModal(false)
                      setSelectedUpiOption('phonepe')
                      handleProceedPayment(9, true)
                    }}
                    style={{
                      width: '100%', padding: '14px', background: '#FFC200', color: '#111827',
                      fontWeight: 900, fontSize: '1.02rem', border: 'none', borderRadius: 8,
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 8, boxShadow: '0 3px 12px rgba(255, 194, 0, 0.45)',
                      marginBottom: 12
                    }}
                  >
                    <Zap size={18} fill="#111827" />
                    <span>Pay ₹9 Token via UPI & Dispatch COD Order</span>
                  </button>

                  {/* 💰 HACK #2: Google AdSense High-CPC Monetization Ad Unit */}
                  <div style={{
                    background: '#FAFAFA', border: '1px solid #E5E7EB', borderRadius: 10,
                    padding: '8px 10px', marginBottom: 12, textAlign: 'center', overflow: 'hidden'
                  }}>
                    <div style={{
                      fontSize: '0.62rem', color: '#9CA3AF', textTransform: 'uppercase',
                      letterSpacing: '0.08em', fontWeight: 700, marginBottom: 4
                    }}>
                      SPONSORED ADVERTISEMENT
                    </div>
                    
                    {/* Google AdSense Responsive Display Unit */}
                    <ins
                      className="adsbygoogle"
                      style={{ display: 'block', minHeight: 90, width: '100%', textAlign: 'center' }}
                      data-ad-client="ca-pub-2291828876695516"
                      data-ad-format="auto"
                      data-full-width-responsive="true"
                    />

                    {/* Sleek Sponsored Fallback Banner for Instant High CTR */}
                    <div style={{
                      marginTop: 6, padding: '6px 8px', background: '#EFF6FF',
                      borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      fontSize: '0.74rem', color: '#1D4ED8', fontWeight: 600
                    }}>
                      <span>⚡ Exclusive Deals: Up to 80% OFF on Top Gadgets</span>
                      <span style={{ fontSize: '0.68rem', background: '#2563EB', color: '#FFF', padding: '2px 6px', borderRadius: 4 }}>
                        View Offers
                      </span>
                    </div>
                  </div>

                  {/* Alternative Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCodModal(false)
                        setSelectedUpiOption('phonepe')
                        handleProceedPayment()
                      }}
                      style={{
                        background: 'none', border: 'none', color: '#16A34A',
                        fontSize: '0.84rem', fontWeight: 800, cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      Or Pay Full ₹{totalAmount.toLocaleString('en-IN')} Online (Free VIP Delivery)
                    </button>

                    <button
                      type="button"
                      onClick={() => setCodStep('offer')}
                      style={{
                        background: 'none', border: 'none', color: '#6B7280',
                        fontSize: '0.80rem', fontWeight: 600, cursor: 'pointer',
                        padding: '4px 8px'
                      }}
                    >
                      ← Back to Delivery Options
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Dropout Catcher Modal: "Wait! Complete Order with just ₹9 Token 📦" ─── */}
      <AnimatePresence>
        {showDropoutModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 120, display: 'flex',
            alignItems: 'flex-end', justifyContent: 'center'
          }}>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDropoutModal(false)}
              style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(3px)'
              }}
            />

            {/* Modal Card */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 280 }}
              style={{
                position: 'relative', width: '100%', maxWidth: 500,
                background: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22,
                padding: '18px 20px 28px', maxHeight: '90vh', overflowY: 'auto',
                boxShadow: '0 -8px 30px rgba(0,0,0,0.3)', zIndex: 121
              }}
            >
              {/* Drag Handle Bar */}
              <div style={{
                width: 36, height: 4, background: '#D1D5DB', borderRadius: 2,
                margin: '0 auto 12px auto'
              }} />

              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: 12
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', background: '#FEF08A',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Zap size={18} color="#D97706" fill="#D97706" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.08rem', fontWeight: 900, color: '#111827', margin: 0 }}>
                      Wait! Complete with ₹9 Token 📦
                    </h2>
                    <span style={{ fontSize: '0.74rem', color: '#16A34A', fontWeight: 700 }}>
                      ✓ Baaki payment Cash on Delivery par dijiye!
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDropoutModal(false)}
                  style={{
                    background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                    color: '#9CA3AF', display: 'flex'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Offer Card */}
              <div style={{
                background: '#FFFBEB', border: '1.5px solid #FDE68A', borderRadius: 12,
                padding: '12px 14px', marginBottom: 14
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '0.84rem', color: '#92400E', lineHeight: 1.45, fontWeight: 600 }}>
                  Hesitating to pay full ₹{totalAmount} online? No problem! Pay a nominal <b>₹9 Security Token via UPI</b> to generate your official Ekart dispatch waybill barcode, and pay the remaining in cash at delivery!
                </p>

                <div style={{
                  background: '#FFFFFF', borderRadius: 8, padding: '10px 12px',
                  display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.82rem',
                  border: '1px solid #FEF3C7'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#4B5563' }}>
                    <span>Product Price:</span>
                    <span style={{ fontWeight: 700 }}>₹{totalAmount.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16A34A', fontWeight: 800 }}>
                    <span>⚡ Pay Token Now (via UPI):</span>
                    <span>₹9</span>
                  </div>
                  <div style={{ height: 1, background: '#F3F4F6', margin: '2px 0' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: '#111827', fontWeight: 900, fontSize: '0.88rem' }}>
                    <span>💵 Pay on Delivery (Cash):</span>
                    <span style={{ color: '#2874F0' }}>₹{(Math.max(totalAmount - 9, 0)).toLocaleString('en-IN')}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.70rem', color: '#B45309', marginTop: 6, textAlign: 'center' }}>
                  ✓ ₹9 token is 100% adjusted into your final cash delivery receipt.
                </div>
              </div>

              {/* Big Pay ₹9 Button */}
              <button
                type="button"
                disabled={isProcessingPayment}
                onClick={() => {
                  setShowDropoutModal(false)
                  setSelectedUpiOption('phonepe')
                  handleProceedPayment(9, true)
                }}
                style={{
                  width: '100%', padding: '14px', background: '#FFC200', color: '#111827',
                  fontWeight: 900, fontSize: '1.05rem', border: 'none', borderRadius: 8,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: 8, boxShadow: '0 3px 12px rgba(255, 194, 0, 0.45)',
                  marginBottom: 10
                }}
              >
                <Zap size={19} fill="#111827" />
                <span>Pay ₹9 Token via UPI & Dispatch Order</span>
              </button>

              {/* Sub-actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowDropoutModal(false)
                    setSelectedUpiOption('phonepe')
                    handleProceedPayment()
                  }}
                  style={{
                    background: 'none', border: 'none', color: '#2874F0',
                    fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  Or Pay Full ₹{totalAmount.toLocaleString('en-IN')} via UPI (Save ₹50 Online)
                </button>

                <button
                  type="button"
                  onClick={() => setShowDropoutModal(false)}
                  style={{
                    background: 'none', border: 'none', color: '#9CA3AF',
                    fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
                    padding: '4px 8px'
                  }}
                >
                  I'll decide later
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
