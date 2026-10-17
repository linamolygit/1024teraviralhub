// src/client/components/order/RefundRequestModal.tsx
// Automated Self-Service Refund & Dispute Filing Portal — Light Theme & Cashfree Compliant
// Strict Verification via Order Number + 12-digit Bank/UPI UTR + Destination UPI ID

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  ShieldCheck,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Lock,
  Building,
} from 'lucide-react'
import { Link } from 'react-router-dom'

interface RefundRequestModalProps {
  isOpen: boolean
  onClose: () => void
  initialOrderNumber?: string
  initialAmount?: number
}

export default function RefundRequestModal({
  isOpen,
  onClose,
  initialOrderNumber = '',
  initialAmount,
}: RefundRequestModalProps) {
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber)
  const [utrNumber, setUtrNumber] = useState('')
  const [upiId, setUpiId] = useState('')
  const [reason, setReason] = useState('Duplicate payment debited')
  const [details, setDetails] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  useEffect(() => {
    if (initialOrderNumber) {
      setOrderNumber(initialOrderNumber)
    }
  }, [initialOrderNumber])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanOrder = orderNumber.trim().toUpperCase().replace(/^#/, '')
    const cleanUtr = utrNumber.trim().replace(/\s+/g, '')
    const cleanUpi = upiId.trim().toLowerCase()

    if (!cleanOrder) {
      setError('Please provide your authentic Order Number (e.g. OD32876... or TVH-...)')
      return
    }

    if (!cleanUtr || cleanUtr.length < 8) {
      setError('Please provide a valid 12-digit Bank/UPI UTR Number (Transaction ID) from your payment app.')
      return
    }

    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 5) {
      setError('Please provide a valid recipient UPI ID (e.g. yourname@okhdfcbank or 9876543210@paytm) for the refund payout.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/order-lookup/refund-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: cleanOrder,
          utr_number: cleanUtr,
          upi_id: cleanUpi,
          reason,
          details,
          customer_name: customerName.trim(),
          customer_email: customerEmail.trim(),
        }),
      })

      const data = (await res.json()) as any

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to submit refund claim. Please verify your details.')
      }

      setSuccessData(data)
    } catch (err: any) {
      setError(err?.message || 'Network error occurred while filing refund. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setSuccessData(null)
    setError(null)
    setUtrNumber('')
    setUpiId('')
    setDetails('')
  }

  return (
    <AnimatePresence>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px',
          background: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
        }}
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '540px',
            maxHeight: '92vh',
            overflowY: 'auto',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '18px',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(0, 0, 0, 0.05)',
            color: '#0F172A',
            padding: '24px',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: '#F1F5F9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748B',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#E2E8F0'
              e.currentTarget.style.color = '#0F172A'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#F1F5F9'
              e.currentTarget.style.color = '#64748B'
            }}
          >
            <X size={18} />
          </button>

          {!successData ? (
            /* ─── Refund Application Form (Clean Light Theme) ─── */
            <div>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(17, 98, 242, 0.25)',
                  }}
                >
                  <RotateCcw size={22} color="#FFFFFF" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
                    Automated Refund Portal
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '2px' }}>
                    1024 Tera Viral Hub • Verified Dispute Redressal Desk
                  </div>
                </div>
              </div>

              {/* 100% Refund Assurance Guarantee Banner (Light Theme) */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #86EFAC',
                  borderRadius: '12px',
                  padding: '12px 14px',
                  fontSize: '0.8125rem',
                  lineHeight: '1.45',
                  color: '#14532D',
                  marginBottom: '18px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, marginBottom: '6px' }}>
                  <ShieldCheck size={18} color="#16A34A" />
                  <span>100% Buyer Protection & Refund Assurance Policy</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '8px', fontSize: '0.78125rem' }}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #DCFCE7', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: '#64748B' }}>Review SLA:</span>{' '}
                    <strong style={{ color: '#D97706' }}>Within 24–48 Hours (2 Days)</strong>
                  </div>
                  <div style={{ background: '#FFFFFF', border: '1px solid #DCFCE7', padding: '6px 8px', borderRadius: '6px' }}>
                    <span style={{ color: '#64748B' }}>Direct UPI Payout:</span>{' '}
                    <strong style={{ color: '#1D4ED8' }}>5 to 7 Business Days</strong>
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1px solid #FCA5A5',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#B91C1C',
                    fontSize: '0.85rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  <div>{error}</div>
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {/* Order Number */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Order Reference Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. OD328768789012 or TVH-98742"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1162F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Available on your payment receipt, SMS notification, or Order Details page.
                  </div>
                </div>

                {/* 12-digit UTR Number */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      12-Digit Bank / UPI UTR Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#D97706', fontWeight: 600 }}>UPI Ref / Txn ID</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="e.g. 428910284729"
                    maxLength={22}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1162F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Find this 12-digit reference number in Google Pay, PhonePe, Paytm, or your bank SMS.
                  </div>
                </div>

                {/* Recipient UPI ID */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <label
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#334155',
                      }}
                    >
                      Your UPI ID for Refund Credit <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.72rem', color: '#16A34A', fontWeight: 600 }}>Direct Payout</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. customer@okhdfcbank or 9876543210@paytm"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#F8FAFC',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1162F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Your refund will be deposited directly to this UPI address within 5–7 business days after verification.
                  </div>
                </div>

                {/* Reason for Refund */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Reason for Refund <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#0F172A',
                      fontSize: '0.875rem',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1162F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  >
                    <option value="Duplicate payment debited">Duplicate payment debited (Money deducted twice)</option>
                    <option value="Unable to access or download files">Unable to access or download files</option>
                    <option value="Download link expired / file corrupted">Download link expired / file corrupted</option>
                    <option value="Purchased incorrect product pack">Purchased incorrect product pack</option>
                    <option value="Order cancelled before dispatch">Order cancelled / requested cancellation</option>
                    <option value="Other billing or technical issue">Other billing or technical dispute</option>
                  </select>
                </div>

                {/* Additional Note (Optional) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: '#334155',
                      marginBottom: '6px',
                    }}
                  >
                    Additional Details / Remarks <span style={{ color: '#64748B' }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Provide any additional transaction information..."
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '8px',
                      color: '#0F172A',
                      fontSize: '0.85rem',
                      resize: 'none',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#1162F2')}
                    onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    marginTop: '8px',
                    padding: '13px',
                    borderRadius: '10px',
                    background: loading ? '#93C5FD' : 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(17, 98, 242, 0.25)',
                    transition: 'all 0.2s',
                  }}
                >
                  {loading ? (
                    'Verifying UTR & Registering Claim...'
                  ) : (
                    <>
                      <RotateCcw size={18} /> Submit Refund Request
                    </>
                  )}
                </button>
              </form>

              {/* Statutory Cashfree Partner & Settlement Disclosure */}
              <div
                style={{
                  marginTop: '16px',
                  padding: '10px 12px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  fontSize: '0.735rem',
                  color: '#64748B',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <ShieldCheck size={14} color="#16A34A" />
                  <span>Authorized Cashfree Payments Partner • 5–7 Days Reversal</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#0F172A', fontWeight: 600 }}>
                  <Lock size={12} color="#16A34A" /> PCI-DSS Level 1
                </div>
              </div>

              {/* Chat Support Alternative */}
              <div
                style={{
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.8125rem',
                  color: '#64748B',
                }}
              >
                <span>Need quick help from an assistant?</span>
                <Link
                  to={orderNumber ? `/order/support?order=${encodeURIComponent(orderNumber)}` : '/order/support'}
                  onClick={onClose}
                  style={{
                    color: '#1162F2',
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <MessageSquare size={14} /> Open Live Chat →
                </Link>
              </div>
            </div>
          ) : (
            /* ─── Refund Confirmation / Tracking Card (Light Theme) ─── */
            <div style={{ textAlign: 'center', padding: '10px 0' }}>
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#DCFCE7',
                  border: '2px solid #22C55E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                }}
              >
                <CheckCircle2 size={32} color="#16A34A" />
              </div>

              <h3 style={{ margin: '0 0 6px 0', fontSize: '1.35rem', fontWeight: 800, color: '#0F172A' }}>
                Refund Request Registered!
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: '0.85rem', color: '#64748B', lineHeight: '1.5' }}>
                Your dispute has been logged with our automated compliance settlement desk.
              </p>

              {/* Ticket Summary Box */}
              <div
                style={{
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  fontSize: '0.85rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
                  <span style={{ color: '#64748B' }}>Refund Ticket ID:</span>
                  <strong style={{ color: '#D97706', fontFamily: 'monospace', letterSpacing: '0.04em' }}>
                    {successData.refund_id}
                  </strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Order Number:</span>
                  <span style={{ color: '#0F172A', fontWeight: 700 }}>#{successData.order_number}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Verified Bank UTR:</span>
                  <span style={{ color: '#334155', fontFamily: 'monospace' }}>{successData.utr_number}</span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Payout Destination:</span>
                  <strong style={{ color: '#1D4ED8' }}>{successData.upi_id}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748B' }}>Refund Status:</span>
                  <span
                    style={{
                      background: '#FEF3C7',
                      color: '#B45309',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                    }}
                  >
                    UNDER REVIEW
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '8px' }}>
                  <span style={{ color: '#64748B' }}>Expected Settlement:</span>
                  <span style={{ color: '#15803D', fontWeight: 700 }}>5–7 Business Days</span>
                </div>

                {/* 3-Step Refund Assurance Progress */}
                <div style={{ marginTop: '10px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <div style={{ fontSize: '0.78125rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px', textAlign: 'left' }}>
                    🛡️ 100% Refund Assurance Timeline:
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', fontSize: '0.72rem', textAlign: 'center' }}>
                    <div style={{ background: '#DCFCE7', border: '1px solid #86EFAC', borderRadius: '6px', padding: '6px 4px' }}>
                      <div style={{ color: '#166534', fontWeight: 800 }}>✓ Step 1</div>
                      <div style={{ color: '#334155', marginTop: '2px' }}>Claim Logged</div>
                    </div>
                    <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '6px', padding: '6px 4px' }}>
                      <div style={{ color: '#B45309', fontWeight: 800 }}>⏳ Step 2 (2 Days)</div>
                      <div style={{ color: '#334155', marginTop: '2px' }}>Desk Review</div>
                    </div>
                    <div style={{ background: '#E0F2FE', border: '1px solid #BAE6FD', borderRadius: '6px', padding: '6px 4px' }}>
                      <div style={{ color: '#0369A1', fontWeight: 800 }}>💳 Step 3 (7 Days)</div>
                      <div style={{ color: '#334155', marginTop: '2px' }}>UPI Payout</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <Link
                  to={`/order/support?order=${encodeURIComponent(successData.order_number)}&refund=${encodeURIComponent(successData.refund_id)}`}
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '10px',
                    background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxSizing: 'border-box',
                    boxShadow: '0 4px 14px rgba(17, 98, 242, 0.25)',
                  }}
                >
                  <MessageSquare size={16} /> Track & Chat with Support Assistant
                </Link>

                <button
                  onClick={onClose}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '10px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    color: '#64748B',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Done & Close Window
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
