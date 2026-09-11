// src/client/pages/static/ContactPage.tsx — Production Contact Us & Support Page
import { useEffect } from 'react'
import { MessageSquare } from 'lucide-react'
import ContactInfoSidebar from '../../components/contact/ContactInfoSidebar'
import ContactForm from '../../components/contact/ContactForm'
import PurchaseSupportGuidance from '../../components/contact/PurchaseSupportGuidance'
import FaqShortcutSection from '../../components/contact/FaqShortcutSection'
import { useSiteConfig } from '../../lib/site-config'

export default function ContactPage() {
  const { siteName, supportEmail } = useSiteConfig()

  useEffect(() => {
    document.title = `Contact Us — ${siteName}`
  }, [siteName])

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '36px', paddingBottom: '80px' }}>
      {/* ── JSON-LD Structured Data (ContactPage) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'ContactPage',
            name: `Contact Us — ${siteName}`,
            description: `Contact ${siteName} for questions, product assistance, purchase support and general inquiries.`,
            mainEntity: {
              '@type': 'Organization',
              name: 'Rishav Media',
              alternateName: siteName,
              email: supportEmail,
              address: {
                '@type': 'PostalAddress',
                streetAddress: 'Flat No. 25, Rishav Media Office, Block Road, Ghorasahan',
                addressLocality: 'Motihari, Purbi Champaran',
                addressRegion: 'Bihar',
                postalCode: '845303',
                addressCountry: 'IN',
              },
            },
          }),
        }}
      />

      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* ── 1. Contact Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--brand-purple-light)',
            }}
          >
            <MessageSquare size={26} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.85rem, 4vw, 2.5rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Contact Us
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '540px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Have a question or need assistance? Send us a message and we'll review your request.
          </p>
        </div>

        {/* ── 2. Main 2-Column Contact Layout ── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'start',
          }}
        >
          {/* Left Column: Contact Channels & Support Info */}
          <div>
            <ContactInfoSidebar />
          </div>

          {/* Right Column: Contact Form */}
          <div>
            <ContactForm />
          </div>
        </div>

        {/* ── 3. Purchase Support Guidance ── */}
        <PurchaseSupportGuidance />

        {/* ── 4. FAQ / Help CTA ── */}
        <FaqShortcutSection />
      </div>
    </div>
  )
}
