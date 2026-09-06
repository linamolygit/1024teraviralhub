// src/client/pages/legal/PricingProductsPage.tsx — Official Pricing & Products Policy Page
import { useSiteConfig, BUSINESS_CONFIG } from '../../lib/site-config'
import { Tag, ShieldCheck, Zap, Download, CreditCard, Sparkles, HelpCircle } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function PricingProductsPage() {
  const { siteName, supportEmail } = useSiteConfig()

  return (
    <div className="section" style={{ minHeight: '80vh', padding: '48px 0 80px' }}>
      <div className="container" style={{ maxWidth: 860 }}>
        {/* Breadcrumb / Top Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Pricing & Products</span>
        </div>

        <h1 className="section-title" style={{ marginBottom: 8, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)' }}>
          Pricing & Products Policy
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 28, fontSize: '0.9rem' }}>
          Last Updated: September 2026 • Official Commerce Policy of {BUSINESS_CONFIG.legalName} ({siteName || BUSINESS_CONFIG.brandName})
        </p>

        {/* Highlight Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 12,
            marginBottom: 32,
          }}
        >
          {[
            { icon: <Tag size={16} color="#008444" />, title: '100% Transparent INR', desc: 'No hidden surcharge' },
            { icon: <Zap size={16} color="#1162F2" />, title: 'Instant Delivery', desc: 'Direct digital download' },
            { icon: <CreditCard size={16} color="#7C3AED" />, title: 'Secure Payments', desc: 'UPI, Cards & NetBanking' },
            { icon: <ShieldCheck size={16} color="#008444" />, title: 'Verified Assets', desc: '100% Virus & Malware Free' },
          ].map((item, i) => (
            <div
              key={i}
              style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: 12,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background: 'var(--bg-elevated)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {item.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Content Box */}
        <div
          className="glass-card"
          style={{
            padding: '36px',
            display: 'flex',
            flexDirection: 'column',
            gap: 28,
            lineHeight: 1.8,
            color: 'var(--text-secondary)',
            background: 'var(--bg-surface)',
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
          }}
        >
          {/* Section 1: Product Descriptions & Nature of Goods */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              1. Products & Services Description
            </h2>
            <p>
              <strong>{siteName}</strong> is a specialized online marketplace providing premium downloadable digital assets, creative kits, and creator tools.
              Our catalog includes, but is not limited to:
            </p>
            <ul style={{ paddingLeft: 22, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Viral Video Collections & Reels:</strong> Pre-cut, high-resolution vertical video packs (4K/1080p MP4) curated for social media creators and agencies.</li>
              <li><strong>Graphic Templates & Presets:</strong> Editable Canva templates, Adobe Premiere Pro & After Effects presets, Photoshop PSDs, and Figma UI/UX design systems.</li>
              <li><strong>Stock Media & Wallpapers:</strong> Ultra-HD wallpapers, royalty-free stock imagery, sound effects (SFX), and music loops.</li>
              <li><strong>Productivity Bundles & eBooks:</strong> Notion dashboards, ChatGPT / Midjourney AI prompt vaults, PLR/MRR master guides, and software bundles.</li>
            </ul>
            <div
              style={{
                marginTop: 12,
                background: 'var(--bg-elevated)',
                padding: '10px 14px',
                borderRadius: 8,
                borderLeft: '3px solid #1162F2',
                fontSize: '0.85rem',
              }}
            >
              <strong>Important:</strong> All items sold on {siteName} are strictly <strong>intangible digital downloads</strong>. No physical discs, USB drives, or parcels are shipped to your physical address.
            </div>
          </section>

          {/* Section 2: Pricing Structure & Taxes */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              2. Transparent Pricing Policy
            </h2>
            <p>
              We believe in complete transparency with zero hidden fees. Our pricing terms are as follows:
            </p>
            <ul style={{ paddingLeft: 22, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Currency:</strong> All prices displayed on our website are denominated in <strong>Indian Rupees (INR - ₹)</strong> unless explicitly stated otherwise.</li>
              <li><strong>Taxes:</strong> Displayed prices are final and inclusive of applicable taxes unless specified at checkout.</li>
              <li><strong>No Convenience Fees:</strong> We do not charge convenience fees or transaction fees on UPI or standard domestic debit card payments.</li>
              <li><strong>Promotions & Discounts:</strong> Discounted or sale prices (slashed rates) are promotional and valid for the duration indicated on the product page. Promotional coupon codes may be applied at checkout prior to payment.</li>
              <li><strong>Price Modifications:</strong> Prices for our digital products are subject to change without prior notice. However, changes will not affect orders for which payment has already been completed.</li>
            </ul>
          </section>

          {/* Section 3: Payment Methods & Gateway Security */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              3. Payment Processing & Security
            </h2>
            <p>
              Payments on {siteName || BUSINESS_CONFIG.brandName} are processed securely under the registered commercial entity <strong>{BUSINESS_CONFIG.legalName}</strong> (Govt. of India MSME / Udyam Reg. No.: <strong>{BUSINESS_CONFIG.udyamRegistration}</strong>) through RBI-compliant, PCI-DSS Level 1 certified payment aggregators (including Cashfree Payments).
              Supported payment channels include:
            </p>
            <ul style={{ paddingLeft: 22, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>UPI (Unified Payments Interface):</strong> Google Pay, PhonePe, Paytm, BHIM, CRED, and any bank UPI app.</li>
              <li><strong>Debit & Credit Cards:</strong> Visa, MasterCard, RuPay, and American Express.</li>
              <li><strong>Net Banking:</strong> Supported across 50+ leading Indian banks.</li>
              <li><strong>Wallets & PayLater:</strong> As supported by the payment gateway at checkout.</li>
            </ul>
            <p style={{ marginTop: 10 }}>
              We never store your complete card details, CVV, or UPI PIN on our servers. All transactions are encrypted via 256-bit SSL protocols and settled directly to {BUSINESS_CONFIG.legalName}.
            </p>
          </section>

          {/* Section 4: Fulfillment & Delivery Process */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              4. Order Fulfillment & Instant Delivery
            </h2>
            <p>
              Because our catalog consists entirely of digital files, delivery is instantaneous:
            </p>
            <ul style={{ paddingLeft: 22, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Immediate Redirection:</strong> Upon successful payment completion, your browser is instantly redirected to the secure order completion and download page.</li>
              <li><strong>Download Token Generation:</strong> A unique, cryptographic download access link is generated specifically for your order.</li>
              <li><strong>High-Speed Cloud Storage:</strong> Files are delivered via Cloudflare R2 high-speed Content Delivery Network (CDN) and/or verified Google Drive cloud storage access.</li>
              <li><strong>Confirmation Email:</strong> A receipt with order reference details and access instructions is automatically dispatched to your provided email address.</li>
              <li><strong>Access Validity:</strong> Direct download links remain active for <strong>12 hours</strong> with a limit of up to 3 download attempts to prevent automated hotlinking. Google Drive folder access links remain accessible permanently.</li>
            </ul>
          </section>

          {/* Section 5: Licensing & Intellectual Property */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              5. Product Licensing & Usage Rights
            </h2>
            <p>
              Every product listing clearly identifies the license tier granted upon purchase:
            </p>
            <ul style={{ paddingLeft: 22, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Standard / Personal License:</strong> For use in personal projects, personal social media profiles, and non-commercial presentations.</li>
              <li><strong>Commercial / Resell Rights (MRR/PLR):</strong> When explicitly marked as Master Resale Rights (MRR) or Private Label Rights (PLR), you may modify, rebrand, and resell the digital package according to the bundled license documentation.</li>
              <li><strong>Restrictions:</strong> Raw download links must not be publicly published or shared on torrent/piracy platforms. Unauthorized file scrapers will have their access terminated immediately.</li>
            </ul>
          </section>

          {/* Section 6: Refund & Cancellation Alignment */}
          <section>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
              6. Cancellation & Refunds
            </h2>
            <p>
              Due to the nature of digital goods which cannot be physically returned once access has been delivered, orders cannot be cancelled once payment is completed and download links are issued.
            </p>
            <p style={{ marginTop: 8 }}>
              However, if you experience corrupt archives, duplicate transactions, or file mismatches, we offer full support and replacements within 48 hours or complete refunds under our{' '}
              <Link to="/refund-policy" style={{ color: '#1162F2', fontWeight: 600 }}>Refund & Cancellation Policy</Link>.
            </p>
          </section>

          {/* Section 7: Grievance & Customer Support */}
          <section style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 20 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              <HelpCircle size={20} color="#1162F2" /> 7. Questions & Support
            </h2>
            <p>
              If you have any questions regarding our pricing, product specifications, or download access, please get in touch with our customer assistance team:
            </p>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.9rem' }}>
              <div><strong>Operating Entity:</strong> {BUSINESS_CONFIG.legalName}</div>
              <div><strong>Brand Name:</strong> {siteName || BUSINESS_CONFIG.brandName}</div>
              <div><strong>Udyam Registration:</strong> <span style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--brand-purple-light)' }}>{BUSINESS_CONFIG.udyamRegistration}</span></div>
              <div><strong>Enterprise Category:</strong> {BUSINESS_CONFIG.registrationType}</div>
              <div><strong>Operating Jurisdiction:</strong> {BUSINESS_CONFIG.operatingState}</div>
              <div><strong>Support Email:</strong> <a href={`mailto:${supportEmail || BUSINESS_CONFIG.supportEmail}`} style={{ color: '#1162F2', fontWeight: 600 }}>{supportEmail || BUSINESS_CONFIG.supportEmail}</a></div>
              <div><strong>Support Hours:</strong> {BUSINESS_CONFIG.supportHours}</div>
              <div><strong>Order Lookup:</strong> <Link to="/order-lookup" style={{ color: '#1162F2', fontWeight: 600 }}>Access Existing Orders & Downloads</Link></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
