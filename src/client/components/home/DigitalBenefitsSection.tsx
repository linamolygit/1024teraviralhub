// src/client/components/home/DigitalBenefitsSection.tsx — Digital Product Advantages & Policy Transparency
import { Check, ShieldAlert, Zap, Globe, Smartphone, RefreshCw } from 'lucide-react'

export default function DigitalBenefitsSection() {
  return (
    <section
      className="section"
      style={{
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--bg-border)',
        borderBottom: '1px solid var(--bg-border)',
        paddingTop: '64px',
        paddingBottom: '64px',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '40px',
            alignItems: 'center',
          }}
        >
          {/* Left: Benefits Details */}
          <div>
            <span className="badge badge-purple" style={{ marginBottom: '12px' }}>
              Digital Delivery Transparency
            </span>
            <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
              Why Buy Digital on Our Platform?
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px', fontSize: '0.95rem' }}>
              We eliminate all physical shipping delays. Every product is a pristine digital file served directly from edge infrastructure for maximum speed and security.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {[
                { title: 'Zero Shipping Delays', desc: 'No packages, no tracking numbers, no customs. Instant access right after payment.' },
                { title: 'High-Speed Edge CDN Delivery', desc: 'Files stream from global Cloudflare edge nodes directly to your mobile or PC.' },
                { title: 'Transparent 12-Hour Access Window', desc: 'Download tokens remain active for 12 hours with up to 3 retry attempts for safe saving.' },
                { title: 'Seamless Order Recovery', desc: 'Lost your download link? Easily recover it anytime using your email on our Order Lookup page.' },
              ].map((b) => (
                <div key={b.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      background: 'rgba(16, 185, 129, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--success)',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Check size={14} strokeWidth={3} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{b.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>{b.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: Policy Summary Glass Card */}
          <div
            className="glass-card"
            style={{
              padding: '32px 28px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--bg-border)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#F1F3F6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#111827',
                }}
              >
                <Zap size={20} />
              </div>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                Direct Delivery Guarantee
              </h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.7, marginBottom: '20px' }}>
              When you purchase any digital wallpaper, pack, or template:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.875rem' }}>
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Smartphone size={18} color="#111827" />
                <span>Compatible with iOS, Android, Mac & Windows</span>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <RefreshCw size={18} color="#111827" />
                <span>Immediate download retry if connection drops</span>
              </div>
              <div style={{ padding: '12px 14px', background: 'var(--bg-elevated)', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Globe size={18} color="#111827" />
                <span>SSL encrypted 256-bit checkout & delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
