// src/client/components/product/ProductLootScarcityBanner.tsx
// Pixel-Accurate Flipkart "The Big Billion Days" Style Loot Deal & Scarcity Widget
import React, { useState, useEffect, useMemo } from 'react'
import { Clock, Eye, ShieldCheck, Zap, AlertTriangle, Sparkles } from 'lucide-react'
import { formatPrice } from '../../lib/utils'

interface ProductLootScarcityBannerProps {
  productId: string | number
  productTitle: string
  effectivePrice: number
  originalPrice: number
  discountPct: number
  totalSlots?: number
  currencySymbol?: string
}

export default function ProductLootScarcityBanner({
  productId,
  productTitle,
  effectivePrice,
  originalPrice,
  discountPct,
  totalSlots = 200,
  currencySymbol = '₹',
}: ProductLootScarcityBannerProps) {
  // Deterministic yet realistic baseline per product
  const seed = useMemo(() => {
    let hash = 0
    const str = String(productId || 'default-loot')
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    return Math.abs(hash)
  }, [productId])

  // Initial claimed slots: Between 88% and 94% of totalSlots (e.g. 176 - 188 out of 200)
  const initialClaimed = useMemo(() => {
    const minClaimed = Math.floor(totalSlots * 0.88)
    const maxClaimed = Math.floor(totalSlots * 0.94)
    const range = maxClaimed - minClaimed
    return minClaimed + (seed % (range + 1))
  }, [totalSlots, seed])

  const [claimedSlots, setClaimedSlots] = useState<number>(initialClaimed)

  // Real-time viewer count (between 38 and 92)
  const [activeViewers, setActiveViewers] = useState<number>(() => 46 + (seed % 35))
  // Recent buyers (between 18 and 38)
  const [recentBuyers, setRecentBuyers] = useState<number>(() => 19 + (seed % 15))

  // Urgency Countdown Timer (synced via sessionStorage for realistic ticking)
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 2,
    minutes: 18,
    seconds: 45,
  })

  useEffect(() => {
    const storageKey = `fomo_timer_${productId}`
    let targetEnd = Number(sessionStorage.getItem(storageKey))
    const now = Date.now()

    if (!targetEnd || targetEnd <= now) {
      targetEnd = now + (2 * 60 + 47) * 60 * 1000 + (seed % 45) * 1000
      sessionStorage.setItem(storageKey, String(targetEnd))
    }

    const updateCountdown = () => {
      const remainingMs = Math.max(0, targetEnd - Date.now())
      if (remainingMs <= 0) {
        const nextTarget = Date.now() + 18 * 60 * 1000
        sessionStorage.setItem(storageKey, String(nextTarget))
        return
      }

      const totalSec = Math.floor(remainingMs / 1000)
      const hours = Math.floor(totalSec / 3600)
      const minutes = Math.floor((totalSec % 3600) / 60)
      const seconds = totalSec % 60

      setTimeLeft({ hours, minutes, seconds })
    }

    updateCountdown()
    const timerInterval = setInterval(updateCountdown, 1000)

    const jitterInterval = setInterval(() => {
      setActiveViewers((prev) => {
        const delta = Math.random() > 0.48 ? 1 : -1
        return Math.min(94, Math.max(34, prev + delta))
      })
    }, 4500)

    const slotBumpInterval = setInterval(() => {
      setClaimedSlots((prev) => {
        if (prev < totalSlots - 3) {
          return prev + 1
        }
        return prev
      })
    }, 45000)

    return () => {
      clearInterval(timerInterval)
      clearInterval(jitterInterval)
      clearInterval(slotBumpInterval)
    }
  }, [productId, seed, totalSlots])

  const remainingSlots = Math.max(3, totalSlots - claimedSlots)
  const percentClaimed = Math.min(98, Math.round((claimedSlots / totalSlots) * 100))

  const padZero = (n: number) => n.toString().padStart(2, '0')

  return (
    <div
      className="fomo-loot-box"
      style={{
        margin: '18px 0',
        padding: '16px 18px',
        position: 'relative',
      }}
      id={`loot-deal-banner-${productId}`}
    >
      {/* ── Background Festive Fireworks Glow Hints ── */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(255, 210, 0, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -20,
          left: -20,
          width: 120,
          height: 120,
          background: 'radial-gradient(circle, rgba(40, 116, 240, 0.25) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Header: Official Flipkart Big Billion Days Medallion & Live Ticking Timer ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          paddingBottom: '14px',
          borderBottom: '1px solid rgba(255, 210, 0, 0.25)',
          marginBottom: '14px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* The Big Billion Days Medallion Badge (Matching Reference Image) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Circular Gold & Navy Medallion */}
          <div
            style={{
              position: 'relative',
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              background: 'radial-gradient(circle, #0F2A75 0%, #061542 100%)',
              border: '2px solid #FFD200',
              boxShadow: '0 0 12px rgba(255, 210, 0, 0.6), inset 0 0 6px rgba(255, 210, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            {/* Subtle Star Accent */}
            <div
              style={{
                position: 'absolute',
                top: -3,
                right: -3,
                color: '#FFD200',
              }}
            >
              <Sparkles size={11} />
            </div>

            <span
              style={{
                fontSize: '0.45rem',
                fontWeight: 900,
                color: '#FFE57F',
                letterSpacing: '0.08em',
                lineHeight: 1,
                textTransform: 'uppercase',
              }}
            >
              THE BIG
            </span>
            <span
              style={{
                fontSize: '0.62rem',
                fontWeight: 900,
                color: '#FFD200',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
                textShadow: '0 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              BILLION
            </span>
            <span
              style={{
                fontSize: '0.42rem',
                fontWeight: 900,
                color: '#FFFFFF',
                letterSpacing: '0.06em',
                lineHeight: 1,
                background: '#2874F0',
                padding: '1px 3px',
                borderRadius: '2px',
                marginTop: '1px',
              }}
            >
              DAYS
            </span>
          </div>

          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#FFD200',
                fontWeight: 900,
                fontSize: '0.92rem',
                letterSpacing: '0.02em',
                textTransform: 'uppercase',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.5)',
              }}
            >
              <span>THE BIG BILLION DAYS</span>
            </div>
            <div
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                color: '#93C5FD',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span>⚡ Special Early-Bird Loot Sale</span>
            </div>
          </div>
        </div>

        {/* Urgency Countdown Timer (Flipkart Golden Capsule Style) */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(5, 14, 38, 0.75)',
            border: '1px solid rgba(255, 210, 0, 0.45)',
            borderRadius: '8px',
            padding: '5px 10px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.35)',
          }}
        >
          <Clock size={13} color="#FFD200" />
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              color: '#FFE57F',
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
            }}
          >
            Ends in:
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: 'monospace' }}>
            <span
              style={{
                background: '#0F2A75',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 210, 0, 0.35)',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 900,
              }}
            >
              {padZero(timeLeft.hours)}h
            </span>
            <span style={{ fontWeight: 900, color: '#FFD200' }}>:</span>
            <span
              style={{
                background: '#0F2A75',
                color: '#FFFFFF',
                border: '1px solid rgba(255, 210, 0, 0.35)',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 900,
              }}
            >
              {padZero(timeLeft.minutes)}m
            </span>
            <span style={{ fontWeight: 900, color: '#FFD200' }}>:</span>
            <span
              style={{
                background: '#FFD200',
                color: '#071330',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.8rem',
                fontWeight: 900,
              }}
            >
              {padZero(timeLeft.seconds)}s
            </span>
          </div>
        </div>
      </div>

      {/* ── Illuminated Marquee Box (Inspired by Reference Image "STARTS 9TH OCT" Glowing Frame) ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(16, 43, 123, 0.75) 0%, rgba(7, 19, 48, 0.85) 100%)',
          border: '1.5px solid #FFD200',
          borderRadius: '12px',
          padding: '12px 14px',
          marginBottom: '14px',
          boxShadow: '0 0 16px rgba(255, 210, 0, 0.3), inset 0 0 12px rgba(255, 210, 0, 0.1)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Marquee Pill Label */}
        <div style={{ marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span
            style={{
              background: '#FFD200',
              color: '#071330',
              fontSize: '0.72rem',
              fontWeight: 900,
              padding: '2px 8px',
              borderRadius: '4px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
            }}
          >
            ★ LOOT OFFER ★
          </span>
          <span style={{ color: '#FFE57F', fontWeight: 800, fontSize: '0.82rem' }}>
            Pehle {totalSlots} Buyers Exclusive Deal
          </span>
        </div>

        {/* Main Price Hook: Pehle 200 Buyers Ko Sirf ₹X Me Milega */}
        <div
          style={{
            fontSize: 'clamp(1.05rem, 3.2vw, 1.3rem)',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.3,
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>Pehle {totalSlots} logo ko sirf</span>
          <span
            style={{
              color: '#FFD200',
              fontSize: 'clamp(1.25rem, 3.8vw, 1.55rem)',
              fontWeight: 900,
              textShadow: '0 0 10px rgba(255, 210, 0, 0.5)',
            }}
          >
            {formatPrice(effectivePrice)}
          </span>
          <span>me milega!</span>
        </div>

        {/* Comparison Strikethrough & Savings Tag */}
        <div
          style={{
            marginTop: '6px',
            fontSize: '0.8125rem',
            color: '#CBD5E1',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          <span>
            MRP: <span style={{ textDecoration: 'line-through', color: '#94A3B8' }}>{formatPrice(originalPrice)}</span>
          </span>
          <span
            style={{
              background: 'rgba(16, 185, 129, 0.25)',
              color: '#34D399',
              border: '1px solid rgba(16, 185, 129, 0.45)',
              padding: '1px 6px',
              borderRadius: '4px',
              fontWeight: 800,
              fontSize: '0.75rem',
            }}
          >
            ↓{discountPct}% OFF
          </span>
          <span style={{ color: '#FDE047', fontSize: '0.78rem', fontWeight: 700 }}>
            Slots end hote hi MRP wapas {formatPrice(originalPrice)} ho jayegi!
          </span>
        </div>
      </div>

      {/* ── Scarcity Inventory Progress Bar (Flipkart Golden Amber Shimmer) ── */}
      <div style={{ marginBottom: '14px', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.78125rem',
            fontWeight: 800,
            marginBottom: '6px',
          }}
        >
          <span style={{ color: '#E2E8F0', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={13} color="#FFD200" />
            <span>
              <strong style={{ color: '#FFD200' }}>{claimedSlots}</strong> / {totalSlots} Slots Claimed ({percentClaimed}%)
            </span>
          </span>

          <span
            style={{
              color: '#FFD200',
              fontWeight: 900,
              background: 'rgba(255, 210, 0, 0.15)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid rgba(255, 210, 0, 0.4)',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: '0 0 8px rgba(255, 210, 0, 0.2)',
            }}
          >
            <AlertTriangle size={11} color="#FFD200" />
            Hurry! Only {remainingSlots} Left at {formatPrice(effectivePrice)}
          </span>
        </div>

        {/* Progress Track */}
        <div className="fomo-progress-track">
          <div className="fomo-progress-fill" style={{ width: `${percentClaimed}%` }} />
        </div>
      </div>

      {/* ── Social Proof & Trust Strip (Royal Blue & Gold Themed) ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(255, 210, 0, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Live Viewers */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#E2E8F0',
          }}
        >
          <span className="fomo-live-dot" />
          <span>
            <strong style={{ color: '#34D399' }}>{activeViewers} people</strong> looking now
          </span>
        </div>

        {/* Recent Purchases */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#E2E8F0',
          }}
        >
          <Sparkles size={12} color="#FFD200" />
          <span>
            <strong style={{ color: '#FFD200' }}>{recentBuyers} grabbed</strong> in last 45m
          </span>
        </div>

        {/* Instant Access Guarantee */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.75rem',
            fontWeight: 700,
            color: '#93C5FD',
          }}
        >
          <ShieldCheck size={13} color="#60A5FA" />
          <span>Instant Download</span>
        </div>
      </div>
    </div>
  )
}
