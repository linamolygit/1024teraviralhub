// src/client/pages/order/FlipkartOrderDetailsPage.tsx
// Exact Flipkart Order Details & Tracking Experience (Matching Screenshot 1 & Screenshot 2)
// - Real Dates (no random fake dates, actual order timestamps)
// - Real major Indian logistics hubs (BHIWANDI, FARUKHNAGAR, GURUGRAM, BENGALURU, etc.)
// - Interactive "See all updates" toggle showing vertical animated green timeline with pulsing dots
// - Direct instant digital download access

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Check,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Copy,
  Send,
  Info,
  ThumbsUp,
  Download,
} from 'lucide-react'
import { api, type OrderLookupResult } from '../../lib/api'
import { getThematicImagesForTitle } from '../../../lib/reviewDefaults'
import { getSavedOrders } from '../../lib/orderSession'

// Curated list of major Indian e-commerce fulfillment / hub locations (Flipkart & Ekart hubs)
const MAJOR_HUBS = [
  'BHIWANDI',
  'FARUKHNAGAR',
  'GURUGRAM',
  'BENGALURU',
  'MUMBAI',
  'DELHI NCR',
  'HYDERABAD',
  'PUNE',
  'AHMEDABAD',
  'KOLKATA',
]

// Simple deterministic hash helper for order numbers
function hashStr(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

// Robust Date Parser supporting SQLite UTC 'YYYY-MM-DD HH:MM:SS', ISO strings, and timestamps
function parseOrderDate(rawDate?: string | number | null): Date {
  if (!rawDate) return new Date()
  if (typeof rawDate === 'number') return new Date(rawDate)
  if (typeof rawDate === 'string') {
    const s = rawDate.trim()
    if (s.includes('T')) {
      const d = new Date(s)
      if (!isNaN(d.getTime())) return d
    }
    const withT = s.replace(' ', 'T')
    const withZ = withT.endsWith('Z') ? withT : `${withT}Z`
    const d = new Date(withZ)
    if (!isNaN(d.getTime())) return d
    const fallback = new Date(s)
    if (!isNaN(fallback.getTime())) return fallback
  }
  return new Date()
}

// Format day suffix: 1st, 2nd, 3rd, 4th, 21st, 22nd...
function getDaySuffix(day: number): string {
  if (day >= 11 && day <= 13) return `${day}th`
  switch (day % 10) {
    case 1:
      return `${day}st`
    case 2:
      return `${day}nd`
    case 3:
      return `${day}rd`
    default:
      return `${day}th`
  }
}

// Format date into Flipkart style: "Mon, 22nd Sep '25"
function formatFlipkartDate(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const dayName = days[d.getDay()]
  const dayWithSuffix = getDaySuffix(d.getDate())
  const monthName = months[d.getMonth()]
  const yearShort = `'${String(d.getFullYear()).slice(-2)}`
  return `${dayName}, ${dayWithSuffix} ${monthName} ${yearShort}`
}

// Format 12-hour time: "12:14am", "4:13pm"
function formatFlipkartTime(d: Date): string {
  let hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? 'pm' : 'am'
  hours = hours % 12
  hours = hours ? hours : 12
  const minStr = minutes < 10 ? `0${minutes}` : String(minutes)
  return `${hours}:${minStr}${ampm}`
}

// Generate authentic Flipkart-style subtitle based on real product type
function getProductSubtitle(title: string): string {
  if (!title) return 'Format: Digital Pack • Instant Access'
  const lower = title.toLowerCase()
  if (lower.includes('shoe') || lower.includes('canvas') || lower.includes('sneaker') || lower.includes('footwear')) {
    return 'Size: 7 • Color: Black,White'
  }
  if (lower.includes('iphone') || lower.includes('vivo') || lower.includes('phone') || lower.includes('mobile')) {
    return 'RAM: 8 GB • Storage: 128 GB'
  }
  if (lower.includes('murti') || lower.includes('idol') || lower.includes('statue')) {
    return 'Material: Brass/Polyresin • Standard Size'
  }
  if (lower.includes('stove') || lower.includes('cooker') || lower.includes('appliance') || lower.includes('steamer')) {
    return 'Color: Black • Warranty: 1 Year'
  }
  if (lower.includes('light') || lower.includes('jhalar')) {
    return 'Pack of 3 • Color: Warm White'
  }
  if (lower.includes('wallpaper') || lower.includes('pack')) {
    return 'Format: Ultra HD 4K • Instant Delivery'
  }
  return 'Format: Digital Pack • Instant Access'
}

export default function FlipkartOrderDetailsPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const orderParam = searchParams.get('order') || ''
  const tokenParam = searchParams.get('token') || ''

  const [orderData, setOrderData] = useState<OrderLookupResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [feedbackGiven, setFeedbackGiven] = useState(false)

  // View state: 'summary' (Screenshot 1: Order Details) or 'updates' (Screenshot 2: All Updates Timeline)
  const [activeView, setActiveView] = useState<'summary' | 'updates'>('summary')
  const [orderCopied, setOrderCopied] = useState(false)
  const [isAccordionOpen, setIsAccordionOpen] = useState(true)

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: orderData?.product || 'Order Details',
          text: `Order Details for ${orderData?.product || 'Product'} (Order #${orderData?.order_number || orderParam})`,
          url: window.location.href,
        })
      } catch { }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setOrderCopied(true)
        setTimeout(() => setOrderCopied(false), 2000)
      } catch { }
    }
  }

  const handleCopyOrderNumber = (e: React.MouseEvent) => {
    e.stopPropagation()
    const ord = orderData?.order_number || orderParam
    if (!ord) return
    try {
      navigator.clipboard.writeText(ord)
      setOrderCopied(true)
      setTimeout(() => setOrderCopied(false), 2000)
    } catch { }
  }

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [activeView])

  useEffect(() => {
    let orderNum = orderParam
    if (!orderNum && typeof window !== 'undefined') {
      orderNum =
        sessionStorage.getItem('tvh_active_order_number') ||
        localStorage.getItem('tvh_active_order_number') ||
        ''
    }

    if (!orderNum) {
      // Check saved orders session
      const saved = getSavedOrders()
      if (saved.length > 0) {
        orderNum = saved[0].orderNumber
      }
    }

    if (!orderNum) {
      setLoading(false)
      return
    }

    api
      .orderLookup(orderNum)
      .then((res) => {
        setOrderData(res)
      })
      .catch((err) => {
        console.error('Order lookup failed:', err)
        // Fallback from cached localStorage
        try {
          const rawActive =
            sessionStorage.getItem('tvh_active_order') ||
            localStorage.getItem('tvh_active_order')
          if (rawActive) {
            const parsed = JSON.parse(rawActive)
            setOrderData({
              order_number: orderNum,
              status: 'PAID',
              amount: parsed.amount || 99,
              product: parsed.title || 'Digital Product Asset',
              created_at: new Date(parsed.timestamp || Date.now()).toISOString(),
              download_token: tokenParam || null,
              download_expired: false,
            })
          }
        } catch { }
      })
      .finally(() => {
        setLoading(false)
      })
  }, [orderParam, tokenParam])

  // Auto-polling verification for pending/active orders
  useEffect(() => {
    if (!orderData || orderData.status === 'PAID') return
    const orderNum = orderData.order_number
    if (!orderNum) return

    const interval = setInterval(() => {
      api
        .orderLookup(orderNum)
        .then((res) => {
          if (res && res.status === 'PAID') {
            setOrderData(res)
          }
        })
        .catch(() => { })
    }, 3500)

    const stopTimer = setTimeout(() => {
      clearInterval(interval)
    }, 35000)

    return () => {
      clearInterval(interval)
      clearTimeout(stopTimer)
    }
  }, [orderData?.order_number, orderData?.status])

  // Resolve Real Order Dates
  const orderDate = parseOrderDate(orderData?.created_at)
  const tomorrowDate = new Date(orderDate.getTime() + 86400000)
  const deliveryDate = new Date(orderDate.getTime() + 4 * 86400000)
  const primaryHub = MAJOR_HUBS[hashStr(orderData?.order_number || 'TVH') % MAJOR_HUBS.length]
  const secondaryHub =
    MAJOR_HUBS[(hashStr(orderData?.order_number || 'TVH') + 2) % MAJOR_HUBS.length]

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const isOrderToday = new Date().toDateString() === orderDate.toDateString()
  const step1DateStr = isOrderToday ? 'Today' : `${months[orderDate.getMonth()]} ${orderDate.getDate()}`
  const shippedDateStr = `${months[tomorrowDate.getMonth()]} ${tomorrowDate.getDate()}`
  const deliveryFullStr = `${daysShort[deliveryDate.getDay()]} ${months[deliveryDate.getMonth()]} ${deliveryDate.getDate()} by 11 PM`
  const deliveryShortStr = `${months[deliveryDate.getMonth()]} ${String(deliveryDate.getDate()).padStart(2, '0')}`

  // Ekart tracking code: e.g. FMPC5235648370
  const ekartTrackingId = `FMPC${String(hashStr(orderData?.order_number || 'TVH')).slice(0, 10).padEnd(10, '8')}`

  // Real Display Order Number (OD + 18 digits)
  const displayOrderNumber = (orderData?.order_number || orderParam || 'OD338881486622885100').replace(/^#/, '')

  // Product Image resolution
  const thematicFallback = getThematicImagesForTitle(orderData?.product || '')
  const displayImage = orderData?.product_image || thematicFallback[0]

  // Pre-calculated milestone timestamps relative to real order time
  const timePlaced = new Date(orderDate.getTime())
  const now = Date.now()
  const timeSellerProcessed = new Date(Math.min(now, orderDate.getTime() + 2 * 60000))
  const timeFacilityConfirmed = new Date(Math.min(now, orderDate.getTime() + 4 * 60000))

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100dvh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#F1F2F4',
          fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              border: '3.5px solid #E5E7EB',
              borderTop: '3.5px solid #2874F0',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 14px auto',
            }}
          />
          <p style={{ color: '#4B5563', fontSize: '0.9rem', fontWeight: 600 }}>
            Loading Order Details...
          </p>
        </div>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        minHeight: '100dvh',
        background: '#F1F2F4',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#111827',
        paddingBottom: '40px',
      }}
    >
      <div
        style={{
          maxWidth: '520px',
          margin: '0 auto',
          background: '#FFFFFF',
          minHeight: '100dvh',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 1: SCREENSHOT 1 — MAIN ORDER DETAILS SCREEN
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeView === 'summary' && (
          <motion.div
            key="summary-view"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.2 }}
          >
            {/* ── 1. Top Navbar: Arrow + "Order Details" + "Help" + Share Icon ── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '14px 16px',
                borderBottom: '1px solid #F3F4F6',
                position: 'sticky',
                top: 0,
                background: '#FFFFFF',
                zIndex: 30,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (window.history.length > 1) {
                      navigate(-1)
                    } else {
                      navigate('/my-orders')
                    }
                  }}
                  aria-label="Back to store"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#111827',
                  }}
                >
                  <ArrowLeft size={24} strokeWidth={2.4} />
                </button>
                <h1
                  style={{
                    fontSize: '1.25rem',
                    fontWeight: 700,
                    margin: 0,
                    color: '#111827',
                    letterSpacing: '-0.01em',
                  }}
                >
                  Order Details
                </h1>
              </div>

              {/* Right: Help Button + Share Icon (Matching Screenshot 100%) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Link
                  to={`/order/support?order=${encodeURIComponent(orderData?.order_number || orderParam)}${tokenParam ? `&token=${encodeURIComponent(tokenParam)}` : ''}`}
                  style={{
                    textDecoration: 'none',
                    padding: '6px 18px',
                    borderRadius: '8px',
                    border: '1px solid #D1D5DB',
                    color: '#111827',
                    fontSize: '0.92rem',
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#FFFFFF',
                  }}
                >
                  Help
                </Link>

                <button
                  type="button"
                  onClick={handleShare}
                  aria-label="Share order details"
                  title="Share order details"
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#111827',
                  }}
                >
                  <Send size={20} strokeWidth={2.2} />
                </button>
              </div>
            </div>

            {/* ── 2. Product Summary Card (Matching Screenshot) ── */}
            <div
              style={{
                padding: '16px 16px 6px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                background: '#FFFFFF',
              }}
            >
              {/* Product Thumbnail Squircle */}
              <div
                style={{
                  width: '58px',
                  height: '58px',
                  borderRadius: '12px',
                  border: '1px solid #E5E7EB',
                  padding: '3px',
                  background: '#F9FAFB',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  overflow: 'hidden',
                }}
              >
                <img
                  src={displayImage}
                  alt={orderData?.product || 'Product'}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                  onError={(e) => {
                    ; (e.target as HTMLImageElement).src = thematicFallback[0]
                  }}
                />
              </div>

              {/* Title & Real Variation Subtitle */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    color: '#111827',
                    margin: '0 0 4px 0',
                    lineHeight: 1.35,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {orderData?.product || 'Digital Media Product Asset'}
                </h2>
                <div
                  style={{
                    fontSize: '0.86rem',
                    color: '#717478',
                    fontWeight: 500,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {getProductSubtitle(orderData?.product || '')}
                </div>
              </div>
            </div>

            {/* ── Order #OD... with Blue Copy Icon (Matching Screenshot 100%) ── */}
            <div
              style={{
                padding: '4px 16px 14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '0.92rem',
                  color: '#717478',
                  fontWeight: 500,
                }}
              >
                Order #{displayOrderNumber}
              </span>
              <button
                type="button"
                onClick={handleCopyOrderNumber}
                aria-label="Copy Order ID"
                title="Copy Order ID"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 2,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2874F0',
                  position: 'relative',
                }}
              >
                <Copy size={16} strokeWidth={2.2} />
                {orderCopied && (
                  <span
                    style={{
                      position: 'absolute',
                      left: '22px',
                      top: '-4px',
                      background: '#111827',
                      color: '#FFFFFF',
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                      zIndex: 10,
                    }}
                  >
                    Copied!
                  </span>
                )}
              </button>
            </div>

            {/* ── 3. Main Status Card (Matching Screenshot 100%) ── */}
            <div style={{ padding: '0 16px 20px 16px' }}>
              <div
                style={{
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  background: '#FFFFFF',
                  padding: '22px 20px 18px 20px',
                  boxShadow: '0 1px 4px rgba(0, 0, 0, 0.02)',
                }}
              >
                {/* Header: "Order Confirmed" + ChevronUp Accordion Icon */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                  }}
                  onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                >
                  <h3
                    style={{
                      fontSize: '1.38rem',
                      fontWeight: 800,
                      margin: 0,
                      color: '#111827',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {orderData?.status === 'FAILED' ? 'Payment Failed' : 'Order Confirmed'}
                  </h3>

                  <button
                    type="button"
                    aria-label="Toggle details"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 2,
                      display: 'flex',
                      alignItems: 'center',
                      color: '#111827',
                    }}
                  >
                    {isAccordionOpen ? (
                      <ChevronUp size={24} strokeWidth={2.4} />
                    ) : (
                      <ChevronDown size={24} strokeWidth={2.4} />
                    )}
                  </button>
                </div>

                {isAccordionOpen && (
                  <div>
                    {/* Subtitle location text */}
                    <p
                      style={{
                        fontSize: '0.98rem',
                        color: '#111827',
                        margin: '12px 0 24px 0',
                        fontWeight: 400,
                      }}
                    >
                      {orderData?.status === 'PAID'
                        ? 'Your Order has been placed.'
                        : orderData?.status === 'FAILED'
                        ? 'Payment was declined or cancelled.'
                        : 'Your Order has been placed.'}
                    </p>

                    {/* Horizontal Delivery Tracker (Matching Screenshot Layout & Alignment) */}
                    <div style={{ position: 'relative', marginBottom: '24px' }}>
                      {/* Step Circles & Connecting Lines Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          width: '100%',
                          height: '22px',
                          position: 'relative',
                        }}
                      >
                        {/* Step 1 Circle: Order Confirmed (Green circle with Checkmark) */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            background: '#008444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                            zIndex: 2,
                          }}
                        >
                          <Check size={13} color="#FFFFFF" strokeWidth={3.5} />
                        </div>

                        {/* Connecting Line 1 */}
                        <div
                          style={{
                            flex: 1,
                            height: '2px',
                            background: '#9CA3AF',
                            zIndex: 1,
                          }}
                        />

                        {/* Step 2 Circle: Shipped (Empty Circle Outline) */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '1.8px solid #9CA3AF',
                            background: '#FFFFFF',
                            flexShrink: 0,
                            zIndex: 2,
                            boxSizing: 'border-box',
                          }}
                        />

                        {/* Connecting Line 2 */}
                        <div
                          style={{
                            flex: 1,
                            height: '2px',
                            background: '#9CA3AF',
                            zIndex: 1,
                          }}
                        />

                        {/* Step 3 Circle: Delivery (Empty Circle Outline) */}
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: '50%',
                            border: '1.8px solid #9CA3AF',
                            background: '#FFFFFF',
                            flexShrink: 0,
                            zIndex: 2,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      {/* Labels Row (Matching Screenshot: Left, Center, Right) */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          marginTop: '10px',
                        }}
                      >
                        {/* Step 1 Label (Left aligned) */}
                        <div style={{ textAlign: 'left' }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              color: '#374151',
                              fontWeight: 500,
                            }}
                          >
                            Order Confirmed
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: '#717478',
                              marginTop: '2px',
                            }}
                          >
                            {step1DateStr}
                          </div>
                        </div>

                        {/* Step 2 Label (Centered) */}
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              color: '#374151',
                              fontWeight: 500,
                            }}
                          >
                            Shipped
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: '#717478',
                              marginTop: '2px',
                            }}
                          >
                            {shippedDateStr}
                          </div>
                        </div>

                        {/* Step 3 Label (Right aligned) */}
                        <div style={{ textAlign: 'right' }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              color: '#374151',
                              fontWeight: 500,
                            }}
                          >
                            Delivery
                          </div>
                          <div
                            style={{
                              fontSize: '0.82rem',
                              color: '#717478',
                              marginTop: '2px',
                            }}
                          >
                            {deliveryFullStr}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Delivery Executive Info Callout Box (Grey Pill Box from Screenshot) */}
                    <div
                      style={{
                        background: '#F4F5F7',
                        borderRadius: '12px',
                        padding: '12px 14px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                        marginBottom: '16px',
                      }}
                    >
                      <Info size={18} color="#6B7280" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span
                        style={{
                          fontSize: '0.84rem',
                          color: '#374151',
                          lineHeight: 1.45,
                        }}
                      >
                        Delivery Executive details will be available once the order is out for delivery
                      </span>
                    </div>

                    {/* Divider line across the card */}
                    <div
                      style={{
                        height: '1px',
                        background: '#F0F1F3',
                        margin: '16px -20px 0 -20px',
                      }}
                    />

                    {/* ── Clickable Blue Link: "See all updates" (Opens Screenshot 2 view) ── */}
                    <div
                      style={{
                        paddingTop: '14px',
                        textAlign: 'center',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveView('updates')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#1C74E9',
                          fontSize: '1.04rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          padding: '4px 12px',
                          letterSpacing: '0.01em',
                        }}
                      >
                        See all updates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ── Instant Digital Delivery & Access Card (For Paid Orders) ── */}
            {orderData?.status === 'PAID' && (
              <div style={{ padding: '0 16px 20px 16px' }}>
                <div
                  style={{
                    background: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
                    border: '1.5px solid #86EFAC',
                    borderRadius: '16px',
                    padding: '16px 18px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    boxShadow: '0 2px 8px rgba(16, 185, 129, 0.08)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem' }}>⚡</span>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.96rem', color: '#14532D' }}>
                        Instant Digital Download Unlocked
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#166534' }}>
                        Your product files and download links are ready
                      </div>
                    </div>
                  </div>

                  <a
                    href={
                      orderData.download_token
                        ? `/download/${orderData.download_token}`
                        : `/order-lookup?order=${encodeURIComponent(orderData.order_number || orderParam)}`
                    }
                    style={{
                      textDecoration: 'none',
                      background: '#16A34A',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '0.92rem',
                      padding: '12px 18px',
                      borderRadius: '10px',
                      textAlign: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 2px 6px rgba(22, 163, 74, 0.3)',
                    }}
                  >
                    <Download size={18} strokeWidth={2.5} />
                    <span>Access / Download Product Assets</span>
                  </a>
                </div>
              </div>
            )}

            {/* ── 4. "Rate your experience" Section (Screenshot 1 bottom) ── */}
            <div style={{ padding: '0 16px 24px 16px' }}>
              <h3
                style={{
                  fontSize: '1.08rem',
                  fontWeight: 800,
                  color: '#111827',
                  margin: '0 0 12px 0',
                }}
              >
                Rate your experience
              </h3>

              <div
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '14px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                }}
                onClick={() => setFeedbackGiven(true)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <ThumbsUp
                    size={20}
                    color={feedbackGiven ? '#008444' : '#4B5563'}
                    fill={feedbackGiven ? '#008444' : 'none'}
                  />
                  <span
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 600,
                      color: '#1F2937',
                    }}
                  >
                    {feedbackGiven
                      ? 'Thank you for your feedback! ⭐'
                      : 'Did you find this page helpful?'}
                  </span>
                </div>

                <ChevronRight size={18} color="#9CA3AF" />
              </div>
            </div>
          </motion.div>
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            VIEW 2: SCREENSHOT 2 — DETAILED TRACKING UPDATES TIMELINE
           ═══════════════════════════════════════════════════════════════════════ */}
        {activeView === 'updates' && (
          <motion.div
            key="updates-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.2 }}
          >
            {/* Top Bar with Back Arrow */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px 16px',
                borderBottom: '1px solid #F3F4F6',
                position: 'sticky',
                top: 0,
                background: '#FFFFFF',
                zIndex: 30,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveView('summary')}
                aria-label="Back to order details"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827',
                }}
              >
                <ArrowLeft size={22} strokeWidth={2.4} />
              </button>
              <h1
                style={{
                  fontSize: '1.18rem',
                  fontWeight: 700,
                  margin: 0,
                  color: '#111827',
                  letterSpacing: '-0.01em',
                }}
              >
                Tracking Updates
              </h1>
            </div>

            {/* Order ID Sub-Bar */}
            {(orderData?.order_number || orderParam) && (
              <div
                style={{
                  padding: '9px 16px',
                  background: '#FFFFFF',
                  borderBottom: '1px solid #F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '0.84rem', color: '#6B7280', fontWeight: 500 }}>
                  Order ID -{' '}
                  <span style={{ color: '#111827', fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                    {orderData?.order_number || orderParam}
                  </span>
                </div>
              </div>
            )}

            {/* Vertical Animated Timeline Container (Matching Screenshot 2) */}
            <div style={{ padding: '24px 20px 30px 24px', position: 'relative' }}>
              {/* Outer Relative Wrapper for the Continuous Vertical Green Line */}
              <div style={{ position: 'relative' }}>
                {/* ── Background Grey Track Line ── */}
                <div
                  style={{
                    position: 'absolute',
                    top: '12px',
                    bottom: '24px',
                    left: '8px',
                    width: '3.5px',
                    background: '#E5E7EB',
                    borderRadius: '2px',
                    zIndex: 1,
                  }}
                />

                {/* ── Animated Green Filled Line (Animates smoothly down through Node 1 events) ── */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: '175px' }}
                  transition={{ duration: 0.9, ease: 'easeOut', delay: 0.15 }}
                  style={{
                    position: 'absolute',
                    top: '12px',
                    left: '8px',
                    width: '3.5px',
                    background: '#008444',
                    borderRadius: '2px',
                    zIndex: 2,
                  }}
                />

                {/* ── SECTION 1: "Order Confirmed Mon, 22nd Sep '25" (Screenshot 2 Top Node - ACTIVE) ── */}
                <div style={{ position: 'relative', paddingLeft: '32px', marginBottom: '36px' }}>
                  {/* Green Solid Pulsing Dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '0px',
                      width: '19px',
                      height: '19px',
                      borderRadius: '50%',
                      background: '#008444',
                      zIndex: 3,
                      boxShadow: '0 0 0 4px #FFFFFF, 0 0 0 7px rgba(0, 132, 68, 0.18)',
                    }}
                  />

                  {/* Node Header Title: Order Confirmed + Real Date */}
                  <h4
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: '#111827',
                      margin: '0 0 10px 0',
                      lineHeight: 1.3,
                    }}
                  >
                    Order Confirmed {formatFlipkartDate(orderDate)}
                  </h4>

                  {/* Sub-Events List (Screenshot 2 style with real timestamps and hubs) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Event 1 */}
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#1F2937', fontWeight: 600 }}>
                        Your Order has been placed.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                        {formatFlipkartDate(orderDate)} - {formatFlipkartTime(timePlaced)}
                      </div>
                    </div>

                    {/* Event 2 */}
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#1F2937', fontWeight: 600 }}>
                        Seller has processed your order.
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                        {formatFlipkartDate(orderDate)} - {formatFlipkartTime(timeSellerProcessed)}
                      </div>
                    </div>

                    {/* Event 3 */}
                    <div>
                      <div style={{ fontSize: '0.88rem', color: '#1F2937', fontWeight: 600 }}>
                        Order verified at Flipkart Facility
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                        {formatFlipkartDate(orderDate)} - {formatFlipkartTime(timeFacilityConfirmed)} -{' '}
                        <strong style={{ color: '#111827' }}>{primaryHub}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: "Shipped" (Pending Milestone - Grey circle, NO TICK) ── */}
                <div style={{ position: 'relative', paddingLeft: '32px', marginBottom: '36px' }}>
                  {/* Grey Outline Circle */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '0px',
                      width: '19px',
                      height: '19px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: '2.5px solid #9CA3AF',
                      zIndex: 3,
                      boxShadow: '0 0 0 4px #FFFFFF',
                    }}
                  />

                  {/* Node Header: Shipped + Expected Date */}
                  <h4
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 700,
                      color: '#4B5563',
                      margin: '0 0 8px 0',
                      lineHeight: 1.3,
                    }}
                  >
                    Shipped (Expected {formatFlipkartDate(tomorrowDate)})
                  </h4>

                  {/* Ekart Logistics Details */}
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '0.94rem', fontWeight: 700, color: '#374151' }}>
                      Ekart Logistics - {ekartTrackingId}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#4B5563', fontWeight: 500, marginTop: '3px' }}>
                      Item is being packed & scheduled for dispatch from Flipkart Facility -{' '}
                      <strong style={{ color: '#111827' }}>{primaryHub}</strong>.
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#6B7280', marginTop: '2px' }}>
                      Expected dispatch to {secondaryHub} Hub
                    </div>
                  </div>
                </div>

                {/* ── SECTION 3: "Out for Delivery / Expected Delivery" (Pending Milestone) ── */}
                <div style={{ position: 'relative', paddingLeft: '32px' }}>
                  {/* Outline Pending Dot */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '2px',
                      left: '0px',
                      width: '19px',
                      height: '19px',
                      borderRadius: '50%',
                      background: '#FFFFFF',
                      border: '2.5px solid #9CA3AF',
                      zIndex: 3,
                      boxShadow: '0 0 0 4px #FFFFFF',
                    }}
                  />

                  <h4
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 700,
                      color: '#4B5563',
                      margin: '0 0 6px 0',
                    }}
                  >
                    Delivery Expected by {formatFlipkartDate(deliveryDate)}
                  </h4>

                  <div style={{ fontSize: '0.84rem', color: '#6B7280', lineHeight: 1.4 }}>
                    Your item will be delivered to your address and dashboard by 11:00 PM.
                  </div>
                </div>
              </div>

              {/* Bottom Back Button */}
              <div style={{ marginTop: '36px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('summary')}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '12px',
                    background: '#2874F0',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    cursor: 'pointer',
                    width: '100%',
                    boxShadow: '0 3px 10px rgba(40, 116, 240, 0.25)',
                  }}
                >
                  ← Back to Order Summary
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
