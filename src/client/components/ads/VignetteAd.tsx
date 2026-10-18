// src/client/components/ads/VignetteAd.tsx — Global Vignette / Interstitial Page Ad (AdSense & AdX GAM)
import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { api } from '../../lib/api'

export default function VignetteAd() {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const [hasTriggeredThisSession, setHasTriggeredThisSession] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Don't render on admin routes or payment processing
  const isAdminOrPayment =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/payment/processing')

  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 2,
  })

  const placement = data?.placements?.['global_vignette_ad']

  // Check if session previously closed vignette
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tvh_vignette_ad_dismissed') === 'true') {
        setHasTriggeredThisSession(true)
      }
    } catch {}
  }, [])

  // Auto trigger after route change or 5s delay on product/blog/home if configured
  useEffect(() => {
    if (isAdminOrPayment || hasTriggeredThisSession || !placement?.custom_code) return

    // Show after 5 seconds on initial page load
    const timer = setTimeout(() => {
      setIsOpen(true)
      setHasTriggeredThisSession(true)
      try {
        sessionStorage.setItem('tvh_vignette_ad_dismissed', 'true')
      } catch {}
    }, 5000)

    return () => clearTimeout(timer)
  }, [isAdminOrPayment, hasTriggeredThisSession, placement?.custom_code, location.pathname])

  // Execute snippet
  useEffect(() => {
    const container = containerRef.current
    if (!container || !placement?.custom_code || !isOpen) return

    container.innerHTML = ''
    const temp = document.createElement('div')
    temp.innerHTML = placement.custom_code

    const scripts: HTMLScriptElement[] = []
    Array.from(temp.childNodes).forEach((node) => {
      if (node.nodeName.toLowerCase() === 'script') {
        scripts.push(node as HTMLScriptElement)
      } else {
        container.appendChild(node.cloneNode(true))
      }
    })

    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script')
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value)
      })
      if (oldScript.innerHTML) {
        newScript.innerHTML = oldScript.innerHTML
      }
      container.appendChild(newScript)
    })

    try {
      if (placement.custom_code.includes('adsbygoogle') && typeof (window as any).adsbygoogle !== 'undefined') {
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      }
    } catch {}
  }, [placement?.custom_code, isOpen])

  if (isAdminOrPayment || !placement || !placement.custom_code || !isOpen) {
    return null
  }

  return (
    <div
      id="tvh-vignette-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.25s ease-out',
      }}
    >
      {/* Vignette Header Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#9CA3AF', fontSize: '0.78rem' }}>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            Advertisement
          </span>
        </div>

        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close Advertisement"
          style={{
            background: 'rgba(255, 255, 255, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.35)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)')}
        >
          <X size={20} />
        </button>
      </div>

      {/* Ad Box Container */}
      <div
        ref={containerRef}
        id="ad-slot-global_vignette_ad"
        style={{
          width: '100%',
          maxWidth: '640px',
          minHeight: '350px',
          background: '#FFFFFF',
          borderRadius: 14,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      />

      {/* Bottom Dismiss Text */}
      <button
        type="button"
        onClick={() => setIsOpen(false)}
        style={{
          marginTop: '16px',
          background: 'none',
          border: 'none',
          color: '#D1D5DB',
          fontSize: '0.85rem',
          textDecoration: 'underline',
          cursor: 'pointer',
        }}
      >
        Skip and continue to website &rarr;
      </button>
    </div>
  )
}
