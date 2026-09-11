// src/client/components/GoogleServicesHead.tsx — Dynamic Google Suite Injector
// Injects Google Search Console Verification, GA4 Tracking, AdSense, and AdX based on Admin Settings

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'

export default function GoogleServicesHead() {
  const { data: settings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
    staleTime: 1000 * 60 * 5, // 5 mins
  })

  useEffect(() => {
    if (!settings || typeof window === 'undefined') return

    // ─── 1. Google Search Console Verification Meta Tag ─────────────
    if (settings.gsc_enabled !== false && settings.gsc_verification_tag) {
      try {
        let token = settings.gsc_verification_tag.trim()
        // If user pasted full <meta name="google-site-verification" content="..." />
        const match = token.match(/content=["']([^"']+)["']/i)
        if (match && match[1]) {
          token = match[1]
        }

        if (token) {
          let meta = document.querySelector('meta[name="google-site-verification"]')
          if (!meta) {
            meta = document.createElement('meta')
            meta.setAttribute('name', 'google-site-verification')
            document.head.appendChild(meta)
          }
          meta.setAttribute('content', token)
        }
      } catch (err) {
        console.warn('[GSC] Failed to set verification meta tag:', err)
      }
    }

    // ─── 2. Google Analytics (GA4) Tracking ─────────────────────────
    if (settings.ga4_enabled !== false && settings.ga4_measurement_id) {
      const measurementId = settings.ga4_measurement_id.trim()
      if (measurementId && !document.getElementById('ga4-gtag-script')) {
        try {
          // Initialize window.dataLayer
          const win = window as any
          win.dataLayer = win.dataLayer || []
          function gtag(...args: any[]) {
            win.dataLayer.push(arguments)
          }
          win.gtag = gtag
          gtag('js', new Date())
          gtag('config', measurementId, {
            send_page_view: true,
            anonymize_ip: true,
          })

          // Inject gtag.js script
          const script = document.createElement('script')
          script.id = 'ga4-gtag-script'
          script.async = true
          script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
          document.head.appendChild(script)
        } catch (err) {
          console.warn('[GA4] Failed to initialize Google Analytics:', err)
        }
      }
    }

    // ─── 3. Google AdSense Auto-Ads Tag ────────────────────────────
    if (settings.adsense_enabled && settings.adsense_publisher_id) {
      let pubId = settings.adsense_publisher_id.trim()
      if (!pubId.startsWith('ca-pub-') && pubId.startsWith('pub-')) {
        pubId = `ca-${pubId}`
      }

      if (pubId && !document.getElementById('adsense-script')) {
        try {
          const script = document.createElement('script')
          script.id = 'adsense-script'
          script.async = true
          script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`
          script.crossOrigin = 'anonymous'
          document.head.appendChild(script)
        } catch (err) {
          console.warn('[AdSense] Failed to initialize AdSense:', err)
        }
      }

      // Inject custom AdSense snippet if provided
      if (settings.adsense_head_code && !document.getElementById('adsense-custom-head-code')) {
        try {
          const container = document.createElement('div')
          container.id = 'adsense-custom-head-code'
          container.style.display = 'none'
          container.innerHTML = settings.adsense_head_code
          document.head.appendChild(container)
        } catch {}
      }
    }

    // ─── 4. Google AdX / Google Ad Manager (GAM) Tag ────────────────
    if (settings.adx_enabled) {
      if (!document.getElementById('adx-gpt-script')) {
        try {
          const script = document.createElement('script')
          script.id = 'adx-gpt-script'
          script.async = true
          script.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js'
          script.crossOrigin = 'anonymous'
          document.head.appendChild(script)

          const win = window as any
          win.googletag = win.googletag || { cmd: [] }
        } catch (err) {
          console.warn('[AdX] Failed to load Google Publisher Tag:', err)
        }
      }

      // Custom GPT head snippet if provided
      if (settings.adx_head_code && !document.getElementById('adx-custom-head-code')) {
        try {
          const container = document.createElement('div')
          container.id = 'adx-custom-head-code'
          container.style.display = 'none'
          container.innerHTML = settings.adx_head_code
          document.head.appendChild(container)
        } catch {}
      }
    }
  }, [settings])

  return null
}
