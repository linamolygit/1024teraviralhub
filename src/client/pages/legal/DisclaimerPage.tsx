import { useSiteConfig } from '../../lib/site-config'

export default function DisclaimerPage() {
  const { siteName } = useSiteConfig()

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title" style={{ marginBottom: 12 }}>Disclaimer</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Last Updated: August 2026</p>

        <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>1. General Information</h2>
            <p>The information, digital products, and materials on {siteName} are provided on an "as is" and "as available" basis without warranties of any kind, either express or implied.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>2. Results & Earnings Disclaimer</h2>
            <p>Any templates, design frameworks, or educational guides offered are tools designed to assist you. We do not guarantee specific business outcomes, viral performance, or earnings through their use.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>3. Third-Party Trademarks</h2>
            <p>Product previews and templates may reference software tools (e.g. Canva, Figma, Photoshop) for compatibility demonstration. All product and company names are trademarks™ or registered® trademarks of their respective holders. Use of them does not imply any affiliation or endorsement.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
