// src/client/pages/legal/ShippingPolicyPage.tsx — Official Shipping & Digital Delivery Policy
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { useOrderVerification } from '../../lib/orderVerification'
import { Zap, Clock, ShieldCheck, Download, Mail, CheckCircle2, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'
import CashfreeHiddenOffice from '../../components/compliance/CashfreeHiddenOffice'

export default function ShippingPolicyPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { fullName: gatewayFullName } = usePaymentGatewayInfo()
  const { isVerified, rawPhone, maskedPhone, rawProprietor } = useOrderVerification()

  useEffect(() => {
    document.title = `Shipping & Digital Delivery Policy — ${siteName}`
  }, [siteName])

  return (
    <div className="section" style={{ minHeight: '80vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Shipping & Delivery Policy</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: 8, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>
          Shipping & Digital Delivery Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
          Last Updated: September 2026 • Official Fulfillment Policy of {BUSINESS_CONFIG.legalName}
        </p>

        {/* Highlight Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { icon: <Zap size={16} color="#10B981" />, title: 'Instant Electronic Access', desc: 'Delivered in 0–5 minutes' },
            { icon: <Clock size={16} color="#1162F2" />, title: 'Zero Shipping Fee', desc: '₹0 / Completely Free' },
            { icon: <Download size={16} color="#7C3AED" />, title: 'Encrypted Download Links', desc: '12-Hour Access Window' },
            { icon: <ShieldCheck size={16} color="#10B981" />, title: '100% Virus-Free Files', desc: 'Cloud CDN Served' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Policy Content Body */}
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
              1. Electronic Digital Delivery Only
            </h2>
            <p>
              All products offered on <strong>{siteName}</strong> (owned and operated by <strong>{BUSINESS_CONFIG.legalName}</strong>) are strictly intangible digital assets. These include downloadable digital wallpapers, curated media bundles, high-resolution photo packs, and digital resource archives.
            </p>
            <p>
              <strong>No physical goods, parcels, parcels, or print shipments will be dispatched to your postal address.</strong> Consequently, no courier, shipping carrier, or physical tracking number applies.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              2. Delivery Timelines & Fulfillment Process
            </h2>
            <p>
              Upon successful payment authorization through our verified payment gateway ({gatewayFullName}), your order is processed and fulfilled instantly:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Immediate On-Screen Download:</strong> Once payment succeeds, you are immediately redirected to your private, encrypted Download Page displaying your download button and order details.
              </li>
              <li>
                <strong>Email Confirmation & Receipt:</strong> An order confirmation containing your secure download link and invoice is dispatched to your provided email address within <strong>0 to 5 minutes</strong>.
              </li>
              <li>
                <strong>Delivery Cost:</strong> Digital delivery is <strong>100% Free (₹0)</strong>. There are no shipping charges, handling fees, or customs duties.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              3. Download Validity Window & Access Limits
            </h2>
            <p>
              To protect intellectual property and maintain server integrity, every digital purchase token is subject to standard security parameters:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Time Window:</strong> Download links remain active for <strong>12 hours</strong> from the moment of payment completion.
              </li>
              <li>
                <strong>Attempt Limit:</strong> Each purchase token allows up to <strong>3 download attempts</strong>.
              </li>
              <li>
                <strong>Customer Responsibility:</strong> We recommend downloading and backing up your purchased digital files to your local device (PC, tablet, phone, or personal cloud storage) immediately after completing the checkout.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              4. Non-Delivery or Download Link Issues
            </h2>
            <p>
              If you have completed your payment but did not receive your download access or confirmation email:
            </p>
            <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                Check your email Spam / Junk / Promotions folder in case the automated confirmation email was filtered.
              </li>
              <li>
                Use our self-service <Link to="/order-lookup" style={{ color: 'var(--brand-purple-light)', fontWeight: 700 }}>Order Lookup Tool</Link> by entering your billing email address and order reference number.
              </li>
              <li>
                Reach out to our customer support desk at <a href={`mailto:${supportEmail}`} style={{ color: 'var(--brand-purple-light)', fontWeight: 700 }}>{supportEmail}</a> with your payment transaction ID. We guarantee link re-generation and resolution within <strong>24 business hours</strong>.
              </li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              5. Merchant & Registered Business Details
            </h2>
            <div
              style={{
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                borderRadius: 12,
                padding: '16px 20px',
                fontSize: '0.875rem',
                lineHeight: 1.6,
                marginBottom: 16,
              }}
            >
              <div><strong>Merchant Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Operations Desk:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div><strong>Brand Name:</strong> {siteName || BUSINESS_CONFIG.brandName}</div>
              <div><strong>Digital Network ID:</strong> <span style={{ fontFamily: 'monospace', color: 'var(--brand-purple-light)', fontWeight: 700 }}>{BUSINESS_CONFIG.udyamRegistration}</span></div>
              <div>
                <strong>Support Channel:</strong>{' '}
                <Link to="/order/support" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  24x7 Digital In-App Support Chat
                </Link>
              </div>
              <div><strong>Support Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: 'inherit' }}>{BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Registration Category:</strong> {BUSINESS_CONFIG.registrationType}</div>
              <div><strong>Operating Jurisdiction:</strong> {BUSINESS_CONFIG.operatingState}</div>
              <div><strong>Operating Hours:</strong> {BUSINESS_CONFIG.supportHours}</div>
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
                <div><span style={{ color: '#64748B' }}>Electronic Fulfillment:</span> <strong style={{ color: '#15803D' }}>Instant (0–5 minutes via encrypted CDN)</strong></div>
                <div>
                  <span style={{ color: '#64748B' }}>Operating Jurisdiction:</span> <span>India (Digital Media Fulfillment)</span>
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
