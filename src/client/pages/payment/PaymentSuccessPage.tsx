// src/client/pages/payment/PaymentSuccessPage.tsx — Premium Blinkit/PhonePe Order Placed Celebration
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Download, Clock, Copy, ShieldCheck, Headphones,
  Package, Check, ExternalLink, Sparkles, Gift
} from 'lucide-react'
import { trackPixelEvent } from '../../lib/utils'
import { saveOrderSession } from '../../lib/orderSession'
import { api } from '../../lib/api'

// ── Golden Lightning Coin SVG (PhonePe/Zepto/Blinkit Style) ──
function LightningCoin({ size = 42 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ filter: 'drop-shadow(0 4px 10px rgba(234, 179, 8, 0.45))' }}
    >
      <circle cx="24" cy="24" r="22" fill="url(#coin_outer_grad)" stroke="#CA8A04" strokeWidth="2" />
      <circle cx="24" cy="24" r="18" fill="url(#coin_inner_grad)" stroke="#FEF08A" strokeWidth="1" />
      {/* Lightning Bolt */}
      <path
        d="M26 12L16 26H24L22 36L32 22H24L26 12Z"
        fill="#FFFFFF"
        stroke="#B45309"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="coin_outer_grad" x1="6" y1="6" x2="42" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDE047" />
          <stop offset="0.5" stopColor="#EAB308" />
          <stop offset="1" stopColor="#CA8A04" />
        </linearGradient>
        <linearGradient id="coin_inner_grad" x1="10" y1="10" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FEF08A" />
          <stop offset="1" stopColor="#FACC15" />
        </linearGradient>
      </defs>
    </svg>
  )
}

// ── Four-Point Sparkle Star SVG ──
function SparkleStar({ size = 18, color = '#34D399' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M12 0C12 7.5 12 12 19.5 12C12 12 12 16.5 12 24C12 16.5 12 12 4.5 12C12 12 12 7.5 12 0Z"
        fill={color}
      />
    </svg>
  )
}

