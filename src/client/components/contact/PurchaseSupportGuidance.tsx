// src/client/components/contact/PurchaseSupportGuidance.tsx — Customer Guidance Block
import { AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react'

export default function PurchaseSupportGuidance() {
  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        marginTop: '32px',
        marginBottom: '32px',
        background: 'var(--bg-surface)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        <Info size={18} color="#111827" />
        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          Guidance for Purchase & Download Inquiries
        </h4>
      </div>

      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '16px' }}>
        To help our team investigate and resolve your inquiry swiftly, please ensure your message includes:
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Your <strong>Order Number</strong> (e.g. ORD-12345678)</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
          <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>The email address used during payment</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--success)' }}>
          <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Product name or title of the purchased pack</span>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '0.8125rem', color: 'var(--success)' }}>
          <CheckCircle2 size={15} color="var(--success)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>Detailed description of the issue or error notice</span>
        </div>
      </div>

      {/* Security Warning */}
      <div
        style={{
          padding: '12px 14px',
          borderRadius: 'var(--radius-md)',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
          fontSize: '0.78125rem',
          color: 'var(--text-secondary)',
        }}
      >
        <ShieldAlert size={16} color="var(--error)" style={{ flexShrink: 0 }} />
        <span>
          <strong>Security Notice:</strong> Never share sensitive payment information like Card PINs, CVV codes, bank passwords, or OTPs. Our team will never ask for payment secrets.
        </span>
      </div>
    </div>
  )
}
