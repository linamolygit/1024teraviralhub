// src/client/components/product/ProductGallery.tsx — Interactive Media Gallery & Lightbox with Progress Slider Bar
import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X, Package, Star, Check } from 'lucide-react'
import type { ProductImage } from '../../lib/api'
import OptimizedImage from '../ui/OptimizedImage'

interface Props {
  images: ProductImage[]
  title: string
  hasDiscount?: boolean
  discountPercent?: number
  inWishlist?: boolean
  onToggleWishlist?: () => void
  averageRating?: number | null
  reviewsCount?: number
}

export default function ProductGallery({
  images,
  title,
  hasDiscount,
  discountPercent,
  inWishlist = false,
  onToggleWishlist,
  averageRating,
  reviewsCount = 0,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [copiedToast, setCopiedToast] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const activeImage = images[activeIdx] || images[0]

  const nextImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (images.length > 1) {
        setActiveIdx((i) => (i + 1) % images.length)
      }
    },
    [images.length]
  )

  const prevImage = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (images.length > 1) {
        setActiveIdx((i) => (i - 1 + images.length) % images.length)
      }
    },
    [images.length]
  )

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (diff > 45) {
      nextImage()
    } else if (diff < -45) {
      prevImage()
    }
    setTouchStartX(null)
  }

  // Handle Share Click
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: window.location.href,
        })
        return
      } catch {
        // user cancelled or fallback
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2200)
    } catch {
      // ignore
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, nextImage, prevImage])

  const totalImages = Math.max(images.length, 1)
  const barWidthPct = 100 / totalImages

  return (
    <div>
      {/* ── Main Preview Frame ── */}
      <div
        className="glass-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{
          aspectRatio: '1 / 1',
          borderRadius: '16px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--bg-border)',
          cursor: activeImage ? 'zoom-in' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-surface)',
          boxShadow: 'var(--shadow-sm)',
        }}
        onClick={() => {
          if (activeImage) setLightboxOpen(true)
        }}
      >
        {activeImage ? (
          <OptimizedImage
            src={activeImage.url}
            alt={activeImage.alt_text || `${title} preview`}
            variant="large"
            priority={activeIdx === 0}
            aspectRatio="1/1"
          />
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)' }}>
            <Package size={56} style={{ margin: '0 auto 12px', opacity: 0.6 }} />
            <p style={{ fontSize: '0.875rem' }}>Digital Product Preview</p>
          </div>
        )}

        {/* Floating Top-Right Actions: Wishlist & Share */}
        <div
          style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            zIndex: 10,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Wishlist Button */}
          {onToggleWishlist && (
            <button
              type="button"
              onClick={onToggleWishlist}
              aria-label="Save to Wishlist"
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1px solid rgba(0, 0, 0, 0.06)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                color: inWishlist ? '#EF4444' : '#212121',
                transition: 'transform 0.15s ease, box-shadow 0.15s ease',
              }}
            >
              {inWishlist ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 21.3667C12 21.3667 2.25 16.1167 2.25 9.9292C2.25 8.58654 2.78337 7.29887 3.73277 6.34947C4.68217 5.40007 5.96984 4.8667 7.3125 4.8667C9.43031 4.8667 11.2444 6.02076 12 7.8667C12.7556 6.02076 14.5697 4.8667 16.6875 4.8667C18.0302 4.8667 19.3178 5.40007 20.2672 6.34947C21.2166 7.29887 21.75 8.58654 21.75 9.9292C21.75 16.1167 12 21.3667 12 21.3667Z"
                    fill="#e3122e"
                  />
                </svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M21.196 11.4057C21.3096 11.1653 22.4159 8.76955 21.1429 6.31952C21.0141 6.06366 19.7866 3.7842 17.271 3.49733C15.2327 3.26473 13.1489 4.46649 11.9896 6.56762C10.5727 4.2649 8.16313 3.11742 6.02635 3.62138C4.3139 4.03231 3.0485 5.43565 2.54083 6.84674C1.22239 10.483 4.73822 14.5612 6.06424 16.0964C8.0722 18.4224 10.3226 19.7559 11.9821 20.5312C12.467 20.3064 12.9898 20.0273 13.5278 19.6784C13.846 19.4768 14.134 19.2675 14.4068 19.0659"
                    stroke="#212121"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M18.0938 12V19.3125"
                    stroke="#212121"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M14.4375 15.6562H21.75"
                    stroke="#212121"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          )}

          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share Product"
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              color: '#212121',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M10.125 13.875L15 9"
                stroke="#212121"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M20.9716 3.95434C21.0078 3.82605 21.0091 3.69044 20.9754 3.56147C20.9417 3.4325 20.8743 3.31484 20.78 3.22059C20.6858 3.12633 20.5681 3.0589 20.4392 3.02524C20.3102 2.99157 20.1746 2.99288 20.0463 3.02903L2.04629 8.48716C1.89934 8.52863 1.76854 8.61397 1.67139 8.73177C1.57424 8.84958 1.51536 8.99422 1.50262 9.14639C1.48988 9.29855 1.52388 9.45098 1.6001 9.58329C1.67631 9.71561 1.79109 9.82151 1.9291 9.88684L10.1257 13.875L14.1138 22.0706C14.1791 22.2086 14.285 22.3234 14.4173 22.3996C14.5497 22.4758 14.7021 22.5098 14.8542 22.4971C15.0064 22.4843 15.1511 22.4255 15.2689 22.3283C15.3867 22.2312 15.472 22.1004 15.5135 21.9534L20.9716 3.95434Z"
                stroke="#212121"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Link Copied Toast Notification */}
        {copiedToast && (
          <div
            style={{
              position: 'absolute',
              top: '14px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: '#111827',
              color: '#FFFFFF',
              padding: '6px 14px',
              borderRadius: '20px',
              fontSize: '0.78125rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              zIndex: 30,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            }}
          >
            <Check size={14} color="#10B981" /> Link copied to clipboard!
          </div>
        )}

        {/* Floating Bottom-Left Rating Badge (Matching Reference: 4.8 ★ | 6) */}
        {reviewsCount > 0 && averageRating ? (
          <div
            style={{
              position: 'absolute',
              bottom: '14px',
              left: '14px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(0, 0, 0, 0.08)',
              borderRadius: '8px',
              padding: '4px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
              fontSize: '0.85rem',
              fontWeight: 800,
              color: '#111827',
              zIndex: 10,
            }}
          >
            <span>{averageRating.toFixed(1)}</span>
            <Star size={13} fill="#008444" color="#008444" />
            <span style={{ color: '#9CA3AF', fontWeight: 400 }}>|</span>
            <span style={{ color: '#4B5563', fontWeight: 600 }}>{reviewsCount}</span>
          </div>
        ) : null}

        {/* Gallery Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              aria-label="Previous image"
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.15s ease',
                zIndex: 10,
              }}
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              onClick={nextImage}
              aria-label="Next image"
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(4px)',
                border: '1px solid rgba(0, 0, 0, 0.08)',
                color: '#111827',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
                transition: 'transform 0.15s ease',
                zIndex: 10,
              }}
            >
              <ChevronRight size={22} />
            </button>
          </>
        )}
      </div>

      {/* ── Dynamic Gallery Slider Bar (Requested by User) ── */}
      {/* Black indicator that slides horizontally as user switches images */}
      <div
        style={{
          width: '100%',
          height: '3.5px',
          background: '#E5E7EB',
          borderRadius: '4px',
          overflow: 'hidden',
          margin: '14px 0 16px',
          position: 'relative',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${barWidthPct}%`,
            transform: `translateX(${activeIdx * 100}%)`,
            background: '#111827',
            borderRadius: '4px',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>

      {/* ── Thumbnail Strip ── */}
      {images.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {images.map((img, idx) => {
            const isActive = idx === activeIdx
            return (
              <button
                key={img.id}
                type="button"
                onClick={() => setActiveIdx(idx)}
                style={{
                  width: '68px',
                  height: '54px',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  padding: 0,
                  cursor: 'pointer',
                  border: `2px solid ${isActive ? '#111827' : 'var(--bg-border)'}`,
                  background: 'var(--bg-surface)',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                  opacity: isActive ? 1 : 0.65,
                }}
              >
                <OptimizedImage
                  src={img.url}
                  alt={img.alt_text || `Thumbnail ${idx + 1}`}
                  variant="thumbnail"
                  aspectRatio="68/54"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* ── Fullscreen Lightbox Modal ── */}
      {lightboxOpen && activeImage && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setLightboxOpen(false)}
        >
          <button
            type="button"
            onClick={() => setLightboxOpen(false)}
            aria-label="Close fullscreen image"
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '44px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              cursor: 'pointer',
            }}
          >
            <X size={24} />
          </button>

          <div
            style={{ position: 'relative', maxWidth: '90vw', maxHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeImage.url}
              alt={activeImage.alt_text || title}
              draggable={false}
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              style={{
                maxWidth: '90vw',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '12px',
                boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)',
                pointerEvents: 'none',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                WebkitTouchCallout: 'none',
              }}
            />
            {/* Transparent Anti-Theft Guard Shield */}
            <div
              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
              onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
              style={{
                position: 'absolute',
                inset: 0,
                zIndex: 2,
                background: 'transparent',
                cursor: 'default',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

