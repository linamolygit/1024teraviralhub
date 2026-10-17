// src/client/pages/legal/RefundPage.tsx — Official Refund & Cancellation Policy
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { useOrderVerification } from '../../lib/orderVerification'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { RefreshCw, CheckCircle2, AlertCircle, Clock, ShieldCheck } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function RefundPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { name: gatewayName, fullName: gatewayFullName } = usePaymentGatewayInfo()
  const { isVerified, rawPhone, maskedPhone, rawProprietor } = useOrderVerification()

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
              At <strong>{siteName}</strong> (owned and operated by <strong>{BUSINESS_CONFIG.legalName}</strong>), we offer non-tangible, irrevocable digital media goods. Because digital files are delivered immediately upon payment, all transactions are generally considered final once a download token is generated.
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
              To file a refund or cancellation claim, you can use our automated self-service refund desk or email our support team at <a href={`mailto:${supportEmail}`} style={{ color: 'var(--brand-purple-light)', fontWeight: 700 }}>{supportEmail}</a>:
            </p>

            <div
              style={{
                marginTop: '14px',
                marginBottom: '18px',
                background: 'rgba(17, 98, 242, 0.08)',
                border: '1px solid rgba(17, 98, 242, 0.25)',
                borderRadius: '12px',
                padding: '18px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#60A5FA' }}>
                🚀 Automated Self-Service Refund Desk (Recommended)
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                Have your Order Number, 12-digit Bank/UPI UTR Number, and destination UPI ID ready. Submissions are verified automatically within 24–48 hours, and refunds are credited in 5–7 business days.
              </p>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <Link
                  to="/refund-request"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  File Instant Refund Claim (UTR) →
                </Link>
                <Link
                  to="/order/support"
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    background: 'rgba(255, 255, 255, 0.08)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  Live Chat Assistant
                </Link>
              </div>
            </div>

            <ol style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li>Your Order Reference Number (e.g. <code>OD32876...</code> or <code>TVH-...</code>)</li>
              <li>12-Digit Bank / UPI UTR Transaction Reference Number</li>
              <li>Your Destination UPI ID for direct payout transfer</li>
              <li>A clear description and reason for your claim</li>
            </ol>
          </section>

          <section>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>
              6. Registered Merchant Entity Contact
            </h2>
            <div style={{ background: 'var(--bg-elevated)', padding: '16px 20px', borderRadius: 10, fontSize: '0.85rem' }}>
              <div><strong>Merchant Legal Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Operations Desk:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div><strong>Digital Network ID:</strong> {BUSINESS_CONFIG.udyamRegistration}</div>
              <div>
                <strong>Support Channel:</strong>{' '}
                <Link to="/order/support" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
                  24x7 Digital In-App Support Chat & Automated Refund Desk
                </Link>
              </div>
              <div><strong>Customer Support Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: 'inherit' }}>{BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Support Working Hours:</strong> {BUSINESS_CONFIG.supportHours}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
