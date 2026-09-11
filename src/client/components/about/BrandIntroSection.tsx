// src/client/components/about/BrandIntroSection.tsx — Platform Introduction
import { MapPin, Building2 } from 'lucide-react'
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function BrandIntroSection() {
  const { siteName } = useSiteConfig()
  const { name } = usePaymentGatewayInfo()

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '840px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>Platform Concept</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.15rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Built for Digital Discovery
          </h2>
        </div>

        <div
          className="glass-card"
          style={{
            padding: '36px 32px',
            borderRadius: 'var(--radius-xl)',
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            color: 'var(--text-secondary)',
            lineHeight: 1.85,
            fontSize: '1rem',
          }}
        >
          <p style={{ marginBottom: '20px' }}>
            <strong>{siteName || BUSINESS_CONFIG.brandName}</strong> is a specialized online marketplace owned, managed, and operated by <strong>{BUSINESS_CONFIG.legalName}</strong> (Govt. of India MSME / Udyam Reg. No.: <strong style={{ fontFamily: 'monospace', color: 'var(--brand-purple-light)' }}>{BUSINESS_CONFIG.udyamRegistration}</strong>), focused on making creative digital content and media packs easy to discover, purchase, and securely download.
          </p>
          <p style={{ marginBottom: '20px' }}>
            Unlike traditional platforms that burden visitors with mandatory account registrations, passwords, and multi-step cart flows, our architecture is engineered for <strong>direct 1-click discovery and guest checkout</strong>. Visitors can explore high-fidelity digital assets, review specifications, complete payment through trusted gateways like {name}, and receive immediate download access within seconds.
          </p>
          <p style={{ marginBottom: '24px' }}>
            Every digital product on the platform is packaged with clear technical specifications, usage licenses, and file formats, ensuring you know exactly what you receive before completing your purchase.
          </p>

          {/* Physical Office Address */}
          <div
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'rgba(255, 210, 0, 0.06)',
              border: '1px solid rgba(255, 210, 0, 0.28)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: '#FFD200',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000000',
                flexShrink: 0,
                marginTop: '2px',
              }}
            >
              <MapPin size={18} />
            </div>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.55 }}>
              <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px' }}>
                Corporate & Registered Office:
              </div>
              <div style={{ color: 'var(--text-secondary)' }}>
                <strong>{BUSINESS_CONFIG.legalName}</strong>
                <br />
                {BUSINESS_CONFIG.registeredOffice}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
