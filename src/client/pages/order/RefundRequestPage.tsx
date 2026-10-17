// src/client/pages/order/RefundRequestPage.tsx
// Official Self-Service Refund & Dispute Settlement Portal — Light Theme & Cashfree Compliant
// Requires Order Number + 12-Digit Bank UTR + Recipient UPI ID

import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  RotateCcw,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Search,
  MessageSquare,
  Clock,
  HelpCircle,
  FileText,
  CreditCard,
  Building,
  Check,
  Copy,
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
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  useEffect(() => {
    document.title = `Refund & Dispute Portal — ${siteName || '1024 Tera Viral Hub'}`
    if (initialOrder) {
      setOrderNumber(initialOrder)
    }
  }, [siteName, initialOrder])

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

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
      setError('Please provide a valid 12-digit Bank/UPI UTR Number.')
      return
    }
    if (!cleanUpi || !cleanUpi.includes('@') || cleanUpi.length < 5) {
      setError('Please provide a valid UPI ID (e.g. user@okhdfcbank or 9876543210@paytm).')
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

      const data: any = await res.json()

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to submit refund claim.')
      }

      setSuccessData(data)
    } catch (err: any) {
      setError(err?.message || 'Failed to file refund claim. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    setTrackError(null)
    setTrackResult(null)

    const cleanQ = trackQuery.trim().toUpperCase().replace(/^#/, '')
    if (!cleanQ) {
      setTrackError('Please enter a Refund Ticket ID, Order Number, or UTR.')
      return
    }

    setTrackLoading(true)

    try {
      const res = await fetch(`/api/order-lookup/refund-status/${encodeURIComponent(cleanQ)}`)
      const data: any = await res.json()

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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', padding: '40px 16px' }}>
      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748B', marginBottom: '20px' }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <Link to="/order-lookup" style={{ color: '#64748B', textDecoration: 'none' }}>Order Lookup</Link>
          <span>/</span>
          <span style={{ color: '#1162F2', fontWeight: 600 }}>Refund & Dispute Portal</span>
        </div>

        {/* Page Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(17, 98, 242, 0.25)',
              marginBottom: '14px',
            }}
          >
            <RotateCcw size={28} color="#FFFFFF" />
          </div>
          <h1 style={{ fontSize: '2.1rem', fontWeight: 800, margin: '0 0 8px 0', letterSpacing: '-0.02em', color: '#0F172A' }}>
            Automated Refund & Dispute Portal
          </h1>
          <p style={{ fontSize: '0.95rem', color: '#475569', maxWidth: '620px', margin: '0 auto', lineHeight: '1.6' }}>
            Self-service digital settlement portal. Submit your 12-digit Bank/UPI UTR and destination UPI ID for guaranteed turnaround and settlement.
          </p>
        </div>

        {/* Key Guarantees Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '28px',
          }}
        >
          {/* 2 Days Review SLA */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #BFDBFE',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(17, 98, 242, 0.05)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#EFF6FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Clock size={22} color="#1D4ED8" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#1E3A8A' }}>2 Days Review SLA</div>
              <div style={{ fontSize: '0.78125rem', color: '#475569' }}>Desk verified within 24–48 hours</div>
            </div>
          </div>

          {/* 5-7 Days UPI Payout */}
          <div
            style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(16, 185, 129, 0.05)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#DCFCE7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} color="#16A34A" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#14532D' }}>5–7 Days UPI Payout</div>
              <div style={{ fontSize: '0.78125rem', color: '#166534' }}>100% assured direct bank credit</div>
            </div>
          </div>

          {/* Live Tracking & Chat */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #E2E8F0',
              borderRadius: '14px',
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                background: '#FEF9C3',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MessageSquare size={22} color="#CA8A04" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#713F12' }}>Live Tracking & Chat</div>
              <div style={{ fontSize: '0.78125rem', color: '#475569' }}>Real-time status updates</div>
            </div>
          </div>
        </div>

        {/* Tab Toggle: Apply vs Track */}
        <div
          style={{
            display: 'flex',
            background: '#E2E8F0',
            padding: '4px',
            borderRadius: '12px',
            marginBottom: '24px',
            border: '1px solid #CBD5E1',
          }}
        >
          <button
            onClick={() => setActiveTab('submit')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'submit' ? '#1162F2' : 'transparent',
              color: activeTab === 'submit' ? '#FFFFFF' : '#475569',
              fontWeight: 700,
              fontSize: '0.925rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'submit' ? '0 2px 6px rgba(17, 98, 242, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <RotateCcw size={16} /> File Refund Request
          </button>
          <button
            onClick={() => setActiveTab('track')}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '9px',
              border: 'none',
              background: activeTab === 'track' ? '#1162F2' : 'transparent',
              color: activeTab === 'track' ? '#FFFFFF' : '#475569',
              fontWeight: 700,
              fontSize: '0.925rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: activeTab === 'track' ? '0 2px 6px rgba(17, 98, 242, 0.3)' : 'none',
              transition: 'all 0.2s',
            }}
          >
            <Search size={16} /> Track Refund Status
          </button>
        </div>

        {/* Main Content Card (Pure White Light Theme) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '32px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
          }}
        >
          {activeTab === 'submit' ? (
            !successData ? (
              /* Tab 1: Submit Claim Form */
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {error && (
                  <div
                    style={{
                      background: '#FEF2F2',
                      border: '1.5px solid #FCA5A5',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      color: '#B91C1C',
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <AlertCircle size={20} color="#DC2626" style={{ flexShrink: 0 }} />
                    <div style={{ fontWeight: 600 }}>{error}</div>
                  </div>
                )}

                {/* Order Number */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
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
                      padding: '13px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '9px',
                      color: '#0F172A',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '5px' }}>
                    Found in your purchase SMS or on your Order Details tracking link.
                  </div>
                </div>

                {/* 12-digit Bank/UPI UTR */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                      12-Digit Bank / UPI UTR Number <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.78125rem', color: '#B45309', fontWeight: 600 }}>UPI Transaction ID</span>
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
                      padding: '13px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '9px',
                      color: '#0F172A',
                      fontSize: '0.95rem',
                      fontFamily: 'monospace',
                      letterSpacing: '0.04em',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '5px' }}>
                    Open PhonePe, Google Pay, Paytm, or your bank SMS and copy the 12-digit UTR/Ref number.
                  </div>
                </div>

                {/* Recipient UPI ID */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <label style={{ fontSize: '0.875rem', fontWeight: 700, color: '#1E293B' }}>
                      Your UPI ID for Refund Transfer <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <span style={{ fontSize: '0.78125rem', color: '#15803D', fontWeight: 700 }}>Payout Destination</span>
                  </div>
                  <input
                    type="text"
                    required
                    value={upiId}
                    onChange={(e) => setUpiId(e.target.value)}
                    placeholder="e.g. yourname@okhdfcbank or 9876543210@paytm"
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '9px',
                      color: '#0F172A',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                  <div style={{ fontSize: '0.78125rem', color: '#64748B', marginTop: '5px' }}>
                    Your refund will be deposited directly to this UPI address within 5–7 business days after verification.
                  </div>
                </div>

                {/* Reason Selection */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Reason for Refund <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '13px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '9px',
                      color: '#0F172A',
                      fontSize: '0.9rem',
                      outline: 'none',
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
                  <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#1E293B', marginBottom: '6px' }}>
                    Additional Remarks / Information <span style={{ color: '#64748B', fontWeight: 400 }}>(Optional)</span>
                  </label>
                  <textarea
                    rows={3}
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Enter any additional details regarding your transaction..."
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      borderRadius: '9px',
                      color: '#0F172A',
                      fontSize: '0.875rem',
                      resize: 'none',
                      outline: 'none',
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
                    padding: '15px',
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
                    boxShadow: '0 4px 16px rgba(17, 98, 242, 0.3)',
                    marginTop: '8px',
                  }}
                >
                  {loading ? (
                    'Submitting & Verifying UTR...'
                  ) : (
                    <>
                      <RotateCcw size={18} /> Submit Refund Claim (Verify UTR)
                    </>
                  )}
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
                    background: '#ECFDF5',
                    border: '2px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 18px auto',
                  }}
                >
                  <CheckCircle2 size={36} color="#10B981" />
                </div>

                <h2 style={{ margin: '0 0 8px 0', fontSize: '1.6rem', fontWeight: 800, color: '#0F172A' }}>
                  Refund Request Registered!
                </h2>
                <p style={{ margin: '0 0 24px 0', fontSize: '0.925rem', color: '#475569' }}>
                  Your refund claim has been recorded and is undergoing automated 24–48 hour desk review.
                </p>

                {/* Ticket Details Box */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '22px',
                    textAlign: 'left',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    marginBottom: '24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                    <span style={{ color: '#64748B' }}>Refund Ticket ID:</span>
                    <strong style={{ color: '#D97706', fontFamily: 'monospace', fontSize: '1rem' }}>
                      {successData.refund_id}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Order Reference:</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>#{successData.order_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Verified Bank UTR:</span>
                    <span style={{ color: '#0F172A', fontFamily: 'monospace', fontWeight: 600 }}>{successData.utr_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Payout Destination:</span>
                    <strong style={{ color: '#1D4ED8' }}>{successData.upi_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Current Status:</span>
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '6px', fontSize: '0.78125rem', fontWeight: 700 }}>
                      UNDER REVIEW
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <span style={{ color: '#64748B' }}>Estimated Payout:</span>
                    <span style={{ color: '#15803D', fontWeight: 700 }}>5–7 Business Days</span>
                  </div>

                  {/* 3-Step Milestone Tracker */}
                  <div style={{ marginTop: '12px', borderTop: '1px solid #E2E8F0', paddingTop: '14px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
                      🛡️ 100% Refund Assurance Timeline:
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px', fontSize: '0.78125rem', textAlign: 'center' }}>
                      <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '8px', padding: '8px 6px' }}>
                        <div style={{ color: '#16A34A', fontWeight: 700 }}>✓ Step 1</div>
                        <div style={{ color: '#14532D', marginTop: '2px', fontWeight: 600 }}>Claim Logged</div>
                      </div>
                      <div style={{ background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '8px', padding: '8px 6px' }}>
                        <div style={{ color: '#D97706', fontWeight: 700 }}>⏳ Step 2 (2 Days)</div>
                        <div style={{ color: '#78350F', marginTop: '2px', fontWeight: 600 }}>Desk Review</div>
                      </div>
                      <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '8px 6px' }}>
                        <div style={{ color: '#2563EB', fontWeight: 700 }}>💳 Step 3 (7 Days)</div>
                        <div style={{ color: '#1E3A8A', marginTop: '2px', fontWeight: 600 }}>UPI Payout</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link
                    to={`/order/support?order=${encodeURIComponent(successData.order_number)}&refund=${encodeURIComponent(successData.refund_id)}`}
                    style={{
                      flex: 1,
                      minWidth: '200px',
                      padding: '14px',
                      borderRadius: '10px',
                      background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 12px rgba(17, 98, 242, 0.25)',
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
                      padding: '14px 22px',
                      borderRadius: '10px',
                      background: '#FFFFFF',
                      border: '1.5px solid #CBD5E1',
                      color: '#475569',
                      fontWeight: 700,
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
                    padding: '13px 14px',
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    borderRadius: '9px',
                    color: '#0F172A',
                    fontSize: '0.95rem',
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  disabled={trackLoading}
                  style={{
                    padding: '13px 24px',
                    borderRadius: '9px',
                    background: '#1162F2',
                    border: 'none',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    cursor: trackLoading ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(17, 98, 242, 0.25)',
                  }}
                >
                  <Search size={16} /> {trackLoading ? 'Searching...' : 'Track'}
                </button>
              </form>

              {trackError && (
                <div
                  style={{
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: '10px',
                    padding: '12px 16px',
                    color: '#B91C1C',
                    fontSize: '0.875rem',
                    marginBottom: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <AlertCircle size={18} /> {trackError}
                </div>
              )}

              {trackResult && (
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: '14px',
                    padding: '22px',
                    fontSize: '0.9rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '10px' }}>
                    <span style={{ color: '#64748B' }}>Ticket Reference:</span>
                    <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>{trackResult.refund_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Order Number:</span>
                    <span style={{ color: '#0F172A', fontWeight: 700 }}>#{trackResult.order_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Bank UTR:</span>
                    <span style={{ color: '#0F172A', fontFamily: 'monospace' }}>{trackResult.utr_number}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Payout Destination:</span>
                    <strong style={{ color: '#1D4ED8' }}>{trackResult.upi_id}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748B' }}>Current Status:</span>
                    <span style={{ background: '#FEF3C7', color: '#B45309', padding: '3px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {trackResult.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E2E8F0', paddingTop: '10px' }}>
                    <span style={{ color: '#64748B' }}>Turnaround SLA:</span>
                    <span style={{ color: '#15803D', fontWeight: 700 }}>5–7 Business Days</span>
                  </div>

                  <Link
                    to={`/order/support?order=${encodeURIComponent(trackResult.order_number)}&refund=${encodeURIComponent(trackResult.refund_id)}`}
                    style={{
                      marginTop: '12px',
                      padding: '12px',
                      borderRadius: '8px',
                      background: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      color: '#1D4ED8',
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

        {/* ── Official Cashfree Merchant & RBI Payment Settlement Compliance ── */}
        <div
          style={{
            marginTop: '28px',
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 4px 14px rgba(16, 185, 129, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>
            <ShieldCheck size={22} color="#16A34A" />
            <span>Authorized Cashfree Merchant Payment & Settlement Compliance</span>
          </div>
          <p style={{ fontSize: '0.875rem', color: '#14532D', lineHeight: 1.6, margin: '0 0 16px 0' }}>
            All online payment collections, customer checkouts, and refund reversals on <strong>{siteName || '1024 Tera Viral Hub'}</strong> (accessible at <strong>1024teraviralhub.com</strong>) are processed in authorized partnership with <strong>Cashfree Payments India Pvt. Ltd.</strong> under RBI Master Directions for Payment Aggregators (PA).
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
              gap: '10px',
              fontSize: '0.825rem',
              color: '#1E293B',
              background: '#FFFFFF',
              padding: '16px',
              borderRadius: '10px',
              border: '1px solid #DCFCE7',
            }}
          >
            <div>
              <span style={{ color: '#64748B' }}>Registered Merchant Entity:</span>{' '}
              <strong style={{ color: '#0F172A' }}>RISHAV MEDIA</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Trade & Website Name:</span>{' '}
              <strong style={{ color: '#0F172A' }}>1024 Tera Viral Hub</strong> (1024teraviralhub.com)
            </div>
            <div>
              <span style={{ color: '#64748B' }}>MSME / Udyam Reg. No.:</span>{' '}
              <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>UDYAM-BR-11-0107325</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Payment Gateway Partner:</span>{' '}
              <strong style={{ color: '#1D4ED8' }}>Cashfree Payments India Pvt. Ltd. (PCI-DSS Level 1)</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Refund Settlement Turnaround:</span>{' '}
              <strong style={{ color: '#15803D' }}>5 to 7 business days directly to original source</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Verification Review SLA:</span>{' '}
              <strong style={{ color: '#B45309' }}>24 to 48 hours via automated dispute desk</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Official Compliance Email:</span>{' '}
              <strong style={{ color: '#0F172A' }}>support@1024teraviralhub.com</strong>
            </div>
            <div>
              <span style={{ color: '#64748B' }}>Registered Office:</span>{' '}
              <span>Flat No. 25, Rishav Media Office, Block Road, Ghorasahan, Motihari, Bihar - 845303</span>
            </div>
          </div>
        </div>

        {/* Live Support Box */}
        <div
          style={{
            marginTop: '20px',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '14px',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A', marginBottom: '2px' }}>
              Have questions or need live order assistance?
            </div>
            <div style={{ fontSize: '0.825rem', color: '#64748B' }}>
              Our 24x7 In-App Support Chat Assistant can resolve your queries immediately.
            </div>
          </div>
          <Link
            to="/order/support"
            style={{
              padding: '11px 22px',
              borderRadius: '9px',
              background: '#FFD200',
              color: '#000000',
              fontWeight: 800,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(255, 210, 0, 0.3)',
            }}
          >
            <MessageSquare size={16} /> Open Support Chat
          </Link>
        </div>
      </div>
    </div>
  )
}
