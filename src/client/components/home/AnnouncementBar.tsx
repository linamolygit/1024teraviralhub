// src/client/components/home/AnnouncementBar.tsx
import { Zap, ShieldCheck, Clock } from 'lucide-react'

export default function AnnouncementBar() {
  return (
    <div
      style={{
        background: 'linear-gradient(90deg, rgba(124, 58, 237, 0.15) 0%, rgba(95, 37, 159, 0.25) 50%, rgba(124, 58, 237, 0.15) 100%)',
        borderBottom: '1px solid rgba(124, 58, 237, 0.25)',
        padding: '7px 16px',
        fontSize: '0.78125rem',
        fontWeight: 600,
        color: 'var(--text-secondary)',
        textAlign: 'center',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          flexWrap: 'wrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--brand-purple-light)' }}>
          <Zap size={13} fill="currentColor" /> Instant Digital Delivery
        </span>
        <span style={{ opacity: 0.3 }} className="hide-mobile">•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ShieldCheck size={13} color="var(--success)" /> Verified Cashfree & UPI Payments
        </span>
        <span style={{ opacity: 0.3 }} className="hide-mobile">•</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="hide-mobile">
          <Clock size={13} color="var(--brand-amber)" /> 12-Hour Authorized Access Window
        </span>
      </div>
    </div>
  )
}
