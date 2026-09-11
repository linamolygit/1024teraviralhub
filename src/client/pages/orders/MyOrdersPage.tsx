
// src/client/pages/orders/MyOrdersPage.tsx — Dedicated My Orders & Re-Download Hub with Cookie Session
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Package, Download, AlertCircle, RefreshCw, Clock, ShieldCheck,
  Search, Plus, CheckCircle2, ChevronDown, ChevronUp, Sparkles, Headphones
} from 'lucide-react'
import { api, type PurchasedDownloadItem } from '../../lib/api'
import { useSavedOrders, saveOrderSession } from '../../lib/orderSession'
import DownloadProductCard from '../../components/downloads/DownloadProductCard'
import DownloadsAccessInfo from '../../components/downloads/DownloadsAccessInfo'
import DownloadsHelpSection from '../../components/downloads/DownloadsHelpSection'
import NoDownloadsState from '../../components/downloads/NoDownloadsState'
import { useSiteConfig } from '../../lib/site-config'

export default function MyOrdersPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { siteName } = useSiteConfig()
  const { orders: savedSessionOrders, count: savedSessionCount, saveOrder } = useSavedOrders()

  const urlOrderParam = searchParams.get('order') || ''
  const urlTokenParam = searchParams.get('token') || ''
  const urlEmailParam = searchParams.get('email') || ''

  const [searchOrder, setSearchOrder] = useState(urlOrderParam)
  const [searchEmail, setSearchEmail] = useState(urlEmailParam)
  const [showAddOrderBox, setShowAddOrderBox] = useState(false)
  const [lookupFeedback, setLookupFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Dynamic Browser Page Title
  useEffect(() => {
    document.title = `My Orders & Downloads — ${siteName}`
  }, [siteName])

  // Collect all tokens and order numbers from browser session + query params
  const allTokens = Array.from(
    new Set([
      ...savedSessionOrders.map((o) => o.token?.trim()).filter(Boolean),
      ...(urlTokenParam ? urlTokenParam.split(',').map((t) => t.trim()) : []),
    ])
  ) as string[]

  const allOrderNumbers = Array.from(
    new Set([
      ...savedSessionOrders.map((o) => o.orderNumber?.trim()).filter(Boolean),
      ...(urlOrderParam ? [urlOrderParam.trim()] : []),
      ...(searchOrder ? [searchOrder.trim()] : []),
    ])
  ) as string[]

  // Query Backend Purchases Access
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['my-orders-access', allTokens.join(','), allOrderNumbers.join(','), searchEmail],
    queryFn: () =>
      api.download.getPurchases({
        tokens: allTokens.join(',') || undefined,
        orders: allOrderNumbers.join(',') || undefined,
        email: searchEmail || undefined,
      }),
    enabled: allTokens.length > 0 || allOrderNumbers.length > 0 || !!searchEmail,
    staleTime: 30000,
  })

  const activePurchases: PurchasedDownloadItem[] = data?.active || []
  const expiredPurchases: PurchasedDownloadItem[] = data?.expired || []
  const hasPurchases = activePurchases.length > 0 || expiredPurchases.length > 0

  // Whenever purchases are fetched, ensure they are synced to dual cookie/session storage
  useEffect(() => {
    if (data) {
      const allItems = [...(data.active || []), ...(data.expired || [])]
      for (const it of allItems) {
        if (it.order_number || it.token) {
          saveOrder({
            orderNumber: it.order_number,
            token: it.token,
            productTitle: it.product?.title,
            thumbnailUrl: it.product?.thumbnail_url || undefined,
            createdAt: it.purchased_at,
          })
        }
      }
    }
  }, [data, saveOrder])

  // Manual lookup handler to add/link an existing order to this browser
  const handleLookupSubmit = async (orderNum: string, emailStr: string) => {
    setSearchOrder(orderNum)
    setSearchEmail(emailStr)
    setLookupFeedback(null)

    const newParams = new URLSearchParams(searchParams)
    if (orderNum) newParams.set('order', orderNum)
    if (emailStr) newParams.set('email', emailStr)
    setSearchParams(newParams)

    if (orderNum) {
      saveOrderSession({
        orderNumber: orderNum,
        createdAt: Date.now(),
      })
    }

    try {
      const res = await api.download.getPurchases({
        order: orderNum || undefined,
        email: emailStr || undefined,
      })

      const found = (res.active?.length || 0) + (res.expired?.length || 0)
      if (found > 0) {
        setLookupFeedback({
          type: 'success',
          message: `Found ${found} order item(s)! Automatically saved to this browser session.`,
        })
        setShowAddOrderBox(false)
        refetch()
      } else {
        setLookupFeedback({
          type: 'error',
          message: 'No purchase records found with those details. Please check your order number.',
        })
      }
    } catch {
      setLookupFeedback({
        type: 'error',
        message: 'Could not connect to verify your order. Please try again.',
      })
    }
  }

  return (
    <div className="section" style={{ minHeight: '82vh', paddingTop: '32px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '1060px' }}>
        {/* ── 1. Page Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '60px',
              height: '60px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(59, 130, 246, 0.15))',
              border: '1.5px solid rgba(124, 58, 237, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--brand-purple)',
              boxShadow: '0 4px 14px rgba(124, 58, 237, 0.15)',
            }}
          >
            <Package size={28} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.45rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '10px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
            }}
          >
            My Orders & Downloads
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '620px',
              margin: '0 auto 14px',
              lineHeight: 1.6,
            }}
          >
            Products purchased on this browser are automatically preserved. You can re-open this page anytime to access and re-download your files directly.
          </p>

          {/* Browser Cookie & Storage Status Pill */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              fontSize: '0.8125rem',
              color: 'var(--success)',
              fontWeight: 600,
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--success)',
                display: 'inline-block',
                boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
              }}
            />
            <span>Browser Session Active · {savedSessionCount} Order(s) Saved</span>
          </div>
        </div>

        {/* ── 2. Top Action Bar: Add / Link Missing Order ── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '28px',
            padding: '14px 18px',
            borderRadius: 'var(--radius-lg)',
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} color="var(--brand-purple)" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              {hasPurchases
                ? `Showing ${activePurchases.length + expiredPurchases.length} Purchase(s) on this browser`
                : 'Looking for a purchase made on another browser or device?'}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowAddOrderBox(!showAddOrderBox)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '8px',
              background: showAddOrderBox ? 'var(--bg-border)' : 'rgba(124, 58, 237, 0.1)',
              border: '1px solid rgba(124, 58, 237, 0.25)',
              color: 'var(--brand-purple)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {showAddOrderBox ? (
              <>
                <ChevronUp size={16} /> Hide Order Lookup
              </>
            ) : (
              <>
                <Plus size={16} /> Add / Find Missing Order
              </>
            )}
          </button>
        </div>

        {/* ── 3. Collapsible Add/Find Order Box ── */}
        <AnimatePresence>
          {showAddOrderBox && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden', marginBottom: '28px' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '22px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid rgba(124, 58, 237, 0.3)',
                  background: 'var(--bg-elevated)',
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
                    Link Previous Order to This Browser
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    Enter the Order Number or Email you used when purchasing. Once found, it will remain permanently saved in this browser's session.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (searchOrder.trim() || searchEmail.trim()) {
                      handleLookupSubmit(searchOrder.trim(), searchEmail.trim())
                    }
                  }}
                  style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr)) auto', gap: '12px', alignItems: 'center' }}
                >
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Order Number (e.g. ORD-12345678)"
                    value={searchOrder}
                    onChange={(e) => setSearchOrder(e.target.value.toUpperCase())}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Customer Email Address (optional)"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                  <button
                    type="submit"
                    disabled={isFetching || (!searchOrder.trim() && !searchEmail.trim())}
                    className="btn-primary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    {isFetching ? <RefreshCw size={15} className="spin" /> : <Search size={15} />}
                    <span>Find & Save</span>
                  </button>
                </form>

                {lookupFeedback && (
                  <div
                    style={{
                      marginTop: '14px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      fontSize: '0.8125rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      background: lookupFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      border: `1px solid ${lookupFeedback.type === 'success' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                      color: lookupFeedback.type === 'success' ? 'var(--success)' : 'var(--error)',
                    }}
                  >
                    {lookupFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>{lookupFeedback.message}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── 4. Loading Skeleton ── */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {[1, 2].map((k) => (
              <div
                key={k}
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  height: '180px',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={18} className="spin" />
                  <span>Loading your orders & downloads...</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 5. Error State ── */}
        {isError && !isLoading && (
          <div
            className="glass-card"
            style={{
              padding: '40px 24px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--bg-border)',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '0 auto 40px',
            }}
          >
            <AlertCircle size={44} color="var(--error)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Unable to Load Orders
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Please check your internet connection or tap below to refresh your browser session.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Try Again
            </button>
          </div>
        )}

        {/* ── 6. Active Downloads Section ── */}
        {!isLoading && !isError && activePurchases.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'inline-block',
                    boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)',
                  }}
                />
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Active Products & Downloads ({activePurchases.length})
                </h2>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                ⚡ 1-Click Direct File Streaming Ready
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {activePurchases.map((item) => (
                <DownloadProductCard key={item.token} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── 7. Expired Downloads Section ── */}
        {!isLoading && !isError && expiredPurchases.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--error)',
                  display: 'inline-block',
                }}
              />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Previous / Expired Orders ({expiredPurchases.length})
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {expiredPurchases.map((item) => (
                <DownloadProductCard key={item.token} item={item} isExpired />
              ))}
            </div>
          </div>
        )}

        {/* ── 8. Empty State (No orders detected in session or query) ── */}
        {!isLoading && !isError && !hasPurchases && (
          <NoDownloadsState onSearchOrder={handleLookupSubmit} isLoading={isFetching} />
        )}

        {/* ── 9. Direct Dispute Resolution Guarantee Card ── */}
        <div
          className="glass-card"
          style={{
            marginTop: '32px',
            marginBottom: '32px',
            padding: '24px 28px',
            borderRadius: 'var(--radius-xl)',
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', maxWidth: '640px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'rgba(16, 185, 129, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10B981',
                flexShrink: 0,
              }}
            >
              <Headphones size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                Need Assistance With Any Order? We Are Here For You 24/7!
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Our team resolves 100% of download issues, access requests, or payment queries directly on our site within minutes.
              </div>
            </div>
          </div>

          <Link
            to="/contact?type=order_issue"
            style={{
              padding: '10px 20px',
              borderRadius: '10px',
              background: '#111827',
              color: '#FFFFFF',
              fontSize: '0.875rem',
              fontWeight: 700,
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              whiteSpace: 'nowrap',
            }}
          >
            Contact Customer Support →
          </Link>
        </div>

        {/* ── 10. Purchase Access Guidelines & FAQ ── */}
        <DownloadsAccessInfo />

        {/* ── 11. Need Help Section ── */}
        <DownloadsHelpSection />
      </div>
    </div>
  )
}
