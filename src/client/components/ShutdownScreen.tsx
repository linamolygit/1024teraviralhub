// src/client/components/ShutdownScreen.tsx
import React, { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Power, RefreshCw } from 'lucide-react'

interface ShutdownScreenProps {
  title?: string
  message?: string
}

export default function ShutdownScreen({ title, message }: ShutdownScreenProps) {
  const queryClient = useQueryClient()

  // Auto-poll public settings every 10 seconds to auto-recover when admin turns switch OFF
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    }, 10000)
    return () => clearInterval(interval)
  }, [queryClient])

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        backgroundColor: '#080c14',
        backgroundImage: `
          radial-gradient(ellipse 80% 50% at 50% -20%, rgba(239, 68, 68, 0.18), transparent),
          radial-gradient(ellipse 60% 40% at 50% 120%, rgba(30, 41, 59, 0.5), transparent)
        `,
        color: '#f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        boxSizing: 'border-box',
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid rgba(239, 68, 68, 0.28)',
          borderRadius: 24,
          padding: '44px 32px',
          maxWidth: 540,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(239, 68, 68, 0.12)',
          boxSizing: 'border-box',
        }}
      >
        {/* Animated glowing icon */}
        <div
          style={{
            position: 'relative',
            width: 84,
            height: 84,
            margin: '0 auto 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -6,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.25)',
              animation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
            }}
          />
          <div
            style={{
              position: 'relative',
              width: 84,
              height: 84,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #ef4444 0%, #991b1b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 25px rgba(239, 68, 68, 0.45)',
              color: '#ffffff',
            }}
          >
            <Power size={38} strokeWidth={2.2} />
          </div>
        </div>

        {/* Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 9999,
            background: 'rgba(239, 68, 68, 0.14)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            color: '#fca5a5',
            fontSize: '0.78rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            marginBottom: 18,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background: '#ef4444',
              boxShadow: '0 0 10px #ef4444',
            }}
          />
          <span>HTTP 503 • Offline for Maintenance</span>
        </div>

        <h1
          style={{
            fontSize: '1.65rem',
            fontWeight: 800,
            color: '#ffffff',
            marginBottom: 12,
            lineHeight: 1.3,
          }}
        >
          {title || 'Site Temporarily Offline'}
        </h1>

        <p
          style={{
            fontSize: '0.95rem',
            color: '#94a3b8',
            lineHeight: 1.65,
            marginBottom: 28,
          }}
        >
          {message || 'We are currently performing essential server maintenance and upgrades. Public access is temporarily paused. Please check back shortly.'}
        </p>

        <button
          onClick={() => window.location.reload()}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            color: '#ffffff',
            border: 'none',
            padding: '12px 26px',
            borderRadius: 12,
            fontWeight: 700,
            fontSize: '0.92rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 16px rgba(37, 99, 235, 0.35)',
          }}
        >
          <RefreshCw size={17} />
          Check Again / Refresh
        </button>

        <div
          style={{
            marginTop: 24,
            fontSize: '0.8rem',
            color: '#64748b',
          }}
        >
          Auto-checking status in background...
        </div>
      </div>

      <div
        style={{
          marginTop: 32,
          textAlign: 'center',
          fontSize: '0.82rem',
          color: '#475569',
        }}
      >
        <p style={{ margin: 0 }}>1024TeraViralHub • All systems monitored</p>
        <p style={{ marginTop: 8 }}>
          <a
            href="/admin"
            style={{
              color: '#64748b',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            Store Administrator Login &rarr;
          </a>
        </p>
      </div>
    </div>
  )
}
