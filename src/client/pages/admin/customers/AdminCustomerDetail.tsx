// src/client/pages/admin/customers/AdminCustomerDetail.tsx — Customer & Guest Buyer Profile Inspector
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowLeft, User, Mail, Phone, ShoppingCart, DollarSign,
  Calendar, Download, ArrowRight, ShieldCheck, CheckCircle, Clock
} from 'lucide-react'
import { adminApi, type Order, type DownloadToken } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate, timeAgo } from '../../../lib/utils'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminCustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuthStore()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-customer-detail', id],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.customers.get(token!, id!)
    },
    enabled: Boolean(id),
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !data?.customer) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Customer Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          The requested customer record does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          ← Back to Customers
        </button>
      </div>
    )
  }

  const c = data.customer
  const orders: Order[] = data.orders || []
  const downloadTokens = data.download_tokens || []

  return (
    <div>
      {/* ── Top Navigation Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/customers')}
          className="btn-ghost"
          style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={16} /> Back to Customers
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {c.name || 'Guest Buyer'}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0' }}>
            {c.email}
          </p>
        </div>

        <span className="badge badge-purple" style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
          Guest Buyer
        </span>
      </div>

      {/* ── Summary Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div className="glass-card" style={{ padding: '18px 22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Total Orders Placed</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {c.total_orders ?? orders.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
            {c.paid_orders ?? orders.filter((o) => o.status === 'PAID').length} paid purchases
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Total Lifetime Spent</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-amber)' }}>
            {formatPrice(c.total_spent)}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified revenue contribution</div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>First Activity</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {c.first_purchased_at || c.first_order_at ? formatDate(c.first_purchased_at || c.first_order_at!) : '-'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Last Activity</div>
          <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: 4 }}>
            {c.last_purchased_at || c.last_order_at ? formatDate(c.last_purchased_at || c.last_order_at!) : '-'}
          </div>
        </div>
      </div>

      {/* ── Order History Table ── */}
      <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)', marginBottom: 24 }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShoppingCart size={16} color="var(--brand-purple-light)" /> Order History ({orders.length})
        </h3>
        {orders.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Amount</th>
                  <th>Payment Status</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 600 }}>
                      {o.order_number}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{o.product_title}</td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-amber)' }}>{formatPrice(o.amount)}</td>
                    <td>
                      <span
                        className={`badge ${
                          o.status === 'PAID'
                            ? 'badge-success'
                            : o.status === 'FAILED'
                            ? 'badge-error'
                            : 'badge-amber'
                        }`}
                        style={{ fontSize: '0.75rem' }}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{formatDate(o.created_at)}</td>
                    <td>
                      <Link
                        to={`/admin/orders/${o.id}`}
                        style={{
                          color: 'var(--brand-purple-light)',
                          fontSize: '0.8125rem',
                          textDecoration: 'none',
                          fontWeight: 600,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        Inspect <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No orders found for this customer.</div>
        )}
      </div>

      {/* ── Download Access History ── */}
      {downloadTokens.length > 0 && (
        <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Download size={16} color="var(--success)" /> Digital Download Sessions ({downloadTokens.length})
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Product</th>
                  <th>Downloads Used</th>
                  <th>Expiration</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {downloadTokens.map((t) => {
                  const isExpired = new Date(t.expires_at).getTime() < Date.now()
                  return (
                    <tr key={t.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{t.order_number}</td>
                      <td style={{ fontSize: '0.85rem' }}>{t.product_title || 'Digital Product'}</td>
                      <td>
                        {t.download_count} / {t.max_downloads}
                      </td>
                      <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatDate(t.expires_at)}</td>
                      <td>
                        <span className={`badge ${!isExpired ? 'badge-success' : 'badge-error'}`} style={{ fontSize: '0.75rem' }}>
                          {!isExpired ? 'Active' : 'Expired'}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
