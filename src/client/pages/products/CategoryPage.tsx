// src/client/pages/products/CategoryPage.tsx — Production Visual Categories & Products Page
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ShoppingBag,
  Camera,
  Monitor,
  Layers,
  Flame,
  Sparkles,
  ArrowRight,
  Package,
  Check,
  ChevronRight,
} from 'lucide-react'
import { api, type Product } from '../../lib/api'
import ProductCard from '../../components/product/ProductCard'
import { SHOWCASE_CATEGORIES, type ShowcaseCategory } from '../../data/showcase-data'
import { useSiteConfig } from '../../lib/site-config'

export default function CategoryPage() {
  const { slug } = useParams<{ slug?: string }>()
  const navigate = useNavigate()
  const { siteName } = useSiteConfig()

  // Active category slug (if any)
  const activeSlug = slug?.toLowerCase()

  // Find active category metadata if matched in showcase or database
  const activeCategory = SHOWCASE_CATEGORIES.find((c) => c.slug.toLowerCase() === activeSlug)

  // Fetch products for the category (or all if on /categories)
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['category-products', activeSlug],
    queryFn: () => api.products.list({ category: activeSlug, limit: 24 }),
  })

  const products: Product[] = productsData?.products || []
  const totalCount = productsData?.total ?? products.length

  const getCategoryIcon = (slugOrIcon: string) => {
    const s = (slugOrIcon || '').toLowerCase()
    if (s.includes('viral') || s.includes('bag')) return <ShoppingBag size={22} color="white" />
    if (s.includes('photo') || s.includes('camera')) return <Camera size={22} color="white" />
    if (s.includes('wallpaper') || s.includes('monitor')) return <Monitor size={22} color="white" />
    if (s.includes('creative') || s.includes('layer') || s.includes('pack')) return <Layers size={22} color="white" />
    return <Flame size={22} color="white" />
  }

  return (
    <div style={{ minHeight: '90vh', background: 'var(--bg-base)', padding: '32px 0 80px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Breadcrumb Navigation */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            marginBottom: '24px',
          }}
        >
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            Home
          </Link>
          <ChevronRight size={14} />
          <Link
            to="/categories"
            style={{
              color: !activeSlug ? 'var(--brand-purple)' : 'inherit',
              textDecoration: 'none',
              fontWeight: !activeSlug ? 700 : 500,
            }}
          >
            Categories
          </Link>
          {activeCategory && (
            <>
              <ChevronRight size={14} />
              <span style={{ color: 'var(--brand-purple)', fontWeight: 700 }}>
                {activeCategory.name}
              </span>
            </>
          )}
        </div>

        {/* Header Title Section */}
        <div style={{ marginBottom: '32px' }}>
          <span
            className="badge badge-purple"
            style={{
              marginBottom: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Sparkles size={12} /> Digital Asset Collections
          </span>
          <h1
            style={{
              fontFamily: 'Manrope, Inter, sans-serif',
              fontSize: 'clamp(1.8rem, 4vw, 2.4rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: '8px',
            }}
          >
            {activeCategory ? activeCategory.name : 'Browse All Categories'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '680px' }}>
            {activeCategory
              ? `Explore curated digital downloads, ultra-HD packs, and creative assets in ${activeCategory.name}.`
              : 'Choose a collection below to discover viral images, wallpapers, photos, and digital design resources.'}
          </p>
        </div>

        {/* ─── 5 Visual Category Cards (Exact Same as Homepage) ─── */}
        <div style={{ marginBottom: '48px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '16px',
            }}
          >
            <h3
              style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
              }}
            >
              Select a Category:
            </h3>

            {activeSlug && (
              <Link
                to="/categories"
                className="btn-ghost"
                style={{ fontSize: '0.825rem', padding: '6px 14px' }}
              >
                View All Categories
              </Link>
            )}
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '16px',
            }}
          >
            {SHOWCASE_CATEGORIES.map((cat: ShowcaseCategory) => {
              const isSelected = activeSlug === cat.slug.toLowerCase()

              return (
                <Link
                  key={cat.id}
                  to={`/category/${cat.slug}`}
                  style={{
                    textDecoration: 'none',
                    borderRadius: '18px',
                    overflow: 'hidden',
                    position: 'relative',
                    aspectRatio: '1.2 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: isSelected
                      ? '2px solid var(--brand-purple)'
                      : '1px solid var(--bg-border)',
                    boxShadow: isSelected
                      ? '0 0 0 3px rgba(124, 58, 237, 0.35), 0 10px 24px rgba(0,0,0,0.15)'
                      : '0 4px 14px rgba(0,0,0,0.06)',
                    transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease, border-color 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(-3px)'
                      e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)'
                    }
                    const img = e.currentTarget.querySelector('img')
                    if (img) img.style.transform = 'scale(1.06)'
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.transform = 'translateY(0)'
                      e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'
                    }
                    const img = e.currentTarget.querySelector('img')
                    if (img) img.style.transform = 'scale(1)'
                  }}
                >
                  {/* Category Image Background */}
                  <img
                    src={cat.image}
                    alt={cat.name}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      transition: 'transform 0.4s ease',
                    }}
                    loading="lazy"
                  />

                  {/* Dark Vignette Gradient Overlay */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: isSelected
                        ? 'linear-gradient(to top, rgba(109, 40, 217, 0.88) 0%, rgba(15, 15, 26, 0.5) 60%, rgba(15, 15, 26, 0.3) 100%)'
                        : 'linear-gradient(to top, rgba(10, 10, 15, 0.85) 0%, rgba(10, 10, 15, 0.4) 60%, rgba(10, 10, 15, 0.15) 100%)',
                      transition: 'background 0.25s ease',
                    }}
                  />

                  {/* Selected Active Badge */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'var(--brand-purple)',
                        color: 'white',
                        padding: '3px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      }}
                    >
                      <Check size={11} strokeWidth={3} /> Selected
                    </div>
                  )}

                  {/* Icon & Label */}
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '16px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '50%',
                        background: isSelected
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.15)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255, 255, 255, 0.25)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {getCategoryIcon(cat.icon || cat.slug)}
                    </div>

                    <span
                      style={{
                        color: '#FFFFFF',
                        fontFamily: 'Manrope, Inter, sans-serif',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {cat.name}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>

        {/* ─── Products in Selected Category ─── */}
        <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '36px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '24px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h2
                style={{
                  fontSize: 'clamp(1.25rem, 2.5vw, 1.6rem)',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '4px',
                }}
              >
                {activeCategory ? `Products in ${activeCategory.name}` : 'All Products'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                {totalCount} {totalCount === 1 ? 'item' : 'items'} available
              </p>
            </div>

            <Link
              to="/products"
              className="btn-ghost"
              style={{ fontSize: '0.85rem' }}
            >
              Explore All Digital Products <ArrowRight size={14} />
            </Link>
          </div>

          {/* Loading Skeletons */}
          {isProductsLoading ? (
            <div className="products-grid">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="product-card"
                  style={{
                    height: 320,
                    opacity: 0.5,
                    animation: 'pulse 1.5s infinite ease-in-out',
                    background: 'var(--bg-elevated)',
                  }}
                />
              ))}
            </div>
          ) : products.length > 0 ? (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            /* Empty State */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--bg-border)',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: 'rgba(124, 58, 237, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: 'var(--brand-purple)',
                }}
              >
                <Package size={30} />
              </div>
              <h3
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                No Products in {activeCategory?.name || 'this category'} Yet
              </h3>
              <p
                style={{
                  color: 'var(--text-secondary)',
                  fontSize: '0.9rem',
                  marginBottom: '24px',
                  lineHeight: 1.6,
                }}
              >
                We are actively creating and adding new digital assets to this category. In the meantime, check out our popular wallpapers or browse the full store!
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <Link to="/category/wallpapers" className="btn-primary" style={{ fontSize: '0.875rem' }}>
                  Browse Wallpapers (2)
                </Link>
                <Link to="/products" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
                  View All Products
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
