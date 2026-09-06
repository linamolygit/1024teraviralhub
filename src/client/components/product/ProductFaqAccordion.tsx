// src/client/components/product/ProductFaqAccordion.tsx — Production FAQ Accordion matching User Design
import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface Props {
  productTitle?: string
  accessHours?: number
}

export default function ProductFaqAccordion({ productTitle = 'this product', accessHours = 12 }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null)

  const faqs = [
    {
      q: 'When will I receive my download?',
      a: 'Immediately after your payment is verified via UPI (PhonePe, Google Pay, Paytm) or Card, you will be redirected to the secure download screen. Your master file download will begin with 1 click.',
    },
    {
      q: 'Do I need to create an account?',
      a: 'No account creation is required! We provide a 1-click guest purchase experience so you can buy and download in under 30 seconds.',
    },
    {
      q: 'How long is my download access available?',
      a: `Your download access link remains valid for ${accessHours} hours from completion of payment with up to 3 download attempts. We recommend downloading and backing up your files to your device or cloud immediately.`,
    },
    {
      q: 'What payment methods are available?',
      a: 'We support all major Indian & international payment options including Instant UPI (PhonePe, Google Pay, Paytm, BHIM), Debit & Credit Cards, and Net Banking with 100% bank-grade encryption.',
    },
    {
      q: 'What should I do if I have a problem downloading?',
      a: 'You can re-download up to 3 times within the active window. If you accidentally closed your browser, simply visit our Order Lookup page with your email to instantly recover your files, or reach out to our 24/7 support team.',
    },
  ]

  const toggle = (i: number) => setOpenIdx(openIdx === i ? null : i)

  return (
    <section style={{ margin: '48px 0px 64px' }}>
      <h2
        style={{
          fontFamily: 'Manrope, Inter, sans-serif',
          fontSize: 'clamp(1.5rem, 3vw, 1.85rem)',
          fontWeight: 800,
          color: 'var(--text-primary)',
          letterSpacing: '-0.025em',
          marginBottom: '24px',
        }}
      >
        Frequently Asked Questions
      </h2>

      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: '20px',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {faqs.map((faq, idx) => {
          const isOpen = openIdx === idx
          const isLast = idx === faqs.length - 1

          return (
            <div
              key={faq.q}
              style={{
                borderBottom: isLast ? 'none' : '1px solid var(--bg-border)',
                background: isOpen ? 'rgba(124, 58, 237, 0.02)' : 'transparent',
                transition: 'background-color 0.2s ease',
              }}
            >
              <button
                type="button"
                onClick={() => toggle(idx)}
                aria-expanded={isOpen}
                style={{
                  width: '100%',
                  padding: '22px 24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: 'none',
                  border: 'none',
                  color: isOpen ? 'rgb(17, 98, 242)' : 'var(--text-primary)',
                  fontFamily: 'Manrope, Inter, sans-serif',
                  fontWeight: 700,
                  fontSize: '0.975rem',
                  textAlign: 'left',
                  cursor: 'pointer',
                  gap: '16px',
                  transition: 'color 0.2s ease',
                }}
              >
                <span style={{ transition: 'color 0.2s ease' }}>{faq.q}</span>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    color: isOpen ? 'rgb(17, 98, 242)' : '#111827',
                    transform: isOpen ? 'rotate(180deg)' : 'none',
                    transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease',
                    flexShrink: 0,
                  }}
                >
                  <ChevronDown size={18} />
                </div>
              </button>

              {isOpen && (
                <div
                  style={{
                    padding: '0 24px 22px',
                    color: 'var(--text-secondary)',
                    fontSize: '0.925rem',
                    lineHeight: 1.65,
                    fontFamily: 'Inter, sans-serif',
                  }}
                >
                  {faq.a}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

