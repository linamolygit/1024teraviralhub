// src/client/components/about/TransparencySection.tsx — Trust & Legal Transparency Hub
import { ShieldCheck, FileText, RefreshCw, HelpCircle, AlertCircle, ArrowUpRight, Zap, Tag } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function TransparencySection() {
  const policies = [
    {
      title: 'Privacy Policy',
      desc: 'How we respect your privacy and protect customer information during checkout.',
      link: '/privacy-policy',
      icon: <ShieldCheck size={20} color="var(--success)" />,
    },
    {
      title: 'Terms & Conditions',
      desc: 'Clear terms governing digital purchases, usage licenses, and platform rules.',
      link: '/terms-and-conditions',
      icon: <FileText size={20} color="#111827" />,
    },
    {
      title: 'Refund & Cancellation',
      desc: 'Standard 5–7 working days refund policy, dispute handling, and eligibility.',
      link: '/refund-policy',
      icon: <RefreshCw size={20} color="var(--brand-amber)" />,
    },
    {
      title: 'Shipping & Delivery',
      desc: 'Instant digital delivery timeline (0–5 mins), download token policy, and ₹0 shipping fees.',
      link: '/shipping-policy',
      icon: <Zap size={20} color="#1162F2" />,
    },
    {
      title: 'Pricing & Products',
      desc: 'Transparent pricing in INR, tax disclosure, and commercial entity billing terms.',
      link: '/pricing-products',
      icon: <Tag size={20} color="#008444" />,
    },
    {
      title: 'Disclaimer',
      desc: 'Important notices regarding digital deliverables, third-party software, and license scopes.',
      link: '/disclaimer',
      icon: <AlertCircle size={20} color="#EC4899" />,
    },
    {
      title: 'Help & FAQ Desk',
      desc: 'Direct answers to download recovery, payment troubleshooting, and file formats.',
      link: '/faq',
      icon: <HelpCircle size={20} color="#3B82F6" />,
    },
  ]

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>Trust & Compliance</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.15rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            Built With Transparency in Mind
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '560px', margin: '8px auto 0' }}>
            We believe digital commerce should be fully transparent and verifiable. Review our official policies anytime.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '18px',
          }}
        >
          {policies.map((p) => (
            <Link
              key={p.title}
              to={p.link}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="glass-card"
                style={{
                  padding: '24px 20px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  background: 'var(--bg-surface)',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  transition: 'border-color 0.2s ease, transform 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--brand-purple)'
                  e.currentTarget.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--bg-border)'
                  e.currentTarget.style.transform = 'translateY(0)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {p.icon}
                  </div>
                  <ArrowUpRight size={16} color="var(--text-muted)" />
                </div>

                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  {p.title}
                </h3>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', lineHeight: 1.5, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
