// src/client/components/ui/LoadingSpinner.tsx
import React from 'react'

interface Props { fullPage?: boolean; size?: 'sm' | 'md' | 'lg'; inline?: boolean }

export default function LoadingSpinner({ fullPage, size = 'md', inline }: Props) {
  const sizes = { sm: 20, md: 32, lg: 48 }
  const px = sizes[size]

  const spinner = (
    <svg width={px} height={px} viewBox="0 0 24 24" fill="none" style={{ animation: 'spin 0.8s linear infinite' }}>
      <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.12)" strokeWidth="3" />
      <path d="M12 2a10 10 0 0 1 10 10" stroke="#111827" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )

  if (fullPage) {
    return (
      <div style={{
        position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'var(--bg-base)', zIndex: 9999,
      }}>
        {spinner}
      </div>
    )
  }

  if (inline) {
    return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{spinner}</span>
  }

  return <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>{spinner}</div>
}
