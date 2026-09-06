// src/client/components/about/BrandIntroSection.tsx — Platform Introduction
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'

export default function BrandIntroSection() {
  const { siteName } = useSiteConfig()

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
            Unlike traditional platforms that burden visitors with mandatory account registrations, passwords, and multi-step cart flows, our architecture is engineered for <strong>direct 1-click discovery and guest checkout</strong>. Visitors can explore high-fidelity digital assets, review specifications, complete payment through trusted gateways like Cashfree, and receive immediate download access within seconds.
          </p>
          <p style={{ margin: 0 }}>
            Every digital product on the platform is packaged with clear technical specifications, usage licenses, and file formats, ensuring you know exactly what you receive before completing your purchase.
          </p>
        </div>
      </div>
    </section>
  )
}
