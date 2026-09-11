// src/client/components/product/ProductGallery.tsx — Interactive Media Gallery & Lightbox with Video Autoplay, Smooth Slide & Liquid Glass Navigation
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X, Package, Star, Check, Volume2, VolumeX, Play } from 'lucide-react'
import { api, type ProductImage } from '../../lib/api'
import OptimizedImage from '../ui/OptimizedImage'

export type GalleryMediaItem =
  | { type: 'image'; id: number | string; url: string; alt_text?: string | null; originalIndex: number }
  | { type: 'video'; id: string; url: string; isYouTube: boolean; youTubeEmbedUrl: string | null }

interface Props {
  productId?: number
  productSlug?: string
  images: ProductImage[]
  videoUrl?: string | null
  title: string
  hasDiscount?: boolean
  discountPercent?: number
  inWishlist?: boolean
  onToggleWishlist?: () => void
  averageRating?: number | null
  reviewsCount?: number
}

// Buttery smooth slide transitions with organic spring physics
const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : direction < 0 ? '-100%' : 0,
    opacity: 0.1,
    scale: 0.97,
  }),
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      x: { type: 'spring' as const, stiffness: 320, damping: 32 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  },
  exit: (direction: number) => ({
    zIndex: 0,
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0.1,
    scale: 0.97,
    transition: {
      x: { type: 'spring' as const, stiffness: 320, damping: 32 },
      opacity: { duration: 0.2 },
      scale: { duration: 0.2 },
    },
  }),
}

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const trimmed = url.trim()
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`)
    if (parsed.hostname.includes('youtube.com')) {
      const v = parsed.searchParams.get('v')
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=0&controls=0&loop=1&playlist=${v}&modestbranding=1&rel=0`
    }
    if (parsed.hostname === 'youtu.be') {
      const v = parsed.pathname.replace(/^\//, '')
      if (v) return `https://www.youtube-nocookie.com/embed/${v}?autoplay=1&mute=0&controls=0&loop=1&playlist=${v}&modestbranding=1&rel=0`
    }
  } catch { }
  return null
}

