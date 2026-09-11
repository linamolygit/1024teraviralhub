// src/client/components/layout/Footer.tsx — Pixel-Accurate Multi-Column Footer with Merchant Compliance
import { Link } from 'react-router-dom'
import { ShieldCheck, Lock, CheckCircle2, Zap } from 'lucide-react'
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { PhonePeIcon, GPayIcon, PaytmIcon, UpiGenericIcon, RuPayIcon } from '../ui/UpiIcons'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

const exploreLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Explore' },
  { to: '/categories', label: 'Categories' },
  { to: '/products?sort=popular', label: 'Popular' },
  { to: '/blog', label: 'Blog' },
]

const productLinks = [
  { to: '/category/viral-images', label: 'Viral Images' },
  { to: '/category/premium-photos', label: 'Premium Photos' },
  { to: '/category/wallpapers', label: 'Wallpapers' },
  { to: '/category/creative-packs', label: 'Creative Packs' },
  { to: '/category/trending-collections', label: 'Trending Collections' },
]

const supportLinks = [
  { to: '/my-orders', label: 'My Orders & Downloads' },
  { to: '/order-lookup', label: 'Order Lookup' },
  { to: '/help', label: 'Help Center' },
  { to: '/faq', label: 'FAQ' },
  { to: '/affiliate', label: 'Affiliate Program (Earn 20%)' },
  { to: '/contact', label: 'Contact Us' },
  { to: '/about', label: 'About Us' },
]

