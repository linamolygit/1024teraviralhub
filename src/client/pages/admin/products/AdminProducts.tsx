// src/client/pages/admin/products/AdminProducts.tsx — Modern 2026 SaaS Admin Product Catalog
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Edit, Trash2, Eye, EyeOff, Search,
  ExternalLink, Package, Filter, ArrowRight, RefreshCw,
  LayoutGrid, List, TrendingUp, CheckCircle2, Copy,
  Check, Sparkles, Flame, X, DollarSign, Layers, Tag, Star
} from 'lucide-react'
import { adminApi, type Product } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate } from '../../../lib/utils'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminProducts() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'bestsellers'>('all')
  const [sortBy, setSortBy] = useState<string>('newest')
  const [deleteId, setDeleteId] = useState<number | null>(null)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  // Persistent Grid vs Table view preference (defaults to modern Grid)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>(() => {
    try {
      return (localStorage.getItem('tvh_admin_product_view') as 'grid' | 'table') || 'grid'
    } catch {
      return 'grid'
    }
  })

  const handleSetViewMode = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    try {
      localStorage.setItem('tvh_admin_product_view', mode)
    } catch {}
  }

  // 350ms search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim())
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-products', debouncedSearch],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.products.list(token!, { search: debouncedSearch || undefined })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.products.delete(token!, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
      setDeleteId(null)
      adminToast.success('Product Deleted', 'Product has been permanently removed.')
    },
    onError: (err: any) => {
      adminToast.error('Delete Failed', err?.message || 'Could not delete product.')
    },
  })

  const togglePublish = useMutation({
    mutationFn: async ({ id, published }: { id: number; published: boolean }) => {
      const token = await getToken()
      return adminApi.products.update(token!, id, { is_published: published })
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })
      adminToast.success(
        vars.published ? 'Product Published' : 'Moved to Drafts',
        vars.published ? 'Product is now live on the storefront.' : 'Product is now hidden from visitors.'
      )
    },
    onError: (err: any) => {
      adminToast.error('Update Failed', err?.message || 'Could not update status.')
    },
  })

  const handleCopyLink = (p: Product) => {
    const url = `${window.location.origin}/product/${p.slug}`
    navigator.clipboard.writeText(url)
    setCopiedId(p.id)
    adminToast.info('Direct Link Copied', `/product/${p.slug}`)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // All raw products from backend
  const allProducts: Product[] = data?.products || []

  // Calculate live KPI metrics across entire catalog
  const kpis = useMemo(() => {
    const total = allProducts.length
    const published = allProducts.filter((p) => p.is_published === 1 || p.is_published === true).length
    const drafts = total - published
    const totalSales = allProducts.reduce((sum, p) => sum + (p.total_sales || 0), 0)
    const catalogValue = allProducts.reduce((sum, p) => sum + (p.sale_price ?? p.price ?? 0), 0)
    return { total, published, drafts, totalSales, catalogValue }
  }, [allProducts])

  // Filter & Sort
  const filteredProducts = useMemo(() => {
    return allProducts
      .filter((p) => {
        const isPub = p.is_published === 1 || p.is_published === true
        if (statusFilter === 'published') return isPub
        if (statusFilter === 'draft') return !isPub
        if (statusFilter === 'bestsellers') return (p.total_sales || 0) > 0
        return true
      })
      .sort((a, b) => {
        if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (sortBy === 'price_asc') return (a.sale_price ?? a.price) - (b.sale_price ?? b.price)
        if (sortBy === 'price_desc') return (b.sale_price ?? b.price) - (a.sale_price ?? a.price)
        if (sortBy === 'sales') return (b.total_sales ?? 0) - (a.total_sales ?? 0)
        return 0
      })
  }, [allProducts, statusFilter, sortBy])

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* ── Header: Modern Title & Quick Actions ── */}
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
              <Package size={20} />
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
              Product Catalog
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Master digital product repository, instant publishing controls, deliverable files, and SEO metadata.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{
              fontSize: '0.8125rem',
              padding: '9px 14px',
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
            {isFetching ? 'Syncing...' : 'Sync Catalog'}
          </button>

          {/* Add Product Button with Electric Gradient */}
          <Link
            to="/admin/products/new"
            className="glow-gradient-pill"
            style={{
              fontSize: '0.875rem',
              padding: '10px 20px',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#FFFFFF',
              fontWeight: 800,
              borderRadius: 10,
            }}
          >
            <Plus size={18} /> Add Digital Product
          </Link>
        </div>
      </div>

      {/* ── 1. KPI Metric Bar Ribbon ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        {/* Total Products */}
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
              Total Products
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(17,98,242,0.1)', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Package size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {kpis.total}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            In digital asset inventory
          </div>
        </div>

        {/* Live Published */}
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
              Live & Purchasable
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #1162F2, #7C3AED)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle2 size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#1162F2', letterSpacing: '-0.02em' }}>
            {kpis.published}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Instant 1-Click checkout enabled
          </div>
        </div>

        {/* Drafts */}
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
              Drafts / Hidden
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(217,119,6,0.12)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EyeOff size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: '#D97706', letterSpacing: '-0.02em' }}>
            {kpis.drafts}
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Unpublished / In development
          </div>
        </div>

        {/* Total Units Sold */}
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
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-amber)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Total Sales Volume
            </span>
            <span style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,210,0,0.15)', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={15} />
            </span>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            {kpis.totalSales} <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>downloads</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Across all verified customer orders
          </div>
        </div>
      </div>

      {/* ── 2. Filter Bar, Search & View Switcher ── */}
      <div
        className="glass-card"
        style={{
          padding: '14px 18px',
          borderRadius: 14,
          border: '1px solid var(--bg-border)',
          marginBottom: 22,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: Search with clear */}
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
            style={{ paddingLeft: 42, paddingRight: searchInput ? 36 : 14, borderRadius: 10, height: 40 }}
            placeholder="Search by product title, slug, or tags..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          {searchInput && (
            <button
              onClick={() => setSearchInput('')}
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: 2,
              }}
              title="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Center: Filter Pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${kpis.total})` },
            { id: 'published', label: `Published (${kpis.published})` },
            { id: 'draft', label: `Drafts (${kpis.drafts})` },
            { id: 'bestsellers', label: '🔥 Best Sellers' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
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

        {/* Right: Sort & Dual View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <select
            className="input-field"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              fontSize: '0.8125rem',
              padding: '8px 12px',
              height: 40,
              width: 'auto',
              borderRadius: 8,
              background: 'var(--bg-elevated)',
              fontWeight: 600,
            }}
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="sales">Sort: Best Selling</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          {/* Grid vs Table View Mode Switcher */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              padding: 3,
              borderRadius: 10,
              border: '1px solid var(--bg-border)',
            }}
          >
            <button
              type="button"
              onClick={() => handleSetViewMode('grid')}
              style={{
                border: 'none',
                background: viewMode === 'grid' ? '#1162F2' : 'transparent',
                color: viewMode === 'grid' ? '#FFFFFF' : 'var(--text-muted)',
                borderRadius: 8,
                padding: '7px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.78rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              title="Modern Card Grid View"
            >
              <LayoutGrid size={15} />
              <span className="hide-mobile">Grid</span>
            </button>

            <button
              type="button"
              onClick={() => handleSetViewMode('table')}
              style={{
                border: 'none',
                background: viewMode === 'table' ? '#1162F2' : 'transparent',
                color: viewMode === 'table' ? '#FFFFFF' : 'var(--text-muted)',
                borderRadius: 8,
                padding: '7px 10px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.78rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              title="Compact Table View"
            >
              <List size={15} />
              <span className="hide-mobile">Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Content: Card Grid View OR Table View ── */}
      {isLoading ? (
        <div style={{ padding: '80px 0', textAlign: 'center' }}>
          <LoadingSpinner />
        </div>
      ) : filteredProducts.length === 0 ? (
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
            <Package size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 6px 0' }}>No products found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', maxWidth: 400, margin: '0 auto 20px auto' }}>
            {debouncedSearch
              ? `No products match "${debouncedSearch}". Try a different search query.`
              : 'You have no products under this status filter.'}
          </p>
          <Link to="/admin/products/new" className="glow-gradient-pill btn-primary" style={{ padding: '10px 20px', textDecoration: 'none' }}>
            <Plus size={16} /> Create First Product
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Modern Card Grid View ── */
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.04 },
            },
          }}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: 18,
          }}
        >
          {filteredProducts.map((p) => {
            const isPublished = p.is_published === 1 || p.is_published === true
            const hasDiscount = p.sale_price && p.sale_price < p.price
            const discountPct = hasDiscount ? Math.round(((p.price - p.sale_price!) / p.price) * 100) : 0
            const thumbUrl = p.thumbnail_url
              ? (p.thumbnail_url.startsWith('http') || p.thumbnail_url.startsWith('/')
                  ? p.thumbnail_url
                  : `/api/images/${encodeURIComponent(p.thumbnail_url)}`)
              : ''

            return (
              <motion.div
                key={p.id}
                variants={{
                  hidden: { opacity: 0, y: 12 },
                  visible: { opacity: 1, y: 0 },
                }}
                className="glass-card admin-card-interactive"
                style={{
                  borderRadius: 14,
                  border: '1px solid var(--bg-border)',
                  background: 'var(--bg-surface)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                }}
              >
                {/* Product Cover Thumbnail Preview */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/9',
                    background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                    overflow: 'hidden',
                  }}
                >
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={p.title}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        transition: 'transform 0.3s ease',
                      }}
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none'
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        color: 'rgba(255,255,255,0.4)',
                      }}
                    >
                      <Layers size={32} />
                      <span style={{ fontSize: '0.72rem', fontWeight: 600 }}>Digital Product Asset</span>
                    </div>
                  )}

                  {/* Top Badges overlay: Status & Discount */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 10,
                      left: 10,
                      right: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      zIndex: 2,
                    }}
                  >
                    {/* Live Published vs Draft Pill */}
                    <span
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: 999,
                        background: isPublished
                          ? 'linear-gradient(135deg, rgba(17,98,242,0.92), rgba(124,58,237,0.92))'
                          : 'rgba(15, 23, 42, 0.85)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(6px)',
                        boxShadow: isPublished ? '0 2px 10px rgba(17,98,242,0.4)' : 'none',
                        border: isPublished ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(255,160,0,0.4)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      {isPublished ? '● Live' : '○ Draft'}
                    </span>

                    {/* Discount Pill if on sale */}
                    {hasDiscount && (
                      <span
                        style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #1162F2, #7C3AED)',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 8px rgba(17,98,242,0.35)',
                        }}
                      >
                        {discountPct}% OFF
                      </span>
                    )}
                  </div>

                  {/* File Type Pill on bottom right */}
                  {p.file_type && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '2px 7px',
                        borderRadius: 6,
                        background: 'rgba(0,0,0,0.65)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(4px)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        zIndex: 2,
                      }}
                    >
                      {p.file_type}
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {/* Category & Sales Count Pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                      }}
                    >
                      {p.category_name || 'General Asset'}
                    </span>

                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        color: (p.total_sales || 0) > 0 ? '#1162F2' : 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                      }}
                    >
                      {(p.total_sales || 0) > 0 ? (
                        <>
                          <Flame size={12} color="#1162F2" /> {p.total_sales} sold
                        </>
                      ) : (
                        '0 sold'
                      )}
                    </span>
                  </div>

                  {/* Rating & Reviews */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 3,
                        background: 'rgba(245, 158, 11, 0.12)',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                        padding: '2px 7px',
                        borderRadius: 6,
                      }}
                    >
                      <Star size={12} fill="#F59E0B" color="#F59E0B" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D97706' }}>
                        {p.average_rating ? Number(p.average_rating).toFixed(1) : '4.8'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                      ({p.reviews_count || 20} reviews)
                    </span>
                  </div>

                  {/* Title with hover marquee support */}
                  <Link
                    to={`/admin/products/${p.id}`}
                    className="text-truncate"
                    style={{
                      fontWeight: 800,
                      fontSize: '0.98rem',
                      color: 'var(--text-primary)',
                      textDecoration: 'none',
                      lineHeight: 1.35,
                      marginBottom: 6,
                      display: 'block',
                    }}
                    title={p.title}
                  >
                    {p.title}
                  </Link>

                  {/* Pricing Display */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                    <span
                      style={{
                        fontSize: '1.2rem',
                        fontWeight: 900,
                        color: 'var(--brand-amber)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {formatPrice(p.sale_price ?? p.price)}
                    </span>
                    {hasDiscount && (
                      <span
                        style={{
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          textDecoration: 'line-through',
                          fontWeight: 500,
                        }}
                      >
                        {formatPrice(p.price)}
                      </span>
                    )}
                  </div>

                  {/* Bottom Action Section with uniform 34px buttons */}
                  <div
                    style={{
                      marginTop: 'auto',
                      paddingTop: 12,
                      borderTop: '1px solid var(--bg-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    {/* Quick Publish Toggle Switch */}
                    <button
                      type="button"
                      onClick={() => togglePublish.mutate({ id: p.id, published: !isPublished })}
                      disabled={togglePublish.isPending}
                      style={{
                        height: 34,
                        padding: '0 10px',
                        borderRadius: 8,
                        background: isPublished ? 'rgba(17, 98, 242, 0.08)' : 'var(--bg-elevated)',
                        border: isPublished ? '1px solid rgba(17, 98, 242, 0.28)' : '1px solid var(--bg-border)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        cursor: 'pointer',
                        boxSizing: 'border-box',
                        transition: 'all 0.15s ease',
                      }}
                      title={isPublished ? 'Click to Unpublish (Make Draft)' : 'Click to Live Publish'}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 16,
                          borderRadius: 999,
                          background: isPublished
                            ? 'linear-gradient(135deg, #1162F2, #7C3AED)'
                            : 'var(--bg-border)',
                          position: 'relative',
                          transition: 'background 0.2s ease',
                        }}
                      >
                        <div
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            position: 'absolute',
                            top: 2,
                            left: isPublished ? 14 : 2,
                            transition: 'left 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
                          }}
                        />
                      </div>
                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 700,
                          color: isPublished ? '#1162F2' : 'var(--text-muted)',
                          lineHeight: 1,
                        }}
                      >
                        {isPublished ? 'Live' : 'Draft'}
                      </span>
                    </button>

                    {/* Quick Action Buttons (strictly identical 34x34px buttons) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      {/* Copy Shareable Link */}
                      <button
                        type="button"
                        onClick={() => handleCopyLink(p)}
                        style={{
                          width: 34,
                          height: 34,
                          minWidth: 34,
                          minHeight: 34,
                          padding: 0,
                          borderRadius: 8,
                          background: copiedId === p.id ? 'rgba(17, 98, 242, 0.12)' : 'var(--bg-elevated)',
                          border: copiedId === p.id ? '1px solid #1162F2' : '1px solid var(--bg-border)',
                          color: copiedId === p.id ? '#1162F2' : 'var(--text-muted)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                        title="Copy direct product link"
                      >
                        {copiedId === p.id ? <Check size={15} /> : <Copy size={15} />}
                      </button>

                      {/* Preview Public Page */}
                      <Link
                        to={`/product/${p.slug}`}
                        target="_blank"
                        style={{
                          width: 34,
                          height: 34,
                          minWidth: 34,
                          minHeight: 34,
                          padding: 0,
                          borderRadius: 8,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--bg-border)',
                          color: 'var(--text-muted)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                        title="View product on public store"
                      >
                        <ExternalLink size={15} />
                      </Link>

                      {/* Edit Product */}
                      <Link
                        to={`/admin/products/${p.id}/edit`}
                        style={{
                          width: 34,
                          height: 34,
                          minWidth: 34,
                          minHeight: 34,
                          padding: 0,
                          borderRadius: 8,
                          background: 'rgba(17, 98, 242, 0.08)',
                          border: '1px solid rgba(17, 98, 242, 0.25)',
                          color: '#1162F2',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          textDecoration: 'none',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                        title="Edit product details & pricing"
                      >
                        <Edit size={15} />
                      </Link>

                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => setDeleteId(p.id)}
                        style={{
                          width: 34,
                          height: 34,
                          minWidth: 34,
                          minHeight: 34,
                          padding: 0,
                          borderRadius: 8,
                          background: 'var(--bg-elevated)',
                          border: '1px solid var(--bg-border)',
                          color: '#EF4444',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxSizing: 'border-box',
                          transition: 'all 0.15s ease',
                        }}
                        title="Delete product"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </motion.div>
      ) : (
        /* ── Compact Table View ── */
        <div
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
                  <th style={{ width: 60 }}>Asset</th>
                  <th>Product Details</th>
                  <th>Price</th>
                  <th>Total Sales</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isPublished = p.is_published === 1 || p.is_published === true
                  const thumbUrl = p.thumbnail_url
                    ? (p.thumbnail_url.startsWith('http') || p.thumbnail_url.startsWith('/')
                        ? p.thumbnail_url
                        : `/api/images/${encodeURIComponent(p.thumbnail_url)}`)
                    : ''

                  return (
                    <tr key={p.id}>
                      {/* Asset Avatar */}
                      <td>
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 8,
                            overflow: 'hidden',
                            background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
                            border: '1px solid var(--bg-border)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {thumbUrl ? (
                            <img src={thumbUrl} alt={p.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Layers size={18} color="rgba(255,255,255,0.4)" />
                          )}
                        </div>
                      </td>

                      {/* Product Title & Link */}
                      <td style={{ maxWidth: 300 }}>
                        <Link
                          to={`/admin/products/${p.id}`}
                          className="text-truncate"
                          style={{
                            fontWeight: 700,
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                            textDecoration: 'none',
                            display: 'block',
                          }}
                          title={p.title}
                        >
                          {p.title}
                        </Link>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {p.category_name || 'General Asset'}
                          </span>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>•</span>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            <Star size={11} fill="#F59E0B" color="#F59E0B" />
                            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#D97706' }}>
                              {p.average_rating ? Number(p.average_rating).toFixed(1) : '4.8'}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              ({p.reviews_count || 20})
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Pricing */}
                      <td style={{ fontWeight: 800, color: 'var(--brand-amber)', whiteSpace: 'nowrap' }}>
                        {formatPrice(p.sale_price ?? p.price)}
                        {p.sale_price && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatPrice(p.price)}
                          </div>
                        )}
                      </td>

                      {/* Sales Count */}
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.8125rem',
                            color: (p.total_sales || 0) > 0 ? '#1162F2' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          {(p.total_sales || 0) > 0 && <Flame size={13} />} {p.total_sales || 0}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td>
                        <button
                          type="button"
                          onClick={() => togglePublish.mutate({ id: p.id, published: !isPublished })}
                          style={{
                            background: 'none',
                            border: 'none',
                            padding: 0,
                            cursor: 'pointer',
                          }}
                          title="Click to toggle status"
                        >
                          <span className={`badge ${isPublished ? 'badge-success' : 'badge-amber'}`}>
                            {isPublished ? '● Live' : '○ Draft'}
                          </span>
                        </button>
                      </td>

                      {/* Date */}
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                        {formatDate(p.created_at)}
                      </td>

                      {/* Actions with strictly uniform 32x32px buttons */}
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => handleCopyLink(p)}
                            style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              minHeight: 32,
                              padding: 0,
                              background: copiedId === p.id ? 'rgba(17, 98, 242, 0.12)' : 'var(--bg-elevated)',
                              border: copiedId === p.id ? '1px solid #1162F2' : '1px solid var(--bg-border)',
                              borderRadius: 7,
                              color: copiedId === p.id ? '#1162F2' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxSizing: 'border-box',
                            }}
                            title="Copy link"
                          >
                            {copiedId === p.id ? <Check size={14} /> : <Copy size={14} />}
                          </button>

                          <Link
                            to={`/product/${p.slug}`}
                            target="_blank"
                            style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              minHeight: 32,
                              padding: 0,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--bg-border)',
                              borderRadius: 7,
                              color: 'var(--text-muted)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              boxSizing: 'border-box',
                            }}
                            title="Preview on live store"
                          >
                            <ExternalLink size={14} />
                          </Link>

                          <Link
                            to={`/admin/products/${p.id}/edit`}
                            style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              minHeight: 32,
                              padding: 0,
                              background: 'rgba(17, 98, 242, 0.08)',
                              border: '1px solid rgba(17, 98, 242, 0.25)',
                              borderRadius: 7,
                              color: '#1162F2',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              textDecoration: 'none',
                              boxSizing: 'border-box',
                            }}
                            title="Edit product"
                          >
                            <Edit size={14} />
                          </Link>

                          <button
                            type="button"
                            onClick={() => setDeleteId(p.id)}
                            style={{
                              width: 32,
                              height: 32,
                              minWidth: 32,
                              minHeight: 32,
                              padding: 0,
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--bg-border)',
                              borderRadius: 7,
                              color: '#EF4444',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxSizing: 'border-box',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={14} />
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
      )}

      {/* ── Delete Confirmation Dialog ── */}
      <AnimatePresence>
        {deleteId && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.65)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card"
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: 16,
                padding: '24px',
                maxWidth: 420,
                width: '100%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 14,
                }}
              >
                <Trash2 size={22} />
              </div>

              <h3 style={{ margin: '0 0 8px 0', fontSize: '1.2rem', fontWeight: 800 }}>Delete Product?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.5, margin: '0 0 20px 0' }}>
                Are you sure you want to permanently delete this product? All deliverable access files and gallery assets will be detached.
              </p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setDeleteId(null)}
                  className="btn-ghost"
                  style={{ fontSize: '0.875rem', padding: '9px 16px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deleteId)}
                  disabled={deleteMutation.isPending}
                  className="btn-primary"
                  style={{
                    fontSize: '0.875rem',
                    padding: '9px 18px',
                    background: '#EF4444',
                    borderColor: '#EF4444',
                  }}
                >
                  {deleteMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
