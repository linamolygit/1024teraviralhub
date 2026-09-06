// src/client/components/home/TrustBar.tsx — Pixel-Accurate Trust Indicators Strip
import { Zap, ShieldCheck, Download, UserCheck } from 'lucide-react'

const trustItems = [
  {
    icon: <Zap size={18} color="#111827" />,
    title: 'Instant Digital Access',
    subtitle: 'Get your files instantly',
  },
  {
    icon: <ShieldCheck size={18} color="#111827" />,
    title: 'Secure Payments',
    subtitle: '100% safe & secure',
  },
  {
    icon: <Download size={18} color="#111827" />,
    title: 'Easy Download',
    subtitle: 'Simple & fast downloads',
  },
  {
    icon: <UserCheck size={18} color="#111827" />,
    title: 'No Signup Required',
    subtitle: 'Buy without an account',
  },
]

export default function TrustBar() {
  return (
    <section style={{ padding: '0 0 48px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '16px',
          }}
        >
          {trustItems.map((item) => (
            <div
              key={item.title}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '16px',
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                boxShadow: 'var(--shadow-sm)',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: '#F1F3F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: 'var(--text-primary)',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.title}
                </div>
                <div
                  style={{
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    marginTop: '2px',
                  }}
                >
                  {item.subtitle}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
