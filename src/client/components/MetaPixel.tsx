// src/client/components/MetaPixel.tsx — Meta Pixel Dynamic Initialization & SPA Pageview Tracker
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useSiteConfig } from '../lib/site-config'

export default function MetaPixel() {
  const { metaPixelId, metaPixelEnabled } = useSiteConfig()
  const location = useLocation()

  // 1. Initialize Meta Pixel Script when ID is configured
  useEffect(() => {
    const rawId = metaPixelId?.trim()
    if (!rawId || rawId === 'YOUR_PIXEL_ID' || !metaPixelEnabled) return

    // Avoid duplicate script tag or re-init for the same pixel ID
    const win = window as any
    if (win._meta_pixel_initialized === rawId) return
    win._meta_pixel_initialized = rawId

    // Define fbq stub if not already injected by SSR
    if (!win.fbq) {
      ;(function (f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return
        n = f.fbq = function () {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
        }
        if (!f._fbq) f._fbq = n
        n.push = n
        n.loaded = !0
        n.version = '2.0'
        n.queue = []
        t = b.createElement(e)
        t.async = !0
        t.src = v
        s = b.getElementsByTagName(e)[0]
        s.parentNode.insertBefore(t, s)
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js')
    }

    if (typeof win.fbq === 'function') {
      win.fbq('init', rawId)
      win.fbq('track', 'PageView')
    }

    // Add noscript fallback if not already present
    if (!document.getElementById('meta-pixel-noscript')) {
      const noscript = document.createElement('noscript')
      noscript.id = 'meta-pixel-noscript'
      noscript.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${rawId}&ev=PageView&noscript=1"/>`
      document.body.appendChild(noscript)
    }
  }, [metaPixelId, metaPixelEnabled])

  // 2. Track PageView on SPA Route Changes
  useEffect(() => {
    const rawId = metaPixelId?.trim()
    if (!rawId || rawId === 'YOUR_PIXEL_ID' || !metaPixelEnabled) return

    const win = window as any
    if (typeof win.fbq === 'function' && win._meta_pixel_initialized) {
      win.fbq('track', 'PageView')
    }
  }, [location.pathname, metaPixelId, metaPixelEnabled])

  return null
}
