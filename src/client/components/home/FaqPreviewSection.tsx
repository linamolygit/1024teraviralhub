// src/client/components/home/FaqPreviewSection.tsx — Interactive FAQ Accordion Preview
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, ChevronRight, HelpCircle } from 'lucide-react'

const faqs = [
  {
    q: 'How do I download my digital files after payment?',
    a: 'Immediately after your payment is confirmed by Cashfree, you will be redirected to a secure download page where your file download begins with 1 click. You will also receive an email with your download token link.',
  },
  {
    q: 'Do I need an account or login to make a purchase?',
    a: 'No! We use a frictionless 1-click guest checkout system. You never have to create an account or remember a password to purchase and download our digital products.',
  },
  {
    q: 'Which UPI apps and payment methods are supported?',
    a: 'We support all major UPI apps including PhonePe, Google Pay, Paytm, BHIM, and Cred UPI, as well as all Indian debit cards, credit cards, and Net Banking via Cashfree Payments.',
  },
  {
    q: 'How long do I have to download my purchased product?',
    a: 'Your download access token remains active for 12 hours after purchase, with up to 3 retry attempts. We recommend downloading and saving the file to your device immediately upon purchase.',
  },
  {
    q: 'What if I lose my download link or my phone disconnects?',
    a: 'You can visit our Order Lookup page anytime with your order ID or email address to retrieve your order and active download link. Our support team is also available 24/7.',
  },
]

export default function FaqPreviewSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx)
  }

  return (
    <section className="section" style={{ paddingTop: '64px', paddingBottom: '64px' }}>
      <div className="container" style={{ maxWidth: '760px' }}>
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '10px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <HelpCircle size={12} /> Got Questions?
          </span>
          <h2 style={{ fontSize: 'clamp(1.5rem, 3.5vw, 2.2rem)', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>
            Frequently Asked Questions
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Everything you need to know about our digital downloads and checkout process.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.q}
                className="glass-card"
                style={{
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isOpen ? 'rgba(124, 58, 237, 0.4)' : 'var(--bg-border)'}`,
                  overflow: 'hidden',
                  transition: 'border-color 0.2s',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggle(index)}
                  style={{
                    width: '100%',
                    padding: '18px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    color: 'var(--text-primary)',
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    cursor: 'pointer',
                  }}
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={18}
                    style={{
                      transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s',
                      flexShrink: 0,
                      color: isOpen ? 'var(--brand-purple-light)' : 'var(--text-muted)',
                    }}
                  />
                </button>

                {isOpen && (
                  <div
                    style={{
                      padding: '0 20px 18px',
                      color: 'var(--text-secondary)',
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                      borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                      paddingTop: '14px',
                    }}
                  >
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <Link to="/faq" className="btn-ghost" style={{ fontSize: '0.875rem' }}>
            View All FAQs <ChevronRight size={15} />
          </Link>
        </div>
      </div>
    </section>
  )
}
