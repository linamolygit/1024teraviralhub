// src/client/components/product/ProductLootScarcityBanner.tsx
// High-Converting Flipkart Big Billion Days Style Loot Deal & Scarcity Widget
import React, { useState, useEffect, useMemo } from 'react'
import { Flame, Clock, Eye, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
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
    // Store countdown end timestamp in sessionStorage so it doesn't reset on every refresh
    const storageKey = `fomo_timer_${productId}`
    let targetEnd = Number(sessionStorage.getItem(storageKey))
    const now = Date.now()

    // 2 hours 45 minutes default duration
    if (!targetEnd || targetEnd <= now) {
      targetEnd = now + (2 * 60 + 47) * 60 * 1000 + (seed % 45) * 1000
      sessionStorage.setItem(storageKey, String(targetEnd))
    }

    const updateCountdown = () => {
      const remainingMs = Math.max(0, targetEnd - Date.now())
      if (remainingMs <= 0) {
        // Roll over to a new short urgent interval
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

    // Jitter live viewers and occasionally bump claimed slots
    const jitterInterval = setInterval(() => {
      setActiveViewers((prev) => {
        const delta = Math.random() > 0.48 ? 1 : -1
        return Math.min(94, Math.max(34, prev + delta))
      })
    }, 4500)

    // Bump claimed slots by 1 every 40-70 seconds, capping at totalSlots - 3
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
      }}
      id={`loot-deal-banner-${productId}`}
    >
      {/* ── Top Bar: Big Billion Days Badge & Urgency Countdown Timer ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
          paddingBottom: '12px',
          borderBottom: '1px dashed rgba(239, 68, 68, 0.28)',
          marginBottom: '14px',
        }}
      >
        {/* Deal Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, #DC2626 0%, #EA580C 100%)',
            color: '#FFFFFF',
            fontWeight: 800,
            fontSize: '0.75rem',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            padding: '4px 10px',
            borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
          }}
        >
          <Flame size={13} fill="#FEF08A" color="#FEF08A" />
          <span>Big Billion Loot Deal</span>
        </div>

        {/* Urgency Countdown Timer */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#B91C1C',
          }}
        >
          <Clock size={14} color="#DC2626" />
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.02em' }}>
            Ends in:
          </span>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontFamily: 'monospace' }}>
            <span
              style={{
                background: '#1F2937',
                color: '#F9FAFB',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 800,
              }}
            >
              {padZero(timeLeft.hours)}h
            </span>
            <span style={{ fontWeight: 900, color: '#DC2626' }}>:</span>
            <span
              style={{
                background: '#1F2937',
                color: '#F9FAFB',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 800,
              }}
            >
              {padZero(timeLeft.minutes)}m
            </span>
            <span style={{ fontWeight: 900, color: '#DC2626' }}>:</span>
            <span
              style={{
                background: '#DC2626',
                color: '#FFFFFF',
                padding: '2px 5px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                fontWeight: 800,
              }}
            >
              {padZero(timeLeft.seconds)}s
            </span>
          </div>
        </div>
      </div>

      {/* ── Main Offer Headline (Pehle 200 Logo Ko Sirf ₹X Me Milega) ── */}
      <div style={{ marginBottom: '12px' }}>
        <div
          style={{
            fontSize: 'clamp(0.98rem, 2.8vw, 1.15rem)',
            fontWeight: 900,
            color: '#991B1B',
            lineHeight: 1.35,
            marginBottom: '4px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap',
          }}
        >
          <span>🔥 Pehle {totalSlots} Buyers Ko Sirf</span>
          <span
            style={{
              background: '#FEF08A',
              color: '#92400E',
              padding: '2px 8px',
              borderRadius: '6px',
              fontWeight: 900,
              border: '1px solid #FDE047',
              boxShadow: '0 2px 6px rgba(234, 179, 8, 0.25)',
            }}
          >
            {formatPrice(effectivePrice)}
          </span>
          <span>Me Milega!</span>
        </div>

        <p
          style={{
            margin: 0,
            fontSize: '0.8125rem',
            color: '#4B5563',
            lineHeight: 1.45,
            fontWeight: 500,
          }}
        >
          Regular MRP <span style={{ textDecoration: 'line-through' }}>{formatPrice(originalPrice)}</span> ·{' '}
          <strong style={{ color: '#047857', fontWeight: 800 }}>{discountPct}% Instant Loot Discount</strong> Applied.
          Slots fill hote hi price automatically wapas <strong>{formatPrice(originalPrice)}</strong> ho jayega!
        </p>
      </div>

      {/* ── Scarcity Progress Bar ── */}
      <div style={{ marginBottom: '14px' }}>
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
          <span style={{ color: '#1F2937', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Zap size={13} color="#D97706" />
            <span>
              <strong>{claimedSlots}</strong> / {totalSlots} Slots Claimed ({percentClaimed}%)
            </span>
          </span>

          <span
            style={{
              color: '#DC2626',
              fontWeight: 800,
              background: 'rgba(254, 226, 226, 0.9)',
              padding: '2px 8px',
              borderRadius: '999px',
              border: '1px solid #FCA5A5',
              fontSize: '0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={11} color="#DC2626" />
            Hurry! Only {remainingSlots} Left at {formatPrice(effectivePrice)}
          </span>
        </div>

        {/* Progress Track */}
        <div className="fomo-progress-track">
          <div className="fomo-progress-fill" style={{ width: `${percentClaimed}%` }} />
        </div>
      </div>

      {/* ── Social Proof & Trust Strip ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '8px',
          paddingTop: '10px',
          borderTop: '1px solid rgba(229, 231, 235, 0.7)',
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
            color: '#1F2937',
          }}
        >
          <span className="fomo-live-dot" />
          <span>
            <strong style={{ color: '#047857' }}>{activeViewers} people</strong> looking now
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
            color: '#1F2937',
          }}
        >
          <Flame size={12} color="#EA580C" />
          <span>
            <strong style={{ color: '#C2410C' }}>{recentBuyers} bought</strong> in last 45m
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
            color: '#065F46',
          }}
        >
          <ShieldCheck size={13} color="#10B981" />
          <span>Instant Download</span>
        </div>
      </div>
    </div>
  )
}
