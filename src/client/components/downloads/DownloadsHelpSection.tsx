// src/client/components/downloads/DownloadsHelpSection.tsx — Need Help Section
import { HelpCircle, Mail, FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useSiteConfig } from '../../lib/site-config'

export default function DownloadsHelpSection() {
  const { supportEmail } = useSiteConfig()

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
        gap: '20px',
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <HelpCircle size={18} color="#111827" />
          <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            Need Assistance with Your Download?
          </h4>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
          Having trouble opening your archive or experiencing network disruptions? Our support desk responds within 24 hours.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <Link to="/order-lookup" className="btn-ghost" style={{ padding: '10px 18px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileQuestion size={14} /> Look Up by Email
        </Link>
        <Link to="/contact" className="btn-primary" style={{ padding: '10px 18px', fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Mail size={14} /> Contact Support
        </Link>
      </div>
    </div>
  )
}
