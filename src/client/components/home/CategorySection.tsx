// src/client/components/home/CategorySection.tsx — Pixel-Accurate Browse Categories Section
import { Link } from 'react-router-dom'
import { ArrowRight, ShoppingBag, Camera, Monitor, Layers, Flame } from 'lucide-react'
import { SHOWCASE_CATEGORIES } from '../../data/showcase-data'
import OptimizedImage from '../ui/OptimizedImage'

interface Props {
  categories?: any[]
  isLoading?: boolean
}

export default function CategorySection({ categories, isLoading }: Props) {
  const getCategoryIcon = (slugOrIcon: string) => {
    const s = (slugOrIcon || '').toLowerCase()
    if (s.includes('viral') || s.includes('bag')) return <ShoppingBag size={22} color="white" />
    if (s.includes('photo') || s.includes('camera')) return <Camera size={22} color="white" />
    if (s.includes('wallpaper') || s.includes('monitor')) return <Monitor size={22} color="white" />
    if (s.includes('creative') || s.includes('layer') || s.includes('pack')) return <Layers size={22} color="white" />
    return <Flame size={22} color="white" />
  }

  return (
    <section id="categories" style={{ padding: '32px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <h2
            style={{
              fontFamily: 'Manrope, Inter, sans-serif',
              fontSize: 'clamp(1.65rem, 3.5vw, 2.15rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            Browse Categories
          </h2>

          <Link
            to="/products"
            className="btn-ghost"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface)',
            }}
          >
            <span>Explore All Categories</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 5 Category Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '16px',
          }}
        >
          {SHOWCASE_CATEGORIES.map((cat) => (
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
                boxShadow: '0 4px 14px rgba(0,0,0,0.06)',
                border: '1px solid var(--bg-border)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.12)'
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0,0,0,0.06)'
                const img = e.currentTarget.querySelector('img')
                if (img) img.style.transform = 'scale(1)'
              }}
            >
              {/* Background Image */}
              <OptimizedImage
                src={cat.image}
                alt={cat.name}
                variant="thumbnail"
                containerStyle={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                }}
                style={{
                  transition: 'transform 0.35s ease',
                }}
              />

              {/* Dark Gradient Overlay */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.75) 100%)',
                }}
              />

              {/* Center Content */}
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
                {/* Icon Container */}
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '12px',
                    background: 'rgba(255, 255, 255, 0.18)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {getCategoryIcon(cat.slug || cat.icon)}
                </div>

                {/* Category Name */}
                <span
                  style={{
                    color: '#FFFFFF',
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '1rem',
                    letterSpacing: '-0.01em',
                    textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                  }}
                >
                  {cat.name}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
