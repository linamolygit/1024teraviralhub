// src/client/components/about/SupportCtaSection.tsx — Need Help Support CTA
import { HelpCircle, Mail, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function SupportCtaSection() {
  return (
    <section className="section" style={{ padding: '56px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '920px' }}>
        <div
          className="glass-card"
          style={{
            padding: '36px 32px',
            borderRadius: 'var(--radius-2xl)',
            border: '1px solid var(--bg-border)',
            background: 'var(--bg-surface)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '24px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <HelpCircle size={20} color="#111827" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Need Help?
              </h3>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0, maxWidth: '440px', lineHeight: 1.5 }}>
              Find quick answers to download validity and file formats in our FAQ, or get in touch with our support desk.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link
              to="/faq"
              className="btn-ghost"
              style={{
                padding: '12px 20px',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <HelpCircle size={15} /> Visit Help & FAQ
            </Link>

            <Link
              to="/contact"
              className="btn-primary"
              style={{
                padding: '12px 22px',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
              }}
            >
              <Mail size={15} /> Contact Us <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
