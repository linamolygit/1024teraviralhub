// src/client/pages/legal/RefundPage.tsx — Official Refund & Cancellation Policy
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function RefundPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { name: gatewayName, fullName: gatewayFullName } = usePaymentGatewayInfo()

  useEffect(() => {
    document.title = `Refund & Cancellation Policy — ${siteName}`
  }, [siteName])

  return (
    <div className="section" style={{ minHeight: '80vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 840 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Refund & Cancellation Policy</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: 8, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>
          Refund & Cancellation Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
          Last Updated: September 2026 • Official Merchant Policy of {BUSINESS_CONFIG.legalName}
        </p>

        {/* Highlights */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { icon: <Clock size={16} color="#1162F2" />, title: '5–7 Business Days', desc: 'Refund credit turnaround' },
            { icon: <ShieldCheck size={16} color="#10B981" />, title: 'Original Payment Source', desc: 'Direct UPI/Bank refund' },
            { icon: <CheckCircle2 size={16} color="#7C3AED" />, title: '100% Guaranteed', desc: 'For duplicate or corrupt debits' },
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
              1. Digital Products Policy Overview
            </h2>
            <p>
              At <strong>{siteName}</strong> (owned and operated by <strong>{BUSINESS_CONFIG.legalName}</strong>, Udyam Registration No: <strong>{BUSINESS_CONFIG.udyamRegistration}</strong>), we offer non-tangible, irrevocable digital media goods. Because digital files are delivered immediately upon payment, all transactions are generally considered final once a download token is generated.
            </p>
            <p>
              However, we maintain a customer-friendly refund policy to protect buyers in cases of technical defects, billing anomalies, or delivery failures.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              2. Valid Grounds for a Full Refund
            </h2>
            <p>
              A full refund or immediate replacement will be granted under any of the following circumstances:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Duplicate Payment / Double Charge:</strong> If your bank account or UPI handle was debited more than once for the same purchase reference.
              </li>
              <li>
                <strong>Corrupt or Unusable Files:</strong> If the downloaded archive or file cannot be extracted or opened, and our technical support team is unable to provide a functional replacement within <strong>48 hours</strong> of notification.
              </li>
              <li>
                <strong>Technical Delivery Failure:</strong> If payment succeeded via {gatewayName} but no download link was generated on screen or received via email within 2 hours, and our team cannot resolve the delivery issue.
              </li>
              <li>
                <strong>Material Discrepancy:</strong> If the delivered asset is demonstrably different in content or format from the product description and live preview shown on the store.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              3. Order Cancellation Policy
            </h2>
            <p>
              Since digital goods are fulfilled automatically in real time (within 0–5 minutes), orders cannot be cancelled once file access has been granted or files have been downloaded.
            </p>
            <p>
              If you placed an order accidentally or experienced an erroneous transaction, you must notify us within <strong>24 hours</strong> before downloading the digital asset to request a cancellation and reversal.
            </p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              4. Refund Processing Time & Settlement Mode
            </h2>
            <p>
              Once your refund request is verified and approved by {BUSINESS_CONFIG.legalName}:
            </p>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>
                <strong>Processing SLA:</strong> Refunds are initiated within <strong>24 to 48 hours</strong> of verification.
              </li>
              <li>
                <strong>Settlement Timeline:</strong> The refunded amount will reflect in your original payment account (UPI ID, debit/credit card, or NetBanking bank account via {gatewayFullName}) within <strong>5 to 7 business days</strong>, depending on your bank's clearance cycles.
              </li>
              <li>
                <strong>Refund Mode:</strong> All refunds are issued strictly to the original payment source. No third-party account transfers or cash refunds are permitted under RBI regulations.
              </li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              5. How to Submit a Refund Claim
            </h2>
            <p>
              To file a refund or cancellation claim, please email our support desk at <a href={`mailto:${supportEmail}`} style={{ color: 'var(--brand-purple-light)', fontWeight: 700 }}>{supportEmail}</a> with:
            </p>
            <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Your Order Reference Number (e.g. <code>ORD-...</code>)</li>
              <li>{gatewayName} Payment Transaction ID / UTR Number</li>
              <li>Purchased Product Title</li>
              <li>A clear description and screenshot/screen-recording of the defect or duplicate debit</li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              6. Registered Merchant Entity Contact
            </h2>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 10, fontSize: '0.85rem' }}>
              <div><strong>Merchant Name:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Registration:</strong> {BUSINESS_CONFIG.udyamRegistration} ({BUSINESS_CONFIG.registrationType})</div>
              <div><strong>Customer Support:</strong> <a href={`mailto:${supportEmail}`} style={{ color: 'inherit' }}>{supportEmail}</a></div>
              <div><strong>Support Working Hours:</strong> {BUSINESS_CONFIG.supportHours}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
