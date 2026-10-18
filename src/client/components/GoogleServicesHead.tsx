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

    // Helper to safely execute any raw HTML/script code in <head>
    const injectRawSnippet = (snippet: string, elementIdPrefix: string) => {
      if (!snippet || !snippet.trim()) return
      const trimmed = snippet.trim()
      const containerId = `${elementIdPrefix}-container`
      if (document.getElementById(containerId)) return

      try {
        const container = document.createElement('div')
        container.id = containerId
        container.style.display = 'none'

        // Parse scripts to execute them properly
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = trimmed

        // Extract and run scripts
        const scripts = tempDiv.querySelectorAll('script')
        scripts.forEach((oldScript, idx) => {
          const newScript = document.createElement('script')
          Array.from(oldScript.attributes).forEach((attr) => newScript.setAttribute(attr.name, attr.value))
          if (oldScript.innerHTML) {
            newScript.textContent = oldScript.innerHTML
          }
          newScript.id = `${elementIdPrefix}-script-${idx}`
          document.head.appendChild(newScript)
          oldScript.remove()
        })

        // Append remaining non-script nodes (meta tags, links, etc.)
        while (tempDiv.firstChild) {
          container.appendChild(tempDiv.firstChild)
        }
        document.head.appendChild(container)
      } catch (err) {
        console.warn(`[AdSenseHead] Failed to inject snippet for ${elementIdPrefix}:`, err)
      }
    }

    // ─── 3. Google AdSense Multi-Account Verification & Auto-Ads Tag ───
    if (settings.adsense_enabled !== false) {
      const accountsList: Array<{
        id: string
        label?: string
        publisher_id: string
        custom_code?: string
        auto_ads?: boolean
        is_primary?: boolean
      }> = []

      // Add accounts from multi-account array
      if (Array.isArray(settings.adsense_accounts) && settings.adsense_accounts.length > 0) {
        settings.adsense_accounts.forEach((acc) => {
          if (acc && acc.publisher_id && acc.publisher_id.trim()) {
            accountsList.push(acc)
          }
        })
      }

      // Fallback/Legacy: ensure primary publisher ID is present if configured
      if (settings.adsense_publisher_id && settings.adsense_publisher_id.trim()) {
        const legacyPub = settings.adsense_publisher_id.trim()
        const alreadyExists = accountsList.some(
          (a) => a.publisher_id.trim().toLowerCase() === legacyPub.toLowerCase()
        )
        if (!alreadyExists) {
          accountsList.unshift({
            id: 'primary-default',
            label: 'Primary Account',
            publisher_id: legacyPub,
            custom_code: settings.adsense_head_code,
            auto_ads: true,
            is_primary: true,
          })
        }
      }

      // Loop through all accounts and inject verification tags & scripts
      accountsList.forEach((acc) => {
        let pubId = acc.publisher_id.trim()
        if (!pubId.startsWith('ca-pub-') && pubId.startsWith('pub-')) {
          pubId = `ca-${pubId}`
        }
        const cleanPub = pubId.replace(/[^a-zA-Z0-9_-]/g, '')

        // A. Primary script loader for this publisher
        const scriptId = `adsense-script-${cleanPub}`
        if (!document.getElementById(scriptId)) {
          try {
            const script = document.createElement('script')
            script.id = scriptId
            script.async = true
            script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pubId}`
            script.crossOrigin = 'anonymous'
            document.head.appendChild(script)
          } catch (err) {
            console.warn(`[AdSense] Failed to initialize AdSense for ${pubId}:`, err)
          }
        }

        // B. Official Google AdSense verification meta tag
        const metaSelector = `meta[name="google-adsense-account"][content="${pubId}"]`
        if (!document.querySelector(metaSelector)) {
          try {
            const meta = document.createElement('meta')
            meta.setAttribute('name', 'google-adsense-account')
            meta.setAttribute('content', pubId)
            document.head.appendChild(meta)
          } catch {}
        }

        // C. Specific custom verification code for this account
        if (acc.custom_code && acc.custom_code.trim()) {
          injectRawSnippet(acc.custom_code, `adsense-acc-${cleanPub}`)
        }
      })

      // D. Legacy custom head code fallback
      if (settings.adsense_head_code && !accountsList.some((a) => a.custom_code === settings.adsense_head_code)) {
        injectRawSnippet(settings.adsense_head_code, 'adsense-legacy-head')
      }

      // E. Raw multi-account verification code snippets (bulk head code)
      if (settings.adsense_multi_head_code && settings.adsense_multi_head_code.trim()) {
        injectRawSnippet(settings.adsense_multi_head_code, 'adsense-multi-raw')
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
