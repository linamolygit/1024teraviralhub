// src/client/pages/admin/orders/AdminOrders.tsx — Modern 2026 Admin Orders & Payments Management
import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, RefreshCw, ShoppingCart, CheckCircle, Clock,
  XCircle, ArrowRight, ChevronLeft, ChevronRight, DollarSign,
  Calendar, Filter, TrendingUp, Copy, Check, ExternalLink,
  ShieldCheck, AlertCircle, CreditCard, Sparkles, Activity
} from 'lucide-react'
import { adminApi, type Order, type AnalyticsData } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminOrders() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [status, setStatus] = useState<string>('')
  const [dateRange, setDateRange] = useState<string>('')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [searchInput, setSearchInput] = useState<string>('')
  const [debouncedSearch, setDebouncedSearch] = useState<string>('')
  const [page, setPage] = useState<number>(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [chartDays, setChartDays] = useState<7 | 14 | 30>(14)
  const [activeHoverPoint, setActiveHoverPoint] = useState<{ x: number; y: number; data: any } | null>(null)
  const limit = 20

  // 350ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch orders list
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-orders', status, dateRange, sortBy, debouncedSearch, page],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.orders.list(token!, {
        status: status || undefined,
        date_range: dateRange || undefined,
        sort: sortBy || undefined,
        search: debouncedSearch || undefined,
        limit,
        offset: (page - 1) * limit,
      })
    },
  })

  // Fetch analytics for interactive chart
  const { data: analyticsData } = useQuery<AnalyticsData>({
    queryKey: ['admin-analytics'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.analytics.get(token!)
    },
  })

  const totalOrders = data?.total ?? 0
  const totalPages = Math.ceil(totalOrders / limit) || 1
  const stats = data?.stats
  const orders: Order[] = data?.orders || []

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    adminToast.info('Copied to Clipboard', text, 2200)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Calculate conversion rates
  const conversionRate = useMemo(() => {
    if (!stats || stats.total_orders === 0) return 0
    return Math.round((stats.paid_count / stats.total_orders) * 100)
  }, [stats])

  // Build daily points for the interactive SVG area chart
  const chartData = useMemo(() => {
    const rawDaily = analyticsData?.daily_revenue || []
    const dailyMap = new Map<string, { revenue: number; orders: number }>()
    rawDaily.forEach((d) => {
      dailyMap.set(d.day, { revenue: d.revenue, orders: d.orders })
    })

    const daysCount = chartDays
    const points: Array<{ label: string; dateStr: string; revenue: number; orders: number }> = []

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      const dateKey = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      const existing = dailyMap.get(dateKey) || { revenue: 0, orders: 0 }
      points.push({
        label,
        dateStr: dateKey,
        revenue: existing.revenue,
        orders: existing.orders,
      })
    }

    return points
  }, [analyticsData, chartDays])

  // SVG Chart Geometry calculations
  const chartWidth = 900
  const chartHeight = 220
  const paddingX = 40
  const paddingY = 25
  const innerWidth = chartWidth - paddingX * 2
  const innerHeight = chartHeight - paddingY * 2

  const maxRevenue = useMemo(() => {
    const maxVal = Math.max(...chartData.map((d) => d.revenue), 1000)
    return Math.ceil(maxVal / 500) * 500
  }, [chartData])

  const svgPoints = useMemo(() => {
    if (chartData.length === 0) return []
    const stepX = innerWidth / (chartData.length - 1)
    return chartData.map((d, i) => {
      const x = paddingX + i * stepX
      const y = paddingY + innerHeight - (d.revenue / maxRevenue) * innerHeight
      return { x, y, data: d }
    })
  }, [chartData, maxRevenue, innerWidth, innerHeight])

  // Build smooth cubic Bézier SVG path
  const { linePath, areaPath } = useMemo(() => {
    if (svgPoints.length === 0) return { linePath: '', areaPath: '' }
    if (svgPoints.length === 1) {
      const pt = svgPoints[0]
      return {
        linePath: `M ${pt.x} ${pt.y}`,
        areaPath: `M ${pt.x} ${pt.y} L ${pt.x} ${paddingY + innerHeight} Z`,
      }
    }

    let d = `M ${svgPoints[0].x} ${svgPoints[0].y}`
    for (let i = 0; i < svgPoints.length - 1; i++) {
      const p0 = svgPoints[i]
      const p1 = svgPoints[i + 1]
      const cpX1 = p0.x + (p1.x - p0.x) / 2
      const cpY1 = p0.y
      const cpX2 = p0.x + (p1.x - p0.x) / 2
      const cpY2 = p1.y
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`
    }

    const firstPt = svgPoints[0]
    const lastPt = svgPoints[svgPoints.length - 1]
    const groundY = paddingY + innerHeight
    const area = `${d} L ${lastPt.x} ${groundY} L ${firstPt.x} ${groundY} Z`

    return { linePath: d, areaPath: area }
  }, [svgPoints, innerHeight, paddingY])

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Page Header ── */}
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
                background: 'linear-gradient(135deg, rgba(17,98,242,0.15), rgba(124,58,237,0.15))',
                border: '1px solid rgba(17,98,242,0.3)',
                color: '#1162F2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ShoppingCart size={20} />
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
              Orders & Payments
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Real-time transaction tracking, UPI & gateway settlements, and digital download session security.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
            }}
          >
            <RefreshCw size={15} className={isFetching ? 'animate-spin' : ''} />
            {isFetching ? 'Refreshing...' : 'Live Refresh'}
          </button>
        </div>
      </div>

      {/* ── 1. KPI Summary Stat Cards ── */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 14,
            marginBottom: 24,
          }}
        >
          {/* Total Orders */}
          <div
            className="glass-card admin-card-interactive"
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Total Orders
              </span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(17,98,242,0.1)', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingCart size={15} />
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              {stats.total_orders}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Total customer checkout attempts
            </div>
          </div>

          {/* Verified Revenue */}
          <div
            className="glass-card admin-card-interactive"
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid rgba(17,98,242,0.25)',
              background: 'linear-gradient(135deg, rgba(17,98,242,0.04), rgba(124,58,237,0.02))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1162F2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Verified Revenue
              </span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1162F2, #7C3AED)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <DollarSign size={15} />
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1162F2', letterSpacing: '-0.02em' }}>
              {formatPrice(stats.total_revenue || 0)}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              100% settled instant UPI payments
            </div>
          </div>

          {/* Paid Orders */}
          <div
            className="glass-card admin-card-interactive"
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#1162F2', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Paid & Delivered
              </span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(17,98,242,0.12)', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={15} />
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1162F2', letterSpacing: '-0.02em' }}>
              {stats.paid_count}
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginLeft: 6 }}>
                ({conversionRate}%)
              </span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Payment conversion success rate
            </div>
          </div>

          {/* Pending */}
          <div
            className="glass-card admin-card-interactive"
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#D97706', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Pending
              </span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(217,119,6,0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Clock size={15} />
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em' }}>
              {stats.pending_count}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Awaiting UPI confirmation
            </div>
          </div>

          {/* Failed */}
          <div
            className="glass-card admin-card-interactive"
            style={{
              padding: '16px 18px',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-surface)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#EF4444', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Failed / Dropped
              </span>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <XCircle size={15} />
              </span>
            </div>
            <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#EF4444', letterSpacing: '-0.02em' }}>
              {stats.failed_count}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
              Declined by gateway / bank
            </div>
          </div>
        </div>
      )}

      {/* ── 2. Interactive SVG Revenue & Order Trend Area Chart ── */}
      <div
        className="glass-card"
        style={{
          padding: '22px 24px',
          borderRadius: 16,
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          marginBottom: 24,
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Revenue & Order Trend Velocity
              </h3>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'linear-gradient(135deg, rgba(17,98,242,0.15), rgba(124,58,237,0.15))',
                  border: '1px solid rgba(17,98,242,0.3)',
                  color: '#1162F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Activity size={12} /> Live Curve
              </span>
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '3px 0 0 0' }}>
              Interactive daily gross volume. Hover over curve data points to inspect details.
            </p>
          </div>

          {/* Timeframe Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
              gap: 2,
            }}
          >
            {[
              { days: 7, label: '7 Days' },
              { days: 14, label: '14 Days' },
              { days: 30, label: '30 Days' },
            ].map((btn) => (
              <button
                key={btn.days}
                type="button"
                onClick={() => setChartDays(btn.days as any)}
                style={{
                  border: 'none',
                  background: chartDays === btn.days ? '#1162F2' : 'transparent',
                  color: chartDays === btn.days ? '#FFFFFF' : 'var(--text-muted)',
                  borderRadius: 6,
                  padding: '5px 12px',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  transition: 'all 0.15s ease',
                }}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Area Chart Container */}
        <div style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
          >
            <defs>
              {/* Area Fill Gradient: Electric Blue fading to Purple Transparent */}
              <linearGradient id="orderChartFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1162F2" stopOpacity="0.45" />
                <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
              </linearGradient>

              {/* Stroke Gradient */}
              <linearGradient id="orderChartStroke" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#1162F2" />
                <stop offset="100%" stopColor="#7C3AED" />
              </linearGradient>

              {/* Filter glow effect */}
              <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#1162F2" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((pct, idx) => {
              const y = paddingY + innerHeight * (1 - pct)
              const val = Math.round(maxRevenue * pct)
              return (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={chartWidth - paddingX}
                    y2={y}
                    stroke="var(--bg-border)"
                    strokeDasharray="3 3"
                    strokeOpacity="0.6"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 4}
                    textAnchor="end"
                    fill="var(--text-muted)"
                    fontSize="10"
                    fontWeight="600"
                  >
                    ₹{val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
                  </text>
                </g>
              )
            })}

            {/* Area Path */}
            {areaPath && (
              <path
                d={areaPath}
                fill="url(#orderChartFill)"
              />
            )}

            {/* Main Bézier Stroke Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#orderChartStroke)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#chartGlow)"
              />
            )}

            {/* Active Vertical Crosshair */}
            {activeHoverPoint && (
              <line
                x1={activeHoverPoint.x}
                y1={paddingY}
                x2={activeHoverPoint.x}
                y2={paddingY + innerHeight}
                stroke="#1162F2"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                strokeOpacity="0.8"
              />
            )}

            {/* Interactive Data Point Circles */}
            {svgPoints.map((pt, i) => {
              const isHovered = activeHoverPoint?.data?.dateStr === pt.data.dateStr
              return (
                <g
                  key={i}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setActiveHoverPoint(pt)}
                  onMouseLeave={() => setActiveHoverPoint(null)}
                >
                  {/* Invisible broad hitbox for easy touch/mouse hovering */}
                  <circle cx={pt.x} cy={pt.y} r={16} fill="transparent" />

                  {/* Outer pulse circle when hovered */}
                  {isHovered && (
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={9}
                      fill="rgba(17, 98, 242, 0.25)"
                    />
                  )}

                  {/* Visual Point */}
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 5.5 : 3.5}
                    fill="#FFFFFF"
                    stroke="#1162F2"
                    strokeWidth={isHovered ? 3 : 2}
                    style={{ transition: 'all 0.15s ease' }}
                  />

                  {/* X-axis date labels (every 2-3 points) */}
                  {(i % (chartDays === 30 ? 4 : chartDays === 14 ? 2 : 1) === 0 || i === svgPoints.length - 1) && (
                    <text
                      x={pt.x}
                      y={paddingY + innerHeight + 18}
                      textAnchor="middle"
                      fill={isHovered ? '#1162F2' : 'var(--text-muted)'}
                      fontSize="10.5"
                      fontWeight={isHovered ? '800' : '600'}
                    >
                      {pt.data.label}
                    </text>
                  )}
                </g>
              )
            })}
          </svg>

          {/* Floating Hover Tooltip Bubble */}
          <AnimatePresence>
            {activeHoverPoint && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="chart-tooltip-bubble"
                style={{
                  position: 'absolute',
                  left: `${(activeHoverPoint.x / chartWidth) * 100}%`,
                  top: `${Math.max(10, (activeHoverPoint.y / chartHeight) * 100 - 30)}%`,
                  transform: 'translate(-50%, -100%)',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '0.82rem', marginBottom: 2 }}>
                  {activeHoverPoint.data.label} ({activeHoverPoint.data.dateStr})
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ color: '#1162F2', fontWeight: 800 }}>
                    {formatPrice(activeHoverPoint.data.revenue)}
                  </span>
                  <span style={{ opacity: 0.7 }}>•</span>
                  <span>{activeHoverPoint.data.orders} verified orders</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Payment Conversion Health Bar on Bottom of Chart */}
        {stats && stats.total_orders > 0 && (
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--bg-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
              <span style={{ fontWeight: 700 }}>Payment Gateway Conversion Health</span>
              <span style={{ color: '#1162F2', fontWeight: 800 }}>
                {conversionRate}% Success Ratio ({stats.paid_count}/{stats.total_orders} Orders)
              </span>
            </div>

            <div
              style={{
                height: 7,
                width: '100%',
                borderRadius: 999,
                background: 'rgba(0,0,0,0.06)',
                display: 'flex',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${(stats.paid_count / stats.total_orders) * 100}%`,
                  background: 'linear-gradient(90deg, #1162F2, #7C3AED)',
                }}
                title={`Paid: ${stats.paid_count}`}
              />
              <div
                style={{
                  width: `${(stats.pending_count / stats.total_orders) * 100}%`,
                  background: '#F59E0B',
                }}
                title={`Pending: ${stats.pending_count}`}
              />
              <div
                style={{
                  width: `${(stats.failed_count / stats.total_orders) * 100}%`,
                  background: '#EF4444',
                }}
                title={`Failed: ${stats.failed_count}`}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── 3. Search & Filter Bar ── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          border: '1px solid var(--bg-border)',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="search"
            className="input-field"
            style={{ paddingLeft: 42, borderRadius: 10, height: 40 }}
            placeholder="Search by order #, customer email, or product..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>

        {/* Status Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { label: 'All Orders', val: '' },
            { label: 'Paid', val: 'PAID' },
            { label: 'Pending', val: 'PENDING' },
            { label: 'Failed', val: 'FAILED' },
          ].map((tab) => {
            const isActive = status === tab.val
            return (
              <button
                key={tab.val}
                type="button"
                onClick={() => {
                  setStatus(tab.val)
                  setPage(1)
                }}
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: isActive ? '1px solid #1162F2' : '1px solid var(--bg-border)',
                  background: isActive
                    ? 'linear-gradient(135deg, #1162F2, #7C3AED)'
                    : 'var(--bg-elevated)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: isActive ? '0 4px 12px rgba(17,98,242,0.25)' : 'none',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Date Filter */}
        <select
          className="input-field"
          value={dateRange}
          onChange={(e) => {
            setDateRange(e.target.value)
            setPage(1)
          }}
          style={{ fontSize: '0.8125rem', padding: '8px 12px', height: 40, width: 'auto', background: 'var(--bg-elevated)', fontWeight: 600 }}
        >
          <option value="">All Time History</option>
          <option value="today">Today</option>
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="90days">Last 90 Days</option>
        </select>
      </div>

      {/* ── 4. Orders Table ── */}
      {isLoading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : orders.length === 0 ? (
        <div
          className="glass-card"
          style={{
            padding: '60px 20px',
            textAlign: 'center',
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(17,98,242,0.12), rgba(124,58,237,0.12))',
              color: '#1162F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <ShoppingCart size={26} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0' }}>No orders found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            {debouncedSearch ? `No orders matched search query "${debouncedSearch}".` : 'No transactions recorded for the selected filter.'}
          </p>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card"
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
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Digital Product</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date & Time</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => {
                  const isPaid = o.status === 'PAID'
                  const isPending = o.status === 'PENDING'
                  const isFailed = o.status === 'FAILED'
                  const customerInitial = (o.customer_name || o.customer_email || 'C').charAt(0).toUpperCase()

                  return (
                    <tr key={o.id}>
                      {/* Order Number & Copy */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Link
                            to={`/admin/orders/${o.id}`}
                            style={{
                              fontFamily: 'monospace',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: 'var(--text-primary)',
                              textDecoration: 'none',
                            }}
                          >
                            {o.order_number}
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleCopy(o.order_number, `order-${o.id}`)}
                            style={{
                              background: 'none',
                              border: 'none',
                              padding: 2,
                              color: copiedId === `order-${o.id}` ? '#1162F2' : 'var(--text-muted)',
                              cursor: 'pointer',
                            }}
                            title="Copy order number"
                          >
                            {copiedId === `order-${o.id}` ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                      </td>

                      {/* Customer Info with Avatar */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background: 'linear-gradient(135deg, rgba(17,98,242,0.15), rgba(124,58,237,0.15))',
                              color: '#1162F2',
                              fontWeight: 800,
                              fontSize: '0.8rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {customerInitial}
                          </div>
                          <div style={{ minWidth: 0, maxWidth: 200 }}>
                            <div className="text-truncate" style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                              {o.customer_name || 'Customer'}
                            </div>
                            <div className="text-truncate" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {o.customer_email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Product */}
                      <td style={{ maxWidth: 240 }}>
                        <div
                          className="text-truncate"
                          style={{
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            color: 'var(--text-primary)',
                          }}
                          title={o.product_title || `Product #${o.product_id}`}
                        >
                          {o.product_title || `Product #${o.product_id}`}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          ID: #{o.product_id}
                        </div>
                      </td>

                      {/* Amount with Payment Method Pill */}
                      <td>
                        <div style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--brand-amber)' }}>
                          {formatPrice(o.amount)}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                          <CreditCard size={10} /> Instant UPI
                        </div>
                      </td>

                      {/* Modern Status Badge */}
                      <td>
                        <span
                          className={`badge ${
                            isPaid
                              ? 'badge-success'
                              : isPending
                              ? 'badge-amber'
                              : 'badge-error'
                          }`}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          {isPaid ? (
                            <>
                              <CheckCircle size={12} /> Paid
                            </>
                          ) : isPending ? (
                            <>
                              <Clock size={12} /> Pending
                            </>
                          ) : (
                            <>
                              <XCircle size={12} /> Failed
                            </>
                          )}
                        </span>
                      </td>

                      {/* Date */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDate(o.created_at)}
                      </td>

                      {/* Action Link */}
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          to={`/admin/orders/${o.id}`}
                          style={{
                            padding: '6px 12px',
                            background: 'linear-gradient(135deg, rgba(17,98,242,0.12), rgba(124,58,237,0.12))',
                            border: '1px solid rgba(17,98,242,0.25)',
                            borderRadius: 6,
                            color: '#1162F2',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            textDecoration: 'none',
                          }}
                          title="View order details & download tokens"
                        >
                          Details <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '14px 20px',
                borderTop: '1px solid var(--bg-border)',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
              }}
            >
              <div>
                Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalOrders)} of {totalOrders} transactions
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <ChevronLeft size={14} /> Prev
                </button>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="btn-ghost"
                  style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  Next <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