// ── Scratch Card Ticket Icon ──
function ScratchTicketIcon() {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 9,
        background: 'linear-gradient(135deg, #F59E0B, #D97706)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#FFFFFF',
        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', top: -3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 3, background: '#E6F5F2', borderRadius: '0 0 4px 4px' }} />
      <div style={{ position: 'absolute', bottom: -3, left: '50%', transform: 'translateX(-50%)', width: 6, height: 3, background: '#E6F5F2', borderRadius: '4px 4px 0 0' }} />
      <Gift size={18} />
    </div>
  )
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams()
  const orderNumber = searchParams.get('order')
  const downloadToken = searchParams.get('token')
  const [copied, setCopied] = useState(false)
  const [savings, setSavings] = useState(0)
  const [hasSavings, setHasSavings] = useState(false)
  const [scratched, setScratched] = useState(false)

  // Animation phase: 'burst' (full green splash) -> 'settled' (clean white card)
  const [animStage, setAnimStage] = useState<'burst' | 'settled'>('burst')

  useEffect(() => {
    // 1. Fire Meta Pixel Purchase event
    trackPixelEvent('Purchase', { order_id: orderNumber, currency: 'INR' })

    // 2. Auto-save order to browser cookie and localStorage session
    if (orderNumber || downloadToken) {
      saveOrderSession({
        orderNumber: orderNumber || '',
        token: downloadToken || '',
        createdAt: Date.now(),
      })
    }

    // 3. Try to lookup real order details for dynamic savings calculation
    if (orderNumber) {
      api.orderLookup(orderNumber).then((res) => {
        if (res?.amount) {
          const original = res.original_price || res.amount
          const realSaved = original > res.amount ? (original - res.amount) : 0
          if (realSaved > 0) {
            setSavings(realSaved)
            setHasSavings(true)
          } else {
            setSavings(0)
            setHasSavings(false)
          }
        }
      }).catch(() => {
        setSavings(0)
        setHasSavings(false)
      })
    }

    // 4. Trigger stage transition: Green burst ripples -> settles into clean card after 1.5s
    const timer = setTimeout(() => {
      setAnimStage('settled')
    }, 1500)

    return () => clearTimeout(timer)
  }, [orderNumber, downloadToken])

  const copyOrder = () => {
    if (orderNumber) {
      navigator.clipboard.writeText(orderNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Radial flying coin coordinates matching Images 3, 4, 5
  const flyingCoins = [
    { id: 1, targetX: -130, targetY: -115, rotate: -25, size: 44, delay: 0.05 },
    { id: 2, targetX: 135, targetY: -130, rotate: 30, size: 48, delay: 0.1 },
    { id: 3, targetX: -145, targetY: 15, rotate: -15, size: 38, delay: 0.16 },
    { id: 4, targetX: 140, targetY: 35, rotate: 20, size: 40, delay: 0.08 },
    { id: 5, targetX: 110, targetY: 145, rotate: -10, size: 36, delay: 0.22 },
    { id: 6, targetX: -110, targetY: 135, rotate: 35, size: 42, delay: 0.18 },
  ]

  return (
    <motion.div
      animate={{
        backgroundColor: animStage === 'burst' ? '#22C55E' : '#F8FAFC',
      }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      style={{
        minHeight: '100dvh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {/* ── 1. Concentric Ripple Burst Waves (Images 4 & 5) ── */}
      <AnimatePresence>
        {animStage === 'burst' && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          >
            {/* Wave 1 */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0.9 }}
              animate={{ scale: 3.5, opacity: 0 }}
              transition={{ duration: 1.4, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 220,
                height: 220,
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.75)',
              }}
            />
            {/* Wave 2 */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0.8 }}
              animate={{ scale: 2.7, opacity: 0 }}
              transition={{ duration: 1.4, delay: 0.2, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 200,
                height: 200,
                borderRadius: '50%',
                border: '4px solid rgba(255, 255, 255, 0.55)',
              }}
            />
            {/* Wave 3 (Soft Fill) */}
            <motion.div
              initial={{ scale: 0.1, opacity: 0.6 }}
              animate={{ scale: 2.0, opacity: 0 }}
              transition={{ duration: 1.3, delay: 0.35, ease: 'easeOut' }}
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.25)',
              }}
            />
          </div>
        )}
      </AnimatePresence>

      {/* ── 2. Floating Golden Lightning Coins (Images 3, 4, 5) ── */}
      <div
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 0,
          height: 0,
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {flyingCoins.map((coin) => (
          <motion.div
            key={coin.id}
            initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
            animate={{
              x: coin.targetX,
              y: animStage === 'burst' ? coin.targetY : coin.targetY * 1.3,
              scale: animStage === 'burst' ? 1 : 0,
              opacity: animStage === 'burst' ? 1 : 0,
              rotate: coin.rotate,
            }}
            transition={{
              type: 'spring',
              stiffness: 140,
              damping: 15,
              delay: coin.delay,
              opacity: { duration: 0.4 },
            }}
            style={{ position: 'absolute' }}
          >
            <LightningCoin size={coin.size} />
          </motion.div>
        ))}
      </div>

      {/* ── 3. Main Card Container ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        style={{
          maxWidth: 480,
          width: '100%',
          textAlign: 'center',
          position: 'relative',
          zIndex: 5,
        }}
      >
        {/* ── The Center Green Checkmark with Mint Halos & Sparkle Stars (Images 2 & 3) ── */}
        <div style={{ position: 'relative', width: 170, height: 170, margin: '0 auto 24px' }}>
          {/* Outer Mint Halo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 180, damping: 20 }}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: animStage === 'burst' ? 'rgba(255, 255, 255, 0.3)' : '#D1FAE5',
              transition: 'background 0.6s ease',
            }}
          />

          {/* Inner Mint Halo */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 22, delay: 0.08 }}
            style={{
              position: 'absolute',
              inset: 20,
              borderRadius: '50%',
              background: animStage === 'burst' ? 'rgba(255, 255, 255, 0.5)' : '#A7F3D0',
              transition: 'background 0.6s ease',
            }}
          />

          {/* Center Green Circle */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 0.95, 1] }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.12 }}
            style={{
              position: 'absolute',
              inset: 40,
              borderRadius: '50%',
              background: '#22C55E',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(34, 197, 94, 0.45)',
            }}
          >
            {/* Crisp White Checkmark */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.24 }}
            >
              <Check size={48} strokeWidth={3.8} color="#FFFFFF" />
            </motion.div>
          </motion.div>

          {/* Sparkle Star 1: Top-Left */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 90 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            style={{ position: 'absolute', top: 22, left: 24 }}
          >
            <SparkleStar size={20} color={animStage === 'burst' ? '#FFFFFF' : '#34D399'} />
          </motion.div>

          {/* Sparkle Star 2: Top-Right */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 180 }}
            transition={{ delay: 0.35, duration: 0.6 }}
            style={{ position: 'absolute', top: 28, right: 22 }}
          >
            <SparkleStar size={16} color={animStage === 'burst' ? '#FFFFFF' : '#34D399'} />
          </motion.div>

          {/* Sparkle Star 3: Bottom-Left */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: -90 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            style={{ position: 'absolute', bottom: 28, left: 22 }}
          >
            <SparkleStar size={18} color={animStage === 'burst' ? '#FFFFFF' : '#34D399'} />
          </motion.div>

          {/* Sparkle Star 4: Bottom-Right */}
          <motion.div
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: 135 }}
            transition={{ delay: 0.45, duration: 0.6 }}
            style={{ position: 'absolute', bottom: 20, right: 26 }}
          >
            <SparkleStar size={16} color={animStage === 'burst' ? '#FFFFFF' : '#34D399'} />
          </motion.div>
        </div>

        {/* ── 4. Main Titles (Image 2) ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <h1
            style={{
              fontSize: 'clamp(1.75rem, 5vw, 2.1rem)',
              fontWeight: 800,
              marginBottom: '6px',
              color: animStage === 'burst' ? '#FFFFFF' : '#111827',
              letterSpacing: '-0.02em',
              transition: 'color 0.6s ease',
            }}
          >
            Order Placed
          </h1>

          {hasSavings && savings > 0 ? (
            <div
              style={{
                fontSize: '1.05rem',
                fontWeight: 700,
                color: animStage === 'burst' ? '#DCFCE7' : '#16A34A',
                marginBottom: '24px',
                transition: 'color 0.6s ease',
              }}
            >
              You saved ₹{savings.toLocaleString('en-IN')}
            </div>
          ) : (
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                color: animStage === 'burst' ? '#DCFCE7' : '#16A34A',
                marginBottom: '24px',
                transition: 'color 0.6s ease',
              }}
            >
              Instant Access Unlocked · 100% Verified
            </div>
          )}
        </motion.div>

        {/* ── 5. Scratch for Real FREE Bonus Product Widget ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.45, delay: 0.45 }}
          onClick={() => {
            setScratched(true)
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([40, 30, 80])
            }
          }}
          style={{
            background: scratched ? '#FEF3C7' : '#E6F5F2',
            border: `1.5px solid ${scratched ? '#FDE68A' : 'rgba(16, 185, 129, 0.25)'}`,
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '14px',
            marginBottom: '24px',
            cursor: 'pointer',
            transition: 'all 0.25s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          }}
        >
          <ScratchTicketIcon />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#1F2937' }}>
              {scratched ? '🎉 FREE Bonus Product Unlocked!' : '🎁 Scratch for FREE Bonus Product!'}
            </div>
            <div style={{ fontSize: '0.78rem', color: scratched ? '#B45309' : '#4B5563' }}>
              {scratched
                ? `Complimentary Creative Pack Added · Coupon Code: FREEVIP (100% OFF)`
                : 'Tap to scratch & claim your complimentary digital gift'}
            </div>
          </div>
        </motion.div>

        {/* ── 6. Order Number Bar ── */}
        {orderNumber && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            style={{
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              borderRadius: '12px',
              padding: '12px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
            }}
          >
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600, textTransform: 'uppercase' }}>
                Order Number
              </div>
              <div style={{ fontWeight: 800, fontFamily: 'monospace', fontSize: '0.95rem', color: '#111827' }}>
                {orderNumber}
              </div>
            </div>
            <button
              type="button"
              onClick={copyOrder}
              style={{
                background: copied ? 'rgba(16, 185, 129, 0.1)' : '#F3F4F6',
                border: 'none',
                color: copied ? '#10B981' : '#374151',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {copied ? (
                <>
                  <Check size={16} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* ── 7. Instant Digital Download Access ── */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}
        >
          {downloadToken ? (
            <>
              <Link
                to={`/download/${downloadToken}`}
                className="btn-cta"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%',
                  textDecoration: 'none',
                  padding: '16px',
                  fontSize: '1.05rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #10B981, #059669)',
                  color: '#FFFFFF',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                }}
              >
                <Download size={22} /> Access Your Download
              </Link>
              <div
                style={{
                  fontSize: '0.8125rem',
                  color: '#B45309',
                  background: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textAlign: 'left',
                }}
              >
                <Clock size={16} style={{ flexShrink: 0 }} />
                <span>
                  Your download link is valid for <strong>12 hours</strong>. Please download your files now.
                </span>
              </div>
            </>
          ) : (
            <div className="alert alert-info">
              Your download is being prepared. Please check My Orders or Order Lookup.
            </div>
          )}
        </motion.div>

        {/* ── 8. Saved to This Browser / View in My Orders Card ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            background: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderRadius: '12px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            textAlign: 'left',
            marginBottom: '20px',
            boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Package size={20} color="#2563EB" style={{ flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#111827' }}>
                Saved to This Browser
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280' }}>
                Re-open this website anytime on this browser to access your files in <strong>My Orders</strong>.
              </div>
            </div>
          </div>
          <Link
            to="/my-orders"
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: '#F3F4F6',
              border: '1px solid #E5E7EB',
              color: '#111827',
              fontSize: '0.8rem',
              fontWeight: 700,
              textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}
          >
            My Orders →
          </Link>
        </motion.div>

        {/* ── 9. Direct Resolution & 100% Anti-Dispute Support Card ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '12px',
            padding: '18px 20px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <ShieldCheck size={20} color="#10B981" />
            <span style={{ fontWeight: 800, fontSize: '0.925rem', color: '#111827' }}>
              100% Direct Support & Assistance Guarantee
            </span>
          </div>
          <p style={{ color: '#4B5563', fontSize: '0.8125rem', lineHeight: 1.5, marginBottom: '14px' }}>
            Have any question or need help downloading? Our dedicated team resolves all requests directly on our site within minutes.
          </p>
          <Link
            to={`/contact?order=${encodeURIComponent(orderNumber || '')}&type=download`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '100%',
              padding: '11px 16px',
              borderRadius: '9px',
              background: '#111827',
              color: '#FFFFFF',
              fontSize: '0.85rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.12)',
            }}
          >
            <Headphones size={16} /> Contact Support Desk (Instant Help)
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
