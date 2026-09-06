// src/client/components/ui/UpiIcons.tsx — Official Crisp Vector Logos for Indian UPI Apps & RuPay
import React from 'react'

export const UPI_ICON_URLS = {
  phonepe: 'https://cdn.simpleicons.org/phonepe/5F259F',
  gpay: 'https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/google-pay.svg',
  paytm: 'https://cdn.simpleicons.org/paytm/20336B',
  // Official real UPI vector logo (NPCI / Wikimedia)
  upi: 'https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.svg',
  upiLocal: '/assets/payments/upi-logo.svg',
  // Official real RuPay logo (NPCI / Wikimedia)
  rupay: 'https://upload.wikimedia.org/wikipedia/commons/c/cb/Rupay-Logo.png',
  rupayLocal: '/assets/payments/rupay-logo.png',
}

export function PhonePeIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size > 16 ? 6 : 4,
        background: '#FFFFFF',
        padding: Math.max(1, Math.round(size * 0.1)),
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        verticalAlign: 'middle',
      }}
    >
      <img
        src={UPI_ICON_URLS.phonepe}
        alt="PhonePe"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        loading="lazy"
      />
    </span>
  )
}

export function GPayIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size > 16 ? 6 : 4,
        background: '#FFFFFF',
        padding: Math.max(1, Math.round(size * 0.08)),
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        verticalAlign: 'middle',
      }}
    >
      <img
        src={UPI_ICON_URLS.gpay}
        alt="Google Pay"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        loading="lazy"
      />
    </span>
  )
}

export function PaytmIcon({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size > 16 ? 6 : 4,
        background: '#FFFFFF',
        padding: Math.max(1, Math.round(size * 0.1)),
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        verticalAlign: 'middle',
      }}
    >
      <img
        src={UPI_ICON_URLS.paytm}
        alt="Paytm"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        loading="lazy"
      />
    </span>
  )
}

// Real official UPI Vector Logo
export function UpiGenericIcon({ size = 20, width }: { size?: number; width?: number }) {
  const w = width ?? Math.round(size * 1.75)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: size,
        borderRadius: size > 16 ? 6 : 4,
        background: '#FFFFFF',
        padding: '2px 4px',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        verticalAlign: 'middle',
        boxSizing: 'border-box',
      }}
    >
      <img
        src={UPI_ICON_URLS.upi}
        alt="UPI"
        onError={(e) => {
          const target = e.currentTarget
          if (target.src !== window.location.origin + UPI_ICON_URLS.upiLocal) {
            target.src = UPI_ICON_URLS.upiLocal
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        loading="lazy"
      />
    </span>
  )
}
export const UpiIcon = UpiGenericIcon

// Real official RuPay Logo
export function RuPayIcon({ size = 20, width }: { size?: number; width?: number }) {
  const w = width ?? Math.round(size * 1.8)
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: w,
        height: size,
        borderRadius: size > 16 ? 6 : 4,
        background: '#FFFFFF',
        padding: '2px 4px',
        flexShrink: 0,
        boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
        verticalAlign: 'middle',
        boxSizing: 'border-box',
      }}
    >
      <img
        src={UPI_ICON_URLS.rupay}
        alt="RuPay"
        onError={(e) => {
          const target = e.currentTarget
          if (target.src !== window.location.origin + UPI_ICON_URLS.rupayLocal) {
            target.src = UPI_ICON_URLS.rupayLocal
          }
        }}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
          display: 'block',
        }}
        loading="lazy"
      />
    </span>
  )
}
export const RupayIcon = RuPayIcon

export function getUpiAppIcon(appName: string, size = 20) {
  const name = (appName || '').toLowerCase()
  if (name.includes('phonepe')) return <PhonePeIcon size={size} />
  if (name.includes('gpay') || name.includes('google')) return <GPayIcon size={size} />
  if (name.includes('paytm')) return <PaytmIcon size={size} />
  if (name.includes('rupay')) return <RuPayIcon size={size} />
  return <UpiGenericIcon size={size} />
}
