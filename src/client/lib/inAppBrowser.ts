// src/client/lib/inAppBrowser.ts — In-App Browser Detection & Android Chrome Intent Breakout Engine

export interface InAppBrowserInfo {
  isInApp: boolean
  isFacebook: boolean
  isInstagram: boolean
  isOtherInApp: boolean
  isAndroid: boolean
  isIOS: boolean
  userAgent: string
}

export function detectInAppBrowser(): InAppBrowserInfo {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return {
      isInApp: false,
      isFacebook: false,
      isInstagram: false,
      isOtherInApp: false,
      isAndroid: false,
      isIOS: false,
      userAgent: '',
    }
  }

  const ua = navigator.userAgent || navigator.vendor || (window as any).opera || ''

  const isAndroid = /android/i.test(ua)
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream

  // Facebook App identifiers: FBAN (FB Android App), FBAV (FB App Version), FB_IAB (FB In-App Browser), FB4A, FBIOS
  const isFacebook = /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i.test(ua)

  // Instagram App identifier
  const isInstagram = /Instagram/i.test(ua)

  // Other social in-app WebViews
  const isOtherInApp = /Snapchat|Line|WhatsApp|Twitter|MicroMessenger|musical_ly|BytedanceWebview/i.test(ua)

  const isInApp = isFacebook || isInstagram || isOtherInApp

  return {
    isInApp,
    isFacebook,
    isInstagram,
    isOtherInApp,
    isAndroid,
    isIOS,
    userAgent: ua,
  }
}

/**
 * Returns an Android Intent URI that forces opening the URL inside Google Chrome
 */
export function getChromeIntentUrl(customUrl?: string): string {
  if (typeof window === 'undefined') return ''
  const target = customUrl || window.location.href
  const clean = target.replace(/^https?:\/\//i, '')
  return `intent://${clean}#Intent;scheme=https;package=com.android.chrome;end;`
}

/**
 * Returns an Android Intent URI that opens the device's default web browser
 */
export function getDefaultBrowserIntentUrl(customUrl?: string): string {
  if (typeof window === 'undefined') return ''
  const target = customUrl || window.location.href
  const clean = target.replace(/^https?:\/\//i, '')
  return `intent://${clean}#Intent;scheme=https;action=android.intent.action.VIEW;end;`
}

/**
 * Triggers external browser breakout on Android
 */
export function triggerChromeBreakout(customUrl?: string): void {
  if (typeof window === 'undefined') return
  const chromeIntent = getChromeIntentUrl(customUrl)
  try {
    window.location.href = chromeIntent
  } catch (err) {
    console.warn('Chrome intent breakout failed, falling back to default browser intent:', err)
    window.location.href = getDefaultBrowserIntentUrl(customUrl)
  }
}

/**
 * Automatically attempts to break out of Facebook/Instagram In-App Browser into Google Chrome (Flipkart-style)
 * Runs once per session to avoid loops if user presses Back button.
 */
export function attemptAutoChromeBreakout(customUrl?: string): boolean {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false
  const info = detectInAppBrowser()
  if (!info.isAndroid || !info.isInApp) {
    return false
  }

  try {
    const alreadyRedirected = sessionStorage.getItem('tvh_auto_chrome_opened')
    if (alreadyRedirected === '1') {
      return false
    }
    sessionStorage.setItem('tvh_auto_chrome_opened', '1')
    triggerChromeBreakout(customUrl)
    return true
  } catch (err) {
    console.warn('Auto chrome breakout failed:', err)
    return false
  }
}

