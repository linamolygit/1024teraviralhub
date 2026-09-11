// src/client/components/ui/GatewayBadge.tsx — Dynamic Gateway Trust Badge & Logo Component
import React from 'react'
import { ShieldCheck, CheckCircle2, Lock } from 'lucide-react'
import { usePaymentGatewayInfo } from '../../lib/payment-gateway-config'

interface GatewayBadgeProps {
  variant?: 'inline' | 'card' | 'footer' | 'pill'
  showLock?: boolean
  className?: string
  style?: React.CSSProperties
}

export default function GatewayBadge({
  variant = 'inline',
  showLock = true,
  className = '',
  style = {},
}: GatewayBadgeProps) {
  const { mode, isBoth, isRazorpay, isCashfree, securedByText, logos, name } = usePaymentGatewayInfo()

  if (variant === 'pill') {
    return (
      <div
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          background: isBoth
            ? 'linear-gradient(135deg, rgba(0, 163, 122, 0.12), rgba(12, 131, 253, 0.12))'
            : isRazorpay
            ? 'rgba(12, 131, 253, 0.12)'
            : 'rgba(0, 163, 122, 0.12)',
          border: isBoth
            ? '1px solid rgba(12, 131, 253, 0.25)'
            : isRazorpay
            ? '1px solid rgba(12, 131, 253, 0.28)'
            : '1px solid rgba(0, 163, 122, 0.28)',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: isBoth ? '#0C83FD' : isRazorpay ? '#0C83FD' : '#00A37A',
          ...style,
        }}
      >
        <ShieldCheck size={13} color={isRazorpay ? '#0C83FD' : '#00A37A'} />
        <span>{securedByText}</span>
      </div>
    )
  }

  if (variant === 'card') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          padding: '12px 16px',
          borderRadius: 12,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--bg-border)',
          ...style,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {showLock && <Lock size={15} color="#10B981" />}
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
            {securedByText}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {logos.map((logo) => (
            <div
              key={logo.name}
              style={{
                height: 24,
                padding: '2px 8px',
                borderRadius: 6,
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
              }}
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ height: 16, maxWidth: 64, objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (variant === 'footer') {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: '0.75rem',
          color: '#9CA3AF',
          ...style,
        }}
      >
        <CheckCircle2 size={14} color="#FFD200" />
        <span>{securedByText}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 4 }}>
          {logos.map((logo) => (
            <div
              key={logo.name}
              style={{
                height: 20,
                padding: '1px 6px',
                borderRadius: 4,
                background: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title={logo.name}
            >
              <img
                src={logo.src}
                alt={logo.alt}
                style={{ height: 13, maxWidth: 52, objectFit: 'contain' }}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Default 'inline'
  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {logos.map((logo) => (
          <div
            key={logo.name}
            style={{
              height: 22,
              padding: '2px 7px',
              borderRadius: 5,
              background: '#FFFFFF',
              border: '1px solid rgba(0,0,0,0.1)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={logo.name}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              style={{ height: 14, maxWidth: 56, objectFit: 'contain' }}
            />
          </div>
        ))}
      </div>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
        {securedByText}
      </span>
    </div>
  )
}
