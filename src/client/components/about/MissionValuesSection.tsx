// src/client/components/about/MissionValuesSection.tsx — Mission & 4 Core Platform Values
import { Target, Zap, Eye, HeartHandshake, ShieldCheck } from 'lucide-react'

export default function MissionValuesSection() {
  const values = [
    {
      icon: <Zap size={22} color="#111827" />,
      title: 'Simplicity',
      desc: 'Zero mandatory signup hurdles. Direct guest checkout enables users to purchase and download assets in under a minute.',
    },
    {
      icon: <Eye size={22} color="var(--brand-amber)" />,
      title: 'Transparency',
      desc: 'Clear deliverable counts, precise file formats, and explicit licensing details upfront. Zero recurring surprise fees.',
    },
    {
      icon: <HeartHandshake size={22} color="var(--success)" />,
      title: 'Customer Experience',
      desc: 'Mobile-first, high-speed interface optimized for friction-free browsing and fast UPI & card payment processing.',
    },
    {
      icon: <ShieldCheck size={22} color="#3B82F6" />,
      title: 'Reliable Access',
      desc: 'Encrypted, time-limited 12-hour download sessions backed by self-service instant order lookup recovery.',
    },
  ]

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* ── Mission Statement ── */}
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
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
              marginBottom: '16px',
            }}
          >
            <Target size={13} /> Our Mission
          </div>

          <h2
            style={{
              fontSize: 'clamp(1.75rem, 3.5vw, 2.35rem)',
              fontWeight: 900,
              color: 'var(--text-primary)',
              lineHeight: 1.25,
              maxWidth: '680px',
              margin: '0 auto 14px',
            }}
          >
            Make digital products simple to discover, purchase, and access.
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.65,
            }}
          >
            We believe creators and professionals deserve effortless access to high-quality digital assets without unnecessary friction.
          </p>
        </div>

        {/* ── Platform Values Grid ── */}
        <div style={{ marginBottom: '16px', textAlign: 'center' }}>
          <span className="badge badge-purple" style={{ marginBottom: '8px' }}>Platform Values</span>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            Principles That Guide Us
          </h3>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
          }}
        >
          {values.map((v) => (
            <div
              key={v.title}
              className="glass-card"
              style={{
                padding: '28px 22px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {v.icon}
              </div>

              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {v.title}
              </h4>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {v.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