export default function ProductGallery({
  productId,
  productSlug,
  images,
  videoUrl,
  title,
  hasDiscount,
  discountPercent,
  inWishlist = false,
  onToggleWishlist,
  averageRating,
  reviewsCount = 0,
}: Props) {
  const [activeIdx, setActiveIdx] = useState(0)
  const [direction, setDirection] = useState<number>(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [lightboxImageIdx, setLightboxImageIdx] = useState(0)
  const [copiedToast, setCopiedToast] = useState(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [userInteracted, setUserInteracted] = useState(false)

  // Video playback & Audio states
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [showUnmutePill, setShowUnmutePill] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Unified media gallery sequence:
  // Slot 0: Cover Image (images[0])
  // Slot 1: High-conversion Video (if videoUrl is present)
  // Slot 2..N: Remaining gallery images
  const mediaItems = useMemo<GalleryMediaItem[]>(() => {
    const items: GalleryMediaItem[] = []
    const trimmedVideo = videoUrl?.trim()

    if (!trimmedVideo) {
      return images.map((img, idx) => ({
        type: 'image',
        id: img.id,
        url: img.url,
        alt_text: img.alt_text,
        originalIndex: idx,
      }))
    }

    const ytEmbed = getYouTubeEmbedUrl(trimmedVideo)
    const videoItem: GalleryMediaItem = {
      type: 'video',
      id: 'product-showcase-video',
      url: trimmedVideo,
      isYouTube: !!ytEmbed,
      youTubeEmbedUrl: ytEmbed,
    }

    if (images.length === 0) {
      items.push(videoItem)
    } else {
      // Slot 0: 1st image (Cover)
      items.push({
        type: 'image',
        id: images[0].id,
        url: images[0].url,
        alt_text: images[0].alt_text,
        originalIndex: 0,
      })
      // Slot 1: High-conversion video
      items.push(videoItem)
      // Slot 2..N: Remaining images
      for (let i = 1; i < images.length; i++) {
        items.push({
          type: 'image',
          id: images[i].id,
          url: images[i].url,
          alt_text: images[i].alt_text,
          originalIndex: i,
        })
      }
    }

    return items
  }, [images, videoUrl])

  const videoIdx = mediaItems.findIndex((m) => m.type === 'video')
  const hasVideo = videoIdx !== -1
  const isVideoActive = hasVideo && activeIdx === videoIdx
  const activeItem = mediaItems[activeIdx] || mediaItems[0]

  // Auto-slide from 1st image (Slot 0) to 2nd slot (Video) after 2.5 seconds
  // Or immediately switch to video unmuted if arriving from share bridge!
  useEffect(() => {
    if (!hasVideo || userInteracted || mediaItems.length <= 1) return

    const shouldStartAtVideo = typeof window !== 'undefined' && (
      sessionStorage.getItem('tvh_unmute_video') === 'true' ||
      new URLSearchParams(window.location.search).get('play') === '1'
    )

    if (shouldStartAtVideo && videoIdx !== -1) {
      setActiveIdx(videoIdx)
      setDirection(1)
      try {
        sessionStorage.removeItem('tvh_unmute_video')
      } catch { }
      return
    }

    const timer = setTimeout(() => {
      if (!userInteracted && activeIdx === 0) {
        setDirection(1)
        setActiveIdx(videoIdx)
      }
    }, 2500)

    return () => clearTimeout(timer)
  }, [hasVideo, userInteracted, activeIdx, videoIdx, mediaItems.length])

  // Mark user interaction to pause any further automatic switching
  const markUserInteracted = useCallback(() => {
    if (!userInteracted) setUserInteracted(true)
  }, [userInteracted])

  // Handle Video Autoplay & Audio Unmute attempt on slide switch
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (isVideoActive) {
      // Attempt unmuted autoplay first
      video.muted = false
      const playPromise = video.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsMuted(false)
            setShowUnmutePill(false)
            setIsPlaying(true)
          })
          .catch(() => {
            // Modern browser autoplay policy blocked unmuted audio!
            // Fall back gracefully to muted autoplay & display pulsing "Tap to Unmute" glass pill
            video.muted = true
            setIsMuted(true)
            setShowUnmutePill(true)
            video.play().then(() => setIsPlaying(true)).catch(() => { })
          })
      }
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }, [isVideoActive])

  // Toggle Mute / Unmute
  const handleToggleMute = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation()
    markUserInteracted()
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.muted = false
      setIsMuted(false)
      setShowUnmutePill(false)
      video.play().catch(() => { })
    } else {
      video.muted = true
      setIsMuted(true)
    }
  }, [isMuted, markUserInteracted])

  // Tap anywhere on video frame to unmute or play/pause
  const handleVideoFrameClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    markUserInteracted()
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      // If muted, first tap immediately activates audio!
      handleToggleMute(e)
    } else {
      // If unmuted, toggle play / pause
      if (video.paused) {
        video.play().catch(() => { })
        setIsPlaying(true)
      } else {
        video.pause()
        setIsPlaying(false)
      }
    }
  }

  const nextMedia = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      markUserInteracted()
      if (mediaItems.length > 1) {
        setDirection(1)
        setActiveIdx((i) => (i + 1) % mediaItems.length)
      }
    },
    [mediaItems.length, markUserInteracted]
  )

  const prevMedia = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      markUserInteracted()
      if (mediaItems.length > 1) {
        setDirection(-1)
        setActiveIdx((i) => (i - 1 + mediaItems.length) % mediaItems.length)
      }
    },
    [mediaItems.length, markUserInteracted]
  )

  // Touch Swipe Handling
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return
    const diff = touchStartX - e.changedTouches[0].clientX
    if (diff > 45) {
      nextMedia()
    } else if (diff < -45) {
      prevMedia()
    }
    setTouchStartX(null)
  }

  // Handle Share Click — Generates a unique share link every single time!
  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    let shareUrl = window.location.href

    try {
      if (productId) {
        const res = await api.share.create({ product_id: productId, slug: productSlug })
        if (res?.success && res.share_url) {
          shareUrl = res.share_url
        }
      }
    } catch (err) {
      console.warn('[Share Link Creation Error, falling back to direct URL]', err)
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url: shareUrl,
        })
        return
      } catch { }
    }
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedToast(true)
      setTimeout(() => setCopiedToast(false), 2200)
    } catch { }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return
      if (e.key === 'Escape') setLightboxOpen(false)
      if (e.key === 'ArrowRight' && images.length > 1) {
        setLightboxImageIdx((i) => (i + 1) % images.length)
      }
      if (e.key === 'ArrowLeft' && images.length > 1) {
        setLightboxImageIdx((i) => (i - 1 + images.length) % images.length)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [lightboxOpen, images.length])

  const totalItems = Math.max(mediaItems.length, 1)
  const barWidthPct = 100 / totalItems

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
          cursor: activeItem?.type === 'image' ? 'zoom-in' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0B0F19',
          boxShadow: 'var(--shadow-sm)',
        }}
        onClick={(e) => {
          if (activeItem?.type === 'image') {
            setLightboxImageIdx(activeItem.originalIndex ?? 0)
            setLightboxOpen(true)
          } else if (activeItem?.type === 'video') {
            handleVideoFrameClick(e)
          }
        }}
      >
        {activeItem ? (
          <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={activeIdx}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                {activeItem.type === 'image' ? (
                  <OptimizedImage
                    src={activeItem.url}
                    alt={activeItem.alt_text || `${title} preview`}
                    variant="large"
                    priority={activeIdx === 0}
                    aspectRatio="1/1"
                    containerStyle={{ width: '100%', height: '100%' }}
                  />
                ) : activeItem.isYouTube && activeItem.youTubeEmbedUrl ? (
                  <iframe
                    src={activeItem.youTubeEmbedUrl}
                    title="Product Showcase Video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ width: '100%', height: '100%', border: 'none' }}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000' }}>
                    <video
                      ref={videoRef}
                      src={activeItem.url}
                      playsInline
                      autoPlay
                      loop
                      muted={isMuted}
                      controls={false}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        display: 'block',
                      }}
                    />

                    {/* Corner Mute/Unmute Toggle Button */}
                    <button
                      type="button"
                      onClick={handleToggleMute}
                      aria-label={isMuted ? 'Unmute Video' : 'Mute Video'}
                      style={{
                        position: 'absolute',
                        top: '14px',
                        left: '14px',
                        height: '38px',
                        borderRadius: '20px',
                        background: 'rgba(15, 23, 42, 0.78)',
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        border: '1px solid rgba(255, 255, 255, 0.22)',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '0 12px',
                        cursor: 'pointer',
                        zIndex: 20,
                        boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        transition: 'transform 0.15s ease, background 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.05)'
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.92)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)'
                        e.currentTarget.style.background = 'rgba(15, 23, 42, 0.78)'
                      }}
                    >
                      {isMuted ? (
                        <>
                          <VolumeX size={17} color="#EF4444" />
                          <span>Muted</span>
                        </>
                      ) : (
                        <>
                          <Volume2 size={17} color="#10B981" />
                          <span>Sound On</span>
                        </>
                      )}
                    </button>

                    {/* Pulsing "🔊 Tap to Unmute" Glass Pill Badge */}
                    {showUnmutePill && isMuted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{
                          opacity: [0.95, 1, 0.95],
                          scale: [1, 1.05, 1],
                          y: 0,
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          ease: 'easeInOut',
                        }}
                        onClick={handleToggleMute}
                        style={{
                          position: 'absolute',
                          bottom: '20px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.92) 0%, rgba(124, 58, 237, 0.92) 100%)',
                          backdropFilter: 'blur(12px)',
                          WebkitBackdropFilter: 'blur(12px)',
                          color: '#FFFFFF',
                          border: '1.5px solid rgba(255, 255, 255, 0.35)',
                          boxShadow: '0 8px 24px rgba(17, 98, 242, 0.45)',
                          borderRadius: '30px',
                          padding: '8px 18px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          cursor: 'pointer',
                          zIndex: 25,
                          fontWeight: 800,
                          fontSize: '0.82rem',
                          letterSpacing: '0.02em',
                        }}
                      >
                        <Volume2 size={18} />
                        <span>Tap to Unmute Audio</span>
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
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

        {/* Floating Bottom-Left Rating Badge */}
        {reviewsCount > 0 && averageRating && activeItem?.type === 'image' ? (
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

        {/* Gallery Navigation Arrows with Pure Transparent Frosted Glass Optics */}
        {mediaItems.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevMedia}
              aria-label="Previous media"
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'transparent',
                backgroundColor: 'transparent',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px -1px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 15,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>
            <button
              type="button"
              onClick={nextMedia}
              aria-label="Next media"
              style={{
                position: 'absolute',
                right: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'transparent',
                backgroundColor: 'transparent',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: 'none',
                outline: 'none',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 14px -1px rgba(0, 0, 0, 0.35)',
                transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                zIndex: 15,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1.1)'
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </>
        )}
      </div>

      {/* ── Dynamic Gallery Slider Bar (Requested by User) ── */}
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
      {mediaItems.length > 1 && (
        <div
          style={{
            display: 'flex',
            gap: '10px',
            marginBottom: '16px',
            overflowX: 'auto',
            paddingBottom: '4px',
          }}
        >
          {mediaItems.map((item, idx) => {
            const isActive = idx === activeIdx

            if (item.type === 'video') {
              return (
                <button
                  key="video-slot-thumbnail"
                  type="button"
                  onClick={() => {
                    markUserInteracted()
                    setDirection(idx > activeIdx ? 1 : -1)
                    setActiveIdx(idx)
                  }}
                  style={{
                    width: '68px',
                    height: '54px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    padding: 0,
                    cursor: 'pointer',
                    border: `2px solid ${isActive ? '#1162F2' : 'var(--bg-border)'}`,
                    background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: isActive ? 1 : 0.75,
                    boxShadow: isActive ? '0 0 12px rgba(17, 98, 242, 0.4)' : 'none',
                  }}
                >
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1162F2 0%, #7C3AED 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fff',
                      boxShadow: '0 2px 8px rgba(17, 98, 242, 0.6)',
                      marginBottom: 2,
                    }}
                  >
                    <Play size={11} fill="#fff" style={{ marginLeft: 1 }} />
                  </div>
                  <span
                    style={{
                      fontSize: '0.58rem',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      color: '#93C5FD',
                      textTransform: 'uppercase',
                    }}
                  >
                    Video
                  </span>
                </button>
              )
            }

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  markUserInteracted()
                  setDirection(idx > activeIdx ? 1 : -1)
                  setActiveIdx(idx)
                }}
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
                  src={item.url}
                  alt={item.alt_text || `Thumbnail ${idx + 1}`}
                  variant="thumbnail"
                  aspectRatio="68/54"
                />
              </button>
            )
          })}
        </div>
      )}

      {/* ── Fullscreen Lightbox Modal (For Photos) ── */}
      {lightboxOpen && images[lightboxImageIdx] && (
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
              src={images[lightboxImageIdx].url}
              alt={images[lightboxImageIdx].alt_text || title}
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

          {/* Fullscreen Frosted Glass Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxImageIdx((i) => (i - 1 + images.length) % images.length)
                }}
                aria-label="Previous fullscreen image"
                style={{
                  position: 'absolute',
                  left: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  zIndex: 10,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  setLightboxImageIdx((i) => (i + 1) % images.length)
                }}
                aria-label="Next fullscreen image"
                style={{
                  position: 'absolute',
                  right: '20px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '46px',
                  height: '46px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: '1.5px solid rgba(255, 255, 255, 0.4)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
                  zIndex: 10,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(-50%) scale(1)'
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
