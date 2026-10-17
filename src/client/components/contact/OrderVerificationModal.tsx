// src/client/components/contact/OrderVerificationModal.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, Lock, Search, X, CheckCircle2, Phone, AlertCircle, ArrowRight } from 'lucide-react'
import { useOrderVerification } from '../../lib/orderVerification'

interface OrderVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export default function OrderVerificationModal({ isOpen, onClose, onSuccess }: OrderVerificationModalProps) {
  const { isVerified, rawPhone, rawProprietor, verifyOrderNumber } = useOrderVerification()
  const [orderInput, setOrderInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderInput.trim()) {
      setError('Please enter your Order Number')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await verifyOrderNumber(orderInput.trim())
      if (res.success) {
        setSuccess(true)
        if (onSuccess) onSuccess()
      } else {
        setError(res.error || 'Order not found. Please verify your order number.')
      }
    } catch (err: any) {
      setError(err?.message || 'Verification failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          style={{
            width: '100%',
            maxWidth: '460px',
            background: 'var(--bg-surface, #111827)',
            border: '1px solid rgba(255, 210, 0, 0.35)',
            borderRadius: '20px',
            padding: '28px',
            color: 'var(--text-primary, #FFFFFF)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(255, 210, 0, 0.1)',
            position: 'relative',
          }}
          onClick={e => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted, #9CA3AF)',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={20} />
          </button>

          {!success && !isVerified ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(255, 210, 0, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFD200',
                  }}
                >
                  <Lock size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                    Verified Customer Support
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Enter Order # to unlock direct phone & WhatsApp helpline
                  </div>
                </div>
              </div>

              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary, #D1D5DB)', lineHeight: 1.55, marginBottom: 18 }}>
                To safeguard our team from automated telemarketing and spam, direct voice and WhatsApp assistance is reserved exclusively for customers with a valid order reference.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6, color: '#E5E7EB' }}>
                    Order Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    value={orderInput}
                    onChange={e => setOrderInput(e.target.value.toUpperCase())}
                    placeholder="e.g. OD328762145892019100 or ORD-..."
                    required
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: 4 }}>
                    You can find your order number in your payment receipt, SMS, or download page.
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 12px',
                      borderRadius: '8px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#FCA5A5',
                      fontSize: '0.82rem',
                    }}
                  >
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '10px',
                    background: '#FFD200',
                    color: '#000000',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    border: 'none',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {loading ? (
                    'Verifying Order...'
                  ) : (
                    <>
                      <Search size={16} /> Verify Order & Reveal Helpline
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(16, 185, 129, 0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#10B981' }}>
                    Order Verified Successfully!
                  </h3>
                  <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
                    Direct Support Helpline is now unlocked
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: '0.875rem',
                }}
              >
                <div>
                  <span style={{ color: '#9CA3AF' }}>Operating Entity:</span>{' '}
                  <strong style={{ color: '#FFFFFF' }}>RISHAV MEDIA</strong>
                </div>
                <div>
                  <span style={{ color: '#9CA3AF' }}>Proprietor:</span>{' '}
                  <strong style={{ color: '#FFD200' }}>{rawProprietor}</strong>
                </div>
                <div>
                  <span style={{ color: '#9CA3AF' }}>Direct Helpline:</span>{' '}
                  <strong style={{ color: '#93C5FD', fontSize: '1.05rem' }}>{rawPhone}</strong>
                </div>
                <div>
                  <span style={{ color: '#9CA3AF' }}>Operating Hours:</span>{' '}
                  <span style={{ color: '#FFFFFF' }}>Mon – Sat, 10:00 AM – 6:00 PM IST</span>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <a
                  href={`tel:${rawPhone}`}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#1162F2',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  <Phone size={16} /> Call Now
                </a>
                <a
                  href={`https://wa.me/919801947855?text=Hello%2C%20I%20have%20an%20order%20query`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: '10px',
                    background: '#25D366',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  Chat WhatsApp
                </a>
              </div>

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  marginTop: 12,
                  padding: '10px',
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '8px',
                  color: '#9CA3AF',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
