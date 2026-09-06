// src/client/pages/admin/customers/AdminCustomers.tsx — Production Admin Customer & Guest Buyer Management
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCheck, Search, RefreshCw, ShoppingCart,
  DollarSign, ArrowRight, ChevronLeft, ChevronRight, User
} from 'lucide-react'
import { adminApi, type CustomerSummary } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate } from '../../../lib/utils'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminCustomers() {
  const { getToken } = useAuthStore()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [customerType, setCustomerType] = useState('')
  const [page, setPage] = useState(1)
  const limit = 20

  // 400ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-customers', debouncedSearch, customerType, page],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.customers.list(token!, {
        search: debouncedSearch || undefined,
        type: customerType || undefined,
        limit,
        offset: (page - 1) * limit,
      })
    },
  })

  const customers = data?.customers || []
  const totalCustomers = data?.total || 0
  const totalPages = Math.ceil(totalCustomers / limit) || 1
  const stats = data?.stats

  return (
    <div>
      {/* ── Page Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Customers & Buyers
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '2px 0 0' }}>
            View and manage verified customers, guest buyers, order counts, and lifetime value.
          </p>
        </div>

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {/* ── Summary Stats Cards ── */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>
              <span>Total Unique Customers</span>
              <Users size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {stats.total_customers}
            </div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brand-purple-light)', fontSize: '0.8125rem', marginBottom: 6 }}>
              <span>Guest Buyers</span>
              <User size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-purple-light)' }}>
              {stats.guest_buyers}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Direct guest checkout</div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--success)', fontSize: '0.8125rem', marginBottom: 6 }}>
              <span>Paying Customers</span>
              <UserCheck size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--success)' }}>
              {stats.paying_customers}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>At least 1 verified purchase</div>
          </div>

          <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', color: 'var(--brand-amber)', fontSize: '0.8125rem', marginBottom: 6 }}>
              <span>Customer Lifetime Value</span>
              <DollarSign size={16} />
            </div>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-amber)' }}>
              {formatPrice(stats.total_spent_all)}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total gross purchases</div>
          </div>
        </div>
      )}

      {/* ── Search & Filter Controls ── */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            className="input-field"
            style={{ paddingLeft: 40 }}
            placeholder="Search by customer name, email, or phone..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'All Customers', val: '' },
            { label: 'Guest Buyers', val: 'guest' },
          ].map((tab) => (
            <button
              key={tab.val}
              type="button"
              onClick={() => {
                setCustomerType(tab.val)
                setPage(1)
              }}
              className={customerType === tab.val ? 'btn-primary' : 'btn-ghost'}
              style={{ fontSize: '0.8125rem', padding: '9px 14px' }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Customer Table / List ── */}
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Customer Type</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Last Activity</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((c) => (
                  <tr key={c.email}>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name || 'Guest Buyer'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.email}</div>
                      {c.phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.phone}</div>}
                    </td>
                    <td>
                      <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>
                        Guest Buyer
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                        {c.orders_count ?? c.total_orders ?? 1} orders
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>
                        {c.paid_orders_count ?? c.paid_orders ?? 0} paid
                      </div>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--brand-amber)' }}>
                      {formatPrice(c.total_spent)}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {c.last_order_at || c.last_purchased_at ? formatDate(c.last_order_at || c.last_purchased_at!) : '-'}
                    </td>
                    <td>
                      <Link
                        to={`/admin/customers/${encodeURIComponent(c.email)}`}
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
                        View <ArrowRight size={13} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {!customers.length && (
            <div className="empty-state" style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div className="empty-state-icon" style={{ fontSize: '2rem', marginBottom: 10 }}>
                👥
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 6 }}>
                {debouncedSearch ? 'No matching customers found' : 'No customers yet'}
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {debouncedSearch
                  ? 'Try clearing the search query.'
                  : 'Customer and guest buyer information will appear here once purchases are made.'}
              </p>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 20px',
                borderTop: '1px solid var(--bg-border)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              <div>
                Page {page} of {totalPages} ({totalCustomers} total customers)
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  <ChevronLeft size={14} /> Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="btn-ghost"
                  style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
