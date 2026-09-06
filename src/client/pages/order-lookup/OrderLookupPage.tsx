// src/client/pages/order-lookup/OrderLookupPage.tsx
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Package, Clock, CheckCircle2, AlertCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, type OrderLookupResult } from '../../lib/api'
import { formatPrice, formatDate } from '../../lib/utils'

export default function OrderLookupPage() {
  const [searchParams] = useSearchParams()
  const [orderNumber, setOrderNumber] = useState(searchParams.get('order') || '')
  const [email, setEmail] = useState(searchParams.get('email') || '')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<OrderLookupResult | null>(null)
  const [error, setError] = useState('')

  // Auto-search if order query param exists in URL
  useEffect(() => {
    const initialOrder = searchParams.get('order')
    if (initialOrder && initialOrder.trim()) {
      executeLookup(initialOrder.trim(), searchParams.get('email')?.trim() || '')
    }
  }, [])

  const executeLookup = async (order: string, emailAddr?: string) => {
    if (!order.trim()) {
      setError('Please enter your Order Number')
      return
    }

    setLoading(true)
    setError('')
    setResult(null)

    try {
      const data = await api.orderLookup(order.trim(), emailAddr?.trim() || undefined)
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Order not found. Please verify your order number.')
    } finally {
      setLoading(false)
    }
  }

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault()
    executeLookup(orderNumber, email)
  }

  return (
    <div className="section" style={{ minHeight: '75vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 580 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Order Lookup</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1 className="section-title" style={{ fontSize: 'clamp(1.75rem, 3.5vw, 2.25rem)', marginBottom: 8 }}>
            Order Lookup & File Recovery
          </h1>
          <p className="section-subtitle" style={{ fontSize: '0.925rem', maxWidth: 460, margin: '0 auto' }}>
            Direct access: Enter your <strong>Order Number</strong> to instantly check status and access your digital downloads.
          </p>
        </div>

        <div className="glass-card" style={{ padding: '32px 28px', borderRadius: 16, border: '1px solid var(--bg-border)' }}>
          <form onSubmit={handleLookup} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Primary Field: Order Number (Required) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                  Order Number <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'rgba(255, 210, 0, 0.12)',
                    color: '#FFD200',
                    border: '1px solid rgba(255, 210, 0, 0.3)',
                  }}
                >
                  Required
                </span>
              </div>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. TVH-20250830-0001"
                value={orderNumber}
                onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                required
                style={{
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                  fontWeight: 600,
                  fontSize: '0.95rem',
                }}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
                You can enter with or without the prefix (e.g. TVH-20250830-0001 or 20250830-0001)
              </p>
            </div>

            {/* Secondary Field: Email Address (Optional) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <label style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                  Email Address
                </label>
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 500,
                    padding: '2px 8px',
                    borderRadius: 4,
                    background: 'var(--bg-elevated)',
                    color: 'var(--text-muted)',
                    border: '1px solid var(--bg-border)',
                  }}
                >
                  Optional
                </span>
              </div>
              <input
                type="email"
                className="input-field"
                placeholder="Email used at checkout (optional)"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, margin: '6px 0 0' }}>
                Optional security verification if you want to verify via registered email
              </p>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading || !orderNumber.trim()}
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '0.95rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: 4,
              }}
            >
              {loading ? (
                <>Searching Order...</>
              ) : (
                <>
                  <Search size={18} /> Find My Order
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="alert alert-error" style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {result && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginTop: 28 }}>
              <div
                style={{
                  padding: '22px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--bg-border)',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 18 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      background: 'rgba(255, 210, 0, 0.12)',
                      border: '1px solid rgba(255, 210, 0, 0.25)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Package size={22} color="#FFD200" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: 2 }}>
                      {result.product}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Purchased on {formatDate(result.created_at)}
                    </div>
                  </div>
                  <span
                    className={`badge ${
                      result.status === 'PAID'
                        ? 'badge-success'
                        : result.status === 'FAILED'
                        ? 'badge-error'
                        : 'badge-amber'
                    }`}
                    style={{ flexShrink: 0, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 700 }}
                  >
                    {result.status === 'PAID' ? '✓ PAID & VERIFIED' : result.status}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12,
                    padding: '14px',
                    background: 'var(--bg-surface)',
                    borderRadius: 10,
                    fontSize: '0.875rem',
                  }}
                >
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Order Number</span>
                    <br />
                    <strong style={{ fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {result.order_number}
                    </strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Amount Paid</span>
                    <br />
                    <strong style={{ color: '#10B981', fontWeight: 800 }}>
                      {formatPrice(result.amount)}
                    </strong>
                  </div>
                </div>
              </div>

              {result.download_token ? (
                <Link
                  to={`/download/${result.download_token}`}
                  className="btn-cta"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    textDecoration: 'none',
                    padding: '14px 20px',
                    fontSize: '0.95rem',
                    fontWeight: 800,
                  }}
                >
                  <Download size={18} /> Access & Download Digital Files →
                </Link>
              ) : result.download_expired ? (
                <div
                  className="alert alert-warning"
                  style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.85rem' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                    <Clock size={16} /> 12-Hour Download Link Expired
                  </div>
                  <div>
                    Your cryptographic download link expired after 12 hours. As per our policy, you can contact support with your order number <strong>{result.order_number}</strong> to have a fresh token generated immediately.
                  </div>
                  <Link
                    to={`/contact?subject=Renew%20Download%20Token%20for%20${result.order_number}`}
                    style={{ color: '#FFD200', fontWeight: 700, textDecoration: 'underline', marginTop: 4 }}
                  >
                    Request Download Link Renewal →
                  </Link>
                </div>
              ) : result.status !== 'PAID' ? (
                <div className="alert alert-info" style={{ fontSize: '0.85rem' }}>
                  Payment status is currently <strong>{result.status}</strong>. If your account was debited, please wait 2–5 minutes for Cashfree webhook confirmation or reach out to customer support.
                </div>
              ) : null}
            </motion.div>
          )}
        </div>

        <div style={{ textAlign: 'center', marginTop: 28, color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Need assistance with your purchase?{' '}
          <Link to="/contact" style={{ color: '#FFD200', fontWeight: 600, textDecoration: 'none' }}>
            Contact Support →
          </Link>
        </div>
      </div>
    </div>
  )
}
