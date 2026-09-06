// src/client/components/home/FeaturedCollectionSection.tsx — Pixel-Accurate Featured Collection Banner
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Image as ImageIcon, Sparkles, Download } from 'lucide-react'
import { FEATURED_COLLECTION_ASSETS } from '../../data/showcase-data'
import OptimizedImage from '../ui/OptimizedImage'

export default function FeaturedCollectionSection() {
  return (
    <section style={{ padding: '16px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E0E0E0',
            borderRadius: '24px',
            padding: '48px 40px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '40px',
            alignItems: 'center',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {/* ── Left Content ── */}
          <div style={{ maxWidth: '500px', zIndex: 2 }}>
            {/* Pill Badge */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 14px',
                borderRadius: 'var(--radius-full)',
                background: '#F1F3F6',
                border: '1px solid #E0E0E0',
                color: 'rgb(17, 98, 242)',
                fontSize: '0.78rem',
                fontWeight: 700,
                marginBottom: '18px',
              }}
            >
              <span>Featured Collection</span>
            </div>

            {/* Title */}
            <h2
              style={{
                fontFamily: 'Manrope, Inter, sans-serif',
                fontSize: 'clamp(1.85rem, 4vw, 2.75rem)',
                fontWeight: 900,
                color: '#111827',
                lineHeight: 1.15,
                letterSpacing: '-0.03em',
                marginBottom: '14px',
              }}
            >
              Cinematic Visual Collection
            </h2>

            {/* Description */}
            <p
              style={{
                fontSize: '0.95rem',
                color: '#4B5563',
                lineHeight: 1.6,
                marginBottom: '24px',
              }}
            >
              A premium handpicked collection of cinematic visuals perfect for creators, designers and marketers.
            </p>

            {/* Metadata Pills */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                marginBottom: '32px',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  background: 'rgba(255, 255, 255, 0.75)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <ImageIcon size={14} color="#111827" />
                <span>120+ Premium Images</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  background: 'rgba(255, 255, 255, 0.75)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <Sparkles size={14} color="#111827" />
                <span>4K Ultra Quality</span>
              </div>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  color: '#4B5563',
                  background: 'rgba(255, 255, 255, 0.75)',
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                <Download size={14} color="#111827" />
                <span>Instant Download</span>
              </div>
            </div>

            {/* CTA Button */}
            <Link
              to="/products"
              className="btn-primary"
              style={{
                padding: '13px 28px',
                fontSize: '0.925rem',
                fontWeight: 700,
                borderRadius: 'var(--radius-full)',
                boxShadow: '0 4px 14px rgba(255, 210, 0, 0.4)',
              }}
            >
              <span>Explore Collection</span>
              <ArrowRight size={17} />
            </Link>
          </div>

          {/* ── Right: Overlapping Fanned-Out Cards ── */}
          <div
            style={{
              position: 'relative',
              height: '320px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Card 1 (Bottom Layer - City) */}
            <motion.div
              initial={{ opacity: 0, x: 260, rotate: 15 }}
              whileInView={{ opacity: 1, x: 0, rotate: -8 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
                delay: 0.05,
              }}
              whileHover={{ scale: 1.05, y: -6, zIndex: 10 }}
              style={{
                position: 'absolute',
                left: '5%',
                bottom: '10px',
                width: '180px',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid #FFFFFF',
                boxShadow: '0 12px 28px rgba(0,0,0,0.14)',
                zIndex: 1,
                cursor: 'pointer',
              }}
            >
              <OptimizedImage
                src={FEATURED_COLLECTION_ASSETS.city}
                alt="Cinematic City"
                variant="medium"
                aspectRatio="3/4"
              />
            </motion.div>

            {/* Card 2 (Neon City / Custom Collection Image) */}
            <motion.div
              initial={{ opacity: 0, x: 300, rotate: 18 }}
              whileInView={{ opacity: 1, x: 0, rotate: -2 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
                delay: 0.13,
              }}
              whileHover={{ scale: 1.05, y: -6, zIndex: 10 }}
              style={{
                position: 'absolute',
                left: '30%',
                top: '20px',
                width: '190px',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid #FFFFFF',
                boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                zIndex: 2,
                cursor: 'pointer',
              }}
            >
              <OptimizedImage
                src={FEATURED_COLLECTION_ASSETS.neonCity}
                alt="Collection Artwork"
                variant="medium"
                aspectRatio="3/4"
              />
            </motion.div>

            {/* Card 3 (Mountain Peaks) */}
            <motion.div
              initial={{ opacity: 0, x: 340, rotate: 22 }}
              whileInView={{ opacity: 1, x: 0, rotate: 5 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
                delay: 0.21,
              }}
              whileHover={{ scale: 1.05, y: -6, zIndex: 10 }}
              style={{
                position: 'absolute',
                right: '25%',
                bottom: '15px',
                width: '190px',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid #FFFFFF',
                boxShadow: '0 16px 36px rgba(0,0,0,0.18)',
                zIndex: 3,
                cursor: 'pointer',
              }}
            >
              <OptimizedImage
                src={FEATURED_COLLECTION_ASSETS.mountain}
                alt="Mountains"
                variant="medium"
                aspectRatio="3/4"
              />
            </motion.div>

            {/* Card 4 (Golden Landscape - Top Layer) */}
            <motion.div
              initial={{ opacity: 0, x: 380, rotate: 26 }}
              whileInView={{ opacity: 1, x: 0, rotate: 10 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                type: 'spring',
                stiffness: 120,
                damping: 14,
                mass: 0.8,
                delay: 0.29,
              }}
              whileHover={{ scale: 1.05, y: -6, zIndex: 10 }}
              style={{
                position: 'absolute',
                right: '5%',
                top: '25px',
                width: '180px',
                aspectRatio: '3/4',
                borderRadius: '16px',
                overflow: 'hidden',
                border: '3px solid #FFFFFF',
                boxShadow: '0 14px 32px rgba(0,0,0,0.15)',
                zIndex: 4,
                cursor: 'pointer',
              }}
            >
              <OptimizedImage
                src={FEATURED_COLLECTION_ASSETS.goldenLandscape}
                alt="Golden Landscape"
                variant="medium"
                aspectRatio="3/4"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  )
}
