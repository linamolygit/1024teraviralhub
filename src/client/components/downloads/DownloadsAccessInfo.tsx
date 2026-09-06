// src/client/components/downloads/DownloadsAccessInfo.tsx — Digital Download Access Policy Info Block
import { ShieldCheck, Clock, Download, RefreshCw, KeyRound } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function DownloadsAccessInfo() {
  const points = [
    {
      icon: <Clock size={18} color="var(--brand-amber)" />,
      title: '12-Hour Access Window',
      desc: 'Each purchase grants an encrypted 12-hour download token starting immediately upon successful payment verification.',
    },
    {
      icon: <Download size={18} color="var(--success)" />,
      title: 'Up to 3 Download Attempts',
      desc: 'You can download the master files up to 3 times within the active window to ensure complete backup of your deliverables.',
    },
    {
      icon: <RefreshCw size={18} color="#111827" />,
      title: 'Order Lookup & Reconnection',
      desc: 'If you switch devices or browsers, simply enter your email and order number on the Order Lookup page to restore your active link.',
    },
    {
      icon: <KeyRound size={18} color="#3B82F6" />,
      title: 'Zero Permanent Storage Risk',
      desc: 'For digital security and copyright protection, links are automatically rotated and expire after the allotted duration.',
    },
  ]

  return (
    <div
      className="glass-card"
      style={{
        padding: '32px 24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        marginTop: '48px',
        marginBottom: '32px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
        <ShieldCheck size={20} color="#111827" />
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
          About Your Download Access
        </h3>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '20px',
        }}
      >
        {points.map((p) => (
          <div key={p.title} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--bg-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {p.icon}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {p.title}
              </div>
              <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                {p.desc}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
