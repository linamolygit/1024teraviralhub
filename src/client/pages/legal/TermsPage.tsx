// src/client/pages/legal/TermsPage.tsx — Official Terms and Conditions
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { useOrderVerification } from '../../lib/orderVerification'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { ShieldCheck } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import CashfreeHiddenOffice from '../../components/compliance/CashfreeHiddenOffice'

export default function TermsPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { name: gatewayName, legalEntity: gatewayLegalEntity } = usePaymentGatewayInfo()
  const { isVerified, rawPhone, maskedPhone, rawProprietor } = useOrderVerification()

  useEffect(() => {
    document.title = `Terms and Conditions — ${siteName}`
  }, [siteName])

  return (
    <div className="section" style={{ minHeight: '80vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Terms and Conditions</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: 8, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>
          Terms and Conditions
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
          Last Updated: September 2026 • Official Commerce Terms of {BUSINESS_CONFIG.legalName}
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
              1. Introduction & Contracting Parties
            </h2>
            <p>
              This website, accessible at <strong>1024teraviralhub.com</strong> (referred to as the "Platform" or "Site"), is owned, managed, and operated by <strong>{BUSINESS_CONFIG.legalName}</strong>, operating under the trade/brand name <strong>{siteName || BUSINESS_CONFIG.brandName}</strong>.
            </p>
            <p>
              By accessing the Site, browsing catalog assets, or purchasing any digital download, you ("Buyer", "User", or "Customer") agree to be legally bound by these Terms and Conditions, our <Link to="/privacy-policy" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>Privacy Policy</Link>, and our <Link to="/refund-policy" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>Refund & Cancellation Policy</Link>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              2. Nature of Products & Digital Delivery
            </h2>
            <p>
              All products listed for sale on the Platform are strictly intangible digital files, such as high-resolution digital wallpapers, photo packs, graphic elements, and digital resource archives.
            </p>
            <p>
              Upon successful payment confirmation via our authorized payment aggregator ({gatewayLegalEntity}), you are provided instant electronic access via a secure download token on-screen and via automated email. <strong>No physical shipment or courier delivery takes place.</strong>
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              3. Access Window & Download Quota
            </h2>
            <p>
              Each purchase entitles the customer to an encrypted download token valid for <strong>12 hours</strong> from the time of transaction completion, with a maximum of <strong>3 download attempts</strong>. Customers are advised to store and backup their files immediately to a personal hard drive or secure cloud storage.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              4. Pricing, Payments & Invoicing
            </h2>
            <p>
              All product prices are quoted in Indian National Rupees (INR / ₹) inclusive of applicable taxes. Payments are fulfilled through secure UPI (PhonePe, Google Pay, Paytm, BHIM), debit/credit cards, and NetBanking gateways powered by {gatewayName}. {BUSINESS_CONFIG.legalName} reserves the right to adjust product pricing or promotional discount coupons at its sole discretion without prior notice.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              5. Intellectual Property & License Grant
            </h2>
            <p>
              Purchasing a product grants you a non-exclusive, non-transferable personal license to view, use, and display the asset. You may not resell, redistribute, sub-license, host on third-party repositories, or claim original copyright of the raw digital files without express written authorization from {BUSINESS_CONFIG.legalName}.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              6. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by applicable Indian laws, {BUSINESS_CONFIG.legalName} and its affiliates shall not be liable for any indirect, incidental, or consequential damages resulting from the use or inability to use purchased digital files.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              7. Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms and Conditions shall be governed by and construed in accordance with the laws of the Republic of India. Any legal dispute, controversy, or claim arising out of or relating to this agreement shall be subject to the exclusive jurisdiction of the competent courts in <strong>{BUSINESS_CONFIG.operatingState}</strong>.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              8. Contact & Grievance Information
            </h2>
            <p>
              For questions concerning these Terms, please contact our support desk:
            </p>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 10, fontSize: '0.85rem', marginBottom: 16 }}>
              <div><strong>Operating Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Operations Desk:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div><strong>Operations Office:</strong> {BUSINESS_CONFIG.registeredOffice}</div>
              <div><strong>Digital Network ID:</strong> {BUSINESS_CONFIG.udyamRegistration}</div>
              <div>
                <strong>Support Channel:</strong>{' '}
                <Link to="/order/support" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  24x7 Digital In-App Support Chat
                </Link>
              </div>
              <div><strong>Support Desk:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: 'inherit' }}>{BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Business Hours:</strong> {BUSINESS_CONFIG.supportHours}</div>
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
                <div><span style={{ color: '#64748B' }}>Refund Settlement TAT:</span> <strong style={{ color: '#15803D' }}>5 to 7 business days to source</strong></div>
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
