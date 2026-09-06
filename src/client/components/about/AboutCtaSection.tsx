// src/client/components/about/AboutCtaSection.tsx — About Page Call to Action
import { ArrowRight, Package } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../../lib/site-config'

export default function AboutCtaSection() {
  const { siteName } = useSiteConfig()

  return (
    <section className="section" style={{ padding: '64px 0 80px' }}>
      <div className="container" style={{ maxWidth: '860px' }}>
        <div
          className="glass-card"
          style={{
            padding: '52px 32px',
            borderRadius: 'var(--radius-2xl)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'var(--grad-cta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Package size={28} color="white" />
          </div>

          <h2 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.35rem)', fontWeight: 900, marginBottom: '12px', color: 'var(--text-primary)' }}>
            Explore Digital Products
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '520px', margin: '0 auto 32px', lineHeight: 1.6 }}>
            Discover the creative digital assets, images, and collections currently available on {siteName}.
          </p>

          <Link
            to="/products"
            className="btn-cta"
            style={{
              padding: '16px 36px',
              fontSize: '1rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              textDecoration: 'none',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            Browse Catalog <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}
