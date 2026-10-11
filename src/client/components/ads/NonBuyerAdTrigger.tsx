// src/client/components/ads/NonBuyerAdTrigger.tsx — Non-Buyer Monetization Engine (Product-Page Only Back Button Trap)
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

  // Helper to check if user has purchased (protect paying buyers from any ads)
  const isPayingBuyer = () => {
    try {
      if (localStorage.getItem('tvh_user_is_buyer') === 'true') return true
      if (sessionStorage.getItem('tvh_active_order') || localStorage.getItem('tvh_active_order')) return true
      if (sessionStorage.getItem('tvh_active_order_number') || localStorage.getItem('tvh_active_order_number')) return true
      if (typeof document !== 'undefined' && document.cookie.includes('tvh_customer_orders')) return true
      const lastPurchase = Number(localStorage.getItem('tvh_last_purchase_time') || '0')
      if (lastPurchase && Date.now() - lastPurchase < 30 * 24 * 60 * 60 * 1000) return true
    } catch {
      // ignore
    }
    return false
  }

  // 1. Inject Global Header / Body Ad Script if configured
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

  // 2. Track Successful Buyers (to permanently protect them)
  useEffect(() => {
    if (
      location.pathname.startsWith('/payment/success') ||
      location.pathname.startsWith('/download/') ||
      location.pathname.startsWith('/order/details') ||
      location.pathname.startsWith('/orders/details') ||
      location.pathname.startsWith('/my-orders')
    ) {
      try {
        localStorage.setItem('tvh_user_is_buyer', 'true')
        localStorage.setItem('tvh_last_purchase_time', String(Date.now()))
        sessionStorage.removeItem('tvh_buy_clicked')
        sessionStorage.removeItem('tvh_checkout_abandoned')
      } catch {
        // ignore
      }
    }
  }, [location.pathname])

  // 3. ⚡ STRICT ENGINE: Product Page Back-Button Direct Link Trigger ONLY
  // Back-button ad MUST ONLY work on the product page (/product/:slug)
  useEffect(() => {
    const isProductPage = location.pathname.startsWith('/product/')

    // If NOT on a product page, do absolutely nothing!
    if (!isProductPage) {
      return
    }

    if (!rules?.non_buyer_ads_enabled || !rules?.non_buyer_direct_link_url) return
    if (rules.product_page_back_button_ad === false) return
    if (isPayingBuyer()) return

    const directLink = rules.non_buyer_direct_link_url.trim()
    if (!directLink) return

    // Clear navigation states on product page mount
    sessionStorage.removeItem('tvh_buy_clicked')
    sessionStorage.removeItem('tvh_navigated_by_click')

    const currentProductPath = location.pathname
    const trapKey = `tvh_trap_installed_${currentProductPath}`

    // Push duplicate state ONCE so browser back triggers popstate instead of leaving site
    if (!sessionStorage.getItem(trapKey)) {
      sessionStorage.setItem(trapKey, 'true')
      try {
        window.history.pushState(
          { tvh_product_page_trap: true, productPath: currentProductPath },
          '',
          window.location.href
        )
      } catch {
        // ignore
      }
    }

    // Detect if user clicks Buy Now or any link/button to navigate away legitimately
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const isBuyAction =
        target.closest('button')?.textContent?.toLowerCase().includes('buy') ||
        target.closest('button')?.textContent?.toLowerCase().includes('pay') ||
        target.closest('a')?.getAttribute('href')?.includes('/checkout') ||
        target.closest('.buy-btn') !== null

      if (isBuyAction) {
        sessionStorage.setItem('tvh_buy_clicked', 'true')
        return
      }

      // If user clicked any regular link or button to navigate
      if (target.closest('a') || target.closest('button')) {
        sessionStorage.setItem('tvh_navigated_by_click', 'true')
      }
    }

    // Handle popstate: ONLY triggers if user hits Back from this product page
    const handlePopState = (e: PopStateEvent) => {
      // Must be leaving the product page
      if (!currentProductPath.startsWith('/product/')) return

      // If user is a buyer, clicked Buy Now, or navigated via a link click, abort!
      if (
        isPayingBuyer() ||
        sessionStorage.getItem('tvh_buy_clicked') === 'true' ||
        sessionStorage.getItem('tvh_navigated_by_click') === 'true'
      ) {
        return
      }

      // Frequency cap check
      try {
        const lastTrigger = Number(localStorage.getItem('tvh_last_non_buyer_ad') || '0')
        const intervalMs = (rules.non_buyer_frequency_minutes || 10) * 60 * 1000
        if (Date.now() - lastTrigger < intervalMs) {
          return
        }
      } catch {}

      try {
        localStorage.setItem('tvh_last_non_buyer_ad', String(Date.now()))
        sessionStorage.removeItem(trapKey)

        // Attempt 1: Open direct link in a new tab
        const win = window.open(directLink, '_blank')
        if (!win || win.closed || typeof win.closed === 'undefined') {
          // Attempt 2: If browser blocked new tab or mobile swipe back, redirect
          window.location.href = directLink
        } else {
          // New tab opened! Proceed back in history so user goes back to store/previous page
          window.history.back()
        }
      } catch {
        window.location.href = directLink
      }
    }

    window.addEventListener('click', handleDocumentClick, { capture: true, passive: true })
    window.addEventListener('popstate', handlePopState)

    return () => {
      window.removeEventListener('click', handleDocumentClick, { capture: true })
      window.removeEventListener('popstate', handlePopState)
    }
  }, [rules, location.pathname])

  return null
}
