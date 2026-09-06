// src/client/pages/legal/CookiePolicyPage.tsx
export default function CookiePolicyPage() {
  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 800 }}>
        <h1 className="section-title" style={{ marginBottom: 12 }}>Cookie Policy</h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: 32 }}>Last Updated: August 2026</p>

        <div className="glass-card" style={{ padding: '36px', display: 'flex', flexDirection: 'column', gap: 24, lineHeight: 1.8, color: 'var(--text-secondary)' }}>
          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>1. What Are Cookies</h2>
            <p>Cookies and session storage items are small data fragments stored on your device that help our website remember your session parameters, marketing referral channels (UTM tags), and shopping preferences.</p>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>2. Cookies We Use</h2>
            <ul style={{ paddingLeft: 20, marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <li><strong>Essential Session Storage:</strong> Stores temporary transaction identifiers and UTM attribution across checkout steps.</li>
              <li><strong>Analytics Cookies:</strong> Meta Pixel & performance cookies that assist in measuring marketing effectiveness.</li>
              <li><strong>Security & Authentication:</strong> Firebase token verification for administrative access protection.</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>3. Managing Preferences</h2>
            <p>You can configure your browser to block or delete cookies. Note that disabling essential cookies may impact checkout session redirection and download token lookup.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
