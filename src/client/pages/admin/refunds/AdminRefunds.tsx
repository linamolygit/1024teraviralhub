// src/client/pages/admin/refunds/AdminRefunds.tsx
// Comprehensive Admin Refund & Dispute Resolution Control Center
// Allows the owner to inspect UTR, UPI ID, and approve/process/reject refund requests at will

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

  // Fetch refund claims with 5s real-time polling
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
    refetchInterval: 5000,
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
    adminToast.success('Copied to clipboard!')
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

      adminToast.success(`Claim marked as ${actionModal.newStatus}!`)
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
      adminToast.error(err.message || 'Failed to update status')
    } finally {
      setSubmittingAction(false)
    }
  }

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'PROCESSED':
        return {
          bg: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          color: '#10B981',
          icon: <CheckCircle size={14} />,
          text: 'PROCESSED / REFUNDED',
        }
      case 'APPROVED':
        return {
          bg: 'rgba(59, 130, 246, 0.15)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          color: '#60A5FA',
          icon: <CheckCircle size={14} />,
          text: 'APPROVED (QUEUED)',
        }
      case 'REJECTED':
        return {
          bg: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.35)',
          color: '#EF4444',
          icon: <XCircle size={14} />,
          text: 'REJECTED',
        }
      case 'UNDER_REVIEW':
      default:
        return {
          bg: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#FBBF24',
          icon: <Clock size={14} />,
          text: 'UNDER REVIEW (ACTION REQUIRED)',
        }
    }
  }

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px', color: '#F1F5F9' }}>
      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(220, 38, 38, 0.1) 100%)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
              }}
            >
              <RotateCcw size={22} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                Refund & Dispute Claims
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.85rem', color: '#94A3B8' }}>
                Full admin control: review customer UTR & UPI ID, verify payment, and execute refunds on your schedule.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '9px 16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} className={isFetching ? 'spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── KPI Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
          marginBottom: '24px',
        }}
      >
        {/* Total Claims */}
        <div
          onClick={() => { setStatusFilter('ALL'); setPage(1); }}
          style={{
            background: 'rgba(15, 23, 42, 0.65)',
            border: statusFilter === 'ALL' ? '1px solid #38BDF8' : '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '14px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Total Claims</span>
            <RotateCcw size={16} color="#94A3B8" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FFFFFF', marginTop: '6px' }}>
            {stats.total}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '4px' }}>
            ₹{stats.all_claims_amount.toLocaleString('en-IN')} claimed
          </div>
        </div>

        {/* Needs Action / Under Review */}
        <div
          onClick={() => { setStatusFilter('UNDER_REVIEW'); setPage(1); }}
          style={{
            background: 'rgba(245, 158, 11, 0.08)',
            border: statusFilter === 'UNDER_REVIEW' ? '1.5px solid #F59E0B' : '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '14px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#FBBF24', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Under Review (Action Required)</span>
            <Clock size={16} color="#FBBF24" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#FBBF24', marginTop: '6px' }}>
            {stats.under_review}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#D97706', marginTop: '4px' }}>
            Requires admin approval
          </div>
        </div>

        {/* Approved */}
        <div
          onClick={() => { setStatusFilter('APPROVED'); setPage(1); }}
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: statusFilter === 'APPROVED' ? '1.5px solid #3B82F6' : '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '14px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#60A5FA', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Approved (Queued)</span>
            <CheckCircle size={16} color="#60A5FA" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#60A5FA', marginTop: '6px' }}>
            {stats.approved}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#2563EB', marginTop: '4px' }}>
            Awaiting UPI payout
          </div>
        </div>

        {/* Processed / Refunded */}
        <div
          onClick={() => { setStatusFilter('PROCESSED'); setPage(1); }}
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: statusFilter === 'PROCESSED' ? '1.5px solid #10B981' : '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '14px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#34D399', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Settled / Paid Out</span>
            <DollarSign size={16} color="#34D399" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#34D399', marginTop: '6px' }}>
            ₹{stats.total_refunded.toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#059669', marginTop: '4px' }}>
            {stats.processed} orders refunded
          </div>
        </div>

        {/* Rejected */}
        <div
          onClick={() => { setStatusFilter('REJECTED'); setPage(1); }}
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: statusFilter === 'REJECTED' ? '1.5px solid #EF4444' : '1px solid rgba(239, 68, 68, 0.25)',
            borderRadius: '14px',
            padding: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <div style={{ fontSize: '0.8rem', color: '#F87171', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Rejected Claims</span>
            <XCircle size={16} color="#F87171" />
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: '#F87171', marginTop: '6px' }}>
            {stats.rejected}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#DC2626', marginTop: '4px' }}>
            Invalid UTR / Ineligible
          </div>
        </div>
      </div>

      {/* ── Filters & Search Bar ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '16px 20px',
          marginBottom: '20px',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '14px',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Status Tab Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {(['ALL', 'UNDER_REVIEW', 'APPROVED', 'PROCESSED', 'REJECTED'] as RefundStatus[]).map((st) => (
            <button
              key={st}
              onClick={() => { setStatusFilter(st); setPage(1); }}
              style={{
                padding: '7px 14px',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                border: 'none',
                cursor: 'pointer',
                background: statusFilter === st ? '#1162F2' : 'rgba(255, 255, 255, 0.05)',
                color: statusFilter === st ? '#FFFFFF' : '#94A3B8',
                transition: 'all 0.15s',
              }}
            >
              {st === 'ALL' ? 'All Claims' : st.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: 'relative', minWidth: '280px', flex: '1', maxWidth: '420px' }}>
          <Search size={16} color="#64748B" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            placeholder="Search Order #, UTR, UPI ID, or Ticket..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: '100%',
              padding: '9px 12px 9px 36px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>
      </div>

      {/* ── Main Claims Table ── */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.65)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          overflow: 'hidden',
        }}
      >
        {isLoading ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <LoadingSpinner />
            <p style={{ marginTop: '12px', color: '#94A3B8', fontSize: '0.9rem' }}>Loading refund claims...</p>
          </div>
        ) : refunds.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center' }}>
            <RotateCcw size={40} color="#64748B" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#FFFFFF' }}>No refund claims found</h3>
            <p style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '0.85rem' }}>
              {debouncedSearch
                ? `No requests match "${debouncedSearch}". Try clearing your search.`
                : 'No customer dispute claims filed in this category.'}
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.08)', background: 'rgba(255, 255, 255, 0.02)' }}>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Refund Ticket</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Order #</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Bank UTR (12 Digits)</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Payout UPI ID</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Amount</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Reason</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '14px 16px', color: '#94A3B8', fontWeight: 600, textAlign: 'right' }}>Admin Actions</th>
                </tr>
              </thead>
              <tbody>
                {refunds.map((r: any) => {
                  const badge = getStatusBadge(r.status)
                  return (
                    <tr
                      key={r.id}
                      style={{
                        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                        transition: 'background 0.15s',
                      }}
                    >
                      {/* Refund Ticket */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#FFD200' }}>
                            {r.refund_id}
                          </span>
                          <button
                            onClick={() => handleCopy(r.refund_id, `ticket_${r.id}`)}
                            title="Copy Ticket ID"
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                          >
                            {copiedKey === `ticket_${r.id}` ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '2px' }}>
                          {formatDate(r.created_at)} {formatTime(r.created_at)}
                        </div>
                      </td>

                      {/* Order Number */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#FFFFFF' }}>#{r.order_number}</span>
                          <Link
                            to={`/admin/orders?search=${encodeURIComponent(r.order_number)}`}
                            title="View order in Admin"
                            style={{ color: '#38BDF8', display: 'inline-flex' }}
                          >
                            <ExternalLink size={12} />
                          </Link>
                        </div>
                        {r.customer_name && (
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: '2px' }}>
                            {r.customer_name}
                          </div>
                        )}
                      </td>

                      {/* Bank UTR */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 700,
                              color: '#38BDF8',
                              background: 'rgba(56, 189, 248, 0.08)',
                              padding: '3px 6px',
                              borderRadius: '4px',
                            }}
                          >
                            {r.utr_number}
                          </span>
                          <button
                            onClick={() => handleCopy(r.utr_number, `utr_${r.id}`)}
                            title="Copy UTR to verify in Cashfree/Bank"
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                          >
                            {copiedKey === `utr_${r.id}` ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Payout UPI ID */}
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 600, color: '#E2E8F0' }}>{r.upi_id}</span>
                          <button
                            onClick={() => handleCopy(r.upi_id, `upi_${r.id}`)}
                            title="Copy UPI ID for Payout"
                            style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: 2 }}
                          >
                            {copiedKey === `upi_${r.id}` ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                          </button>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ color: '#10B981', fontSize: '0.95rem' }}>
                          ₹{r.amount}
                        </strong>
                      </td>

                      {/* Reason */}
                      <td style={{ padding: '14px 16px', maxWidth: '180px' }}>
                        <div style={{ color: '#F1F5F9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {r.reason}
                        </div>
                        {r.details && (
                          <div style={{ fontSize: '0.75rem', color: '#94A3B8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {r.details}
                          </div>
                        )}
                        {r.admin_notes && (
                          <div style={{ fontSize: '0.72rem', color: '#FBBF24', marginTop: '2px', fontStyle: 'italic' }}>
                            Note: {r.admin_notes}
                          </div>
                        )}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: badge.bg,
                            border: badge.border,
                            color: badge.color,
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            letterSpacing: '0.02em',
                          }}
                        >
                          {badge.icon}
                          {badge.text}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          {/* Approve Button */}
                          {r.status === 'UNDER_REVIEW' && (
                            <button
                              onClick={() => handleOpenAction(r, 'APPROVED')}
                              title="Approve Refund Claim"
                              style={{
                                background: 'rgba(59, 130, 246, 0.15)',
                                border: '1px solid rgba(59, 130, 246, 0.35)',
                                color: '#60A5FA',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Approve
                            </button>
                          )}

                          {/* Mark Processed / Paid */}
                          {r.status !== 'PROCESSED' && (
                            <button
                              onClick={() => handleOpenAction(r, 'PROCESSED')}
                              title="Mark Refund Paid & Revoke Order"
                              style={{
                                background: 'rgba(16, 185, 129, 0.15)',
                                border: '1px solid rgba(16, 185, 129, 0.35)',
                                color: '#10B981',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Mark Paid
                            </button>
                          )}

                          {/* Reject Button */}
                          {r.status !== 'REJECTED' && (
                            <button
                              onClick={() => handleOpenAction(r, 'REJECTED')}
                              title="Reject Invalid Claim"
                              style={{
                                background: 'rgba(239, 68, 68, 0.12)',
                                border: '1px solid rgba(239, 68, 68, 0.25)',
                                color: '#F87171',
                                padding: '5px 10px',
                                borderRadius: '6px',
                                fontSize: '0.78125rem',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div
            style={{
              padding: '14px 20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: '#94A3B8',
            }}
          >
            <span>
              Showing {refunds.length} of {totalItems} claims (Page {page} of {totalPages})
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: page <= 1 ? '#475569' : '#FFFFFF',
                  cursor: page <= 1 ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ChevronLeft size={14} /> Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: page >= totalPages ? '#475569' : '#FFFFFF',
                  cursor: page >= totalPages ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Confirmation Modal ── */}
      <AnimatePresence>
        {actionModal && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(6px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '16px',
            }}
            onClick={() => setActionModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#0F172A',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '16px',
                padding: '24px',
                maxWidth: '480px',
                width: '100%',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              }}
            >
              <h3 style={{ margin: '0 0 10px', fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700 }}>
                {actionModal.newStatus === 'PROCESSED' && 'Mark Refund as Paid & Settled'}
                {actionModal.newStatus === 'APPROVED' && 'Approve Refund Request'}
                {actionModal.newStatus === 'REJECTED' && 'Reject Refund Request'}
                {actionModal.newStatus === 'UNDER_REVIEW' && 'Set Under Review'}
              </h3>

              <div
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '0.825rem',
                  color: '#94A3B8',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div>
                  Ticket: <strong style={{ color: '#FFD200' }}>{actionModal.claim.refund_id}</strong>
                </div>
                <div>
                  Order: <strong style={{ color: '#FFFFFF' }}>#{actionModal.claim.order_number}</strong>
                </div>
                <div>
                  Bank UTR: <strong style={{ color: '#38BDF8' }}>{actionModal.claim.utr_number}</strong>
                </div>
                <div>
                  Payout UPI: <strong style={{ color: '#10B981' }}>{actionModal.claim.upi_id}</strong>
                </div>
                <div>
                  Amount: <strong style={{ color: '#10B981' }}>₹{actionModal.claim.amount}</strong>
                </div>
              </div>

              {/* UPI Quick Pay Helper if marking paid */}
              {actionModal.newStatus === 'PROCESSED' && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '8px',
                    padding: '10px',
                    marginBottom: '14px',
                    fontSize: '0.8rem',
                    color: '#6EE7B7',
                  }}
                >
                  💡 Tip: Open PhonePe/GPay, send <strong>₹{actionModal.claim.amount}</strong> to{' '}
                  <strong>{actionModal.claim.upi_id}</strong>, then confirm below.
                </div>
              )}

              {/* Admin Note Input */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#94A3B8', marginBottom: '6px', fontWeight: 600 }}>
                  Admin Notes / Remarks (visible to admin & customer tracking):
                </label>
                <textarea
                  rows={3}
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  placeholder="e.g. Paid ₹99 via PhonePe UPI at 3:15 PM or UTR verified with Cashfree"
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    resize: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  disabled={submittingAction}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.06)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    color: '#94A3B8',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmStatusChange}
                  disabled={submittingAction}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '8px',
                    background:
                      actionModal.newStatus === 'PROCESSED'
                        ? '#10B981'
                        : actionModal.newStatus === 'REJECTED'
                        ? '#EF4444'
                        : '#1162F2',
                    border: 'none',
                    color: '#FFFFFF',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: submittingAction ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submittingAction ? 'Updating...' : `Confirm ${actionModal.newStatus}`}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
