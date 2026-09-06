// src/client/components/ads/NonBuyerAdTrigger.tsx — Non-Buyer Monetization Engine
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function NonBuyerAdTrigger() {
  const location = useLocation()
  const previousPathRef = useRef(location.pathname)

  // Fetch active ads configuration & rules
  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  })

  const rules = data?.rules

  // Helper to check if user has purchased recently (within 7 days)
  const isPayingBuyer = () => {
    try {
      const isBuyer = localStorage.getItem('tvh_user_is_buyer') === 'true'
      const lastPurchase = Number(localStorage.getItem('tvh_last_purchase_time') || '0')
      if (isBuyer && Date.now() - lastPurchase < 7 * 24 * 60 * 60 * 1000) {
        return true
      }
    } catch {
      // ignore
    }
    return false
  }

  // 1. Inject Global Header / Body Ad Script (e.g. Monetag Multi-Tag or Popunder)
  useEffect(() => {
    if (!rules?.global_header_script) return

    const scriptId = 'tvh-global-ad-script'
    if (document.getElementById(scriptId)) return

    const temp = document.createElement('div')
    temp.innerHTML = rules.global_header_script

    const scripts = Array.from(temp.querySelectorAll('script'))
    scripts.forEach((s) => {
      const el = document.createElement('script')
      el.id = scriptId
      Array.from(s.attributes).forEach((a) => el.setAttribute(a.name, a.value))
      if (s.innerHTML) el.innerHTML = s.innerHTML
      document.head.appendChild(el)
    })
  }, [rules?.global_header_script])

  // 2. Track Successful Buyers (to protect them from intrusive non-buyer ads)
  useEffect(() => {
    if (location.pathname.startsWith('/payment/success') || location.pathname.startsWith('/download/')) {
      try {
        localStorage.setItem('tvh_user_is_buyer', 'true')
        localStorage.setItem('tvh_last_purchase_time', String(Date.now()))
        sessionStorage.removeItem('tvh_buy_clicked')
      } catch {
        // ignore
      }
    }
  }, [location.pathname])

  // 3. Track Checkout State to detect Checkout Abandonment
  useEffect(() => {
    const prev = previousPathRef.current
    const curr = location.pathname
    previousPathRef.current = curr

    // If user was in checkout but navigated away without landing on success
    if (
      prev.startsWith('/checkout') &&
      !curr.startsWith('/checkout') &&
      !curr.startsWith('/payment/success')
    ) {
      sessionStorage.setItem('tvh_checkout_abandoned', 'true')
    }

    if (curr.startsWith('/checkout')) {
      sessionStorage.setItem('tvh_in_checkout', 'true')
    }
  }, [location.pathname])

  // 4. ⚡ SPECIAL ENGINE: Product Page Back-Button Trap & Direct Link Launcher
  // When a visitor is on a product page and hits the back button without buying, instantly open the direct link
  useEffect(() => {
    if (!rules?.non_buyer_ads_enabled || !rules?.non_buyer_direct_link_url) return
    if (rules.product_page_back_button_ad === false) return
    if (isPayingBuyer()) return

    const isProductPage = location.pathname.startsWith('/product/')
    if (!isProductPage) return

    // Clean up buy click state when entering a new product page
    sessionStorage.removeItem('tvh_buy_clicked')

    const trapKey = `tvh_trap_installed_${location.pathname}`
    if (!sessionStorage.getItem(trapKey)) {
      sessionStorage.setItem(trapKey, 'true')
      try {
        // Push duplicate state so browser back triggers popstate instead of immediately leaving
        window.history.pushState({ tvh_back_trap: true, path: location.pathname }, '', window.location.href)
      } catch {
        // ignore
      }
    }

    const handlePopState = (e: PopStateEvent) => {
      // If paying customer or clicked buy button, do not trigger ad
      if (isPayingBuyer() || sessionStorage.getItem('tvh_buy_clicked') === 'true') {
        return
      }

      const directLink = rules.non_buyer_direct_link_url.trim()
      if (!directLink) return

      try {
        localStorage.setItem('tvh_last_non_buyer_ad', String(Date.now()))
        sessionStorage.removeItem(trapKey)

        // Attempt 1: Open direct link in a new tab
        const win = window.open(directLink, '_blank')
        if (!win || win.closed || typeof win.closed === 'undefined') {
          // Attempt 2: If browser blocked new tab or mobile swipe back, redirect directly
          window.location.href = directLink
        } else {
          // New tab opened! Proceed back in history so user goes back to store/homepage
          window.history.back()
        }
      } catch {
        window.location.href = directLink
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [rules, location.pathname])

  // 5. General Non-Buyer Ad Trigger Handler (Checkout Abandonment & Browse Clicks)
  useEffect(() => {
    if (!rules?.non_buyer_ads_enabled || !rules?.non_buyer_direct_link_url) return

    // Never trigger on checkout or admin pages
    if (location.pathname.startsWith('/checkout') || location.pathname.startsWith('/admin')) {
      return
    }

    // Helper to check frequency cap
    const canTriggerAd = () => {
      try {
        const lastTrigger = Number(localStorage.getItem('tvh_last_non_buyer_ad') || '0')
        const intervalMs = (rules.non_buyer_frequency_minutes || 10) * 60 * 1000
        return Date.now() - lastTrigger >= intervalMs
      } catch {
        return true
      }
    }

    const fireNonBuyerAd = () => {
      if (isPayingBuyer() || !canTriggerAd()) return

      try {
        localStorage.setItem('tvh_last_non_buyer_ad', String(Date.now()))
        sessionStorage.removeItem('tvh_checkout_abandoned')

        // Open direct monetization link in background / new tab
        const win = window.open(rules.non_buyer_direct_link_url, '_blank')
        if (win) {
          win.focus()
          window.focus()
        }
      } catch {
        // popup blocked or storage error
      }
    }

    // Trigger on Checkout Abandonment
    if (sessionStorage.getItem('tvh_checkout_abandoned') === 'true') {
      const timer = setTimeout(() => {
        fireNonBuyerAd()
      }, 800)
      return () => clearTimeout(timer)
    }

    // Trigger on Non-Buyer Clicks (when user clicks anywhere outside buy buttons)
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      // Don't trigger if user is clicking "Buy Now" or "Checkout"
      const isBuyAction =
        target.closest('button')?.textContent?.toLowerCase().includes('buy') ||
        target.closest('button')?.textContent?.toLowerCase().includes('pay') ||
        target.closest('a')?.getAttribute('href')?.includes('/checkout') ||
        target.closest('.buy-btn') !== null

      if (isBuyAction) {
        sessionStorage.setItem('tvh_buy_clicked', 'true')
        return
      }

      // If user has browsed and isn't buying, trigger ad
      if (rules.non_buyer_trigger_mode === 'all' || rules.non_buyer_trigger_mode === 'browse_interaction') {
        fireNonBuyerAd()
      }
    }

    // Listen on document with passive mode
    document.addEventListener('click', handleDocumentClick, { passive: true })
    return () => {
      document.removeEventListener('click', handleDocumentClick)
    }
  }, [rules, location.pathname])

  return null
}
