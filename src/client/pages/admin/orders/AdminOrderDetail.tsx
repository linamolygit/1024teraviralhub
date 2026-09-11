// src/client/pages/admin/orders/AdminOrderDetail.tsx — Production Order & Payment Detail Inspector
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, Download, User, Mail, Phone,
  ShieldCheck, Clock, CheckCircle, Package, ExternalLink, Activity, Copy
} from 'lucide-react'
import { adminApi } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate, timeAgo } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminOrderDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuthStore()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-order', id],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.orders.get(token!, id!)
    },
    enabled: Boolean(id),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !data?.order) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Order Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          The requested order does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          ← Back to Orders
        </button>
      </div>
    )
  }

  const o = data.order
  const token = data.download_token
  const isTokenExpired = token ? new Date(token.expires_at).getTime() < Date.now() : true
  const isPaid = o.status === 'PAID'

  return (
    <div>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/orders')}
          className="btn-ghost"
          style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={16} /> Back to Orders
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span>Order #{o.order_number}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(o.order_number)
                adminToast.info('Copied Order Number', o.order_number)
              }}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px 4px', display: 'flex', alignItems: 'center', borderRadius: 4 }}
              title="Copy Order Number"
            >
              <Copy size={15} />
            </button>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
            Created on {formatDate(o.created_at)} ({timeAgo(o.created_at)})
          </p>
        </div>

        <span
          className={`badge ${
            o.status === 'PAID'
              ? 'badge-success'
              : o.status === 'FAILED'
              ? 'badge-error'
              : 'badge-amber'
          }`}
          style={{ fontSize: '0.875rem', padding: '6px 14px' }}
        >
          {o.status}
        </span>
      </div>

      {/* ── 3-Column Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {/* 1. Customer Card */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <User size={16} color="var(--brand-purple-light)" /> Customer Details
            </h3>
            {o.customer_email && (
              <Link
                to={`/admin/customers/${encodeURIComponent(o.customer_email)}`}
                style={{ fontSize: '0.75rem', color: 'var(--brand-purple-light)', textDecoration: 'none', fontWeight: 600 }}
              >
                View Profile →
              </Link>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Name</div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{o.customer_name || 'Guest Buyer'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Email</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.customer_email || 'Not provided'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Phone</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem' }}>{o.customer_phone || 'Not provided'}</div>
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Checkout Classification</div>
              <div style={{ fontWeight: 500, fontSize: '0.875rem', color: 'var(--brand-purple-light)' }}>
                Guest Buyer (No Account Required)
              </div>
            </div>
          </div>
        </div>

        {/* 2. Payment Summary Card */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShieldCheck size={16} color="var(--brand-amber)" /> Payment Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Purchased Product</span>
              <span style={{ fontWeight: 600, maxWidth: '160px', textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {o.product_title}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Currency</span>
              <span>{o.currency || 'INR'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Payment Gateway</span>
              <span style={{ fontWeight: 600 }}>
                {(o as any).notes?.includes('razorpay') || o.cashfree_order_id?.startsWith('order_') || o.cashfree_order_id?.startsWith('plink_')
                  ? 'Razorpay Payment Gateway'
                  : 'Cashfree Payment Gateway'}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                {(o as any).notes?.includes('razorpay') || o.cashfree_order_id?.startsWith('order_') || o.cashfree_order_id?.startsWith('plink_')
                  ? 'Razorpay Order ID'
                  : 'Cashfree Order ID'}
              </span>
              <span style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{o.cashfree_order_id || 'N/A'}</span>
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontWeight: 900,
                fontSize: '1.2rem',
                borderTop: '1px solid var(--bg-border)',
                paddingTop: 12,
                marginTop: 4,
              }}
            >
              <span>Amount Paid</span>
              <span style={{ color: 'var(--brand-amber)' }}>{formatPrice(o.amount)}</span>
            </div>
          </div>
        </div>

        {/* 3. Download Access Card */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} color="var(--success)" /> Digital Delivery Access
          </h3>
          {token ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>Status</span>
                <span className={`badge ${!isTokenExpired ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.75rem' }}>
                  {!isTokenExpired ? 'Active (12-Hour Access)' : 'Expired'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Downloads Used</span>
                <span style={{ fontWeight: 700 }}>
                  {token.download_count} / {token.max_downloads}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Access Expiry</span>
                <span style={{ fontSize: '0.8125rem' }}>{formatDate(token.expires_at)}</span>
              </div>
              <div
                onClick={() => {
                  navigator.clipboard.writeText(token.token)
                  adminToast.info('Token Copied', token.token)
                }}
                style={{ marginTop: 4, padding: '8px 10px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', fontFamily: 'monospace', wordBreak: 'break-all', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                title="Click to copy full download token"
              >
                <span>Token: {token.token.slice(0, 16)}...</span>
                <Copy size={13} />
              </div>
            </div>
          ) : (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>
              {isPaid
                ? 'No download token record generated.'
                : 'Download token will be generated automatically once payment is verified.'}
            </div>
          )}
        </div>
      </div>

      {/* ── Order Timeline ── */}
      <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--brand-purple-light)" /> Order Timeline
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem' }}>
            <CheckCircle size={16} color="var(--success)" />
            <div>
              <strong>Order Created:</strong> {formatDate(o.created_at)} (#{o.order_number})
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem' }}>
            {isPaid ? <CheckCircle size={16} color="var(--success)" /> : <Clock size={16} color="var(--brand-amber)" />}
            <div>
              <strong>Payment Status:</strong> {o.status} ({formatPrice(o.amount)})
            </div>
          </div>
          {token && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.875rem' }}>
              <CheckCircle size={16} color="var(--success)" />
              <div>
                <strong>Download Access Generated:</strong> Expires {formatDate(token.expires_at)}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Download Logs ── */}
      {data.download_logs && data.download_logs.length > 0 && (
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} color="var(--brand-purple-light)" /> Download Activity Logs
          </h3>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>IP Address</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.download_logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontSize: '0.8125rem' }}>{formatDate(log.created_at)}</td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}>{log.ip_address || 'Unknown'}</td>
                  <td>
                    <span
                      className={`badge ${log.success === 1 ? 'badge-success' : 'badge-error'}`}
                      style={{ fontSize: '0.75rem' }}
                    >
                      {log.success === 1 ? 'SUCCESS' : 'FAILED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
