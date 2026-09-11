// src/client/pages/admin/AdminDashboard.tsx — Production Business Command Center
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  TrendingUp, ShoppingCart, Package, Download, RefreshCw,
  Plus, ArrowRight, ShieldCheck, Clock, XCircle, DollarSign,
  Activity, ExternalLink, Settings, FileText
} from 'lucide-react'
import { adminApi, type AnalyticsData } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import { formatPrice, formatDate, timeAgo } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminDashboard() {
  const { getToken } = useAuthStore()

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.analytics.get(token!)
    },
  })

  if (isLoading) {
    return (
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ height: '32px', width: '200px', background: 'var(--bg-surface)', borderRadius: '6px' }} />
          <div style={{ height: '36px', width: '100px', background: 'var(--bg-surface)', borderRadius: '6px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="glass-card" style={{ height: '110px', borderRadius: 'var(--radius-lg)' }} />
          ))}
        </div>
        <LoadingSpinner />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="glass-card" style={{ padding: '48px 24px', textAlign: 'center', maxWidth: '500px', margin: '40px auto' }}>
        <Activity size={44} color="var(--error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Unable to load dashboard</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
          Something went wrong while retrieving business data. Please try again.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn-primary"
          style={{ padding: '10px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Try Again
        </button>
      </div>
    )
  }

  const revenue = data.revenue
  const orders = data.orders
  const conversion = data.conversion
  const topProducts = data.top_products || []
  const dailyRevenue = data.daily_revenue || []
  const recentOrders = data.recent_orders || []

  // Max daily revenue for SVG chart scaling
  const maxDailyRevenue = Math.max(...dailyRevenue.map((d) => d.revenue), 1)

  // Payment health percentage calculation
  const totalCompletedOrAttempted = (orders.paid || 0) + (orders.pending || 0) + (orders.failed || 0) || 1
  const paidPct = Math.round(((orders.paid || 0) / totalCompletedOrAttempted) * 100)
  const pendingPct = Math.round(((orders.pending || 0) / totalCompletedOrAttempted) * 100)
  const failedPct = Math.round(((orders.failed || 0) / totalCompletedOrAttempted) * 100)

  const kpis = [
    {
      label: 'Total Revenue',
      value: formatPrice(revenue.total || 0),
      icon: <DollarSign size={20} />,
      sub: `Today: ${formatPrice(revenue.today || 0)} · Month: ${formatPrice(revenue.month || 0)}`,
      color: '#F59E0B',
    },
    {
      label: 'Total Orders',
      value: orders.total || 0,
      icon: <ShoppingCart size={20} />,
      sub: `${orders.paid || 0} Paid · ${orders.pending || 0} Pending`,
      color: '#7C3AED',
    },
    {
      label: 'Active Products',
      value: data.active_products ?? topProducts.length,
      icon: <Package size={20} />,
      sub: 'Published & Purchasable',
      color: '#1162F2',
    },
    {
      label: 'Conversion Rate',
      value: `${conversion.purchase_rate || 0}%`,
      icon: <TrendingUp size={20} />,
      sub: `${conversion.checkout_starts || 0} Checkouts · ${conversion.purchases || 0} Paid`,
      color: '#3B82F6',
    },
  ]

  return (
    <div>
      {/* ── 1. Page Header ── */}
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
            Business Dashboard
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '2px 0 0' }}>
            Real-time business performance, revenue, verified transactions, and digital delivery.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
            {isFetching ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <Link
            to="/admin/products/new"
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> Add Product
          </Link>
        </div>
      </div>

      {/* ── 2. Quick Action Shortcuts ── */}
      <div
        style={{
          display: 'flex',
          gap: 10,
          marginBottom: 24,
          flexWrap: 'wrap',
        }}
      >
        <Link
          to="/admin/orders"
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', padding: '8px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <ShoppingCart size={14} /> View Orders ({orders.total || 0})
        </Link>
        <Link
          to="/admin/products"
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', padding: '8px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Package size={14} /> Product Catalog
        </Link>
        <Link
          to="/admin/audit"
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', padding: '8px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Activity size={14} /> Audit Logs
        </Link>
        <Link
          to="/admin/settings"
          className="btn-ghost"
          style={{ fontSize: '0.8125rem', padding: '8px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <Settings size={14} /> Store Settings
        </Link>
      </div>

      {/* ── 3. Traffic Overview Quick Card ── */}
      <div
        className="glass-card"
        style={{
          padding: '16px 20px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--bg-border)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* Live Pulse */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 13px',
              background: (data.live_visitors ?? 0) > 0 ? 'rgba(16,185,129,0.12)' : 'var(--bg-surface)',
              border: `1px solid ${(data.live_visitors ?? 0) > 0 ? 'rgba(16,185,129,0.35)' : 'var(--bg-border)'}`,
              borderRadius: '20px',
              fontSize: '0.8125rem',
              fontWeight: 700,
              color: (data.live_visitors ?? 0) > 0 ? '#10B981' : 'var(--text-muted)',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: (data.live_visitors ?? 0) > 0 ? '#10B981' : '#9CA3AF',
                boxShadow: (data.live_visitors ?? 0) > 0 ? '0 0 10px #10B981' : 'none',
              }}
            />
            {data.live_visitors ?? 0} Active Shoppers Right Now
          </div>

          {data.traffic && (
            <div style={{ display: 'flex', gap: 16, fontSize: '0.8125rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
              <span><strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{(data.traffic.total_visitors || 0).toLocaleString()}</strong> visitors</span>
              <span><strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{(data.traffic.buy_now_clicks || 0).toLocaleString()}</strong> Buy clicks</span>
              <span><strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{data.traffic.dwell_time_formatted || '0m 0s'}</strong> avg. time</span>
            </div>
          )}
        </div>

        <Link
          to="/admin/analytics"
          style={{
            fontSize: '0.8125rem',
            fontWeight: 700,
            color: 'var(--brand-primary)',
            textDecoration: 'none',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: '7px 14px',
            border: '1px solid rgba(17,98,242,0.3)',
            borderRadius: '8px',
            background: 'rgba(17,98,242,0.06)',
            whiteSpace: 'nowrap',
          }}
        >
          <Activity size={14} />
          Full Analytics →
        </Link>
      </div>

      {/* ── 4. Primary KPI Cards Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 28,
        }}
      >
        {kpis.map((stat) => (
          <div
            key={stat.label}
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--bg-border)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
              <div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)', marginTop: 4 }}>
                  {stat.value}
                </div>
              </div>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: `${stat.color}1A`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 4. Charts & Performance Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 28,
        }}
      >
        {/* Real Revenue Trends Visualizer */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Daily Revenue (Last 30 Days)</h3>
            <span style={{ fontSize: '0.8125rem', color: 'var(--brand-amber)', fontWeight: 700 }}>
              Month: {formatPrice(revenue.month || 0)}
            </span>
          </div>

          {dailyRevenue.length > 0 ? (
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: '140px', paddingTop: 10 }}>
              {dailyRevenue.map((d) => {
                const heightPct = Math.max(8, Math.round((d.revenue / maxDailyRevenue) * 100))
                return (
                  <div
                    key={d.day}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      height: '100%',
                      justifyContent: 'flex-end',
                    }}
                    title={`${d.day}: ${formatPrice(d.revenue)} (${d.orders} orders)`}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: `${heightPct}%`,
                        background: 'linear-gradient(180deg, var(--brand-amber) 0%, rgba(245,158,11,0.3) 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 0.3s ease',
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ height: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No revenue transactions recorded in the last 30 days.
            </div>
          )}
        </div>

        {/* Payment Health Breakdown Card */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 18 }}>Payment Health Breakdown</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span style={{ color: '#1162F2', fontWeight: 600 }}>Successful (Paid)</span>
                <span>{orders.paid || 0} ({paidPct}%)</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${paidPct}%`, background: 'linear-gradient(90deg, #1162f2, #7c3aed)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--brand-amber)', fontWeight: 600 }}>Pending</span>
                <span>{orders.pending || 0} ({pendingPct}%)</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pendingPct}%`, background: 'var(--brand-amber)' }} />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: 4 }}>
                <span style={{ color: 'var(--error)', fontWeight: 600 }}>Failed</span>
                <span>{orders.failed || 0} ({failedPct}%)</span>
              </div>
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${failedPct}%`, background: 'var(--error)' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. Top Products & Recent Orders Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
        }}
      >
        {/* Top Products Leaderboard */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Top Performing Products</h3>
            <Link
              to="/admin/products"
              style={{ fontSize: '0.8125rem', color: 'var(--brand-purple-light)', textDecoration: 'none', fontWeight: 600 }}
            >
              View All →
            </Link>
          </div>

          {topProducts.length > 0 ? (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Sales</th>
                  <th>Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p) => (
                  <tr key={p.slug}>
                    <td style={{ fontWeight: 500, fontSize: '0.85rem' }}>{p.title}</td>
                    <td style={{ fontSize: '0.85rem' }}>{p.total_sales}</td>
                    <td style={{ color: 'var(--brand-amber)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {formatPrice(p.total_revenue || 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No product sales recorded yet.
            </div>
          )}
        </div>

        {/* Recent Orders Feed */}
        <div
          className="glass-card"
          style={{
            padding: '24px',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--bg-border)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>Recent Orders</h3>
            <Link
              to="/admin/orders"
              style={{ fontSize: '0.8125rem', color: 'var(--brand-purple-light)', textDecoration: 'none', fontWeight: 600 }}
            >
              View All Orders →
            </Link>
          </div>

          {recentOrders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((o) => (
                    <tr key={o.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 600 }}>
                        {o.order_number}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{o.customer_name || 'Guest'}</td>
                      <td style={{ fontWeight: 700, color: 'var(--brand-amber)', fontSize: '0.8125rem' }}>
                        {formatPrice(o.amount)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            o.status === 'PAID'
                              ? 'badge-success'
                              : o.status === 'FAILED'
                              ? 'badge-error'
                              : 'badge-amber'
                          }`}
                          style={{ fontSize: '0.7rem' }}
                        >
                          {o.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No orders placed yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
