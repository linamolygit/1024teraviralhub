// src/client/components/ads/AnchorAd.tsx — High-CPM Sticky Bottom Anchor Ad (Google AdSense & AdX GAM)
import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp, X } from 'lucide-react'
import { api } from '../../lib/api'

export default function AnchorAd() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)

  // Don't render on admin routes
  const isAdmin = location.pathname.startsWith('/admin')

  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 2,
  })

  const placement = data?.placements?.['global_anchor_ad']

  // Check if session previously closed
  useEffect(() => {
    try {
      if (sessionStorage.getItem('tvh_anchor_ad_dismissed') === 'true') {
        setIsDismissed(true)
      }
    } catch {}
  }, [])

  // Execute ad script
  useEffect(() => {
    const container = containerRef.current
    if (!container || !placement?.custom_code || isDismissed || isCollapsed) return

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
  }, [placement?.custom_code, isDismissed, isCollapsed])

  if (isAdmin || isDismissed || !placement || !placement.custom_code) {
    return null
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    try {
      sessionStorage.setItem('tvh_anchor_ad_dismissed', 'true')
    } catch {}
  }

  return (
    <div
      id="tvh-anchor-ad-wrapper"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 9998,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
        transition: 'transform 0.3s ease',
        transform: isCollapsed ? 'translateY(calc(100% - 24px))' : 'translateY(0)',
      }}
    >
      {/* Top Handle / Control Bar */}
      <div
        style={{
          width: '100%',
          maxWidth: '728px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 12px',
          background: 'rgba(0, 0, 0, 0.04)',
          borderBottom: isCollapsed ? 'none' : '1px solid rgba(0, 0, 0, 0.06)',
          fontSize: '0.65rem',
          color: '#6B7280',
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          fontWeight: 700,
        }}
      >
        <span>Advertisement</span>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4B5563',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
            title={isCollapsed ? 'Expand Ad' : 'Collapse Ad'}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4B5563',
              display: 'flex',
              alignItems: 'center',
              padding: '2px',
            }}
            title="Close Ad"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Ad Runner Slot */}
      {!isCollapsed && (
        <div
          ref={containerRef}
          style={{
            width: '100%',
            maxWidth: '728px',
            minHeight: '50px',
            maxHeight: '100px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            padding: '4px 0',
          }}
        />
      )}
    </div>
  )
}
