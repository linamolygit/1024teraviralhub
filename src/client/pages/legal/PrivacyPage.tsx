// src/client/pages/legal/PrivacyPage.tsx — Official Privacy Policy
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ShieldCheck, Lock, Eye, Database, UserCheck } from 'lucide-react'

export default function PrivacyPage() {
  const { siteName, supportEmail } = useSiteConfig()

  useEffect(() => {
    document.title = `Privacy Policy — ${siteName}`
  }, [siteName])

  return (
    <div className="section" style={{ minHeight: '80vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Privacy Policy</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: 8, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>
          Privacy Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
          Last Updated: September 2026 • Official Data Protection Policy of {BUSINESS_CONFIG.legalName}
        </p>

        <div
          className="glass-card"
          style={{
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 24,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
            fontSize: '0.925rem',
          }}
        >
          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              1. Data Controller & Business Identity
            </h2>
            <p>
              This Privacy Policy explains how <strong>{BUSINESS_CONFIG.legalName}</strong> (Govt. of India MSME / Udyam Registration No: <strong style={{ fontFamily: 'monospace', color: 'var(--brand-purple-light)' }}>{BUSINESS_CONFIG.udyamRegistration}</strong>), operating under the trade name <strong>{siteName || BUSINESS_CONFIG.brandName}</strong>, collects, processes, and protects your personal data when you visit <strong>1024teraviralhub.com</strong> or purchase digital assets.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              2. Information We Collect
            </h2>
            <p>
              We collect minimal information necessary to process transactions, issue invoices, and fulfill digital deliveries:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Contact Information:</strong> Customer Name, Email Address, and Phone Number provided during guest checkout.</li>
              <li><strong>Order Identifiers:</strong> Order reference IDs, purchased product SKUs, and payment settlement timestamps.</li>
              <li><strong>Technical Data:</strong> IP address and user-agent string used to generate 12-hour encrypted download tokens and prevent unauthorized distribution.</li>
            </ul>
            <p style={{ marginTop: 8 }}>
              <strong>We do NOT store or capture your sensitive financial credentials</strong> (such as card CVV, card numbers, banking passwords, or UPI PINs). All payment information is handled directly by our certified payment aggregator.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              3. Secure Payment Gateway Processing (Cashfree)
            </h2>
            <p>
              Online transactions are securely processed through <strong>Cashfree Payments India Pvt. Ltd.</strong>, an RBI-authorized Payment Aggregator. Cashfree is certified under <strong>PCI-DSS Level 1</strong> standards and employs 256-bit SSL encryption to guarantee end-to-end security of your financial data.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              4. How We Use Your Data
            </h2>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Generate your encrypted 12-hour digital product download access.</li>
              <li>Dispatch automated order receipts and download recovery emails.</li>
              <li>Facilitate customer service queries and process refunds if eligible.</li>
              <li>Comply with Indian tax and commercial bookkeeping regulations.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              5. Data Retention & Protection
            </h2>
            <p>
              Your data is stored in secure, encrypted cloud data centers with restricted access. Download access tokens automatically expire after 12 hours. We never sell, rent, or trade your personal data to third-party marketing entities.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              6. Grievance Officer & Redressal
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and Digital Personal Data Protection Act, the details of our designated Grievance Officer are provided below:
            </p>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 10, fontSize: '0.85rem' }}>
              <div><strong>Designation:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div><strong>Organization:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Udyam Registration:</strong> {BUSINESS_CONFIG.udyamRegistration}</div>
              <div><strong>Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.grievanceEmail}`} style={{ color: 'inherit' }}>{BUSINESS_CONFIG.grievanceEmail}</a></div>
              <div><strong>Jurisdiction:</strong> {BUSINESS_CONFIG.operatingState}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
