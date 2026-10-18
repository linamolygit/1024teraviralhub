// src/client/components/ads/SliderAd.tsx — Floating Corner Slider / Drawer Ad (AdSense & AdX GAM)
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, ChevronRight, ChevronLeft } from 'lucide-react'
import { api } from '../../lib/api'

export default function SliderAd() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Don't render on admin or payment processing
  const isAdminOrPayment =
    location.pathname.startsWith('/admin') ||
    location.pathname.startsWith('/payment/processing')

  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 2,
  })

  const placement = data?.placements?.['global_slider_ad']

  // Check if session previously dismissed
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tvh_slider_ad_dismissed') === 'true') {
        setIsDismissed(true)
      }
    } catch {}
  }, [])

  // Slide in after 3.5 seconds
  useEffect(() => {
    if (isAdminOrPayment || isDismissed || !placement?.custom_code) return
    const timer = setTimeout(() => {
      setIsVisible(true)
    }, 3500)
    return () => clearTimeout(timer)
  }, [isAdminOrPayment, isDismissed, placement?.custom_code])

  // Execute ad script
  useEffect(() => {
    const container = containerRef.current
    if (!container || !placement?.custom_code || !isVisible || isDismissed || isMinimized) return

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
  }, [placement?.custom_code, isVisible, isDismissed, isMinimized])

  if (isAdminOrPayment || isDismissed || !placement || !placement.custom_code || !isVisible) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem('tvh_slider_ad_dismissed', 'true')
    } catch {}
  }

  if (isMinimized) {
    return (
      <button
        type="button"
        onClick={() => setIsMinimized(false)}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '12px',
          zIndex: 9990,
          padding: '6px 12px',
          borderRadius: '20px',
          background: '#FFD200',
          color: '#000000',
          fontWeight: 800,
          fontSize: '0.75rem',
          border: 'none',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.25)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        <ChevronLeft size={14} /> Sponsor Ad
      </button>
    )
  }

  return (
    <div
      id="tvh-slider-ad-wrapper"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9990,
        maxWidth: '320px',
        width: '100%',
        background: '#FFFFFF',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        overflow: 'hidden',
        animation: 'slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Top Header of the Slider */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 10px',
          background: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
          fontSize: '0.68rem',
          color: '#6B7280',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
        }}
      >
        <span>Sponsored Ad</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            type="button"
            onClick={() => setIsMinimized(true)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '2px',
              display: 'flex',
            }}
            title="Minimize"
          >
            <ChevronRight size={13} />
          </button>
          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#6B7280',
              padding: '2px',
              display: 'flex',
            }}
            title="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Runner Box */}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          minHeight: '120px',
          maxHeight: '270px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '6px',
          overflow: 'hidden',
          background: 'rgba(0, 0, 0, 0.02)',
        }}
      />
    </div>
  )
}
