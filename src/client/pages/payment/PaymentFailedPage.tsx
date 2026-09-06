// src/client/pages/payment/PaymentFailedPage.tsx
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { XCircle, RefreshCw, HelpCircle } from 'lucide-react'

export default function PaymentFailedPage() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}
      >
        <div style={{
          width: 80, height: 80, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', border: '2px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 32px',
        }}>
          <XCircle size={40} color="var(--error)" />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Payment Failed</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32, lineHeight: 1.6 }}>
          Something went wrong with your payment. No amount has been deducted. Please try again.
        </p>

        {orderNumber && (
          <div style={{ marginBottom: 24, padding: '12px 20px', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Order Reference: <strong>{orderNumber}</strong>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={() => window.history.back()} className="btn-cta" style={{ width: '100%' }}>
            <RefreshCw size={18} /> Try Again
          </button>
          <Link to="/contact" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <HelpCircle size={16} /> Contact Support
          </Link>
          <Link to="/products" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 8 }}>
            ← Back to Products
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
