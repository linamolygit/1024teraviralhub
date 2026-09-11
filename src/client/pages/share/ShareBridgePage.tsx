// src/client/pages/share/ShareBridgePage.tsx — High-Speed Anti-Spam & User-Activation Bridge
// Converts in-app browser landings into genuine user gestures to guarantee unmuted video autoplay!

import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Sparkles, ShieldCheck, Zap, ArrowRight, Volume2 } from 'lucide-react'
import { api } from '../../lib/api'
import { formatPrice } from '../../lib/utils'

export default function ShareBridgePage() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()

  const [loading, setLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState(false)
  const [countdown, setCountdown] = useState(3)
  const hasNavigated = useRef(false)

  // Fetch product data for this share link
  useEffect(() => {
    if (!uid) {
      navigate('/', { replace: true })
      return
    }

    let isMounted = true
    api.share.getByUid(uid)
      .then((res) => {
        if (!isMounted) return
        if (res?.success && res.product) {
          setProduct(res.product)
          setLoading(false)
        } else {
          setError(true)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('[Share Bridge Error]', err)
        if (isMounted) {
          setError(true)
          setLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [uid, navigate])

  // Handle User Activation & Unmuted Autoplay Navigation
  const handleActivateAndNavigate = useCallback(() => {
    if (hasNavigated.current || !product) return
    hasNavigated.current = true

    // 🚀 BROWSER USER GESTURE GRANTED: Mark session so ProductGallery plays unmuted video immediately!
    try {
      sessionStorage.setItem('tvh_unmute_video', 'true')
      sessionStorage.setItem('tvh_from_share', 'true')
      sessionStorage.setItem('tvh_share_uid', uid || '')
    } catch { }

    const targetUrl = `/product/${product.slug}?ref=share&uid=${encodeURIComponent(uid || '')}&play=1`
    navigate(targetUrl, { replace: true })
  }, [product, uid, navigate])

  // Smooth fallback countdown: If user doesn't tap, auto-navigate after 2.5 seconds
  useEffect(() => {
    if (!product || hasNavigated.current) return

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          handleActivateAndNavigate()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [product, handleActivateAndNavigate])

  if (error) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#090D16',
          color: '#FFFFFF',
          padding: 20,
          textAlign: 'center',
        }}
      >
        <div style={{ maxWidth: 400 }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 8 }}>
            Shared Link Expired or Invalid
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.88rem', marginBottom: 20 }}>
            This share link could not be resolved. Explore our trending viral assets on the storefront.
          </p>
          <button
            onClick={() => navigate('/products', { replace: true })}
            style={{
              padding: '12px 24px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #1162F2, #7C3AED)',
              color: '#FFFFFF',
              fontWeight: 700,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Explore All Products
          </button>
        </div>
      </div>
    )
  }

  const effectivePrice = product?.sale_price ?? product?.price ?? 0
  const originalPrice = product?.price ?? 0
  const hasDiscount = product?.sale_price && product.sale_price < product.price

  const thumbnailUrl = product?.thumbnail_key
    ? (product.thumbnail_key.startsWith('http')
        ? product.thumbnail_key
        : `/api/images/${encodeURIComponent(product.thumbnail_key)}`)
    : '/assets/collection-section-image.png'

  return (
    <div
      onClick={handleActivateAndNavigate}
      style={{
        minHeight: '100vh',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(ellipse at 50% 30%, rgba(17, 98, 242, 0.18) 0%, rgba(9, 13, 22, 0.98) 75%), #090D16',
        color: '#FFFFFF',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
      }}
    >
      {/* Background Animated Gradient Glow */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124, 58, 237, 0.25) 0%, rgba(17, 98, 242, 0.12) 50%, transparent 80%)',
          filter: 'blur(60px)',
          pointerEvents: 'none',
        }}
      />

      {/* Main High-Conversion Launch Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 420,
          borderRadius: 24,
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(17, 98, 242, 0.2)',
          padding: '24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          position: 'relative',
          zIndex: 2,
        }}
      >
        {/* Brand Verified Header Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 12px',
            borderRadius: 999,
            background: 'rgba(17, 98, 242, 0.15)',
            border: '1px solid rgba(17, 98, 242, 0.35)',
            fontSize: '0.74rem',
            fontWeight: 700,
            color: '#60A5FA',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          <ShieldCheck size={14} color="#60A5FA" />
          <span>Verified Media Asset</span>
        </div>

        {/* Thumbnail Preview with Play Icon Overlay */}
        <div
          style={{
            width: '100%',
            height: 210,
            borderRadius: 16,
            overflow: 'hidden',
            position: 'relative',
            marginBottom: 18,
            background: '#0B1120',
            border: '1px solid rgba(255, 255, 255, 0.08)',
          }}
        >
          {loading ? (
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.4)',
                fontSize: '0.85rem',
              }}
            >
              <Sparkles size={24} className="animate-spin" style={{ color: '#1162F2' }} />
            </div>
          ) : (
            <>
              <img
                src={thumbnailUrl}
                alt={product?.title || 'Product'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: 'block',
                }}
              />
              {/* Play Badge */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(9,13,22,0.85) 0%, rgba(9,13,22,0.1) 60%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, rgba(17,98,242,0.9), rgba(124,58,237,0.9))',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 0 25px rgba(17,98,242,0.6)',
                    border: '2px solid rgba(255,255,255,0.4)',
                  }}
                >
                  <Play size={24} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: 3 }} />
                </div>
              </div>

              {/* Sound Enabled Pill Indicator */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 10px',
                  borderRadius: 999,
                  background: 'rgba(0,0,0,0.65)',
                  backdropFilter: 'blur(8px)',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: '#10B981',
                  border: '1px solid rgba(16,185,129,0.3)',
                }}
              >
                <Volume2 size={13} />
                <span>Audio Ready</span>
              </div>
            </>
          )}
        </div>

        {/* Product Title */}
        <h1
          style={{
            fontSize: '1.18rem',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.35,
            marginBottom: 8,
            letterSpacing: '-0.01em',
            minHeight: 32,
          }}
        >
          {loading ? 'Preparing Digital Media...' : product?.title}
        </h1>

        {/* Price & Deal Pill */}
        {!loading && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}
          >
            <span style={{ fontSize: '1.35rem', fontWeight: 900, color: '#10B981' }}>
              {formatPrice(effectivePrice, product?.currency)}
            </span>
            {hasDiscount && (
              <span
                style={{
                  fontSize: '0.92rem',
                  color: 'rgba(255,255,255,0.4)',
                  textDecoration: 'line-through',
                }}
              >
                {formatPrice(originalPrice, product?.currency)}
              </span>
            )}
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 800,
                color: '#38BDF8',
                background: 'rgba(56, 189, 248, 0.12)',
                padding: '2px 8px',
                borderRadius: 6,
                border: '1px solid rgba(56, 189, 248, 0.25)',
              }}
            >
              Instant 1-Click
            </span>
          </div>
        )}

        {/* Main Pulsing Interactive Button — Triggers user gesture */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          animate={{
            boxShadow: [
              '0 0 15px rgba(17, 98, 242, 0.4)',
              '0 0 35px rgba(124, 58, 237, 0.7)',
              '0 0 15px rgba(17, 98, 242, 0.4)',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          onClick={(e) => {
            e.stopPropagation()
            handleActivateAndNavigate()
          }}
          style={{
            width: '100%',
            padding: '16px 20px',
            borderRadius: 16,
            background: 'linear-gradient(135deg, #1162F2 0%, #7C3AED 100%)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            color: '#FFFFFF',
            fontSize: '1.02rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            letterSpacing: '0.01em',
          }}
        >
          <Play size={18} fill="#FFFFFF" />
          <span>Tap to View Product & Watch Video</span>
          <ArrowRight size={18} />
        </motion.button>

        {/* User Guidance / Fallback Timer */}
        <div
          style={{
            marginTop: 14,
            fontSize: '0.76rem',
            color: 'rgba(255, 255, 255, 0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Zap size={12} color="#F59E0B" />
          <span>
            Tap anywhere to open • Auto-redirecting in {countdown}s
          </span>
        </div>
      </motion.div>
    </div>
  )
}
