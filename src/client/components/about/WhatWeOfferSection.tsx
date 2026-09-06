// src/client/components/about/WhatWeOfferSection.tsx — What We Offer Feature Grid
import { Image as ImageIcon, LayoutTemplate, Layers, Archive } from 'lucide-react'

export default function WhatWeOfferSection() {
  const offerings = [
    {
      icon: <ImageIcon size={24} color="#111827" />,
      title: 'Digital Images & Photography',
      desc: 'Curated high-resolution image packs and photography assets created for content creators, designers, and digital media projects.',
    },
    {
      icon: <Layers size={24} color="var(--brand-amber)" />,
      title: 'Creative Wallpapers & Backgrounds',
      desc: 'Lossless 4K visual backgrounds and mobile wallpaper collections styled with modern aesthetic palettes.',
    },
    {
      icon: <LayoutTemplate size={24} color="#3B82F6" />,
      title: 'Design Templates & Graphic Assets',
      desc: 'Ready-to-use digital templates, vector graphic collections, and creative overlays to accelerate digital production.',
    },
    {
      icon: <Archive size={24} color="var(--success)" />,
      title: 'Downloadable Asset Bundles',
      desc: 'Multi-file master ZIP packages containing organized digital media assets with straightforward personal and commercial licenses.',
    },
  ]

  return (
    <section className="section" style={{ padding: '64px 0', borderBottom: '1px solid var(--bg-border)' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        <div style={{ textAlign: 'center', marginBottom: '44px' }}>
          <span className="badge badge-purple" style={{ marginBottom: '12px' }}>Product Catalog</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3.5vw, 2.15rem)', fontWeight: 900, color: 'var(--text-primary)', lineHeight: 1.25 }}>
            What You'll Find
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '540px', margin: '8px auto 0' }}>
            A curated variety of downloadable digital assets optimized for modern creator workflows.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '24px',
          }}
        >
          {offerings.map((item) => (
            <div
              key={item.title}
              className="glass-card"
              style={{
                padding: '28px 24px',
                borderRadius: 'var(--radius-xl)',
                border: '1px solid var(--bg-border)',
                background: 'var(--bg-surface)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
                transition: 'transform 0.2s ease, border-color 0.2s ease',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </div>

              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                {item.title}
              </h3>

              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
