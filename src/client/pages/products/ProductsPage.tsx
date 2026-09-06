// src/client/pages/products/ProductsPage.tsx — Production Products Listing Page
import { useState, useEffect, useTransition, useMemo } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Search, X, SlidersHorizontal, ArrowUpDown, Sparkles,
  Package, RefreshCw, Layers, Check, ChevronDown, Download
} from 'lucide-react'
import { api, type Product, type Category } from '../../lib/api'
import ProductCard from '../../components/product/ProductCard'
import { useSiteConfig } from '../../lib/site-config'

const PAGE_SIZE = 12
const DEBOUNCE_MS = 350

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { siteName } = useSiteConfig()
  const [, startTransition] = useTransition()

  // Read URL parameters
  const queryParam = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || ''
  const sortParam = searchParams.get('sort') || 'newest'
  const featuredParam = searchParams.get('featured') === 'true'

  // Local state for debounced search input
  const [searchInput, setSearchInput] = useState(queryParam)
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [accumulatedProducts, setAccumulatedProducts] = useState<Product[]>([])

  // Debounce search input into URL parameter
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== queryParam) {
        setSearchParams((prev) => {
          const next = new URLSearchParams(prev)
          if (searchInput.trim()) {
            next.set('q', searchInput.trim())
          } else {
            next.delete('q')
          }
          return next
        })
        setPage(1)
      }
    }, DEBOUNCE_MS)

    return () => clearTimeout(timer)
  }, [searchInput, queryParam, setSearchParams])

  // Synchronize search input when URL changes (e.g. Back/Forward button)
  useEffect(() => {
    setSearchInput(queryParam)
  }, [queryParam])

  // Reset page when category, featured, or sort changes
  useEffect(() => {
    setPage(1)
  }, [categoryParam, featuredParam, sortParam, queryParam])

  // Fetch Categories for Filter Pills
  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.categories.list(),
  })

  // Fetch Products Query
  const {
    data: productsData,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['products-list', categoryParam, featuredParam, queryParam, sortParam, page],
    queryFn: () =>
      api.products.list({
        category: categoryParam || undefined,
        featured: featuredParam || undefined,
        q: queryParam || undefined,
        sort: sortParam,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      }),
  })

  // Handle accumulation for "Load More" pagination
  useEffect(() => {
    if (productsData?.products) {
      if (page === 1) {
        setAccumulatedProducts(productsData.products)
      } else {
        setAccumulatedProducts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id))
          const fresh = productsData.products.filter((p) => !existingIds.has(p.id))
          return [...prev, ...fresh]
        })
      }
    }
  }, [productsData, page])

  const totalCount = productsData?.total ?? 0
  const hasMore = accumulatedProducts.length < totalCount

  // Helper to update filter params
  const updateFilter = (updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([key, val]) => {
        if (val === null || val === '') {
          next.delete(key)
        } else {
          next.set(key, val)
        }
      })
      return next
    })
  }

  const resetAllFilters = () => {
    setSearchInput('')
    setSearchParams({})
  }

  // Active Category object for display
  const activeCategoryObj = useMemo(() => {
    if (!categoryParam || !categoriesData?.categories) return null
    return categoriesData.categories.find((c) => c.slug === categoryParam)
  }, [categoryParam, categoriesData])

  // Dynamic Page Title
  const pageHeading = activeCategoryObj
    ? activeCategoryObj.name
    : featuredParam
    ? 'Featured Digital Products'
    : queryParam
    ? `Search Results for "${queryParam}"`
    : 'All Digital Products'

  const hasActiveFilters = Boolean(queryParam || categoryParam || featuredParam || sortParam !== 'newest')

  return (
    <div className="section" style={{ paddingTop: '40px', minHeight: '80vh' }}>
      <div className="container">
        {/* ─── 1. Page Hero / Header ─── */}
        <div style={{ marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(124, 58, 237, 0.12)',
              color: 'var(--brand-purple-light)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            <Sparkles size={13} /> Complete Marketplace
          </div>

          <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '8px' }}>
            {pageHeading}
          </h1>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '600px', lineHeight: 1.6 }}>
            {activeCategoryObj?.description ||
              `Discover high-resolution wallpapers, photo packs, editable templates, reels & digital bundles with instant 1-click delivery.`}
          </p>
        </div>

        {/* ─── 2. Search & Filter Bar ─── */}
        <div
          style={{
            display: 'flex',
            gap: '12px',
            marginBottom: '20px',
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          {/* Search Input */}
          <div style={{ position: 'relative', flex: '1 1 280px' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              className="input-field"
              style={{
                paddingLeft: '44px',
                paddingRight: searchInput ? '40px' : '16px',
                height: '46px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9375rem',
              }}
              placeholder="Search wallpapers, templates, photo packs..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                aria-label="Clear search"
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div style={{ position: 'relative', minWidth: '180px' }}>
            <select
              className="input-field"
              style={{
                height: '46px',
                paddingLeft: '14px',
                paddingRight: '36px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.875rem',
                fontWeight: 600,
                appearance: 'none',
                cursor: 'pointer',
              }}
              value={sortParam}
              onChange={(e) => updateFilter({ sort: e.target.value })}
            >
              <option value="newest">🕒 Newest First</option>
              <option value="popular">🔥 Most Popular</option>
              <option value="price_asc">🏷️ Price: Low to High</option>
              <option value="price_desc">💎 Price: High to Low</option>
            </select>
            <ChevronDown
              size={16}
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
              }}
            />
          </div>

          {/* Mobile Filter Toggle */}
          <button
            type="button"
            onClick={() => setMobileFilterOpen(true)}
            className="btn-ghost hide-desktop"
            style={{
              height: '46px',
              padding: '0 16px',
              fontSize: '0.875rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <SlidersHorizontal size={16} /> Filters
            {hasActiveFilters && (
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--brand-purple)',
                }}
              />
            )}
          </button>
        </div>

        {/* ─── 3. Category Filter Pills (Desktop & Tablet) ─── */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            alignItems: 'center',
            marginBottom: '28px',
          }}
        >
          {/* All Products Pill */}
          <button
            type="button"
            onClick={() => updateFilter({ category: null, featured: null })}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: '1px solid',
              background: !categoryParam && !featuredParam ? 'var(--brand-purple)' : 'var(--bg-elevated)',
              borderColor: !categoryParam && !featuredParam ? 'var(--brand-purple)' : 'var(--bg-border)',
              color: !categoryParam && !featuredParam ? '#FFFFFF' : 'var(--text-secondary)',
            }}
          >
            All Products
          </button>

          {/* Featured Pill */}
          <button
            type="button"
            onClick={() => updateFilter({ featured: featuredParam ? null : 'true' })}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              border: '1px solid',
              background: featuredParam ? 'var(--brand-purple)' : 'var(--bg-elevated)',
              borderColor: featuredParam ? 'var(--brand-purple)' : 'var(--bg-border)',
              color: featuredParam ? '#FFFFFF' : 'var(--text-secondary)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Sparkles size={12} /> Featured
          </button>

          {/* Dynamic Categories */}
          {categoriesData?.categories?.map((cat: Category) => {
            const isActive = categoryParam === cat.slug
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateFilter({ category: isActive ? null : cat.slug, featured: null })}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: '1px solid',
                  background: isActive ? 'var(--brand-purple)' : 'var(--bg-elevated)',
                  borderColor: isActive ? 'var(--brand-purple)' : 'var(--bg-border)',
                  color: isActive ? '#FFFFFF' : 'var(--text-secondary)',
                }}
              >
                {cat.name}
              </button>
            )
          })}

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={resetAllFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--error)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '6px 12px',
                marginLeft: 'auto',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={14} /> Clear Filters
            </button>
          )}
        </div>

        {/* ─── 4. Results Info Header ─── */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '20px',
            fontSize: '0.875rem',
            color: 'var(--text-muted)',
          }}
        >
          <div>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{accumulatedProducts.length}</strong> of{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{totalCount}</strong> digital assets
          </div>

          {isFetching && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}>
              <RefreshCw size={13} className="spin" /> Updating...
            </div>
          )}
        </div>

        {/* ─── 5. Product Grid / Skeletons / States ─── */}
        {isLoading && page === 1 ? (
          <div className="products-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                style={{
                  height: '320px',
                  borderRadius: 'var(--radius-xl)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  overflow: 'hidden',
                }}
              />
            ))}
          </div>
        ) : isError ? (
          <div
            className="glass-card"
            style={{
              padding: '60px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '520px',
              margin: '40px auto',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--error)',
                margin: '0 auto 16px',
              }}
            >
              <RefreshCw size={26} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Unable to Load Products
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              We encountered a temporary network issue. Please click below to try again.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.875rem' }}
            >
              <RefreshCw size={16} /> Try Again
            </button>
          </div>
        ) : accumulatedProducts.length > 0 ? (
          <>
            <div className="products-grid">
              {accumulatedProducts.map((p: Product) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {/* Load More Button */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '48px' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="btn-ghost"
                  style={{
                    padding: '14px 32px',
                    fontSize: '0.9375rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-full)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Loading more...
                    </>
                  ) : (
                    <>
                      <Download size={16} /> Load More Products ({totalCount - accumulatedProducts.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        ) : (
          <div
            className="glass-card"
            style={{
              padding: '64px 24px',
              textAlign: 'center',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '500px',
              margin: '40px auto',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '16px',
                background: 'rgba(124, 58, 237, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--brand-purple-light)',
                margin: '0 auto 16px',
              }}
            >
              <Package size={32} />
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              No Products Found
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              {queryParam
                ? `No products matched "${queryParam}". Try checking your spelling or using broader search terms.`
                : `There are no products in this category yet.`}
            </p>
            <button
              type="button"
              onClick={resetAllFilters}
              className="btn-primary"
              style={{ padding: '12px 24px', fontSize: '0.875rem' }}
            >
              Reset Filters & Show All
            </button>
          </div>
        )}
      </div>

      {/* ─── 6. Mobile Filter Drawer / Bottom Sheet ─── */}
      {mobileFilterOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setMobileFilterOpen(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              borderTop: '1px solid var(--bg-border)',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '24px 20px',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Filter Products</h3>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Category selection */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
                CATEGORY
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    updateFilter({ category: null, featured: null })
                    setMobileFilterOpen(false)
                  }}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    border: '1px solid var(--bg-border)',
                    background: !categoryParam ? 'var(--brand-purple)' : 'var(--bg-elevated)',
                    color: !categoryParam ? '#FFFFFF' : 'var(--text-primary)',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>All Products</span>
                  {!categoryParam && <Check size={16} />}
                </button>

                {categoriesData?.categories?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      updateFilter({ category: c.slug, featured: null })
                      setMobileFilterOpen(false)
                    }}
                    style={{
                      padding: '12px 16px',
                      borderRadius: '8px',
                      textAlign: 'left',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      border: '1px solid var(--bg-border)',
                      background: categoryParam === c.slug ? 'var(--brand-purple)' : 'var(--bg-elevated)',
                      color: categoryParam === c.slug ? '#FFFFFF' : 'var(--text-primary)',
                      display: 'flex',
                      justifyContent: 'space-between',
                    }}
                  >
                    <span>{c.name}</span>
                    {categoryParam === c.slug && <Check size={16} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <button
                type="button"
                onClick={() => {
                  resetAllFilters()
                  setMobileFilterOpen(false)
                }}
                className="btn-ghost"
                style={{ padding: '12px', fontSize: '0.875rem' }}
              >
                Reset All
              </button>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                className="btn-primary"
                style={{ padding: '12px', fontSize: '0.875rem' }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
