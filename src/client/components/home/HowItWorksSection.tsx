// src/client/components/home/HowItWorksSection.tsx — Pixel-Accurate How It Works Section
import { ShoppingBag, CreditCard, Download } from 'lucide-react'

const steps = [
  {
    num: '1',
    icon: <ShoppingBag size={22} color="#111827" />,
    title: 'Choose',
    desc: 'Browse and select the digital products you love.',
  },
  {
    num: '2',
    icon: <CreditCard size={22} color="#111827" />,
    title: 'Pay Securely',
    desc: 'Complete payment securely and safely.',
  },
  {
    num: '3',
    icon: <Download size={22} color="#111827" />,
    title: 'Download',
    desc: 'Instantly download your files and start using.',
  },
]

export default function HowItWorksSection() {
  return (
    <section style={{ padding: '32px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <h2
            style={{
              fontFamily: 'Manrope, Inter, sans-serif',
              fontSize: 'clamp(1.65rem, 3.5vw, 2.15rem)',
              fontWeight: 800,
              color: 'var(--text-primary)',
              letterSpacing: '-0.025em',
              marginBottom: '6px',
            }}
          >
            How It Works
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Get your digital content in three simple steps.
          </p>
        </div>

        {/* Steps Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
            position: 'relative',
          }}
        >
          {steps.map((step, idx) => (
            <div
              key={step.num}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '20px',
                padding: '28px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '18px',
                boxShadow: 'var(--shadow-sm)',
                position: 'relative',
              }}
            >
              {/* Icon in Container */}
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: '#F1F3F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {step.icon}
              </div>

              {/* Text & Number */}
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      background: '#F1F3F6',
                      color: '#111827',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {step.num}
                  </span>
                  <h3
                    style={{
                      fontFamily: 'Manrope, Inter, sans-serif',
                      fontWeight: 800,
                      fontSize: '1.05rem',
                      color: 'var(--text-primary)',
                      margin: 0,
                    }}
                  >
                    {step.title}
                  </h3>
                </div>
                <p
                  style={{
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
