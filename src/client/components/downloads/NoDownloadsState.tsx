// src/client/components/downloads/NoDownloadsState.tsx — Empty State with Quick Lookup
import { useState } from 'react'
import { PackageOpen, Search, ArrowRight, RefreshCw } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  onSearchOrder?: (order: string, email: string) => void
  isLoading?: boolean
}

export default function NoDownloadsState({ onSearchOrder, isLoading = false }: Props) {
  const [orderNumber, setOrderNumber] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderNumber.trim() && !email.trim()) return
    onSearchOrder?.(orderNumber.trim(), email.trim())
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '48px 24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '0 auto 40px',
      }}
    >
      <div
        style={{
          width: '72px',
          height: '72px',
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.12)',
          border: '1px solid rgba(124, 58, 237, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 20px',
          color: 'var(--brand-purple-light)',
        }}
      >
        <PackageOpen size={36} />
      </div>

      <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
        No Active Downloads Found
      </h2>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '28px', maxWidth: '440px', margin: '0 auto 28px' }}>
        We couldn't detect any active purchases connected to this browser session. If you recently purchased on another device or private tab, you can look up your order below.
      </p>

      {/* Quick Lookup Form */}
      {onSearchOrder && (
        <form
          onSubmit={handleSubmit}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px',
            marginBottom: '24px',
            textAlign: 'left',
          }}
        >
          <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Search size={14} color="#111827" /> Find Your Purchase
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
            <input
              type="text"
              className="input-field"
              placeholder="Order Number (e.g. ORD-12345678)"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              style={{ fontSize: '0.8125rem', height: '40px' }}
            />
            <input
              type="email"
              className="input-field"
              placeholder="Your Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ fontSize: '0.8125rem', height: '40px' }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || (!orderNumber.trim() && !email.trim())}
            className="btn-primary"
            style={{ width: '100%', padding: '10px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isLoading ? (
              <>
                <RefreshCw size={14} className="spin" /> Searching Orders...
              </>
            ) : (
              <>
                <Search size={14} /> Restore Download Access
              </>
            )}
          </button>
        </form>
      )}

      {/* Primary Action Button */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/products" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.875rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          Browse Catalog <ArrowRight size={16} />
        </Link>
        <Link to="/" className="btn-ghost" style={{ padding: '12px 20px', fontSize: '0.875rem' }}>
          Back to Home
        </Link>
      </div>
    </div>
  )
}
