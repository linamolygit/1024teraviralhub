// src/client/components/home/FinalCtaSection.tsx — Pixel-Accurate Final CTA Banner
import { Link } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'

export default function FinalCtaSection() {
  return (
    <section style={{ padding: '16px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #172337 0%, #1F2E4A 50%, #172337 100%)',
            borderRadius: '24px',
            padding: '36px 44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 16px 40px rgba(23, 35, 55, 0.25)',
          }}
        >
          {/* Background Decorative Ambient Shapes */}
          <div
            style={{
              position: 'absolute',
              left: '-40px',
              top: '-40px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(40, 116, 240, 0.25) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'absolute',
              right: '-30px',
              bottom: '-30px',
              width: '180px',
              height: '180px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255, 210, 0, 0.2) 0%, transparent 70%)',
              filter: 'blur(30px)',
              pointerEvents: 'none',
            }}
          />

          {/* Left: Icon & Headline */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '22px',
              zIndex: 2,
            }}
          >
            {/* Shopping Bag Icon Container */}
            <div
              style={{
                width: '54px',
                height: '54px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.12)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShoppingBag size={24} color="#FFFFFF" />
            </div>

            {/* Text Content */}
            <div>
              <h2
                style={{
                  fontFamily: 'Manrope, Inter, sans-serif',
                  fontSize: 'clamp(1.4rem, 2.8vw, 1.85rem)',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  letterSpacing: '-0.02em',
                  margin: '0 0 4px',
                }}
              >
                Find Something Worth Downloading.
              </h2>
              <p
                style={{
                  fontSize: '0.925rem',
                  color: 'rgba(255, 255, 255, 0.75)',
                  margin: 0,
                }}
              >
                Explore our latest digital collections.
              </p>
            </div>
          </div>

          {/* Right: White Button CTA */}
          <div style={{ zIndex: 2 }}>
            <Link
              to="/products"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#FFD200',
                color: '#000000',
                fontFamily: 'Manrope, Inter, sans-serif',
                fontWeight: 800,
                fontSize: '0.925rem',
                padding: '13px 26px',
                borderRadius: 'var(--radius-full)',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(255, 210, 0, 0.4)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.2)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              <span>Explore Products</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
