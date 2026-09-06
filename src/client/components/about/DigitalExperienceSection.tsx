// src/client/components/about/DigitalExperienceSection.tsx — 4-Step Experience Progression
export default function DigitalExperienceSection() {
  const steps = [
    {
      num: '01',
      title: 'Explore',
      desc: 'Browse available digital asset packs with real previews, clear file counts, and straightforward licensing details.',
    },
    {
      num: '02',
      title: 'Choose',
      desc: 'Select the exact digital package that fits your creative workflow or design requirements without signing up.',
    },
    {
      num: '03',
      title: 'Purchase',
      desc: 'Complete your purchase securely in under 30 seconds through direct PhonePe, UPI, Card, or Net Banking.',
    },
    {
      num: '04',
      title: 'Access',
      desc: 'Receive immediate 12-hour download access and download uncompressed master files straight to your device.',
    },
  ]

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>How It Works</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.15rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            From Discovery to Download
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '8px auto 0' }}>
            A streamlined 4-step path engineered for zero friction and instant fulfillment.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '20px',
            position: 'relative',
          }}
        >
          {steps.map((s) => (
            <div
              key={s.num}
              className="glass-card"
              style={{
                padding: '28px 22px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <div
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  color: 'var(--brand-purple-light)',
                  fontFamily: 'monospace',
                  letterSpacing: '0.04em',
                }}
              >
                {s.num}
              </div>

              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {s.title}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, margin: 0 }}>
                {s.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
