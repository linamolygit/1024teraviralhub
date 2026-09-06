// src/client/components/contact/FaqShortcutSection.tsx — FAQ Redirection Banner
import { HelpCircle, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function FaqShortcutSection() {
  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(95, 37, 159, 0.16) 100%)',
        border: '1px solid rgba(124, 58, 237, 0.25)',
        borderRadius: 'var(--radius-xl)',
        padding: '28px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px',
        marginBottom: '20px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <HelpCircle size={18} color="#111827" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Looking for a Quick Answer?
          </h4>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          Explore our Help & FAQ center for answers regarding instant downloads, 12-hour validity, and licensing rights.
        </p>
      </div>

      <Link
        to="/faq"
        className="btn-primary"
        style={{
          padding: '10px 20px',
          fontSize: '0.8125rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontWeight: 700,
        }}
      >
        View Help & FAQ <ArrowRight size={14} />
      </Link>
    </div>
  )
}
