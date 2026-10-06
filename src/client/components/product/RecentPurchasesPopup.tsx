// src/client/components/product/RecentPurchasesPopup.tsx
// Real-time Floating Social Proof Activity Notification Ticker
import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle2, X, Zap } from 'lucide-react'
import { formatPrice } from '../../lib/utils'

interface RecentPurchasesPopupProps {
  productTitle?: string
  productImage?: string
  price?: number
  currencySymbol?: string
}

interface PurchaseItem {
  name: string
  city: string
  action: string
  timeAgo: string
  avatarColor: string
}

const RECENT_PURCHASES_LIST: PurchaseItem[] = [
  { name: 'Amit Sharma', city: 'Mumbai', action: 'Grabbed the Early-Bird Loot Deal', timeAgo: '2 mins ago', avatarColor: '#3B82F6' },
  { name: 'Pooja Verma', city: 'Bengaluru', action: 'Claimed ₹99 Pehle 200 Offer', timeAgo: '4 mins ago', avatarColor: '#EC4899' },
  { name: 'Rohan Deshmukh', city: 'Pune', action: 'Unlocked Instant Download Files', timeAgo: '1 min ago', avatarColor: '#10B981' },
  { name: 'Vikram Rajput', city: 'Lucknow', action: 'Grabbed Big Billion Loot Deal', timeAgo: '3 mins ago', avatarColor: '#F59E0B' },
  { name: 'Sneha Patel', city: 'Ahmedabad', action: 'Purchased via PhonePe UPI', timeAgo: 'Just now', avatarColor: '#8B5CF6' },
  { name: 'Ananya Mukherjee', city: 'Kolkata', action: 'Downloaded Full Media Assets', timeAgo: '5 mins ago', avatarColor: '#EF4444' },
  { name: 'Kunal Tiwari', city: 'New Delhi', action: 'Grabbed 1 of remaining 14 slots', timeAgo: '2 mins ago', avatarColor: '#06B6D4' },
  { name: 'Deepak Choudhary', city: 'Jaipur', action: 'Verified Digital Buyer • 5★', timeAgo: '6 mins ago', avatarColor: '#F97316' },
  { name: 'Neha Gupta', city: 'Indore', action: 'Grabbed Flash Sale Loot Offer', timeAgo: '3 mins ago', avatarColor: '#14B8A6' },
  { name: 'Arjun Nair', city: 'Hyderabad', action: 'Completed Instant Checkout', timeAgo: '4 mins ago', avatarColor: '#6366F1' },
]

export default function RecentPurchasesPopup({
  productTitle,
  productImage,
  price,
  currencySymbol = '₹',
}: RecentPurchasesPopupProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const isHoveredRef = useRef(false)

  useEffect(() => {
    // If dismissed in this session, don't show
    if (sessionStorage.getItem('fomo_social_toast_dismissed') === 'true') {
      setIsDismissed(true)
      return
    }

    // Initial delay before first popup appears (4.5s after page load)
    const initialTimer = setTimeout(() => {
      setIsVisible(true)
    }, 4500)

    // Interval ticker: Show for 5.5s, hide for 4s, rotate to next
    const tickerInterval = setInterval(() => {
      if (isHoveredRef.current) return

      setIsVisible(false)

      setTimeout(() => {
        if (!isHoveredRef.current) {
          setCurrentIndex((prev) => (prev + 1) % RECENT_PURCHASES_LIST.length)
          setIsVisible(true)
        }
      }, 4000)
    }, 9500)

    return () => {
      clearTimeout(initialTimer)
      clearInterval(tickerInterval)
    }
  }, [])

  if (isDismissed || !isVisible) return null

  const currentItem = RECENT_PURCHASES_LIST[currentIndex]
  const initials = currentItem.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const handleDismiss = () => {
    setIsVisible(false)
    setIsDismissed(true)
    sessionStorage.setItem('fomo_social_toast_dismissed', 'true')
  }

  return (
    <div
      className="fomo-social-toast"
      onMouseEnter={() => {
        isHoveredRef.current = true
      }}
      onMouseLeave={() => {
        isHoveredRef.current = false
      }}
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 900,
        maxWidth: '350px',
        width: 'calc(100% - 32px)',
        background: 'var(--bg-surface)',
        border: '1.5px solid rgba(255, 210, 0, 0.45)',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.45), 0 0 16px rgba(255, 210, 0, 0.12)',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Buyer Avatar / Product Thumbnail */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {productImage ? (
          <img
            src={productImage}
            alt="Product"
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '8px',
              objectFit: 'cover',
              border: '1px solid var(--bg-border)',
            }}
          />
        ) : (
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: currentItem.avatarColor,
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '0.85rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
            }}
          >
            {initials}
          </div>
        )}

        {/* Small Verified Check Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-3px',
            right: '-3px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#10B981',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1.5px solid var(--bg-surface)',
          }}
        >
          <CheckCircle2 size={11} color="#FFFFFF" strokeWidth={3} />
        </div>
      </div>

      {/* Buyer & Purchase Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '6px',
            marginBottom: '2px',
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: '0.825rem',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {currentItem.name}{' '}
            <span style={{ fontWeight: 500, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              ({currentItem.city})
            </span>
          </span>

          <span
            style={{
              fontSize: '0.7rem',
              color: 'var(--text-muted)',
              flexShrink: 0,
              fontWeight: 600,
            }}
          >
            {currentItem.timeAgo}
          </span>
        </div>

        <div
          style={{
            fontSize: '0.76rem',
            color: '#10B981',
            fontWeight: 700,
            lineHeight: 1.25,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          <Zap size={11} color="#FFD200" />
          <span>{currentItem.action}</span>
          {price !== undefined && (
            <span style={{ color: '#FFD200', fontWeight: 800 }}>({formatPrice(price)})</span>
          )}
        </div>

        <div
          style={{
            fontSize: '0.68rem',
            color: 'var(--text-muted)',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '3px',
          }}
        >
          <span style={{ color: '#10B981' }}>● Verified Purchase</span>
          <span>· Instant Access</span>
        </div>
      </div>

      {/* Close Dismiss Button */}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Close social proof notification"
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          transition: 'color 0.15s ease',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
      >
        <X size={14} />
      </button>
    </div>
  )
}
