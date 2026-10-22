// src/client/components/product/FlipkartUpiTrustSection.tsx
// Authentic Flipkart-Style Offers, Delivery Rules (No COD), and UPI Benefits
import React, { useState } from 'react'
import {
  Tag,
  Truck,
  ShieldCheck,
  Zap,
  Info,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Lock,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  BadgePercent,
  Check
} from 'lucide-react'
import { PhonePeIcon, GPayIcon, PaytmIcon, UpiGenericIcon, RuPayIcon } from '../ui/UpiIcons'
import { formatPrice } from '../../lib/utils'

interface FlipkartUpiTrustSectionProps {
  effectivePrice: number
  originalPrice: number
  discountAmount?: number
  preferredApp?: string
  accessHours?: number
}

export default function FlipkartUpiTrustSection({
  effectivePrice,
  originalPrice,
  discountAmount = 21,
  preferredApp = 'phonepe',
  accessHours = 12,
}: FlipkartUpiTrustSectionProps) {
  const [showCodExplainer, setShowCodExplainer] = useState(false)
  const [showAllOffers, setShowAllOffers] = useState(false)

  const upiSavingsEstimate = Math.max(15, Math.round(effectivePrice * 0.1))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', margin: '16px 0 20px' }}>
      
      {/* ─────────────────────────────────────────────────────────────
          1. FLIPKART "AVAILABLE OFFERS" SECTION (Authentic Green Tag)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '14px 16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#E8F5E9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Tag size={13} color="#008444" strokeWidth={2.5} />
            </span>
            <span style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', letterSpacing: '-0.01em' }}>
              Available Offers
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              color: '#008444',
              background: '#E8F5E9',
              padding: '2px 8px',
              borderRadius: '6px',
            }}
          >
            Prepaid UPI Special
          </span>
        </div>

        {/* Offers List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Offer 1: Special UPI Offer */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', lineHeight: 1.45 }}>
            <span style={{ color: '#008444', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
              🏷️
            </span>
            <div style={{ color: '#1F2937' }}>
              <strong style={{ color: '#111827' }}>Special UPI Instant Price: </strong>
              Pay via <strong>PhonePe, Google Pay or Paytm</strong> to unlock instant discount. Price already reduced to{' '}
              <span style={{ color: '#008444', fontWeight: 800 }}>{formatPrice(effectivePrice)}</span> (Inclusive of cashback).
            </div>
          </div>

          {/* Offer 2: ₹0 Delivery vs ₹70 Physical */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', lineHeight: 1.45 }}>
            <span style={{ color: '#008444', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
              🏷️
            </span>
            <div style={{ color: '#1F2937' }}>
              <strong style={{ color: '#111827' }}>Free Instant Delivery: </strong>
              Save <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>₹70</span> delivery fee. 100% ₹0 Shipping fee with instant electronic access.
            </div>
          </div>

          {/* Offer 3: Instant Access Unlock */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', lineHeight: 1.45 }}>
            <span style={{ color: '#008444', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
              🏷️
            </span>
            <div style={{ color: '#1F2937' }}>
              <strong style={{ color: '#111827' }}>Instant Download Guarantee: </strong>
              UPI payment hote hi agle <strong>10 seconds</strong> me file unlock ho jayegi. Koi courier ka intezaar nahi!
            </div>
          </div>

          {/* Extra expandable offers */}
          {showAllOffers && (
            <>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', lineHeight: 1.45 }}>
                <span style={{ color: '#008444', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                  🏷️
                </span>
                <div style={{ color: '#1F2937' }}>
                  <strong style={{ color: '#111827' }}>Zero Convenience Fee: </strong>
                  Prepaid UPI checkout par koi gateway charge ya extra platform handling fee nahi hai. 100% transparent pricing.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '0.825rem', lineHeight: 1.45 }}>
                <span style={{ color: '#008444', fontWeight: 800, flexShrink: 0, marginTop: '2px' }}>
                  🏷️
                </span>
                <div style={{ color: '#1F2937' }}>
                  <strong style={{ color: '#111827' }}>WhatsApp & Email Backup: </strong>
                  Payment confirmation ke baad aapko order details aur lifetime access link instantly email/SMS/WhatsApp par milta hai.
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toggle More Offers */}
        <button
          type="button"
          onClick={() => setShowAllOffers(p => !p)}
          style={{
            background: 'none',
            border: 'none',
            padding: '6px 0 0',
            color: '#2874F0',
            fontWeight: 700,
            fontSize: '0.78rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '6px',
          }}
        >
          <span>{showAllOffers ? 'View fewer offers' : '+ 2 more offers available'}</span>
          {showAllOffers ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          2. FLIPKART "DELIVERY & SERVICES" SPECIFICATION BOX
             (Transparently explains NO Cash on Delivery + Why UPI)
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'var(--bg-surface, #FFFFFF)',
          border: '1px solid #E5E7EB',
          borderRadius: '12px',
          padding: '16px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#111827', marginBottom: '14px' }}>
          Delivery &amp; Service Details
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          
          {/* Row 1: Delivery by Instant */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              <Truck size={13} color="#2563EB" strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                Delivery by <span style={{ color: '#008444' }}>Instant (Within 10–60 Seconds)</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                Delivery Charge: <span style={{ color: '#008444', fontWeight: 700 }}>FREE ₹0</span>{' '}
                <span style={{ textDecoration: 'line-through', color: '#9CA3AF' }}>₹70</span> (Digital Fast Delivery)
              </div>
            </div>
          </div>

          {/* Row 2: Cash On Delivery - NOT AVAILABLE (The Critical Flipkart Badge) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: '#FFF5F5',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #FEE2E2',
            }}
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#FEE2E2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              <XCircle size={14} color="#DC2626" strokeWidth={2.5} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '4px' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#991B1B' }}>
                  Cash on Delivery: Not Available
                </span>
                <button
                  type="button"
                  onClick={() => setShowCodExplainer(p => !p)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563EB',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    padding: 0,
                    textDecoration: 'underline',
                  }}
                >
                  {showCodExplainer ? 'Hide Reason' : 'Why No COD?'}
                </button>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#B91C1C', marginTop: '2px' }}>
                Yeh 100% digital instant download product hai. Payment ke turant baad link aapke screen par khulta hai.
              </div>

              {/* Explainer Box */}
              {showCodExplainer && (
                <div
                  style={{
                    marginTop: '8px',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    border: '1px solid #FECACA',
                    fontSize: '0.75rem',
                    color: '#4B5563',
                    lineHeight: 1.45,
                  }}
                >
                  💡 <strong>COD Kyu Nahi Hai?</strong> Physical delivery boy aapke ghar par aane me 4–7 din leta hai aur ₹60–₹70 extra delivery charge lagta hai. Is digital product ko aap UPI se <strong>10 second</strong> me pay karke turant bina kisi courier charge ke direct phone me download kar sakte hain!
                </div>
              )}
            </div>
          </div>

          {/* Row 3: 7 Days Replacement / Return Assurance */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              <ShieldCheck size={14} color="#059669" strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                7 Days Money-Back / Refund Guarantee
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                Agar file corrupt ho ya open na ho, to 100% full refund seedha aapke UPI account me (Cashfree Protection).
              </div>
            </div>
          </div>

          {/* Row 4: 1-Click Launch with Any UPI App */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#F5F3FF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
              <Zap size={13} color="#7C3AED" strokeWidth={2.2} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                1-Click Direct UPI Launch
              </div>
              <div style={{ fontSize: '0.78rem', color: '#6B7280', marginTop: '2px' }}>
                Koi Card/CVV ya OTP daalne ki zaroorat nahi. PhonePe, GPay, Paytm direct 1-tap me open hota hai.
              </div>
            </div>
          </div>

        </div>
      </div>


      {/* ─────────────────────────────────────────────────────────────
          3. "WHY PAY VIA UPI?" BENEFIT CARD (Flipkart Trust Banner)
             Makes the user feel happy and smart for choosing UPI!
         ───────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.05) 0%, rgba(99, 102, 241, 0.08) 100%)',
          border: '1.5px solid rgba(37, 99, 235, 0.2)',
          borderRadius: '12px',
          padding: '14px 16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={16} color="#2563EB" />
            <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#1E40AF' }}>
              UPI Se Payment Karne Me Fayda
            </span>
          </div>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 800,
              background: '#2563EB',
              color: '#FFFFFF',
              padding: '2px 8px',
              borderRadius: '20px',
            }}
          >
            Instant Unlock
          </span>
        </div>

        {/* 4 Quick Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>⚡ 0 Seconds Wait</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>Payment ke turant baad download button</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#008444' }}>💰 ₹0 Extra Charge</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>COD courier charges se 100% bachat</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>🔒 100% Secure</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>Cashfree & NPCI Verified Gateway</div>
          </div>

          <div style={{ background: '#FFFFFF', padding: '8px 10px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A' }}>📱 1-Tap App Open</div>
            <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '1px' }}>PhonePe/GPay direct seamless launch</div>
          </div>
        </div>

        {/* Supported UPI Apps Row */}
        <div
          style={{
            marginTop: '12px',
            paddingTop: '10px',
            borderTop: '1px dashed rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569' }}>
            Supported UPI Apps:
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <PhonePeIcon size={20} />
            <GPayIcon size={20} />
            <PaytmIcon size={20} />
            <UpiGenericIcon size={20} />
            <RuPayIcon size={20} />
          </div>
        </div>
      </div>

    </div>
  )
}
