// src/client/pages/admin/refunds/AdminRefunds.tsx
// Comprehensive Admin Refund & Dispute Resolution Control Center — Fully Responsive & Theme-Consistent
// Matches AdminOrders / AdminDashboard Design System with Mobile Touch Cards & Desktop Table

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RotateCcw,
  Search,
  RefreshCw,
  CheckCircle,
  Clock,
  XCircle,
  Copy,
  Check,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Filter,
  DollarSign,
  FileText,
  User,
  ArrowUpRight,
  MessageSquare,
  Eye,
  X,
  Info,
} from 'lucide-react'
import { adminApi } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate, formatTime } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

type RefundStatus = 'ALL' | 'UNDER_REVIEW' | 'APPROVED' | 'PROCESSED' | 'REJECTED'

export default function AdminRefunds() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [statusFilter, setStatusFilter] = useState<RefundStatus>('ALL')
  const [searchInput, setSearchInput] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const limit = 20

  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [selectedClaim, setSelectedClaim] = useState<any | null>(null)
  const [actionModal, setActionModal] = useState<{
    claim: any
    newStatus: 'APPROVED' | 'PROCESSED' | 'REJECTED' | 'UNDER_REVIEW'
  } | null>(null)
  const [adminNotesInput, setAdminNotesInput] = useState<string>('')
  const [submittingAction, setSubmittingAction] = useState<boolean>(false)

  // 350ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch refund claims with 5s real-time live polling
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-refunds', statusFilter, debouncedSearch, page],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.refunds.list(token!, {
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        search: debouncedSearch || undefined,
        limit,
        offset: (page - 1) * limit,
      })
    },
    refetchInterval: 5000, // ⚡ Realtime 5s live polling!
  })

  const refunds = data?.refunds || []
  const stats = data?.stats || {
    total: 0,
    under_review: 0,
    approved: 0,
    processed: 0,
    rejected: 0,
    total_refunded: 0,
    all_claims_amount: 0,
  }
  const totalItems = data?.total || 0
  const totalPages = Math.max(1, Math.ceil(totalItems / limit))

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
    adminToast.info('Copied to Clipboard', text, 2000)
  }

  const handleOpenAction = (claim: any, newStatus: 'APPROVED' | 'PROCESSED' | 'REJECTED' | 'UNDER_REVIEW') => {
    setActionModal({ claim, newStatus })
    setAdminNotesInput(claim.admin_notes || '')
  }

  const handleConfirmStatusChange = async () => {
    if (!actionModal) return
    setSubmittingAction(true)
    try {
      const token = await getToken()
      await adminApi.refunds.updateStatus(
        token!,
        actionModal.claim.id,
        actionModal.newStatus,
        adminNotesInput.trim()
      )

      adminToast.success(`Claim marked as ${actionModal.newStatus}!`, `Ticket ${actionModal.claim.refund_id} updated.`)
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] })
      setActionModal(null)
      if (selectedClaim && selectedClaim.id === actionModal.claim.id) {
        setSelectedClaim((prev: any) => ({
          ...prev,
          status: actionModal.newStatus,
          admin_notes: adminNotesInput.trim(),
        }))
      }
    } catch (err: any) {
      adminToast.error('Status Update Failed', err.message || 'Failed to update status.')
    } finally {
      setSubmittingAction(false)
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PROCESSED':
        return {
          bg: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10B981',
          icon: <CheckCircle size={13} />,
          text: 'PROCESSED / SETTLED',
        }
      case 'APPROVED':
        return {
          bg: 'rgba(59, 130, 246, 0.12)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#3B82F6',
          icon: <CheckCircle size={13} />,
          text: 'APPROVED (QUEUED)',
        }
      case 'REJECTED':
        return {
          bg: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#EF4444',
          icon: <XCircle size={13} />,
          text: 'REJECTED',
        }
      case 'UNDER_REVIEW':
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.12)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#F59E0B',
          icon: <Clock size={13} />,
          text: 'UNDER REVIEW',
        }
    }
  }

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px 20px', color: 'var(--text-primary)' }}>
      {/* ── Responsive CSS Rules ── */}
      <style>{`
        @media (max-width: 768px) {
          .admin-refunds-desktop { display: none !important; }
          .admin-refunds-mobile { display: flex !important; flex-direction: column; gap: 14px; }
        }
        @media (min-width: 769px) {
          .admin-refunds-desktop { display: block !important; }
          .admin-refunds-mobile { display: none !important; }
        }
      `}</style>

      {/* ── Page Header (Exact AdminOrders Theme) ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <span
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(245,158,11,0.15))',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#EF4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={20} />
            </span>
            <h1
              style={{
                fontSize: '1.75rem',
                fontWeight: 900,
                color: 'var(--text-primary)',
                margin: 0,
                letterSpacing: '-0.02em',
              }}
            >
              Refund & Dispute Claims
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Inspect customer 12-digit UTR & UPI ID, verify transactions, and approve or process refunds at will.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Live Indicator Badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 14px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 20,
            }}
            title="Real-time 5-second automatic data sync active"
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px #10B981',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#10B981', letterSpacing: '0.02em' }}>
              LIVE · 5s Auto-sync
            </span>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{
              fontSize: '0.8125rem',
              padding: '9px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              fontWeight: 600,
              cursor: 'pointer',
              color: 'var(--text-primary)',
            }}
          >
            <RefreshCw size={14} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Refreshing...' : 'Live Refresh'}
          </button>
        </div>
      </div>

      {/* ── 1. KPI Metric Stat Cards (Matching AdminOrders Design) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {/* Total Claims */}
        <div
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          className="glass-card admin-card-interactive"
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            border: statusFilter === 'ALL' ? '1.5px solid #1162F2' : '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Claims
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(17,98,242,0.1)', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RotateCcw size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            ₹{stats.all_claims_amount.toLocaleString('en-IN')} claimed amount
          </div>
        </div>

        {/* Needs Action / Under Review */}
        <div
          onClick={() => { setStatusFilter('UNDER_REVIEW'); setPage(1); }}
          className="glass-card admin-card-interactive"
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            border: statusFilter === 'UNDER_REVIEW' ? '1.5px solid #F59E0B' : '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Under Review
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em' }}>
            {stats.under_review}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#D97706', marginTop: 4, fontWeight: 600 }}>
            ⚡ Requires your manual review
          </div>
        </div>

        {/* Approved (Queued) */}
        <div
          onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          className="glass-card admin-card-interactive"
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            border: statusFilter === 'APPROVED' ? '1.5px solid #3B82F6' : '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Approved (Queued)
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59, 130, 246, 0.12)', color: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#2563EB', letterSpacing: '-0.02em' }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Verified & ready for UPI payout
          </div>
        </div>

        {/* Settled / Paid Out */}
        <div
          onClick={() => { setStatusFilter('PROCESSED'); setPage(1); }}
          className="glass-card admin-card-interactive"
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            border: statusFilter === 'PROCESSED' ? '1.5px solid #10B981' : '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Settled / Refunded
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#10B981', letterSpacing: '-0.02em' }}>
            ₹{stats.total_refunded.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.72rem', color: '#059669', marginTop: 4, fontWeight: 600 }}>
            {stats.processed} transactions refunded
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          className="glass-card admin-card-interactive"
          style={{
            padding: '16px 18px',
            borderRadius: 12,
            border: statusFilter === 'REJECTED' ? '1.5px solid #EF4444' : '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            cursor: 'pointer',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rejected
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239, 68, 68, 0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <XCircle size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#DC2626', letterSpacing: '-0.02em' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Invalid UTR / Ineligible
          </div>
        </div>
      </div>

      {/* ── 2. Filters & Search Bar (Matching AdminLayout Theme) ── */}
      <div
        className="glass-card"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 14,
          padding: '16px 20px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Status Tab Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {(['ALL', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED', 'REJECTED'] as RefundStatus[]).map((st) => {
            const isActive = statusFilter === st
            return (
              <button
                key={st}
                type="button"
                onClick={() => { setStatusFilter(st); setPage(1); }}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: isActive ? 800 : 600,
                  border: isActive ? 'none' : '1px solid var(--bg-border)',
                  cursor: 'pointer',
                  background: isActive ? '#FFD200' : 'var(--bg-elevated)',
                  color: isActive ? '#000000' : 'var(--text-secondary)',
                  boxShadow: isActive ? '0 2px 6px rgba(255, 210, 0, 0.3)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                {st === 'ALL' ? 'All Claims' : st.replace('_', ' ')}
                {st === 'UNDER_REVIEW' && stats.under_review > 0 && (
                  <span
                    style={{
                      marginLeft: 6,
                      background: isActive ? '#000000' : '#F59E0B',
                      color: isActive ? '#FFD200' : '#FFFFFF',
                      padding: '1px 6px',
                      borderRadius: 10,
                      fontSize: '0.7rem',
                      fontWeight: 800,
                    }}
                  >
                    {stats.under_review}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: 260, flex: 1, maxWidth: 420 }}>
          <Search
            size={15}
            color="var(--text-muted)"
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}
          />
          <input
            type="text"
            placeholder="Search Order #, UTR, UPI ID, or Ticket ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── 3. Main Claims Container ── */}
      {isLoading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <LoadingSpinner />
          <p style={{ marginTop: 12, color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading refund claims...</p>
        </div>
      ) : refunds.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(239,68,68,0.12), rgba(245,158,11,0.12))',
              color: '#EF4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <RotateCcw size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 6px 0' }}>
            No refund claims found
          </h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {debouncedSearch
              ? `No requests match "${debouncedSearch}". Try clearing your search.`
              : 'No customer dispute claims filed in this category.'}
          </p>
        </div>
      ) : (
        <>
          {/* ─── A. DESKTOP VIEW (admin-table) ─── */}
          <div
            className="admin-refunds-desktop glass-card"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Refund Ticket</th>
                    <th>Order #</th>
                    <th>Bank UTR (12 Digits)</th>
                    <th>Payout UPI ID</th>
                    <th>Amount</th>
                    <th>Reason / Details</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Admin Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {refunds.map((r: any) => {
                    const badge = getStatusBadge(r.status)
                    return (
                      <tr key={r.id}>
                        {/* Refund Ticket */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D97706' }}>
                              {r.refund_id}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(r.refund_id, `ticket_${r.id}`)}
                              title="Copy Ticket ID"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                            >
                              {copiedKey === `ticket_${r.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                            </button>
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                            {formatDate(r.created_at)} {formatTime(r.created_at)}
                          </div>
                        </td>

                        {/* Order Number */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>#{r.order_number}</span>
                            <Link
                              to={`/admin/orders?search=${encodeURIComponent(r.order_number)}`}
                              title="View order in Admin Orders"
                              style={{ color: '#1162F2', display: 'inline-flex' }}
                            >
                              <ExternalLink size={13} />
                            </Link>
                          </div>
                          {r.customer_name && (
                            <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: 140, marginTop: 2 }}>
                              {r.customer_name}
                            </div>
                          )}
                        </td>

                        {/* Bank UTR */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span
                              style={{
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                color: '#1D4ED8',
                                background: 'rgba(29, 78, 216, 0.08)',
                                border: '1px solid rgba(29, 78, 216, 0.2)',
                                padding: '3px 7px',
                                borderRadius: 5,
                                fontSize: '0.82rem',
                                letterSpacing: '0.03em',
                              }}
                            >
                              {r.utr_number}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(r.utr_number, `utr_${r.id}`)}
                              title="Copy UTR to verify in Cashfree/Bank app"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                            >
                              {copiedKey === `utr_${r.id}` ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Payout UPI ID */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>{r.upi_id}</span>
                            <button
                              type="button"
                              onClick={() => handleCopy(r.upi_id, `upi_${r.id}`)}
                              title="Copy UPI ID for Payout transfer"
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                            >
                              {copiedKey === `upi_${r.id}` ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                            </button>
                          </div>
                        </td>

                        {/* Amount */}
                        <td>
                          <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>
                            {formatPrice(r.amount)}
                          </strong>
                        </td>

                        {/* Reason / Details */}
                        <td style={{ maxWidth: 200 }}>
                          <div className="text-truncate" style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.85rem' }} title={r.reason}>
                            {r.reason}
                          </div>
                          {r.details && (
                            <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }} title={r.details}>
                              {r.details}
                            </div>
                          )}
                          {r.admin_notes && (
                            <div className="text-truncate" style={{ fontSize: '0.72rem', color: '#D97706', marginTop: 2, fontStyle: 'italic' }} title={r.admin_notes}>
                              Note: {r.admin_notes}
                            </div>
                          )}
                        </td>

                        {/* Status */}
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              background: badge.bg,
                              border: badge.border,
                              color: badge.color,
                              padding: '3px 8px',
                              borderRadius: 6,
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              letterSpacing: '0.02em',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {badge.icon}
                            {badge.text}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {r.status === 'UNDER_REVIEW' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(r, 'APPROVED')}
                                style={{
                                  background: 'rgba(59, 130, 246, 0.12)',
                                  border: '1px solid rgba(59, 130, 246, 0.35)',
                                  color: '#2563EB',
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Approve
                              </button>
                            )}

                            {r.status !== 'PROCESSED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(r, 'PROCESSED')}
                                style={{
                                  background: 'rgba(16, 185, 129, 0.12)',
                                  border: '1px solid rgba(16, 185, 129, 0.35)',
                                  color: '#059669',
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Mark Paid
                              </button>
                            )}

                            {r.status !== 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenAction(r, 'REJECTED')}
                                style={{
                                  background: 'rgba(239, 68, 68, 0.1)',
                                  border: '1px solid rgba(239, 68, 68, 0.3)',
                                  color: '#DC2626',
                                  padding: '5px 10px',
                                  borderRadius: 6,
                                  fontSize: '0.78rem',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                Reject
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => setSelectedClaim(r)}
                              title="View Full Dispute Information"
                              style={{
                                background: 'var(--bg-elevated)',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-secondary)',
                                padding: '5px 8px',
                                borderRadius: 6,
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                              }}
                            >
                              <Eye size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── B. MOBILE CARDS VIEW (Clean Touch Cards for Small Screens) ─── */}
          <div className="admin-refunds-mobile">
            {refunds.map((r: any) => {
              const badge = getStatusBadge(r.status)
              return (
                <div
                  key={r.id}
                  className="glass-card"
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 14,
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  }}
                >
                  {/* Top Bar: Ticket + Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#D97706', fontSize: '0.9rem' }}>
                        {r.refund_id}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(r.refund_id, `m_ticket_${r.id}`)}
                        style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                      >
                        {copiedKey === `m_ticket_${r.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: badge.bg,
                        border: badge.border,
                        color: badge.color,
                        padding: '3px 8px',
                        borderRadius: 6,
                        fontSize: '0.72rem',
                        fontWeight: 800,
                      }}
                    >
                      {badge.icon}
                      {badge.text}
                    </span>
                  </div>

                  {/* Middle Row: Order # and Claim Amount */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      background: 'var(--bg-elevated)',
                      padding: '10px 12px',
                      borderRadius: 10,
                      border: '1px solid var(--bg-border)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order Reference</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '0.9rem' }}>#{r.order_number}</span>
                        <Link to={`/admin/orders?search=${encodeURIComponent(r.order_number)}`} style={{ color: '#1162F2' }}>
                          <ExternalLink size={12} />
                        </Link>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Claim Amount</div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 900, color: '#10B981', marginTop: 1 }}>
                        {formatPrice(r.amount)}
                      </div>
                    </div>
                  </div>

                  {/* Banking Info Box (UTR & UPI) */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      fontSize: '0.8rem',
                    }}
                  >
                    <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Bank/UPI UTR</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 800, color: '#1D4ED8', fontSize: '0.8rem' }}>
                          {r.utr_number}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(r.utr_number, `m_utr_${r.id}`)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                        >
                          {copiedKey === `m_utr_${r.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>

                    <div style={{ background: 'var(--bg-elevated)', padding: '8px 10px', borderRadius: 8, border: '1px solid var(--bg-border)' }}>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: 2 }}>Payout UPI</div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="text-truncate" style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.8rem', maxWidth: 100 }} title={r.upi_id}>
                          {r.upi_id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(r.upi_id, `m_upi_${r.id}`)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                        >
                          {copiedKey === `m_upi_${r.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Reason & Notes */}
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Reason:</span>{' '}
                      <strong>{r.reason}</strong>
                    </div>
                    {r.details && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: 3 }}>
                        {r.details}
                      </div>
                    )}
                    {r.admin_notes && (
                      <div style={{ color: '#D97706', fontSize: '0.75rem', marginTop: 3, fontStyle: 'italic' }}>
                        Admin Note: {r.admin_notes}
                      </div>
                    )}
                  </div>

                  {/* Mobile Action Buttons Bar */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))',
                      gap: 6,
                      marginTop: 4,
                      paddingTop: 10,
                      borderTop: '1px solid var(--bg-border)',
                    }}
                  >
                    {r.status === 'UNDER_REVIEW' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAction(r, 'APPROVED')}
                        style={{
                          padding: '8px',
                          borderRadius: 8,
                          background: 'rgba(59, 130, 246, 0.12)',
                          border: '1px solid rgba(59, 130, 246, 0.35)',
                          color: '#2563EB',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Approve
                      </button>
                    )}

                    {r.status !== 'PROCESSED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAction(r, 'PROCESSED')}
                        style={{
                          padding: '8px',
                          borderRadius: 8,
                          background: 'rgba(16, 185, 129, 0.12)',
                          border: '1px solid rgba(16, 185, 129, 0.35)',
                          color: '#059669',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Mark Paid
                      </button>
                    )}

                    {r.status !== 'REJECTED' && (
                      <button
                        type="button"
                        onClick={() => handleOpenAction(r, 'REJECTED')}
                        style={{
                          padding: '8px',
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: '1px solid rgba(239, 68, 68, 0.3)',
                          color: '#DC2626',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                        }}
                      >
                        Reject
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedClaim(r)}
                      style={{
                        padding: '8px',
                        borderRadius: 8,
                        background: 'var(--bg-elevated)',
                        border: '1px solid var(--bg-border)',
                        color: 'var(--text-secondary)',
                        fontWeight: 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4,
                      }}
                    >
                      <Eye size={12} /> Details
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 4. Pagination ── */}
          {totalPages > 1 && (
            <div
              style={{
                marginTop: 20,
                padding: '14px 20px',
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: 12,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.85rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <span>
                Showing {refunds.length} of {totalItems} claims (Page {page} of {totalPages})
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    color: page <= 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: page <= 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-ghost"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    color: page >= totalPages ? 'var(--text-muted)' : 'var(--text-primary)',
                    cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── 5. Action Confirmation Modal (Matching Admin Design) ── */}
      <AnimatePresence>
        {actionModal && (
          <div
            className="modal-overlay"
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box"
              style={{
                maxWidth: 480,
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                  {actionModal.newStatus === 'PROCESSED' && 'Mark Refund as Paid & Settled'}
                  {actionModal.newStatus === 'APPROVED' && 'Approve Refund Request'}
                  {actionModal.newStatus === 'REJECTED' && 'Reject Refund Request'}
                  {actionModal.newStatus === 'UNDER_REVIEW' && 'Set Under Review'}
                </h3>
                <button
                  onClick={() => setActionModal(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={18} />
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 10,
                  padding: '14px',
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  marginBottom: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Ticket ID:</span>
                  <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>{actionModal.claim.refund_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Order Number:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>#{actionModal.claim.order_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bank / UPI UTR:</span>
                  <strong style={{ color: '#1D4ED8', fontFamily: 'monospace' }}>{actionModal.claim.utr_number}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payout UPI:</span>
                  <strong style={{ color: '#10B981' }}>{actionModal.claim.upi_id}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--bg-border)', paddingTop: 6 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Refund Amount:</span>
                  <strong style={{ color: '#10B981', fontSize: '1rem' }}>{formatPrice(actionModal.claim.amount)}</strong>
                </div>
              </div>

              {/* UPI Quick Pay Helper if marking paid */}
              {actionModal.newStatus === 'PROCESSED' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    marginBottom: 16,
                    fontSize: '0.8rem',
                    color: '#059669',
                    lineHeight: 1.5,
                  }}
                >
                  💡 <strong>Payout Instruction:</strong> Open your PhonePe, Google Pay, or Paytm app, transfer{' '}
                  <strong>{formatPrice(actionModal.claim.amount)}</strong> to UPI address{' '}
                  <strong>{actionModal.claim.upi_id}</strong>, then click Confirm below.
                </div>
              )}

              {/* Admin Note Input */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 700 }}>
                  Admin Notes / Remarks (visible to admin audit & customer tracking):
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="e.g. Verified with Cashfree settlement desk. Paid ₹99 via PhonePe UPI."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    resize: 'none',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  disabled={submittingAction}
                  className="btn-ghost"
                  style={{
                    padding: '9px 16px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--text-secondary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={submittingAction}
                  style={{
                    padding: '9px 20px',
                    borderRadius: 8,
                    background:
                      actionModal.newStatus === 'PROCESSED'
                        ? '#10B981'
                        : actionModal.newStatus === 'REJECTED'
                        ? '#EF4444'
                        : '#1162F2',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  }}
                >
                  {submittingAction ? 'Updating...' : `Confirm ${actionModal.newStatus}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── 6. Full Details Modal (selectedClaim) ── */}
      <AnimatePresence>
        {selectedClaim && (
          <div
            className="modal-overlay"
            onClick={() => setSelectedClaim(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="modal-box"
              style={{
                maxWidth: 540,
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-primary)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Dispute Claim Inspection
                  </div>
                  <h3 style={{ margin: '2px 0 0', fontSize: '1.25rem', color: 'var(--text-primary)', fontWeight: 800 }}>
                    Ticket #{selectedClaim.refund_id}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedClaim(null)}
                  style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 12,
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  fontSize: '0.85rem',
                  marginBottom: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Order Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: 'var(--text-primary)' }}>#{selectedClaim.order_number}</strong>
                    <Link to={`/admin/orders?search=${encodeURIComponent(selectedClaim.order_number)}`} style={{ color: '#1162F2' }}>
                      <ExternalLink size={13} />
                    </Link>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Customer Name:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{selectedClaim.customer_name || 'Guest Customer'}</strong>
                </div>

                {selectedClaim.customer_email && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Customer Email:</span>
                    <span>{selectedClaim.customer_email}</span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Bank / UPI UTR:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: '#1D4ED8', fontFamily: 'monospace' }}>{selectedClaim.utr_number}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedClaim.utr_number, `d_utr_${selectedClaim.id}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      {copiedKey === `d_utr_${selectedClaim.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Payout UPI ID:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <strong style={{ color: '#10B981' }}>{selectedClaim.upi_id}</strong>
                    <button
                      type="button"
                      onClick={() => handleCopy(selectedClaim.upi_id, `d_upi_${selectedClaim.id}`)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    >
                      {copiedKey === `d_upi_${selectedClaim.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Claim Amount:</span>
                  <strong style={{ color: '#10B981', fontSize: '1.05rem' }}>{formatPrice(selectedClaim.amount)}</strong>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Filed At:</span>
                  <span>{formatDate(selectedClaim.created_at)} at {formatTime(selectedClaim.created_at)}</span>
                </div>

                <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 8 }}>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginBottom: 2 }}>Reason:</div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedClaim.reason}</div>
                  {selectedClaim.details && (
                    <div style={{ marginTop: 4, color: 'var(--text-secondary)', fontSize: '0.8rem', background: 'var(--bg-surface)', padding: 8, borderRadius: 6 }}>
                      {selectedClaim.details}
                    </div>
                  )}
                </div>

                {selectedClaim.admin_notes && (
                  <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 8 }}>
                    <div style={{ color: '#D97706', fontSize: '0.78rem', fontWeight: 700, marginBottom: 2 }}>Admin Note:</div>
                    <div style={{ color: 'var(--text-primary)', fontStyle: 'italic', fontSize: '0.82rem' }}>{selectedClaim.admin_notes}</div>
                  </div>
                )}
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClaim
                    setSelectedClaim(null)
                    handleOpenAction(c, 'APPROVED')
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.35)',
                    color: '#2563EB',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Approve
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClaim
                    setSelectedClaim(null)
                    handleOpenAction(c, 'PROCESSED')
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    color: '#059669',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Mark Paid
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClaim
                    setSelectedClaim(null)
                    handleOpenAction(c, 'REJECTED')
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    color: '#DC2626',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Reject
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClaim(null)}
                  className="btn-ghost"
                  style={{
                    padding: '8px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--text-secondary)',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                  }}
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
