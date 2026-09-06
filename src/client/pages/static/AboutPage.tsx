// src/client/pages/static/AboutPage.tsx — Production About Us Page
import { useEffect } from 'react'
import AboutHero from '../../components/about/AboutHero'
import BrandIntroSection from '../../components/about/BrandIntroSection'
import WhatWeOfferSection from '../../components/about/WhatWeOfferSection'
import MissionValuesSection from '../../components/about/MissionValuesSection'
import WhyChooseUsAboutSection from '../../components/about/WhyChooseUsAboutSection'
import DigitalExperienceSection from '../../components/about/DigitalExperienceSection'
import TransparencySection from '../../components/about/TransparencySection'
import SupportCtaSection from '../../components/about/SupportCtaSection'
import AboutCtaSection from '../../components/about/AboutCtaSection'
import { useSiteConfig } from '../../lib/site-config'

export default function AboutPage() {
  const { siteName, siteTagline } = useSiteConfig()

  useEffect(() => {
    document.title = `About Us — ${siteName}`
  }, [siteName])

  return (
    <div style={{ minHeight: '85vh', background: 'var(--bg-base)' }}>
      {/* ── JSON-LD Structured Data (Organization / AboutPage) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'AboutPage',
            name: `About Us — ${siteName}`,
            description: siteTagline || 'A digital platform focused on providing accessible digital products and creative resources.',
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
          }),
        }}
      />

      {/* 1. Hero Section */}
      <AboutHero />

      {/* 2. Who We Are */}
      <BrandIntroSection />

      {/* 3. What We Offer */}
      <WhatWeOfferSection />

      {/* 4. Our Mission & Platform Values */}
      <MissionValuesSection />

      {/* 5. Why Choose Us */}
      <WhyChooseUsAboutSection />

      {/* 6. 4-Step Digital Product Experience */}
      <DigitalExperienceSection />

      {/* 7. Built With Transparency in Mind (Policy Links Grid) */}
      <TransparencySection />

      {/* 8. Need Help Support CTA */}
      <SupportCtaSection />

      {/* 9. Final Explore Products CTA */}
      <AboutCtaSection />
    </div>
  )
}
