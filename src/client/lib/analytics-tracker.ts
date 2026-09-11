// src/client/lib/analytics-tracker.ts — Lightweight Client Analytics Engine
// Tracks pageviews, new vs returning visitors, dwell time, clicks, and live heartbeats

function getOrCreateVisitorId(): { visitorId: string; isNewUser: boolean } {
  if (typeof window === 'undefined') return { visitorId: '', isNewUser: false }
  try {
    let vid = localStorage.getItem('tvh_visitor_id')
    let isNew = false
    if (!vid) {
      vid = 'v_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
      localStorage.setItem('tvh_visitor_id', vid)
      isNew = true
    }
    return { visitorId: vid, isNewUser: isNew }
  } catch {
    return { visitorId: 'anon_' + Date.now(), isNewUser: false }
  }
}

function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return ''
  try {
    let sid = sessionStorage.getItem('tvh_session_id')
    if (!sid) {
      sid = 's_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now().toString(36)
      sessionStorage.setItem('tvh_session_id', sid)
    }
    return sid
  } catch {
    return 's_fallback_' + Date.now()
  }
}

export function detectTrafficSource(): string {
  if (typeof window === 'undefined') return 'Direct / Caption Link'
  const urlParams = new URLSearchParams(window.location.search)
  const utmSource = urlParams.get('utm_source')?.toLowerCase()
  const fbclid = urlParams.get('fbclid')
  const gclid = urlParams.get('gclid')
  const referrer = document.referrer.toLowerCase()

  if (fbclid || utmSource?.includes('facebook') || utmSource?.includes('fb') || referrer.includes('facebook.com') || referrer.includes('fb.me')) {
    return 'Facebook Reels / Stories'
  }
  if (utmSource?.includes('instagram') || referrer.includes('instagram.com')) {
    return 'Instagram'
  }
  if (gclid || utmSource?.includes('google') || referrer.includes('google.com') || referrer.includes('google.co.in')) {
    return 'Google Search'
  }
  if (utmSource?.includes('youtube') || referrer.includes('youtube.com')) {
    return 'YouTube'
  }
  if (utmSource) {
    return utmSource
  }
  if (referrer) {
    try {
      const refHost = new URL(referrer).hostname
      if (refHost && !refHost.includes(window.location.hostname)) {
        return refHost.replace('www.', '')
      }
    } catch {}
  }
  return 'Direct / Caption Link'
}

let activePageStartTime = Date.now()
let activePagePath = typeof window !== 'undefined' ? window.location.pathname : '/'
let activeProductId: number | undefined = undefined

// Send raw event to API
export function sendAnalyticsEvent(payload: {
  event_type: string
  product_id?: number
  metadata?: Record<string, unknown>
  useBeacon?: boolean
}) {
  if (typeof window === 'undefined') return

  const { visitorId, isNewUser } = getOrCreateVisitorId()
  const sessionId = getOrCreateSessionId()
  const source = detectTrafficSource()

  const body = {
    event_type: payload.event_type,
    product_id: payload.product_id,
    session_id: sessionId,
    referrer: document.referrer || undefined,
    utm_source: source,
    metadata: {
      visitor_id: visitorId,
      is_new_user: isNewUser,
      path: window.location.pathname,
      screen_width: window.innerWidth,
      ...payload.metadata,
    },
  }

  const jsonStr = JSON.stringify(body)

  if (payload.useBeacon && navigator.sendBeacon) {
    try {
      const blob = new Blob([jsonStr], { type: 'application/json' })
      navigator.sendBeacon('/api/analytics/event', blob)
      return
    } catch {}
  }

  fetch('/api/analytics/event', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: jsonStr,
    keepalive: true,
  }).catch(() => {})
}

// Track page view
export function trackPageView(pathname: string, productId?: number) {
  // Flush previous page dwell time before switching
  flushDwellTime()

  activePageStartTime = Date.now()
  activePagePath = pathname
  activeProductId = productId

  sendAnalyticsEvent({
    event_type: 'page_view',
    product_id: productId,
    metadata: {
      path: pathname,
      title: document.title,
    },
  })
}

// Track user clicks (e.g. Buy Now button, Product Cards)
export function trackUserClick(targetName: string, metadata?: Record<string, unknown>, productId?: number) {
  sendAnalyticsEvent({
    event_type: targetName.includes('buy') ? 'buy_now_click' : 'click',
    product_id: productId || activeProductId,
    metadata: {
      click_target: targetName,
      path: activePagePath,
      ...metadata,
    },
  })
}

// Flush dwell time when user leaves page or tab
export function flushDwellTime(useBeacon = false) {
  const durationSeconds = Math.round((Date.now() - activePageStartTime) / 1000)
  if (durationSeconds >= 2 && durationSeconds <= 3600) {
    sendAnalyticsEvent({
      event_type: 'dwell_time',
      product_id: activeProductId,
      useBeacon,
      metadata: {
        dwell_seconds: durationSeconds,
        path: activePagePath,
      },
    })
  }
}

// Setup Global Listeners (Heartbeat, Tab Close, Pagehide)
let isInitialized = false
export function initAnalyticsListeners() {
  if (typeof window === 'undefined' || isInitialized) return
  isInitialized = true

  // 1. Dwell time flushing on tab switch or close
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      flushDwellTime(true)
    } else {
      activePageStartTime = Date.now()
    }
  })

  window.addEventListener('pagehide', () => {
    flushDwellTime(true)
  })

  // 2. Heartbeat every 45s for Real-Time Live Visitors count
  setInterval(() => {
    if (document.visibilityState === 'visible') {
      sendAnalyticsEvent({
        event_type: 'heartbeat',
        product_id: activeProductId,
        metadata: {
          path: window.location.pathname,
        },
      })
    }
  }, 45000)
}
