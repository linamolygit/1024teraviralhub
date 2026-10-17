// src/client/pages/legal/RefundPage.tsx — Official Refund & Cancellation Policy (Light Theme & Cashfree Compliant)
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import { CheckCircle2, Clock, ShieldCheck, ArrowRight, RotateCcw } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function RefundPage() {
  const { siteName, supportEmail } = useSiteConfig()
  const { name: gatewayName, fullName: gatewayFullName } = usePaymentGatewayInfo()

  useEffect(() => {
    document.title = `Refund & Cancellation Policy — ${siteName || '1024 Tera Viral Hub'}`
  }, [siteName])

  return (
    <div style={{ minHeight: '100vh', background: '#F8FAFC', color: '#0F172A', padding: '48px 16px 80px' }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#64748B', marginBottom: '16px' }}>
          <Link to="/" style={{ color: '#64748B', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: '#1162F2', fontWeight: 600 }}>Refund & Cancellation Policy</span>
        </div>

        <h1 style={{ fontSize: 'clamp(2rem, 3.5vw, 2.6rem)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: '8px' }}>
          Refund & Cancellation Policy
        </h1>
        <p style={{ color: '#64748B', marginBottom: '28px', fontSize: '0.925rem' }}>
          Last Updated: October 2026 • Official Merchant Policy for <strong>{siteName || '1024 Tera Viral Hub'}</strong>
        </p>

        {/* Highlights Row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '14px',
            marginBottom: '32px',
          }}
        >
          {[
            { icon: <Clock size={20} color="#1D4ED8" />, title: '5–7 Business Days', desc: 'Direct refund turnaround time', bg: '#EFF6FF', border: '#BFDBFE' },
            { icon: <ShieldCheck size={20} color="#16A34A" />, title: 'Original Payment Source', desc: 'Direct UPI/Bank reversal', bg: '#F0FDF4', border: '#86EFAC' },
            { icon: <CheckCircle2 size={20} color="#7C3AED" />, title: '100% Guaranteed', desc: 'For duplicate or corrupt debits', bg: '#FAF5FF', border: '#DDD6FE' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${item.border}`,
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: item.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0F172A' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.78125rem', color: '#64748B' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Document Body (Clean Light Theme) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '16px',
            padding: '40px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '28px',
            lineHeight: 1.8,
            color: '#334155',
            fontSize: '0.95rem',
          }}
        >
          {/* Section 1 */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              1. Digital Products Policy Overview
            </h2>
            <p>
              At <strong>{siteName || '1024 Tera Viral Hub'}</strong> (accessible at <strong>1024teraviralhub.com</strong>), we offer non-tangible, irrevocable digital media goods including downloadable high-resolution wallpapers, media bundles, and creative graphic packs. Because digital files are delivered electronically immediately upon successful checkout, all transactions are generally considered final once a download token is generated.
            </p>
            <p>
              However, to ensure 100% customer trust and adhere to RBI payment aggregator guidelines, we provide a customer-friendly refund policy to protect buyers against duplicate debits, technical defects, or delivery failures.
            </p>
          </section>

          {/* Section 2 */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              2. Valid Grounds for a Full Refund
            </h2>
            <p>
              A 100% full refund or immediate replacement will be granted under any of the following circumstances:
            </p>
            <ul style={{ paddingLeft: '22px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Duplicate Payment / Double Debit:</strong> If your bank account or UPI VPA was debited more than once for the same purchase reference, the excess transaction will be refunded 100%.
              </li>
              <li>
                <strong>Corrupt or Unusable Files:</strong> If the downloaded archive or file cannot be extracted or opened, and our technical support desk is unable to provide a functional replacement within <strong>48 hours</strong> of notification.
              </li>
              <li>
                <strong>Technical Delivery Failure:</strong> If payment succeeded via Cashfree Payments or authorized gateway but no download link was generated on screen or received via email within 2 hours, and our team cannot resolve the delivery issue.
              </li>
              <li>
                <strong>Material Discrepancy:</strong> If the delivered asset is demonstrably different in content or format from the product description and live preview shown on the store.
              </li>
            </ul>
          </section>

          {/* Section 3 */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              3. Order Cancellation Policy
            </h2>
            <p>
              Since digital goods are fulfilled automatically in real time (within 0–5 minutes), orders cannot be cancelled once file access has been granted or files have been downloaded.
            </p>
            <p>
              If you placed an order accidentally or experienced an erroneous transaction, you must notify us within <strong>24 hours</strong> before downloading the digital asset to request an immediate order cancellation and full reversal.
            </p>
          </section>

          {/* Section 4 */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              4. Refund Processing Time & Settlement Mode (Turnaround Time - TAT)
            </h2>
            <p>
              Once your refund request is submitted and verified against our payment gateway logs:
            </p>
            <ul style={{ paddingLeft: '22px', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li>
                <strong>Review SLA:</strong> All dispute claims are acknowledged and desk-reviewed within <strong>24 to 48 hours (2 Days)</strong>.
              </li>
              <li>
                <strong>Settlement Turnaround Time (TAT):</strong> The refunded amount will reflect in your original payment account (UPI ID, debit/credit card, or NetBanking bank account via <strong>Cashfree Payments India Pvt. Ltd.</strong>) within <strong>5 to 7 business days</strong>, subject to standard bank clearance cycles.
              </li>
              <li>
                <strong>Refund Mode:</strong> In strict compliance with Reserve Bank of India (RBI) regulations, all refunds are credited directly back to the original source of payment (original UPI handle or bank account). No third-party transfers or cash payments are permitted.
              </li>
            </ul>
          </section>

          {/* Section 5: Automated Portal */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              5. How to File a Refund Request
            </h2>
            <p>
              To file a refund or cancellation claim, you can use our 24x7 automated self-service refund desk or email our support desk at <a href={`mailto:${supportEmail}`} style={{ color: '#1162F2', fontWeight: 700 }}>{supportEmail}</a>:
            </p>

            <div
              style={{
                marginTop: '14px',
                marginBottom: '18px',
                background: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                borderRadius: '12px',
                padding: '20px 24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div style={{ fontWeight: 800, fontSize: '1rem', color: '#1E3A8A' }}>
                🚀 Automated Self-Service Refund Portal (Recommended)
              </div>
              <p style={{ margin: 0, fontSize: '0.875rem', color: '#334155', lineHeight: 1.6 }}>
                Submit your Order Number, 12-digit Bank/UPI UTR Number, and destination UPI ID. Submissions are verified within 24–48 hours, and refunds are credited directly to your account within 5–7 business days.
              </p>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <Link
                  to="/refund-request"
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: 'linear-gradient(135deg, #1162F2 0%, #1D4ED8 100%)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 4px 12px rgba(17, 98, 242, 0.25)',
                  }}
                >
                  <RotateCcw size={16} /> File Instant Refund Claim (UTR) →
                </Link>
                <Link
                  to="/order/support"
                  style={{
                    padding: '11px 20px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1.5px solid #CBD5E1',
                    color: '#1E293B',
                    fontWeight: 700,
                    fontSize: '0.9rem',
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

            <p style={{ marginTop: '10px', fontSize: '0.9rem' }}>
              Required verification credentials:
            </p>
            <ol style={{ paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>Your Order Reference Number (e.g. <code>OD32876...</code> or <code>TVH-...</code>)</li>
              <li>12-Digit Bank / UPI UTR Transaction Reference Number from your payment app</li>
              <li>Your Destination UPI ID for direct payout transfer</li>
              <li>A clear description and reason for your claim</li>
            </ol>
          </section>

          {/* ── Official Cashfree Merchant & RBI Payment Settlement Compliance ── */}
          <section
            style={{
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              borderRadius: '14px',
              padding: '24px',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.06)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#166534', fontWeight: 800, fontSize: '1.05rem', marginBottom: '8px' }}>
              <ShieldCheck size={22} color="#16A34A" />
              <span>Official Cashfree Merchant & RBI Payment Settlement Disclosure</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#14532D', lineHeight: 1.6, margin: '0 0 14px 0' }}>
              All online payment collections, customer checkouts, and refund reversals on <strong>{siteName || '1024 Tera Viral Hub'}</strong> (accessible at <strong>1024teraviralhub.com</strong>) are processed in authorized partnership with <strong>Cashfree Payments India Pvt. Ltd.</strong> under RBI Master Directions for Payment Aggregators (PA).
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '10px',
                fontSize: '0.825rem',
                color: '#1E293B',
                background: '#FFFFFF',
                padding: '16px',
                borderRadius: '10px',
                border: '1px solid #DCFCE7',
              }}
            >
              <div>
                <span style={{ color: '#64748B' }}>Registered Merchant Legal Entity:</span>{' '}
                <strong style={{ color: '#0F172A' }}>RISHAV MEDIA</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Trade & Website Name:</span>{' '}
                <strong style={{ color: '#0F172A' }}>1024 Tera Viral Hub</strong> (1024teraviralhub.com)
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Govt. MSME / Udyam Reg. No.:</span>{' '}
                <strong style={{ color: '#D97706', fontFamily: 'monospace' }}>UDYAM-BR-11-0107325</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Payment Gateway Partner:</span>{' '}
                <strong style={{ color: '#1D4ED8' }}>Cashfree Payments India Pvt. Ltd. (PCI-DSS Level 1)</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Refund Settlement Turnaround:</span>{' '}
                <strong style={{ color: '#15803D' }}>5 to 7 business days directly to original payment source</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Verification Review SLA:</span>{' '}
                <strong style={{ color: '#B45309' }}>24 to 48 hours via automated dispute desk</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Official Compliance Email:</span>{' '}
                <strong style={{ color: '#0F172A' }}>support@1024teraviralhub.com</strong>
              </div>
              <div>
                <span style={{ color: '#64748B' }}>Registered Office:</span>{' '}
                <span>Flat No. 25, Rishav Media Office, Block Road, Ghorasahan, Motihari, Bihar - 845303</span>
              </div>
            </div>
          </section>

          {/* Section 6: Customer Support & Grievance Contact */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A', marginBottom: '8px' }}>
              6. Customer Support & Grievance Redressal
            </h2>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: '20px', borderRadius: '12px', fontSize: '0.875rem', lineHeight: 1.7 }}>
              <div><strong>Merchant Operating Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Operations & Grievance Desk:</strong> {BUSINESS_CONFIG.grievanceOfficer}</div>
              <div>
                <strong>Customer Support Channel:</strong>{' '}
                <Link to="/order/support" style={{ color: '#1162F2', fontWeight: 700, textDecoration: 'underline' }}>
                  24x7 Digital In-App Support Chat & Automated Refund Desk
                </Link>
              </div>
              <div><strong>Customer Support Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: '#1162F2', fontWeight: 700 }}>{BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Operating Hours:</strong> Monday – Sunday: 24/7 Digital Operations Desk</div>
              <div><strong>Resolution Turnaround:</strong> Acknowledged within 24 hours, resolved within 5–7 business days</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
