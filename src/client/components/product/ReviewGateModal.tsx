// src/client/components/product/ReviewGateModal.tsx
// Beautiful modal shown when a non-verified customer tries to leave a review
import { ShoppingBag, Lock, Star, X, CheckCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

interface ReviewGateModalProps {
  mode: 'gate' | 'success'
  productSlug?: string
  onClose: () => void
}

export default function ReviewGateModal({ mode, productSlug, onClose }: ReviewGateModalProps) {
  return (
    <div
      className="modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-box" style={{ textAlign: 'center', position: 'relative' }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 4,
            borderRadius: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: 'unset',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <X size={20} />
        </button>

        {mode === 'gate' ? (
          <>
            {/* Gate Icon */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: '#F1F3F6',
              border: '2px solid #E0E0E0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <Lock size={32} color="#111827" />
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginBottom: 10,
              color: 'var(--text-primary)',
            }}>
              Verified Customers Only
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              marginBottom: 24,
            }}>
              Only customers who have purchased this product can leave a review. This keeps our feedback genuine and trustworthy.
            </p>

            {/* Stars decoration */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 24 }}>
              {[1,2,3,4,5].map(i => (
                <Star key={i} size={20} fill="var(--brand-amber)" color="var(--brand-amber)" />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {productSlug && (
                <Link
                  to={`/product/${productSlug}`}
                  className="btn-primary"
                  onClick={onClose}
                  style={{ justifyContent: 'center' }}
                >
                  <ShoppingBag size={16} />
                  Buy This Product
                </Link>
              )}
              <button
                onClick={onClose}
                className="btn-ghost"
                style={{ justifyContent: 'center' }}
              >
                Maybe Later
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Success Icon */}
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(16,185,129,0.12)',
              border: '2px solid rgba(16,185,129,0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}>
              <CheckCircle size={36} color="var(--success)" />
            </div>

            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              marginBottom: 10,
              color: 'var(--text-primary)',
            }}>
              Review Submitted! 🎉
            </h2>

            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.9rem',
              lineHeight: 1.65,
              marginBottom: 24,
            }}>
              Thank you for your feedback! Your review will appear after a quick moderation check.
            </p>

            <button
              onClick={onClose}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
