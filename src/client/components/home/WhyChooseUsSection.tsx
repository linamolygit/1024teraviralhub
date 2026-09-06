// src/client/components/home/WhyChooseUsSection.tsx — Pixel-Accurate Why Choose Us Section
import { Zap, Gem, ShieldCheck, Download } from 'lucide-react'

const features = [
  {
    icon: <Zap size={22} color="#111827" />,
    title: 'Instant Access',
    desc: 'Get immediate access to your purchased digital products.',
  },
  {
    icon: <Gem size={22} color="#111827" />,
    title: 'High Quality',
    desc: 'Premium quality content crafted for creators.',
  },
  {
    icon: <ShieldCheck size={22} color="#111827" />,
    title: 'Secure Checkout',
    desc: 'Your payments are protected with top-notch security.',
  },
  {
    icon: <Download size={22} color="#111827" />,
    title: 'Simple Download',
    desc: 'Easy and fast downloads with one click.',
  },
]

export default function WhyChooseUsSection() {
  return (
    <section style={{ padding: '32px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h2
            style={{
              fontFamily: 'Manrope, Inter, sans-serif',
              fontSize: 'clamp(1.65rem, 3.5vw, 2.15rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
            }}
          >
            Why Choose 1024 Tera Viral Hub?
          </h2>
        </div>

        {/* 4 Feature Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '20px',
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '20px',
                padding: '28px 22px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.25s ease, box-shadow 0.25s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0,0,0,0.06)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
              }}
            >
              {/* Icon */}
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '14px',
                  background: '#F1F3F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '18px',
                }}
              >
                {f.icon}
              </div>

              {/* Title */}
              <h3
                style={{
                  fontFamily: 'Manrope, Inter, sans-serif',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  color: 'var(--text-primary)',
                  marginBottom: '8px',
                }}
              >
                {f.title}
              </h3>

              {/* Description */}
              <p
                style={{
                  fontSize: '0.85rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.55,
                  margin: 0,
                }}
              >
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
