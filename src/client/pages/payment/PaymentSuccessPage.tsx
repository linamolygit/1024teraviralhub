// src/client/pages/payment/PaymentSuccessPage.tsx
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, Download, Clock, Copy } from 'lucide-react'
import { useState } from 'react'
import { trackPixelEvent } from '../../lib/utils'
import { useEffect } from 'react'

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')
  const downloadToken = searchParams.get('token')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    // Fire Meta Pixel purchase event
    trackPixelEvent('Purchase', { order_id: orderNumber, currency: 'INR' })
  }, [orderNumber])

  const copyOrder = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 20 }}
        style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}
      >
        {/* Success Icon */}
        <div style={{ position: 'relative', marginBottom: 32, display: 'inline-block' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
          }}>
            <CheckCircle size={40} color="var(--success)" />
          </div>
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            border: '2px solid rgba(16,185,129,0.2)',
            animation: 'pulse-ring 2s ease infinite',
          }} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Payment Successful! 🎉</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
          Your payment has been verified. Your download is ready!
        </p>

        {orderNumber && (
          <div style={{
            background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)', padding: '16px 20px', marginBottom: 24,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Order Number</div>
              <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.95rem' }}>{orderNumber}</div>
            </div>
            <button onClick={copyOrder} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 8 }}>
              {copied ? <CheckCircle size={18} color="var(--success)" /> : <Copy size={18} />}
            </button>
          </div>
        )}

        {/* Download Link */}
        {downloadToken ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link
              to={`/download/${downloadToken}`}
              className="btn-cta"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', textDecoration: 'none' }}
            >
              <Download size={22} /> Access Your Download
            </Link>
            <div className="alert alert-warning" style={{ fontSize: '0.8125rem', textAlign: 'left' }}>
              <Clock size={14} /> Your download link is valid for <strong>12 hours</strong>. Please download your files now. Save your order number for future reference.
            </div>
          </div>
        ) : (
          <div className="alert alert-info">
            Your download is being prepared. Please use Order Lookup with your order number.
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/products" className="btn-ghost" style={{ fontSize: '0.875rem' }}>Browse More Products</Link>
          <Link to="/order-lookup" className="btn-ghost" style={{ fontSize: '0.875rem' }}>Order Lookup</Link>
        </div>
      </motion.div>
    </div>
  )
}
