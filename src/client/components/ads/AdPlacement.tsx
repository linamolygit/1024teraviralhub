// src/client/components/ads/AdPlacement.tsx — Real Dynamic Ad Runner & Container
import React, { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

interface AdPlacementProps {
  placementKey: string
  className?: string
  style?: React.CSSProperties
}

export default function AdPlacement({ placementKey, className = '', style }: AdPlacementProps) {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  // 1. Strict suppression on checkout & payment & admin paths
  const isCheckoutOrPayment =
    location.pathname.startsWith('/checkout') ||
    location.pathname.startsWith('/payment') ||
    location.pathname.startsWith('/admin')

  // 2. Fetch active ad placements configuration from public API
  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  })

  const placement = data?.placements?.[placementKey]
  const shouldSuppressCheckout = placement ? Boolean(placement.suppress_on_checkout) : true

  // If checkout suppression is active or slot not found/inactive, render nothing
  if (isCheckoutOrPayment && shouldSuppressCheckout) {
    return null
  }

  if (!placement || !placement.custom_code) {
    return null
  }

  // 3. Dynamic Script Execution Engine
  // Standard innerHTML does NOT run <script> tags. This runner extracts and injects them to execute Monetag/Adsterra/AdSense tags.
  useEffect(() => {
    const container = containerRef.current
    if (!container || !placement?.custom_code) return

    // Clear previous children
    container.innerHTML = ''

    // Create temporary parser div
    const temp = document.createElement('div')
    temp.innerHTML = placement.custom_code

    // Move non-script nodes
    const scripts: HTMLScriptElement[] = []
    const childNodes = Array.from(temp.childNodes)

    childNodes.forEach((node) => {
      if (node.nodeName.toLowerCase() === 'script') {
        scripts.push(node as HTMLScriptElement)
      } else {
        container.appendChild(node.cloneNode(true))
      }
    })

    // Execute scripts in sequential order
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

    // Push AdSense ads if applicable
    try {
      if (placement.custom_code.includes('adsbygoogle') && typeof (window as any).adsbygoogle !== 'undefined') {
        ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      }
    } catch {
      // ignore
    }
  }, [placement?.custom_code])

  return (
    <div
      className={`ad-placement-slot ${className}`}
      data-placement={placementKey}
      style={{
        margin: '20px auto',
        width: '100%',
        maxWidth: '728px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      <div
        style={{
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 4,
          alignSelf: 'center',
        }}
      >
        Advertisement
      </div>
      <div
        ref={containerRef}
        id={`ad-slot-${placementKey}`}
        style={{
          width: '100%',
          minHeight: '60px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: 8,
          background: 'rgba(0, 0, 0, 0.05)',
        }}
      />
    </div>
  )
}
