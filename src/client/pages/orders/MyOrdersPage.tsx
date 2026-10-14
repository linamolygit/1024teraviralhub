// src/client/pages/orders/MyOrdersPage.tsx — Exact Flipkart Mobile "My Orders" Interface
import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Search,
  SlidersHorizontal,
  ChevronRight,
  Package,
  X,
  RefreshCw,
  ShoppingBag,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'
import { api, type MyOrderItem } from '../../lib/api'
import { useSavedOrders, saveOrderSession } from '../../lib/orderSession'
import { useSiteConfig } from '../../lib/site-config'

export default function MyOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { siteName } = useSiteConfig()
  const { orders: savedSessionOrders, saveOrder } = useSavedOrders()

  // URL Query Parameters
  const urlOrderParam = searchParams.get('order') || ''
  const urlPhoneParam = searchParams.get('phone') || ''
  const urlEmailParam = searchParams.get('email') || ''
  const urlQParam = searchParams.get('q') || ''

  // Local Search & Filter State
  const [searchQuery, setSearchQuery] = useState(urlQParam || urlOrderParam || urlPhoneParam)
  const [submittedSearch, setSubmittedSearch] = useState(urlQParam || urlOrderParam || urlPhoneParam)
  const [activeTab, setActiveTab] = useState<'all' | 'flipkart' | 'grocery' | 'minutes'>('all')
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all')
  const [showFilterModal, setShowFilterModal] = useState(false)

  // Browser Page Title
  useEffect(() => {
    document.title = `My Orders — ${siteName}`
  }, [siteName])

  // Collect all known order numbers from localStorage, sessionStorage, and cookie
  const localLastPurchased = typeof window !== 'undefined' ? localStorage.getItem('tvh_last_purchased_order') : null
  const localActiveOrderNum = typeof window !== 'undefined' ? (localStorage.getItem('tvh_active_order_number') || sessionStorage.getItem('tvh_active_order_number')) : null
  let activeOrderFromObj: string | null = null
  try {
    const raw = typeof window !== 'undefined' ? (localStorage.getItem('tvh_active_order') || sessionStorage.getItem('tvh_active_order')) : null
    if (raw) activeOrderFromObj = JSON.parse(raw)?.order_number || null
  } catch {}

  const allOrderNumbers = useMemo(() => {
    return Array.from(
      new Set([
        ...savedSessionOrders.map((o) => o.orderNumber?.trim()).filter(Boolean),
        ...(localLastPurchased ? [localLastPurchased.trim()] : []),
        ...(localActiveOrderNum ? [localActiveOrderNum.trim()] : []),
        ...(activeOrderFromObj ? [activeOrderFromObj.trim()] : []),
        ...(urlOrderParam ? [urlOrderParam.trim()] : []),
      ])
    ) as string[]
  }, [savedSessionOrders, localLastPurchased, localActiveOrderNum, activeOrderFromObj, urlOrderParam])

  // Fetch real orders from database via backend API
  const {
    data: ordersData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['my-orders-list', allOrderNumbers.join(','), submittedSearch, urlEmailParam, urlPhoneParam],
    queryFn: () =>
      api.myOrders({
        orders: allOrderNumbers.join(',') || undefined,
        q: submittedSearch || undefined,
        phone: urlPhoneParam || undefined,
        email: urlEmailParam || undefined,
      }),
    staleTime: 10000,
  })

  const rawOrders: MyOrderItem[] = ordersData?.orders || []

  // Sync found orders into session & cookies
  useEffect(() => {
    if (rawOrders.length > 0) {
      for (const ord of rawOrders) {
        if (ord.order_number) {
          saveOrder({
            orderNumber: ord.order_number,
            token: ord.download_token || undefined,
            productTitle: ord.product,
            thumbnailUrl: ord.product_image || undefined,
            createdAt: ord.created_at,
          })
          try {
            document.cookie = `tvh_last_order=${encodeURIComponent(ord.order_number)}; path=/; max-age=31536000; SameSite=Lax`
          } catch {}
        }
      }
    }
  }, [rawOrders, saveOrder])

  // Handle Search Submission (Enter or Click)
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmittedSearch(searchQuery.trim())
    const newParams = new URLSearchParams(searchParams)
    if (searchQuery.trim()) {
      newParams.set('q', searchQuery.trim())
    } else {
      newParams.delete('q')
    }
    setSearchParams(newParams)
  }

  // Filter orders by active tab, status, and local instant search filter
  const displayedOrders = useMemo(() => {
    return rawOrders.filter((ord) => {
      // Status filter
      if (statusFilter === 'paid' && !ord.is_paid) return false
      if (statusFilter === 'pending' && ord.is_paid) return false

      // Tab filter
      if (activeTab === 'grocery' || activeTab === 'minutes') {
        // We are a digital product store, so grocery/minutes tabs show empty state
        return false
      }

      // In-page text filter (if search query entered but not yet submitted)
      if (searchQuery.trim() && !submittedSearch) {
        const q = searchQuery.toLowerCase()
        const matchesProduct = ord.product?.toLowerCase().includes(q)
        const matchesOrder = ord.order_number?.toLowerCase().includes(q)
        const matchesDelivery = ord.delivery_headline?.toLowerCase().includes(q)
        if (!matchesProduct && !matchesOrder && !matchesDelivery) return false
      }

      return true
    })
  }, [rawOrders, statusFilter, activeTab, searchQuery, submittedSearch])

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
      {/* ── Mobile Container (Max 540px, centered on desktop) ── */}
      <div
        style={{
          maxWidth: '540px',
          margin: '0 auto',
          background: '#FFFFFF',
          minHeight: '100dvh',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.05)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            1. TOP NAVBAR: ← My Orders
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '14px 16px',
            background: '#FFFFFF',
            borderBottom: '1px solid #F3F4F6',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate('/')
              }
            }}
            aria-label="Back"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111827',
              marginRight: '12px',
            }}
          >
            <ArrowLeft size={22} strokeWidth={2.4} />
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
            My Orders
          </h1>
          {isFetching && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center' }}>
              <RefreshCw size={16} className="spin-icon" color="#6B7280" />
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            2. SEARCH & FILTERS BAR (Matching Flipkart Mobile)
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            padding: '12px 16px 8px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            background: '#FFFFFF',
          }}
        >
          {/* Search Input Box */}
          <form
            onSubmit={handleSearchSubmit}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              background: '#FFFFFF',
              border: '1.5px solid #D1D5DB',
              borderRadius: '10px',
              padding: '0 12px',
              height: '44px',
              boxSizing: 'border-box',
            }}
          >
            <Search size={18} color="#6B7280" style={{ marginRight: '8px', flexShrink: 0 }} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your orders..."
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '0.92rem',
                color: '#111827',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('')
                  setSubmittedSearch('')
                  const newParams = new URLSearchParams(searchParams)
                  newParams.delete('q')
                  setSearchParams(newParams)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '2px',
                  color: '#9CA3AF',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </form>

          {/* Filters Button */}
          <button
            type="button"
            onClick={() => setShowFilterModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 4px',
              color: '#111827',
              fontSize: '0.92rem',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            <SlidersHorizontal size={18} strokeWidth={2.2} />
            <span>Filters</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. HORIZONTAL FILTER PILLS: All | Flipkart | Grocery | Minutes
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px 14px 16px',
            overflowX: 'auto',
            background: '#FFFFFF',
            borderBottom: '1px solid #F3F4F6',
            scrollbarWidth: 'none',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            style={{
              padding: '6px 18px',
              borderRadius: '9999px',
              border: activeTab === 'all' ? '1px solid #111827' : '1px solid #E5E7EB',
              background: activeTab === 'all' ? '#111827' : '#FFFFFF',
              color: activeTab === 'all' ? '#FFFFFF' : '#111827',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            All
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('flipkart')}
            style={{
              padding: '6px 18px',
              borderRadius: '9999px',
              border: activeTab === 'flipkart' ? '1px solid #111827' : '1px solid #E5E7EB',
              background: activeTab === 'flipkart' ? '#111827' : '#FFFFFF',
              color: activeTab === 'flipkart' ? '#FFFFFF' : '#111827',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Flipkart
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grocery')}
            style={{
              padding: '6px 18px',
              borderRadius: '9999px',
              border: activeTab === 'grocery' ? '1px solid #111827' : '1px solid #E5E7EB',
              background: activeTab === 'grocery' ? '#111827' : '#FFFFFF',
              color: activeTab === 'grocery' ? '#FFFFFF' : '#111827',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Grocery
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('minutes')}
            style={{
              padding: '6px 18px',
              borderRadius: '9999px',
              border: activeTab === 'minutes' ? '1px solid #111827' : '1px solid #E5E7EB',
              background: activeTab === 'minutes' ? '#111827' : '#FFFFFF',
              color: activeTab === 'minutes' ? '#FFFFFF' : '#111827',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            Minutes
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════
            4. ORDERS LIST (Exact Flipkart Style Cards)
           ══════════════════════════════════════════════════════════ */}
        <div style={{ flex: 1, background: '#FFFFFF' }}>
          {isLoading ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  border: '3.5px solid #E5E7EB',
                  borderTop: '3.5px solid #2874F0',
                  animation: 'spin 0.8s linear infinite',
                  margin: '0 auto 12px auto',
                }}
              />
              <p style={{ color: '#6B7280', fontSize: '0.88rem', fontWeight: 600 }}>Loading orders...</p>
            </div>
          ) : displayedOrders.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {displayedOrders.map((ord) => {
                const imgUrl = ord.product_image || '/api/images/fallback.png'
                return (
                  <div
                    key={ord.order_number || ord.id}
                    onClick={() => navigate(`/order/details?order=${encodeURIComponent(ord.order_number)}`)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '16px',
                      borderBottom: '1px solid #F3F4F6',
                      background: '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'background 0.12s ease',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = '#F9FAFB'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLElement).style.background = '#FFFFFF'
                    }}
                  >
                    {/* Left: Product Thumbnail Squircle (Matching Screenshot 100%) */}
                    <div
                      style={{
                        width: '74px',
                        height: '74px',
                        borderRadius: '12px',
                        background: '#F3F4F6',
                        border: '1px solid #E5E7EB',
                        padding: '5px',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        marginRight: '16px',
                      }}
                    >
                      <img
                        src={imgUrl}
                        alt={ord.product || 'Product'}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                          borderRadius: '8px',
                        }}
                        onError={(e) => {
                          ;(e.target as HTMLImageElement).src =
                            'https://placehold.co/100x100/f3f4f6/111827?text=Product'
                        }}
                      />
                    </div>

                    {/* Middle: Order Details (Headline & Subtitle) */}
                    <div style={{ flex: 1, minWidth: 0, paddingRight: '8px' }}>
                      {/* Bold Primary Line (e.g. "Delivery expected by Oct 24") */}
                      <h3
                        style={{
                          fontSize: '0.96rem',
                          fontWeight: 700,
                          color: '#111827',
                          margin: '0 0 4px 0',
                          lineHeight: 1.35,
                          letterSpacing: '-0.01em',
                        }}
                      >
                        {ord.delivery_headline}
                      </h3>

                      {/* Subtitle (e.g. "Your Order has been placed.") */}
                      <p
                        style={{
                          fontSize: '0.84rem',
                          color: '#4B5563',
                          margin: '0 0 4px 0',
                          lineHeight: 1.35,
                        }}
                      >
                        {ord.delivery_subtitle}
                      </p>

                      {/* Product Name & Price Muted Line */}
                      <p
                        style={{
                          fontSize: '0.78rem',
                          color: '#6B7280',
                          margin: 0,
                          lineHeight: 1.3,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {ord.product} • ₹{ord.amount}
                      </p>
                    </div>

                    {/* Right: Chevron Arrow (>) */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#111827',
                        flexShrink: 0,
                        marginLeft: 'auto',
                      }}
                    >
                      <ChevronRight size={18} strokeWidth={2.4} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* ══════════════════════════════════════════════════════════
                EMPTY STATE: No Orders Found / Find by Phone
               ══════════════════════════════════════════════════════════ */
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: '#F3F4F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  color: '#6B7280',
                }}
              >
                <Package size={30} />
              </div>

              <h2
                style={{
                  fontSize: '1.15rem',
                  fontWeight: 700,
                  color: '#111827',
                  marginBottom: '8px',
                }}
              >
                {submittedSearch
                  ? 'No matching orders found'
                  : activeTab === 'grocery'
                  ? 'No Grocery orders yet'
                  : activeTab === 'minutes'
                  ? 'No Minutes orders yet'
                  : 'No orders found on this device'}
              </h2>

              <p
                style={{
                  fontSize: '0.875rem',
                  color: '#6B7280',
                  lineHeight: 1.5,
                  maxWidth: '380px',
                  margin: '0 auto 24px auto',
                }}
              >
                {submittedSearch
                  ? `We could not find any order matching "${submittedSearch}". Please verify your order number or phone number.`
                  : 'Enter your 10-digit mobile number or order number to find and link your purchases immediately.'}
              </p>

              {/* Find Order by Mobile / Order # Input Box */}
              <form
                onSubmit={handleSearchSubmit}
                style={{
                  maxWidth: '360px',
                  margin: '0 auto 24px auto',
                  display: 'flex',
                  gap: '8px',
                }}
              >
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter 10-digit Mobile # or Order #"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid #D1D5DB',
                    fontSize: '0.88rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: '#2874F0',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  Find
                </button>
              </form>

              <Link
                to="/"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 24px',
                  borderRadius: '10px',
                  background: '#111827',
                  color: '#FFFFFF',
                  textDecoration: 'none',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                }}
              >
                <ShoppingBag size={16} /> Continue Shopping
              </Link>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════════
            5. FILTER BOTTOM SHEET / MODAL
           ══════════════════════════════════════════════════════════ */}
        <AnimatePresence>
          {showFilterModal && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowFilterModal(false)}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0,0,0,0.45)',
                  zIndex: 90,
                }}
              />

              {/* Bottom Sheet */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  maxWidth: '540px',
                  margin: '0 auto',
                  background: '#FFFFFF',
                  borderTopLeftRadius: '20px',
                  borderTopRightRadius: '20px',
                  padding: '20px',
                  zIndex: 100,
                  boxShadow: '0 -10px 30px rgba(0,0,0,0.15)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    borderBottom: '1px solid #F3F4F6',
                    paddingBottom: '12px',
                  }}
                >
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#111827' }}>
                    Filter Orders
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowFilterModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#6B7280',
                    }}
                  >
                    <X size={20} />
                  </button>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#6B7280', marginBottom: '10px' }}>
                    ORDER STATUS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { id: 'all', label: 'All Orders' },
                      { id: 'paid', label: 'Delivered / Placed' },
                      { id: 'pending', label: 'Payment Awaiting Confirmation' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setStatusFilter(opt.id as any)
                          setShowFilterModal(false)
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: statusFilter === opt.id ? '1.5px solid #2874F0' : '1px solid #E5E7EB',
                          background: statusFilter === opt.id ? '#EFF6FF' : '#FFFFFF',
                          color: statusFilter === opt.id ? '#1D4ED8' : '#111827',
                          fontWeight: statusFilter === opt.id ? 700 : 500,
                          fontSize: '0.9rem',
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStatusFilter('all')
                    setShowFilterModal(false)
                  }}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#F3F4F6',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: '#374151',
                    cursor: 'pointer',
                  }}
                >
                  Reset Filters
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        .spin-icon { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  )
}
