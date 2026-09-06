// src/client/components/home/HeroSection.tsx — Pixel-Accurate Hero Section matching Reference Screenshot
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, TrendingUp } from 'lucide-react'
import { HERO_COLLAGE_ASSETS } from '../../data/showcase-data'
import OptimizedImage from '../ui/OptimizedImage'

// Animated 4-point Sparkle Star Component
function SparkleStar({
  style,
  delay = 0,
  size = 18,
}: {
  style: React.CSSProperties
  delay?: number
  size?: number
}) {
  return (
    <motion.div
      animate={{
        scale: [0.75, 1.25, 0.75],
        opacity: [0.35, 1, 0.35],
        rotate: [0, 90, 180],
      }}
      transition={{
        duration: 3.6,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
      style={{
        position: 'absolute',
        zIndex: 6,
        pointerEvents: 'none',
        ...style,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
          fill="#111827"
        />
      </svg>
    </motion.div>
  )
}

export default function HeroSection() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        padding: '52px 0 64px',
        background: 'radial-gradient(ellipse 70% 60% at 70% 45%, rgba(255, 210, 0, 0.08) 0%, rgba(17, 98, 242, 0.03) 45%, transparent 75%)',
      }}
    >
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '36px',
            alignItems: 'center',
          }}
        >
          {/* ── Left Column: Headline & Action Buttons ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
            style={{ maxWidth: '560px', zIndex: 10 }}
          >
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: 'var(--radius-full)',
                background: '#F1F3F6',
                border: '1px solid #E0E0E0',
                color: '#111827',
                fontSize: '0.8125rem',
                fontWeight: 700,
                marginBottom: '22px',
              }}
            >
              <TrendingUp size={14} color="#111827" />
              <span>Trending Digital Collections</span>
            </div>

            {/* Main Headline */}
            <h1
              style={{
                fontFamily: 'Manrope, Inter, sans-serif',
                fontSize: 'clamp(2.4rem, 5.2vw, 3.85rem)',
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: '-0.035em',
                color: 'var(--text-primary)',
                marginBottom: '20px',
              }}
            >
              Discover Digital Content Worth{' '}
              <span style={{ color: 'rgb(17, 98, 242)' }}>Sharing.</span>
            </h1>

            {/* Supporting Copy */}
            <p
              style={{
                fontSize: 'clamp(1rem, 2vw, 1.125rem)',
                lineHeight: 1.65,
                color: 'var(--text-secondary)',
                marginBottom: '32px',
                maxWidth: '510px',
              }}
            >
              Explore premium viral images, creative collections and digital assets. Buy instantly and download securely.
            </p>

            {/* CTA Buttons */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                flexWrap: 'wrap',
              }}
            >
              {/* Primary CTA */}
              <Link
                to="/products"
                className="btn-primary"
                style={{
                  padding: '14px 28px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  boxShadow: '0 4px 14px rgba(255, 210, 0, 0.4)',
                }}
              >
                <span>Explore Products</span>
                <ArrowRight size={17} />
              </Link>

              {/* Secondary CTA */}
              <Link
                to="/products?sort=trending"
                className="btn-ghost"
                style={{
                  padding: '14px 26px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--bg-surface)',
                  borderColor: 'var(--bg-border)',
                }}
              >
                See What's Trending
              </Link>
            </div>
          </motion.div>

          {/* ── Right Column: Pixel-Accurate Floating Collage & Glow ── */}
          <div
            style={{
              position: 'relative',
              minHeight: '540px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 1. Large Ambient Radial Glow Behind Collage */}
            <div
              style={{
                position: 'absolute',
                width: '480px',
                height: '480px',
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(17, 98, 242, 0.08) 0%, rgba(255, 210, 0, 0.05) 45%, transparent 75%)',
                filter: 'blur(55px)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />

            {/* 2. Decorative Curved Orbit Lines */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 2,
                opacity: 0.6,
              }}
              viewBox="0 0 540 540"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 50,260 C 110,70 380,30 500,150 C 560,240 490,460 270,480 C 130,490 30,400 50,260 Z"
                stroke="rgba(0, 0, 0, 0.1)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
              />
            </svg>

            {/* 3. Animated Twinkling Sparkle Stars */}
            <SparkleStar style={{ top: '6%', left: '8%' }} delay={0} size={22} />
            <SparkleStar style={{ top: '12%', right: '6%' }} delay={0.8} size={18} />
            <SparkleStar style={{ top: '46%', right: '0%' }} delay={1.4} size={16} />
            <SparkleStar style={{ bottom: '10%', right: '12%' }} delay={2.1} size={20} />
            <SparkleStar style={{ bottom: '22%', left: '6%' }} delay={1.1} size={15} />

            {/* 4. Layered 4 Floating Collage Cards */}
            <div
              style={{
                position: 'relative',
                width: '100%',
                maxWidth: '560px',
                height: '560px',
                zIndex: 4,
              }}
            >
              {/* ── CARD 1: Top-Left (Viral Photography / Mountain Landscape) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, -8, 0],
                  rotate: [-5, -3, -5],
                }}
                transition={{
                  opacity: { duration: 0.6 },
                  y: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
                  rotate: { duration: 5.2, repeat: Infinity, ease: 'easeInOut' },
                }}
                style={{
                  position: 'absolute',
                  top: '0px',
                  left: '32px',
                  width: '220px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '6px',
                  boxShadow: '0 20px 45px rgba(124, 58, 237, 0.16), 0 6px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  zIndex: 10,
                }}
              >
                <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/4', position: 'relative' }}>
                  <OptimizedImage
                    src={HERO_COLLAGE_ASSETS.mountainLandscape.image}
                    alt="Viral Photography"
                    priority={true}
                    variant="medium"
                    aspectRatio="3/4"
                  />
                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.72rem',
                      fontFamily: 'Manrope, Inter, sans-serif',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
                      zIndex: 20,
                    }}
                  >
                    {HERO_COLLAGE_ASSETS.mountainLandscape.badge}
                  </div>
                </div>
              </motion.div>

              {/* ── CARD 2: Top-Right (Creative Digital Art / Abstract Wave) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, 8, 0],
                  rotate: [4, 6, 4],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.15 },
                  y: { duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
                  rotate: { duration: 5.6, repeat: Infinity, ease: 'easeInOut', delay: 0.4 },
                }}
                style={{
                  position: 'absolute',
                  top: '12px',
                  right: '28px',
                  width: '220px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '6px',
                  boxShadow: '0 20px 45px rgba(124, 58, 237, 0.16), 0 6px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  zIndex: 2,
                }}
              >
                <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '1/1', position: 'relative' }}>
                  <OptimizedImage
                    src={HERO_COLLAGE_ASSETS.creativeDigitalArt.image}
                    alt="Creative Digital Art"
                    priority={true}
                    variant="medium"
                    aspectRatio="1/1"
                  />
                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.72rem',
                      fontFamily: 'Manrope, Inter, sans-serif',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {HERO_COLLAGE_ASSETS.creativeDigitalArt.badge}
                  </div>
                </div>
              </motion.div>

              {/* ── CARD 3: Bottom-Left (Social Media Pack / Neon City) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, 7, 0],
                  rotate: [5, 3, 5],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.3 },
                  y: { duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
                  rotate: { duration: 4.9, repeat: Infinity, ease: 'easeInOut', delay: 0.8 },
                }}
                style={{
                  position: 'absolute',
                  top: '265px',
                  left: '5px',
                  width: '210px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '6px',
                  boxShadow: '0 22px 48px rgba(124, 58, 237, 0.18), 0 6px 16px rgba(0,0,0,0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  zIndex: 3,
                }}
              >
                <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '3/4', position: 'relative' }}>
                  <OptimizedImage
                    src={HERO_COLLAGE_ASSETS.neonCity.image}
                    alt="Social Media Pack"
                    priority={true}
                    variant="medium"
                    aspectRatio="3/4"
                  />
                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.72rem',
                      fontFamily: 'Manrope, Inter, sans-serif',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {HERO_COLLAGE_ASSETS.neonCity.badge}
                  </div>
                </div>
              </motion.div>

              {/* ── CARD 4: Bottom-Right (Premium Wallpaper / Mountain Sunset Lake) ── */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{
                  opacity: 1,
                  y: [0, -7, 0],
                  rotate: [-3, -1, -3],
                }}
                transition={{
                  opacity: { duration: 0.6, delay: 0.45 },
                  y: { duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
                  rotate: { duration: 5.4, repeat: Infinity, ease: 'easeInOut', delay: 1.2 },
                }}
                style={{
                  position: 'absolute',
                  top: '270px',
                  right: '5px',
                  width: '325px',
                  background: '#FFFFFF',
                  borderRadius: '22px',
                  padding: '6px',
                  boxShadow: '0 24px 50px rgba(124, 58, 237, 0.22), 0 8px 20px rgba(0,0,0,0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.8)',
                  zIndex: 5,
                }}
              >
                <div style={{ borderRadius: '16px', overflow: 'hidden', aspectRatio: '16/10', position: 'relative' }}>
                  <OptimizedImage
                    src={HERO_COLLAGE_ASSETS.premiumWallpaper.image}
                    alt="Premium Wallpaper"
                    priority={true}
                    variant="medium"
                    aspectRatio="16/10"
                  />
                  {/* Badge */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: '#FFFFFF',
                      color: '#111827',
                      fontSize: '0.72rem',
                      fontFamily: 'Manrope, Inter, sans-serif',
                      fontWeight: 700,
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  >
                    {HERO_COLLAGE_ASSETS.premiumWallpaper.badge}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
