// src/client/components/about/WhyChooseUsAboutSection.tsx — Value Proposition Grid
import { Zap, ShieldCheck, FileCheck, RefreshCw } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function WhyChooseUsAboutSection() {
  const { name } = usePaymentGatewayInfo()

  const principles = [
    {
      icon: <Zap size={22} color="#111827" />,
      title: 'Simple Discovery',
      desc: 'Browse available digital products quickly with fast filters, high-fidelity previews, and zero clutter.',
    },
    {
      icon: <FileCheck size={22} color="var(--brand-amber)" />,
      title: 'Clear Product Information',
      desc: 'Complete transparency on file sizes, formats, file counts, and usage licenses before you buy.',
    },
    {
      icon: <ShieldCheck size={22} color="var(--success)" />,
      title: 'Secure Payment Flow',
      desc: `Bank-grade 256-bit encryption powered by verified ${name} payment gateway with instant UPI options.`,
    },
    {
      icon: <RefreshCw size={22} color="#3B82F6" />,
      title: 'Easy Digital Access',
      desc: 'Immediate 12-hour download access generated upon payment verification with Order Lookup recovery.',
    },
  ]

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge badge-amber" style={{ marginBottom: '12px' }}>Platform Principles</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.15rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Designed for a Better Digital Experience
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '8px auto 0' }}>
            Built around the fundamentals of speed, transparency, and dependable delivery.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
            gap: '24px',
          }}
        >
          {principles.map((p) => (
            <div
              key={p.title}
              className="stat-card"
              style={{
                padding: '28px 22px',
                borderRadius: 'var(--radius-xl)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '10px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {p.icon}
              </div>

              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {p.title}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {p.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
