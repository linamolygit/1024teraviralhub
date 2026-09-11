// src/client/pages/static/FaqPage.tsx
import { Link } from 'react-router-dom'
import { HelpCircle } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

export default function FaqPage() {
  const { name: gatewayName, fullName: gatewayFullName } = usePaymentGatewayInfo()

  const allFaqs = [
    {
      category: 'Purchases & Downloads',
      items: [
        { q: 'How do I download my digital files after payment?', a: `Immediately after completing payment through ${gatewayName}, you will be redirected to the Payment Success page where your unique download link is ready. You can download the file right away.` },
        { q: 'How long is my download link valid?', a: 'Download links remain valid for 12 hours from the moment of purchase, allowing up to 3 download attempts for security reasons.' },
        { q: 'What happens if my download link expires?', a: 'If your 12-hour window expires before you save the files, visit the Order Lookup page or contact our support team with your order number.' },
        { q: 'Can I download files on mobile?', a: 'Yes! All download links work on mobile browsers (Chrome, Safari) as well as desktop computers.' },
      ],
    },
    {
      category: 'Payments & Security',
      items: [
        { q: 'What payment methods do you accept?', a: `We accept UPI (Google Pay, PhonePe, Paytm, BHIM), all major Indian Credit and Debit Cards (Visa, MasterCard, RuPay), and Net Banking via ${gatewayFullName}.` },
        { q: 'Is my payment secure?', a: `Yes. All payments are processed through ${gatewayFullName} with bank-grade 256-bit SSL encryption. We never store your card or bank credentials.` },
        { q: 'Do I need an account to buy?', a: 'No. You can buy any product directly with guest checkout using just your name, email, and phone number.' },
      ],
    },
    {
      category: 'Licensing & Usage',
      items: [
        { q: 'Can I use these assets commercially?', a: 'Usage rights depend on the license specified on the product page. Personal Use licenses are for private projects; Commercial licenses permit use in commercial work and client projects.' },
        { q: 'Can I redistribute or resell the files?', a: 'No. Redistribution, reselling, or sharing the raw digital assets without authorization is strictly prohibited under our terms of service.' },
      ],
    },
  ]
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 760 }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-purple" style={{ marginBottom: 12 }}>FAQ</span>
          <h1 className="section-title">Frequently Asked Questions</h1>
          <p className="section-subtitle">Everything you need to know about our digital products and downloads</p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
          {allFaqs.map(section => (
            <div key={section.category}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: 16, color: 'var(--brand-purple-light)' }}>
                {section.category}
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {section.items.map((item, i) => (
                  <details key={i} style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <summary style={{ padding: '16px 20px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9375rem', color: 'var(--text-primary)', listStyle: 'none', userSelect: 'none' }}>
                      {item.q}
                    </summary>
                    <div style={{ padding: '0 20px 16px', color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.9rem' }}>
                      {item.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: 'center', marginTop: 48 }}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>Didn't find your answer?</p>
          <Link to="/contact" className="btn-primary">Contact Support</Link>
        </div>
      </div>
    </div>
  )
}
