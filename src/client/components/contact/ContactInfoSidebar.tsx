// src/client/components/contact/ContactInfoSidebar.tsx — Real Contact Details & Support Channels
import { useState } from 'react'
import { Mail, Clock, ShieldCheck, FileQuestion, Building2, UserCheck, MapPin, Phone, Lock, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { useOrderVerification } from '../../lib/orderVerification'
import OrderVerificationModal from './OrderVerificationModal'

export default function ContactInfoSidebar() {
  const { siteName, supportEmail, showMsmeBadge } = useSiteConfig()
  const { isVerified, phone, proprietor, maskedPhone, rawPhone, verifiedOrderNumber } = useOrderVerification()
  const [showVerifyModal, setShowVerifyModal] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* 1. Official Registered Business Identity (Cashfree & Legal Verification) */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(255, 210, 0, 0.3)',
          background: 'linear-gradient(135deg, rgba(255, 210, 0, 0.05), rgba(17, 98, 242, 0.03))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#FFD200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000000',
              boxShadow: '0 2px 8px rgba(255, 210, 0, 0.35)',
            }}
          >
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#1162F2' }}>
              Registered Business Entity
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0 }}>
              {BUSINESS_CONFIG.legalName}
            </h3>
            <div style={{ fontSize: '0.8rem', color: isVerified ? '#10B981' : '#9CA3AF', fontWeight: 700, marginTop: '2px' }}>
              {isVerified ? '✓ Verified Customer Order' : 'Govt. of India MSME Registered Enterprise'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Business Name:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{BUSINESS_CONFIG.legalName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Operations Desk:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Customer Grievance Redressal Officer, RISHAV MEDIA</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Trading / Brand Name:</span>{' '}
            <strong style={{ color: 'var(--text-primary)' }}>{siteName || BUSINESS_CONFIG.brandName}</strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Primary Support:</span>{' '}
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '2px' }}>
              <Link
                to="/order/support"
                style={{
                  background: 'rgba(17, 98, 242, 0.15)',
                  border: '1px solid rgba(17, 98, 242, 0.4)',
                  color: '#93C5FD',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <MessageSquare size={12} /> 24x7 Support Chat
              </Link>
              <Link
                to="/refund-request"
                style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#FCA5A5',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                File Refund (UTR)
              </Link>
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Support Email:</span>{' '}
            <a
              href={`mailto:${BUSINESS_CONFIG.supportEmail}`}
              style={{ color: '#1162F2', fontWeight: 700, textDecoration: 'none' }}
            >
              {BUSINESS_CONFIG.supportEmail}
            </a>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Compliance / Direct Email:</span>{' '}
            <a
              href={`mailto:${BUSINESS_CONFIG.complianceEmail}`}
              style={{ color: '#1162F2', fontWeight: 700, textDecoration: 'none' }}
            >
              {BUSINESS_CONFIG.complianceEmail}
            </a>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Physical Office & Support Address:</span>
            <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '3px', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <MapPin size={16} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{BUSINESS_CONFIG.registeredOffice}</span>
            </div>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>MSME / Udyam Reg.:</span>{' '}
            <strong style={{ color: '#D97706', fontFamily: 'monospace', fontSize: '0.85rem' }}>
              {BUSINESS_CONFIG.udyamRegistration}
            </strong>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Category:</span>{' '}
            <span>{BUSINESS_CONFIG.registrationType}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Operating Jurisdiction:</span>{' '}
            <span>{BUSINESS_CONFIG.operatingState}</span>
          </div>
          <div>
            <span style={{ color: 'var(--text-muted)' }}>Office & Support Hours:</span>{' '}
            <span>{BUSINESS_CONFIG.supportHours}</span>
          </div>
        </div>
      </div>

      {/* 2. Customer Support Desk Card */}
      <div
        className="glass-card"
        style={{
          padding: '24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: 'rgba(124, 58, 237, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--brand-purple-light)',
            }}
          >
            <Mail size={20} />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Customer Support Desk
            </h3>
            <div style={{ fontSize: '0.78125rem', color: 'var(--text-muted)' }}>Direct Assistance & Inquiries</div>
          </div>
        </div>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '14px' }}>
          Send us your inquiries, licensing questions, or order assistance requests.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <a
            href={`tel:${BUSINESS_CONFIG.phone}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#1162F2',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
            }}
          >
            <Phone size={15} /> {BUSINESS_CONFIG.phone}
          </a>
          <a
            href={`mailto:${BUSINESS_CONFIG.supportEmail}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--brand-purple-light)',
              fontWeight: 700,
              fontSize: '0.9rem',
              textDecoration: 'none',
              wordBreak: 'break-all',
            }}
          >
            <Mail size={15} /> {BUSINESS_CONFIG.supportEmail}
          </a>
        </div>
      </div>

      {/* 3. Grievance Redressal Officer Card (RBI / Cashfree Mandatory Compliance) */}
      <div
        className="glass-card"
        style={{
          padding: '20px 24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--bg-border)',
          background: 'var(--bg-surface)',
          display: 'flex',
          gap: '14px',
          alignItems: 'flex-start',
        }}
      >
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10B981',
            flexShrink: 0,
          }}
        >
          <UserCheck size={18} />
        </div>
        <div>
          <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px' }}>
            Grievance Redressal Officer
          </h4>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, margin: '0 0 6px' }}>
            In accordance with IT Rules and Consumer Protection regulations:
          </p>
          <div style={{ fontSize: '0.78125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            <div><strong>Officer:</strong> Customer Grievance Redressal Officer, RISHAV MEDIA</div>
            <div>
              <strong>Support Desk:</strong>{' '}
              <Link to="/order/support" style={{ color: '#1162F2', fontWeight: 600, textDecoration: 'none' }}>
                24x7 Digital In-App Support Chat
              </Link>
            </div>
            <div><strong>Email:</strong> <a href={`mailto:${BUSINESS_CONFIG.supportEmail}`} style={{ color: '#1162F2', fontWeight: 600 }}>{BUSINESS_CONFIG.supportEmail}</a></div>
            <div><strong>Response Time:</strong> Acknowledged within 24–48 hours</div>
          </div>
        </div>
      </div>

      {/* 4. Quick Lookup Link */}
      <div
        style={{
          background: 'rgba(124, 58, 237, 0.08)',
          border: '1px solid rgba(124, 58, 237, 0.25)',
          borderRadius: 'var(--radius-xl)',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
          <FileQuestion size={16} color="#111827" /> Need an Instant Download Link?
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: '0 0 6px', lineHeight: 1.5 }}>
          If you just need to access your active 12-hour purchase link, use our self-service recovery tool.
        </p>
        <Link
          to="/order-lookup"
          style={{
            color: 'rgb(17, 98, 242)',
            fontWeight: 700,
            fontSize: '0.8125rem',
            textDecoration: 'underline',
          }}
        >
          Go to Order Lookup →
        </Link>
      </div>

      {/* Order Verification Modal */}
      <OrderVerificationModal
        isOpen={showVerifyModal}
        onClose={() => setShowVerifyModal(false)}
      />
    </div>
  )
}
