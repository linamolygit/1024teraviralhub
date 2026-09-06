// src/client/components/blog/BlogCtaSection.tsx — Content & Catalog Call to Action
import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../../lib/site-config'

export default function BlogCtaSection() {
  const { siteName } = useSiteConfig()

  return (
    <div
      className="glass-card"
      style={{
        padding: '48px 32px',
        borderRadius: 'var(--radius-2xl)',
        textAlign: 'center',
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
        border: '1px solid rgba(124, 58, 237, 0.3)',
        marginTop: '64px',
        marginBottom: '20px',
      }}
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '14px',
          background: 'var(--grad-cta)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
        }}
      >
        <Sparkles size={26} color="white" />
      </div>

      <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.1rem)', fontWeight: 900, marginBottom: '10px', color: 'var(--text-primary)' }}>
        Explore Digital Products
      </h2>

      <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 28px', lineHeight: 1.6 }}>
        Put these creative concepts into practice with instant downloadable digital asset packs on {siteName}.
      </p>

      <Link
        to="/products"
        className="btn-cta"
        style={{
          padding: '14px 32px',
          fontSize: '0.9375rem',
          fontWeight: 800,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          textDecoration: 'none',
          borderRadius: 'var(--radius-xl)',
        }}
      >
        Browse Products <ArrowRight size={16} />
      </Link>
    </div>
  )
}
