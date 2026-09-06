// src/client/pages/static/HelpPage.tsx
import { Link } from 'react-router-dom'
import { Download, CreditCard, RefreshCw, HelpCircle, Mail } from 'lucide-react'

export default function HelpPage() {
  const guides = [
    {
      icon: <Download size={24} color="#111827" />,
      title: 'Downloading Your Files',
      desc: 'After payment, your download link is activated for 12 hours. You can download the file up to 3 times before the security token expires.',
      action: <Link to="/order-lookup" className="btn-ghost" style={{ fontSize: '0.8125rem', marginTop: 12 }}>Order Lookup →</Link>,
    },
    {
      icon: <CreditCard size={24} color="var(--brand-amber)" />,
      title: 'Payment & Checkout',
      desc: 'We support all major Indian payment methods through Cashfree: UPI (Google Pay, PhonePe, Paytm), debit/credit cards, and net banking.',
      action: <Link to="/faq" className="btn-ghost" style={{ fontSize: '0.8125rem', marginTop: 12 }}>Payment FAQ →</Link>,
    },
    {
      icon: <RefreshCw size={24} color="var(--success)" />,
      title: 'Expired Access Re-generation',
      desc: 'If your 12-hour download window expired before you finished downloading, contact our support team with your order number to request an access extension.',
      action: <Link to="/contact" className="btn-ghost" style={{ fontSize: '0.8125rem', marginTop: 12 }}>Contact Support →</Link>,
    },
  ]

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 840 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-purple" style={{ marginBottom: 12 }}>Customer Support</span>
          <h1 className="section-title">Help Center</h1>
          <p className="section-subtitle">Find solutions and guidance for common inquiries</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 48 }}>
          {guides.map(g => (
            <div key={g.title} className="glass-card" style={{ padding: 28 }}>
              {g.icon}
              <h3 style={{ fontWeight: 700, fontSize: '1.1rem', margin: '12px 0 8px' }}>{g.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{g.desc}</p>
              {g.action}
            </div>
          ))}
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-xl)', padding: '32px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>Still need assistance?</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>Our support team typically responds in under 24 hours.</p>
          <Link to="/contact" className="btn-primary" style={{ display: 'inline-flex' }}>
            <Mail size={16} /> Open Support Ticket
          </Link>
        </div>
      </div>
    </div>
  )
}