const companyLinks = [
  { to: '/privacy-policy', label: 'Privacy Policy' },
  { to: '/terms-and-conditions', label: 'Terms & Conditions' },
  { to: '/refund-policy', label: 'Refund & Cancellation' },
  { to: '/shipping-policy', label: 'Shipping & Delivery' },
  { to: '/pricing-products', label: 'Pricing & Products' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/cookie-policy', label: 'Cookie Policy' },
]

export default function Footer() {
  const { siteName } = useSiteConfig()
  const { securedByText, logos } = usePaymentGatewayInfo()

  return (
    <footer
      style={{
        background: '#172337',
        borderTop: '1px solid #2A3B5C',
        paddingTop: '56px',
        paddingBottom: '32px',
        color: '#FFFFFF',
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Top 5-Column Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
            gap: '36px',
            marginBottom: '40px',
          }}
        >
          {/* Column 1: Brand Info & MSME Udyam Enterprise Card */}
          <div style={{ gridColumn: 'span 2', maxWidth: '340px' }}>
            <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none', marginBottom: '14px' }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  background: '#FFD200',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#172337" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M12 6L7.5 8.5V13.5L12 16L16.5 13.5V8.5L12 6Z" fill="#172337" fillOpacity="0.8"/>
                </svg>
              </div>
              <span style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                {siteName || BUSINESS_CONFIG.brandName}
              </span>
            </Link>

            <p style={{ color: '#9CA3AF', fontSize: '0.825rem', lineHeight: 1.6, marginBottom: '16px' }}>
              Your verified destination for curated high-resolution digital media, creative packs, and instant electronic deliveries.
            </p>

            {/* Official Registered Enterprise Card (Cashfree / MSME Verification) */}
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                background: 'rgba(255, 210, 0, 0.08)',
                border: '1px solid rgba(255, 210, 0, 0.28)',
                fontSize: '0.78125rem',
                color: '#E5E7EB',
                lineHeight: 1.55,
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, color: '#FFD200', marginBottom: '4px', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                <ShieldCheck size={14} /> Registered MSME Enterprise
              </div>
              <div>
                <span style={{ color: '#9CA3AF' }}>Legal Entity:</span>{' '}
                <strong style={{ color: '#FFFFFF' }}>{BUSINESS_CONFIG.legalName}</strong>
              </div>
              <div>
                <span style={{ color: '#9CA3AF' }}>Udyam Reg. No.:</span>{' '}
                <strong style={{ color: '#FFD200', fontFamily: 'monospace', letterSpacing: '0.02em' }}>
                  {BUSINESS_CONFIG.udyamRegistration}
                </strong>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#9CA3AF', marginTop: '6px', lineHeight: 1.45 }}>
                <span style={{ color: '#D1D5DB' }}>Office:</span> {BUSINESS_CONFIG.registeredOffice}
              </div>
              <div style={{ fontSize: '0.7rem', color: '#9CA3AF', marginTop: '4px' }}>
                Ministry of Micro, Small & Medium Enterprises, Govt. of India
              </div>
            </div>

            {/* Social Icons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                {
                  label: 'Facebook',
                  href: 'https://facebook.com',
                  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/6/6c/Facebook_Logo_2023.png',
                  fallbackUrl: '/assets/social/facebook-logo.png',
                  hoverBorder: '#1877F2',
                  hoverGlow: 'rgba(24, 119, 242, 0.4)',
                  imgStyle: { width: 18, height: 18, objectFit: 'contain' as const, borderRadius: '50%' },
                },
                {
                  label: 'X (Twitter)',
                  href: 'https://twitter.com',
                  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/c/ce/X_logo_2023.svg',
                  fallbackUrl: '/assets/social/x-logo.svg',
                  hoverBorder: '#FFFFFF',
                  hoverGlow: 'rgba(255, 255, 255, 0.35)',
                  imgStyle: { width: 14, height: 14, objectFit: 'contain' as const, filter: 'brightness(0) invert(1)' },
                },
                {
                  label: 'Instagram',
                  href: 'https://instagram.com',
                  iconUrl: 'https://upload.wikimedia.org/wikipedia/commons/9/95/Instagram_logo_2022.svg',
                  fallbackUrl: '/assets/social/instagram-logo.svg',
                  hoverBorder: '#E1306C',
                  hoverGlow: 'rgba(225, 48, 108, 0.4)',
                  imgStyle: { width: 18, height: 18, objectFit: 'contain' as const, borderRadius: 4 },
                },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    background: '#23334E',
                    border: '1px solid #2A3B5C',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textDecoration: 'none',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = s.hoverBorder
                    e.currentTarget.style.boxShadow = `0 2px 10px ${s.hoverGlow}`
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = '#2A3B5C'
                    e.currentTarget.style.boxShadow = 'none'
                    e.currentTarget.style.transform = 'none'
                  }}
                >
                  <img
                    src={s.iconUrl}
                    alt={s.label}
                    onError={(e) => {
                      const target = e.currentTarget
                      if (target.src !== window.location.origin + s.fallbackUrl) {
                        target.src = s.fallbackUrl
                      }
                    }}
                    style={s.imgStyle}
                    loading="lazy"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Column 2: Explore */}
          <div>
            <h4 style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#878787', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Explore
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {exploreLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ color: '#FFFFFF', fontSize: '0.825rem', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD200')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Products */}
          <div>
            <h4 style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#878787', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Products
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {productLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ color: '#FFFFFF', fontSize: '0.825rem', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD200')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Support & Info */}
          <div>
            <h4 style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#878787', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Support & Info
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {supportLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ color: '#FFFFFF', fontSize: '0.825rem', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD200')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 5: Legal & Policies */}
          <div>
            <h4 style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 700, fontSize: '0.78rem', color: '#878787', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '16px' }}>
              Legal Policies
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {companyLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to}
                    style={{ color: '#FFFFFF', fontSize: '0.825rem', textDecoration: 'none', transition: 'color 0.18s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = '#FFD200')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = '#FFFFFF')}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Payment & Security Verification Trust Strip */}
        <div
          style={{
            borderTop: '1px solid #2A3B5C',
            paddingTop: '20px',
            paddingBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          {/* Payment Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: '#9CA3AF', fontWeight: 600 }}>Accepted Payments:</span>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <PhonePeIcon size={24} />
              <GPayIcon size={24} />
              <PaytmIcon size={24} />
              <UpiGenericIcon size={24} />
              <RuPayIcon size={24} />
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: '#23334E',
                  border: '1px solid #2A3B5C',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  color: '#FFFFFF',
                }}
              >
                Cards / NetBanking
              </span>
            </div>
          </div>

          {/* Security & Cashfree Compliance Trust Badges */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.75rem', color: '#9CA3AF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#10B981" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} color="#10B981" />
              <span>PCI-DSS Compliant</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <CheckCircle2 size={14} color="#FFD200" />
              <span>{securedByText}</span>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: 2 }}>
                {logos.map((logo) => (
                  <div
                    key={logo.name}
                    style={{
                      height: 20,
                      padding: '1px 6px',
                      borderRadius: 4,
                      background: '#FFFFFF',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={logo.name}
                  >
                    <img
                      src={logo.src}
                      alt={logo.alt}
                      style={{ height: 13, maxWidth: 52, objectFit: 'contain' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Comprehensive Legal & Entity Ownership Disclaimer */}
        <div
          style={{
            borderTop: '1px solid #2A3B5C',
            paddingTop: '20px',
            textAlign: 'center',
          }}
        >
          <p style={{ color: '#9CA3AF', fontSize: '0.78125rem', lineHeight: 1.6, margin: '0 0 8px' }}>
            © {new Date().getFullYear()} <strong>{siteName || BUSINESS_CONFIG.brandName}</strong>. All rights reserved.
            {' • '}
            Owned, operated and managed by <strong>{BUSINESS_CONFIG.legalName}</strong> (Govt. of India MSME / Udyam Reg. No.:{' '}
            <strong style={{ color: '#FFD200', fontFamily: 'monospace' }}>{BUSINESS_CONFIG.udyamRegistration}</strong>).
          </p>
          <p style={{ color: '#6B7280', fontSize: '0.71875rem', margin: 0, lineHeight: 1.5 }}>
            All commercial contracts, digital fulfillment, and payment gateway transactions are processed under the legal entity name <strong>{BUSINESS_CONFIG.legalName}</strong>.
            All digital downloads are subject to our verified <Link to="/terms-and-conditions" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Terms & Conditions</Link>,{' '}
            <Link to="/refund-policy" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Refund Policy</Link>, and{' '}
            <Link to="/shipping-policy" style={{ color: '#9CA3AF', textDecoration: 'underline' }}>Shipping & Digital Delivery Policy</Link>.
          </p>
        </div>
      </div>
    </footer>
  )
}
