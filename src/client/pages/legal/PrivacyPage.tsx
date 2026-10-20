// src/client/pages/legal/PrivacyPage.tsx — Official Privacy Policy
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { useOrderVerification } from '../../lib/orderVerification'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ShieldCheck, Lock, Eye, Database, UserCheck } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import CashfreeHiddenOffice from '../../components/compliance/CashfreeHiddenOffice'

export default function PrivacyPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { name: gatewayName, legalEntity: gatewayLegalEntity, isBoth } = usePaymentGatewayInfo()
  const { isVerified, rawPhone, maskedPhone, rawProprietor } = useOrderVerification()

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
              This Privacy Policy explains how <strong>{BUSINESS_CONFIG.legalName}</strong>, operating under the trade and brand name <strong>{siteName || BUSINESS_CONFIG.brandName}</strong>, collects, processes, and protects your personal data when you visit <strong>1024teraviralhub.com</strong> or purchase digital assets.
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
              3. Secure Payment Gateway Processing ({gatewayName})
            </h2>
            <p>
              Online transactions are securely processed through <strong>{gatewayLegalEntity}</strong>, {isBoth ? 'RBI-authorized Payment Aggregators' : 'an RBI-authorized Payment Aggregator'}. {gatewayName} {isBoth ? 'are certified' : 'is certified'} under <strong>PCI-DSS Level 1</strong> standards and {isBoth ? 'employ' : 'employs'} 256-bit SSL encryption to guarantee end-to-end security of your financial data.
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
              6. Third-Party Advertising & Google AdSense Disclosure
            </h2>
            <p>
              We partner with third-party advertising networks, including <strong>Google AdSense</strong> and <strong>Google Ad Manager (DoubleClick)</strong>, to display non-intrusive advertisements across eligible areas of our website. Please review the following mandatory disclosures regarding third-party ad serving:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Third-Party Cookies & Web Beacons:</strong> Third-party vendors, including Google, use cookies to serve ads based on a user's prior visits to this website or other websites across the Internet.
              </li>
              <li>
                <strong>Google DoubleClick DART Cookies:</strong> Google's use of advertising cookies enables it and its certified partners to serve relevant ads to our visitors based on their visit to <em>1024teraviralhub.com</em> and/or other sites on the Internet.
              </li>
              <li>
                <strong>Personalized Advertising Opt-Out:</strong> Users may opt out of personalized advertising by visiting Google's official Ads Settings at{' '}
                <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  https://www.google.com/settings/ads
                </a>. Alternatively, visitors may opt out of third-party vendor cookies for personalized advertising by visiting{' '}
                <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  www.aboutads.info/choices/
                </a>.
              </li>
              <li>
                <strong>Checkout & Buyer Protection:</strong> We strictly protect user privacy during the checkout process. Advertising scripts and behavioral tracking cookies are 100% suppressed on checkout pages, payment confirmation screens, and paid customer download vaults.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              7. Grievance Officer & Redressal
            </h2>
            <p>
              In accordance with the Information Technology Act, 2000 and Digital Personal Data Protection Act, the details of our designated Grievance Officer are provided below:
            </p>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
              <div><strong>Desk:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div><strong>Organization / Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Operations Office:</strong> {BUSINESS_CONFIG.registeredOffice}</div>
              <div><strong>Classification:</strong> {BUSINESS_CONFIG.registrationType}</div>
              <div>
                <strong>Support Channel:</strong>{' '}
                <Link to="/order/support" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  24x7 Digital In-App Chat Support
                </Link>
              </div>
              <div><strong>Grievance Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: 'inherit' }}>{BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Jurisdiction:</strong> {BUSINESS_CONFIG.operatingState}</div>
            </div>

            {/* Statutory Cashfree Merchant & RBI Settlement Disclosure */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1.5px solid #86EFAC',
                borderRadius: 12,
                padding: '16px 20px',
                color: '#14532D',
                fontSize: '0.825rem',
                lineHeight: 1.6,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#166534', fontWeight: 800, fontSize: '0.925rem', marginBottom: '8px' }}>
                <ShieldCheck size={18} color="#16A34A" />
                <span>Authorized Cashfree Merchant & RBI Payment Settlement Disclosure</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', background: '#FFFFFF', padding: '12px 14px', borderRadius: '8px', border: '1px solid #DCFCE7' }}>
                <div><span style={{ color: '#64748B' }}>Registered Merchant Entity:</span> <strong style={{ color: '#0F172A' }}>RISHAV MEDIA</strong></div>
                <div><span style={{ color: '#64748B' }}>Trade & Website:</span> <strong style={{ color: '#0F172A' }}>1024 Tera Viral Hub</strong> (1024teraviralhub.com)</div>
                <div><span style={{ color: '#64748B' }}>MSME / Udyam Reg.:</span> <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>UDYAM-BR-11-0107325</strong></div>
                <div><span style={{ color: '#64748B' }}>Payment Partner:</span> <strong style={{ color: '#1D4ED8' }}>Cashfree Payments India Pvt. Ltd. (PCI-DSS Level 1)</strong></div>
                <div><span style={{ color: '#64748B' }}>Data Protection:</span> <strong style={{ color: '#15803D' }}>256-bit SSL & Zero Financial Data Stored</strong></div>
                <div>
                  <span style={{ color: '#64748B' }}>Operating Jurisdiction:</span> <span>India (Digital Media Desk)</span>
                  <CashfreeHiddenOffice />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
