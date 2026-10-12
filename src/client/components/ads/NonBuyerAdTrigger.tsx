// src/client/components/ads/NonBuyerAdTrigger.tsx — Non-Buyer Monetization Engine (Product-Page Only Back Button Trap)
import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'

export default function NonBuyerAdTrigger() {
  const location = useLocation()
  const isNavigatingToCheckoutRef = useRef(false)

  // Fetch active ads configuration & rules
  const { data } = useQuery({
    queryKey: ['active-ads'],
    queryFn: () => api.ads.getActive(),
    staleTime: 1000 * 60 * 2, // 2 minutes cache
  })

  const rules = data?.rules

  // 1. Inject Global Header / Body Ad Script if configured in admin
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

  // 2. ⚡ ULTRA-RELIABLE ENGINE: Product Page Back-Button Direct Link Trigger ONLY
  // Back-button ad MUST ONLY work on the product page (/product/:slug)
  useEffect(() => {
    const isProductPage = location.pathname.startsWith('/product/')

    // If NOT on a product page (e.g. Home, Category, Search, Blog, Checkout), do absolutely nothing!
    if (!isProductPage) {
      return
    }

    if (!rules?.non_buyer_ads_enabled || !rules?.non_buyer_direct_link_url) {
      return
    }

    if (rules.product_page_back_button_ad === false) {
      return
    }

    const directLink = rules.non_buyer_direct_link_url.trim()
    if (!directLink) {
      return
    }

    // Reset checkout intention flag on product page
    isNavigatingToCheckoutRef.current = false

    // Push duplicate state into history stack so clicking Back triggers popstate instead of instantly exiting
    try {
      window.history.pushState({ tvh_product_trap: true, url: window.location.href }, '', window.location.href)
    } catch {
      // ignore
    }

    // Track if user clicked "Buy Now" or "Pay" so legitimate purchases are never interrupted
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (!target) return

      const isBuyAction =
        target.closest('button')?.textContent?.toLowerCase().includes('buy') ||
        target.closest('button')?.textContent?.toLowerCase().includes('pay') ||
        target.closest('a')?.getAttribute('href')?.includes('/checkout') ||
        target.closest('.buy-btn') !== null

      if (isBuyAction) {
        isNavigatingToCheckoutRef.current = true
      }
    }

    // Handle Back Button (popstate event)
    const handlePopState = (_e: PopStateEvent) => {
      // If user clicked Buy Now, do not trigger ad — let them continue to purchase
      if (isNavigatingToCheckoutRef.current) {
        return
      }

      // User pressed Back to leave the product page without buying -> LAUNCH AD DIRECT LINK!
      try {
        // window.location.href is 100% reliable across Chrome, Safari, Android, and iOS
        // It bypasses aggressive popup blockers that block window.open() on popstate
        window.location.href = directLink
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
