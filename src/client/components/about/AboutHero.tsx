// src/client/components/about/AboutHero.tsx — Neo-Modern About Hero
import { motion } from 'framer-motion'
import { ArrowRight, Mail, Sparkles, Layers, Image as ImageIcon, Download, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../../lib/site-config'

export default function AboutHero() {
  const { siteName } = useSiteConfig()

  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '56px 0 72px',
        borderBottom: '1px solid var(--bg-border)',
      }}
    >
      {/* Background glow effects */}
      <div
        style={{
          position: 'absolute',
          top: '-15%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '600px',
          height: '350px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.15) 0%, transparent 70%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1100px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '48px',
          alignItems: 'center',
        }}
      >
        {/* Left Column: Text & CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.28)',
              color: 'var(--brand-purple-light)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '20px',
            }}
          >
            <Sparkles size={13} /> About {siteName}
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 3rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              color: 'var(--text-primary)',
              marginBottom: '18px',
              letterSpacing: '-0.02em',
            }}
          >
            Digital Products Designed for <span className="text-gradient">Modern Creators</span>
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              marginBottom: '32px',
              maxWidth: '520px',
            }}
          >
            Discover creative digital content and downloadable assets through a simple, transparent, and secure experience built for fast delivery.
          </p>

          {/* Action CTAs */}
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              to="/products"
              className="btn-primary"
              style={{
                padding: '14px 28px',
                fontSize: '0.9375rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              Explore Products <ArrowRight size={16} />
            </Link>

            <Link
              to="/contact"
              className="btn-ghost"
              style={{
                padding: '14px 24px',
                fontSize: '0.9375rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={16} /> Contact Us
            </Link>
          </div>
        </motion.div>

        {/* Right Column: Abstract Geometric Composition (No fake stock photos) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            className="glass-card"
            style={{
              width: '100%',
              maxWidth: '420px',
              borderRadius: 'var(--radius-2xl)',
              padding: '32px 28px',
              border: '1px solid var(--bg-border)',
              background: 'var(--grad-surface)',
              boxShadow: 'var(--shadow-lg)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
          >
            {/* Visual Item 1 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(124, 58, 237, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-purple-light)',
                  flexShrink: 0,
                }}
              >
                <Layers size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  Digital Asset Packs
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Images, templates, and high-fidelity graphics
                </div>
              </div>
            </div>

            {/* Visual Item 2 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--brand-amber)',
                  flexShrink: 0,
                }}
              >
                <Download size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  Instant Edge Delivery
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  12-Hour secure access window immediately ready
                </div>
              </div>
            </div>

            {/* Visual Item 3 */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                padding: '14px',
                borderRadius: 'var(--radius-lg)',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--success)',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={22} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.925rem', color: 'var(--text-primary)' }}>
                  100% Secure Checkout
                </div>
                <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Direct PhonePe, UPI, and Card transactions
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
