// src/client/pages/admin/AdminAnalytics.tsx — Traffic & Conversion Analytics Command Center
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, Eye, MousePointerClick, Clock, TrendingUp, RefreshCw,
  ShoppingBag, ArrowRight, CheckCircle2, Globe, Flame,
  Share2, BarChart2, ShieldCheck, ChevronRight, Zap
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import { formatPrice } from '../../lib/utils'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function AdminAnalytics() {
  const { getToken } = useAuthStore()
  const [period, setPeriod] = useState<'today' | '7d' | '30d' | 'all'>('30d')

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['admin-traffic-analytics', period],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.analytics.get(token!, period)
    },
    refetchInterval: 30000, // Auto-refresh live stats every 30 seconds
  })

  if (isLoading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ height: '32px', width: '220px', background: 'var(--bg-surface)', borderRadius: '8px' }} />
          <div style={{ height: '36px', width: '120px', background: 'var(--bg-surface)', borderRadius: '8px' }} />
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
        <BarChart2 size={44} color="var(--error)" style={{ margin: '0 auto 16px' }} />
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Unable to load analytics</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
          Could not fetch real-time traffic and conversion data.
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="btn-primary"
          style={{ padding: '10px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    )
  }

  const liveVisitors = data.live_visitors ?? 0
  const traffic = data.traffic || {
    total_visitors: 0,
    total_pageviews: 0,
    new_visitors: 0,
    returning_visitors: 0,
    new_visitor_pct: 0,
    avg_dwell_seconds: 0,
    dwell_time_formatted: '0m 0s',
    total_clicks: 0,
    buy_now_clicks: 0,
    buy_now_ctr: 0,
  }

  const funnel = data.funnel || []
  const sources = data.traffic_sources || []
  const topProducts = data.top_products || []

  const kpis = [
    {
      label: 'Unique Visitors',
      value: traffic.total_visitors.toLocaleString(),
      sub: `${traffic.new_visitors} New (${traffic.new_visitor_pct}%) · ${traffic.returning_visitors} Return`,
      icon: <Users size={22} color="#10B981" />,
      bg: 'rgba(16, 185, 129, 0.1)',
      border: 'rgba(16, 185, 129, 0.25)',
    },
    {
      label: 'Total Pageviews',
      value: traffic.total_pageviews.toLocaleString(),
      sub: traffic.total_visitors > 0
        ? `${(traffic.total_pageviews / traffic.total_visitors).toFixed(1)} views / shopper`
        : '0 views / shopper',
      icon: <Eye size={22} color="#3B82F6" />,
      bg: 'rgba(59, 130, 246, 0.1)',
      border: 'rgba(59, 130, 246, 0.25)',
    },
    {
      label: 'Avg. Time on Site',
      value: traffic.dwell_time_formatted,
      sub: traffic.avg_dwell_seconds > 60 ? '🔥 High Engagement' : 'Standard Browsing Time',
      icon: <Clock size={22} color="#F59E0B" />,
      bg: 'rgba(245, 158, 11, 0.1)',
      border: 'rgba(245, 158, 11, 0.25)',
    },
    {
      label: '"Buy Now" Clicks',
      value: traffic.buy_now_clicks.toLocaleString(),
      sub: `CTR: ${traffic.buy_now_ctr}% conversion intent`,
      icon: <MousePointerClick size={22} color="#8B5CF6" />,
      bg: 'rgba(139, 92, 246, 0.1)',
      border: 'rgba(139, 92, 246, 0.25)',
    },
  ]

  return (
    <div style={{ paddingBottom: '40px' }}>
      {/* ── 1. Page Header with Live Shoppers Pulse Badge ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Traffic & Funnel Analytics
            </h1>
            {/* Live Shoppers Pulse Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '7px',
                padding: '4px 12px',
                background: liveVisitors > 0 ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                border: `1px solid ${liveVisitors > 0 ? 'rgba(16, 185, 129, 0.35)' : 'var(--bg-border)'}`,
                borderRadius: '20px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: liveVisitors > 0 ? '#10B981' : 'var(--text-muted)',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: liveVisitors > 0 ? '#10B981' : '#9CA3AF',
                  boxShadow: liveVisitors > 0 ? '0 0 10px #10B981' : 'none',
                  animation: liveVisitors > 0 ? 'pulse 2s infinite' : 'none',
                }}
              />
              <span>{liveVisitors} Live {liveVisitors === 1 ? 'Shopper' : 'Shoppers'} on Site</span>
            </div>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Real-time tracking of Reel visitors, dwell times, button clicks, and end-to-end checkout conversion.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {/* Period Filter Selector */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-surface)',
              padding: '3px',
              borderRadius: '8px',
              border: '1px solid var(--bg-border)',
            }}
          >
            {(['today', '7d', '30d', 'all'] as const).map((p) => {
              const active = period === p
              const label = p === 'today' ? 'Today' : p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : 'All Time'
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    padding: '6px 14px',
                    fontSize: '0.8125rem',
                    fontWeight: active ? 700 : 500,
                    borderRadius: '6px',
                    border: 'none',
                    background: active ? 'var(--brand-primary)' : 'transparent',
                    color: active ? '#FFFFFF' : 'var(--text-muted)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {label}
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '8px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Refresh analytics data"
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* ── 2. Top Metric Cards (Visitors, Views, Dwell Time, Buy Clicks) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
          marginBottom: 24,
        }}
      >
        {kpis.map((k, idx) => (
          <div
            key={idx}
            className="glass-card"
            style={{
              padding: '20px',
              borderRadius: 'var(--radius-lg)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                {k.label}
              </span>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: k.bg,
                  border: `1px solid ${k.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {k.icon}
              </div>
            </div>
            <div>
              <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {k.value}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6, fontWeight: 500 }}>
                {k.sub}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3. 5-Stage High-Conversion Funnel Visualizer ── */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-lg)',
          marginBottom: 24,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="var(--brand-primary)" />
              5-Stage Conversion Funnel Tracking
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '3px 0 0' }}>
              Track visitor drop-offs from Facebook Reel link click to finalized paid order.
            </p>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            Overall Conversion Rate:{' '}
            <strong style={{ color: '#10B981', fontWeight: 800, fontSize: '0.95rem' }}>
              {traffic.total_visitors > 0
                ? `${((data.orders?.paid || 0) / traffic.total_visitors * 100).toFixed(2)}%`
                : '0.00%'}
            </strong>
          </div>
        </div>

        {funnel.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {funnel.map((step, i) => {
              const colors = ['#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#10B981']
              const stageColor = colors[i % colors.length]
              const barWidth = Math.max(step.pctOfTotal, 3)

              return (
                <div key={i} style={{ background: 'var(--bg-surface)', padding: '14px 18px', borderRadius: '10px', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: stageColor,
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {i + 1}
                      </span>
                      <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {step.stage}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {step.count.toLocaleString()}
                      </span>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: 700,
                          padding: '2px 8px',
                          borderRadius: '12px',
                          background: `${stageColor}20`,
                          color: stageColor,
                        }}
                      >
                        {step.pctOfTotal}% of visitors
                      </span>
                      {step.dropoffPct > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--error)', fontWeight: 600 }}>
                          ↓ {step.dropoffPct}% drop-off
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Funnel Progress Bar */}
                  <div
                    style={{
                      height: '8px',
                      background: 'rgba(0,0,0,0.06)',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        width: `${barWidth}%`,
                        background: stageColor,
                        borderRadius: '4px',
                        transition: 'width 0.4s ease',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            No funnel events recorded yet for this timeframe.
          </div>
        )}
      </div>

      {/* ── 4. Traffic Sources & Top Products Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
        {/* Traffic Sources Breakdown */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Share2 size={20} color="#10B981" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              Traffic Sources Breakdown
            </h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: -8, marginBottom: 16 }}>
            Where your shoppers are arriving from (Reels caption links, Instagram, Direct).
          </p>

          {sources.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sources.map((s, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '6px',
                        background: 'rgba(59, 130, 246, 0.1)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--brand-primary)',
                      }}
                    >
                      <Globe size={16} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {s.source}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {s.total_events} pageviews / events
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {s.unique_visitors.toLocaleString()} visitors
                    </div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981' }}>
                      {s.percentage}% share
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No traffic sources recorded yet.
            </div>
          )}
        </div>

        {/* Top Products by Conversion & Revenue */}
        <div className="glass-card" style={{ padding: '22px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flame size={20} color="#F59E0B" />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Top Performing Products
              </h3>
            </div>
            <Link
              to="/admin/products"
              style={{ fontSize: '0.8125rem', color: 'var(--brand-primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              View all →
            </Link>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginTop: -8, marginBottom: 16 }}>
            Products getting the most views, clicks, and direct purchases.
          </p>

          {topProducts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {topProducts.map((p, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ minWidth: 0, marginRight: 10 }}>
                    <Link
                      to={`/product/${p.slug}`}
                      target="_blank"
                      style={{
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'block',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {p.title}
                    </Link>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                      {p.total_sales || 0} direct sales
                    </div>
                  </div>

                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#10B981' }}>
                      {formatPrice(p.total_revenue || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              No sales data recorded yet.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
