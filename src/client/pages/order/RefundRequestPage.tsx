// src/client/pages/order/RefundRequestPage.tsx
// Official Self-Service Refund & Dispute Settlement Portal
// Requires Order Number + 12-Digit Bank UTR + Recipient UPI ID

import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageSquare,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  CreditCard,
} from 'lucide-react'
import { useSiteConfig } from '../../lib/site-config'

export default function RefundRequestPage() {
  const { siteName } = useSiteConfig()
  const [searchParams] = useSearchParams()
  const initialOrder = searchParams.get('order') || searchParams.get('order_number') || ''

  const [activeTab, setActiveTab] = useState<'submit' | 'track'>('submit')

  // Form State
  const [orderNumber, setOrderNumber] = useState(initialOrder)
  const [utrNumber, setUtrNumber] = useState('')
  const [upiId, setUpiId] = useState('')
  const [reason, setReason] = useState('Duplicate payment debited')
  const [details, setDetails] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<any | null>(null)

  // Track State
  const [trackQuery, setTrackQuery] = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackError, setTrackError] = useState<string | null>(null)
  const [trackResult, setTrackResult] = useState<any | null>(null)

  useEffect(() => {
    document.title = `Refund & Dispute Portal — ${siteName}`
    if (initialOrder) {
      setOrderNumber(initialOrder)
    }
  }, [siteName, initialOrder])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const cleanOrder = orderNumber.trim().toUpperCase().replace(/^#/, '')
    const cleanUtr = utrNumber.trim().replace(/\s+/g, '')
    const cleanUpi = upiId.trim().toLowerCase()

    if (!cleanOrder) {
      setError('Please provide your Order Number.')
      return
    }
    if (!cleanUtr || cleanUtr.length < 8) {
      setError('Please provide a valid 12-digit Bank/UPI UTR Number from your payment app.')
      return
    }
    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 5) {
      setError('Please provide a valid UPI ID (e.g. user@okhdfcbank) to receive your refund payout.')
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
      setError(err?.message || 'Error occurred while filing refund claim.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setTrackError(null)
    setTrackResult(null)

    const q = trackQuery.trim()
    if (!q) {
      setTrackError('Please enter your Refund Ticket ID, Order Number, or UTR.')
      return
    }

    setTrackLoading(true)

    try {
      const res = await fetch(`/api/order-lookup/refund-status/${encodeURIComponent(q)}`)
      const data = (await res.json()) as any

      if (!res.ok || !data.found) {
        throw new Error(data.message || 'No refund claim found matching this reference.')
      }

      setTrackResult(data.refund)
    } catch (err: any) {
      setTrackError(err?.message || 'Unable to find refund request.')
    } finally {
      setTrackLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary, #0B0F19)', color: '#F8FAFC', padding: '40px 16px' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '20px' }}>
          <Link to="/" style={{ color: '#94A3B8', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/order-lookup" style={{ color: '#94A3B8', textDecoration: 'none' }}>Order Lookup</Link>
          <span>/</span>
          <span style={{ color: '#FFD200', fontWeight: 600 }}>Refund & Dispute Portal</span>
        </div>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(17, 98, 242, 0.35)',
              marginBottom: '14px',
            }}
          >
            <RotateCcw size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#FFFFFF' }}>
            Automated Refund & Dispute Desk
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#94A3B8', maxWidth: '580px', margin: '0 auto', lineHeight: '1.5' }}>
            Self-service digital settlement portal. Submit your 12-digit Bank UTR and destination UPI ID for an automated verification and refund turnaround.
          </p>
        </div>

        {/* Key Guarantees Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '12px',
            marginBottom: '28px',
          }}
        >
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <Clock size={22} color="#60A5FA" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFFFFF' }}>24–48 Hours Review</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Automated UTR verification</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <ShieldCheck size={22} color="#10B981" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFFFFF' }}>100% Direct UPI Refund</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Settled via RBI guidelines</div>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
            }}
          >
            <MessageSquare size={22} color="#FBBF24" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFFFFF' }}>In-App Chat Support</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>24x7 instant assistant</div>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Apply vs Track */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.05)',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          <button
            onClick={() => setActiveTab('submit')}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'submit' ? '#1162F2' : 'transparent',
              color: activeTab === 'submit' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <RotateCcw size={16} /> File Refund Request
          </button>
          <button
            onClick={() => setActiveTab('track')}
            style={{
              flex: 1,
              padding: '11px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'track' ? '#1162F2' : 'transparent',
              color: activeTab === 'track' ? '#FFFFFF' : '#94A3B8',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s',
            }}
          >
            <Search size={16} /> Track Refund Status
          </button>
        </div>

        {/* Main Content Card */}
        <div
          style={{
            background: '#0F172A',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          }}
        >
          {activeTab === 'submit' ? (
            !successData ? (
              /* Tab 1: Submit Claim Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {error && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1px solid rgba(239, 68, 68, 0.35)',
                      borderRadius: '8px',
                      padding: '12px 16px',
                      color: '#FCA5A5',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertCircle size={18} style={{ flexShrink: 0 }} />
                    <div>{error}</div>
                  </div>
                )}

                {/* Order Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Order Number <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="e.g. OD328768789012 or TVH-98742"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Found in your purchase SMS or on your Order Details tracking link.
                  </div>
                </div>

                {/* 12-digit Bank/UPI UTR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>
                      12-Digit Bank / UPI UTR Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#F59E0B' }}>UPI Transaction ID</span>
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
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Open PhonePe, Google Pay, Paytm, or your bank SMS and copy the 12-digit UTR/Ref number.
                  </div>
                </div>

                {/* Recipient UPI ID */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0' }}>
                      Your UPI ID for Refund Transfer <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#10B981' }}>Payout Destination</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
                    Your refund will be deposited directly to this UPI address after verification.
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Reason for Refund <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#1E293B',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Duplicate payment debited">Duplicate payment debited (Money deducted twice)</option>
                    <option value="Unable to access or download files">Unable to access or download files</option>
                    <option value="Download link expired / file corrupted">Download link expired / file corrupted</option>
                    <option value="Purchased incorrect product pack">Purchased incorrect product pack</option>
                    <option value="Order cancelled before dispatch">Order cancelled / requested cancellation</option>
                    <option value="Other billing or technical issue">Other billing or technical dispute</option>
                  </select>
                </div>

                {/* Additional Details */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px' }}>
                    Additional Remarks / Information <span style={{ color: '#64748B' }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter any additional details regarding your transaction..."
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '8px',
                      color: '#FFFFFF',
                      fontSize: '0.875rem',
                      resize: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '10px',
                    background: loading ? '#3B82F6' : 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 16px rgba(17, 98, 242, 0.35)',
                    marginTop: '6px',
                  }}
                >
                  {loading ? 'Submitting & Verifying UTR...' : 'Submit Refund Claim (Verify UTR)'}
                </button>
              </form>
            ) : (
              /* Success View */
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto',
                  }}
                >
                  <CheckCircle2 size={36} color="#10B981" />
                </div>

                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.5rem', fontWeight: 800, color: '#FFFFFF' }}>
                  Refund Request Registered!
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.9rem', color: '#94A3B8' }}>
                  Your refund claim is under automated review with our operations settlement desk.
                </p>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                    <span style={{ color: '#94A3B8' }}>Refund Ticket ID:</span>
                    <strong style={{ color: '#FFD200', fontFamily: 'monospace' }}>{successData.refund_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Order Reference:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>#{successData.order_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Verified Bank UTR:</span>
                    <span style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{successData.utr_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Destination UPI ID:</span>
                    <strong style={{ color: '#38BDF8' }}>{successData.upi_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Current Status:</span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', padding: '2px 8px', borderRadius: '4px', fontSize: '0.78rem', fontWeight: 700 }}>
                      UNDER REVIEW
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                    <span style={{ color: '#94A3B8' }}>Estimated Payout:</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>5–7 Business Days</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                  <Link
                    to={`/order/support?order=${encodeURIComponent(successData.order_number)}&refund=${encodeURIComponent(successData.refund_id)}`}
                    style={{
                      flex: 1,
                      padding: '13px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                    }}
                  >
                    <MessageSquare size={16} /> Open Support Chat
                  </Link>
                  <button
                    onClick={() => {
                      setSuccessData(null)
                      setUtrNumber('')
                      setUpiId('')
                    }}
                    style={{
                      padding: '13px 20px',
                      borderRadius: '10px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#94A3B8',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    File Another Claim
                  </button>
                </div>
              </div>
            )
          ) : (
            /* Tab 2: Track Existing Claim */
            <div>
              <form onSubmit={handleTrack} style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
                <input
                  type="text"
                  required
                  value={trackQuery}
                  onChange={(e) => setTrackQuery(e.target.value)}
                  placeholder="Enter Refund Ticket (REF-...), Order No, or 12-digit UTR"
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: '8px',
                    color: '#FFFFFF',
                    fontSize: '0.95rem',
                  }}
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: '#1162F2',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: trackLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Search size={16} /> {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <div
                  style={{
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.35)',
                    borderRadius: '8px',
                    padding: '12px',
                    color: '#FCA5A5',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={16} /> {trackError}
                </div>
              )}

              {trackResult && (
                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '20px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '10px' }}>
                    <span style={{ color: '#94A3B8' }}>Ticket Reference:</span>
                    <strong style={{ color: '#FFD200', fontFamily: 'monospace' }}>{trackResult.refund_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Order Number:</span>
                    <span style={{ color: '#FFFFFF', fontWeight: 600 }}>#{trackResult.order_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Bank UTR:</span>
                    <span style={{ color: '#E2E8F0', fontFamily: 'monospace' }}>{trackResult.utr_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Payout Destination:</span>
                    <strong style={{ color: '#38BDF8' }}>{trackResult.upi_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94A3B8' }}>Current Status:</span>
                    <span style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#FBBF24', padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {trackResult.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '10px' }}>
                    <span style={{ color: '#94A3B8' }}>Turnaround SLA:</span>
                    <span style={{ color: '#10B981', fontWeight: 700 }}>5–7 Business Days</span>
                  </div>

                  <Link
                    to={`/order/support?order=${encodeURIComponent(trackResult.order_number)}&refund=${encodeURIComponent(trackResult.refund_id)}`}
                    style={{
                      marginTop: '10px',
                      padding: '11px',
                      borderRadius: '8px',
                      background: 'rgba(17, 98, 242, 0.15)',
                      border: '1px solid rgba(17, 98, 242, 0.35)',
                      color: '#93C5FD',
                      fontWeight: 700,
                      textDecoration: 'none',
                      textAlign: 'center',
                    }}
                  >
                    Chat with Assistant About this Refund →
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Support Alternative */}
        <div
          style={{
            marginTop: '28px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#FFFFFF', marginBottom: '2px' }}>
              Have questions or need live order assistance?
            </div>
            <div style={{ fontSize: '0.825rem', color: '#94A3B8' }}>
              Our 24x7 In-App Support Chat Assistant can answer your questions immediately.
            </div>
          </div>
          <Link
            to="/order/support"
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              background: '#FFD200',
              color: '#000000',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <MessageSquare size={16} /> Open Support Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
