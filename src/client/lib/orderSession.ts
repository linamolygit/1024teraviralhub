// src/client/lib/orderSession.ts — Dual Cookie & LocalStorage Persistence for Customer Orders
import { useState, useEffect, useCallback } from 'react'

export interface SavedOrderSession {
  orderNumber: string
  token?: string
  productTitle?: string
  amount?: number
  thumbnailUrl?: string
  createdAt?: string | number
  status?: string
}

const STORAGE_KEY = 'tvh_customer_orders'
const COOKIE_KEY = 'tvh_customer_orders'
const EVENT_NAME = 'tvh_orders_updated'

// ── Cookie Helpers ──
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const matches = document.cookie.match(
    new RegExp('(?:^|; )' + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)')
  )
  return matches ? decodeURIComponent(matches[1]) : null
}

function setCookie(name: string, value: string, days = 365) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  // Store with Lax SameSite and root path for persistent 1-year browser lifespan
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}

// ── Merged Retrieval from LocalStorage + Cookie ──
export function getSavedOrders(): SavedOrderSession[] {
  if (typeof window === 'undefined') return []

  let fromStorage: SavedOrderSession[] = []
  let fromCookie: SavedOrderSession[] = []

  // 1. Read from LocalStorage
  try {
    const rawStorage = localStorage.getItem(STORAGE_KEY)
    if (rawStorage) {
      const parsed = JSON.parse(rawStorage)
      if (Array.isArray(parsed)) fromStorage = parsed
    }
  } catch {
    // Ignore parse error
  }

  // 2. Read from Cookie
  try {
    const rawCookie = getCookie(COOKIE_KEY)
    if (rawCookie) {
      const parsed = JSON.parse(rawCookie)
      if (Array.isArray(parsed)) fromCookie = parsed
    }
  } catch {
    // Ignore parse error
  }

  // 3. Merge both sources (deduplicating by orderNumber or token)
  const map = new Map<string, SavedOrderSession>()

  // Process storage first, then cookie (cookie may update or vice versa)
  for (const item of [...fromCookie, ...fromStorage]) {
    if (!item) continue
    const key = (item.orderNumber || item.token || '').trim()
    if (!key) continue

    const existing = map.get(key)
    if (existing) {
      // Merge properties if newer or fuller
      map.set(key, {
        ...existing,
        ...item,
        token: item.token || existing.token,
        productTitle: item.productTitle || existing.productTitle,
        amount: item.amount || existing.amount,
        thumbnailUrl: item.thumbnailUrl || existing.thumbnailUrl,
        createdAt: item.createdAt || existing.createdAt || Date.now(),
      })
    } else {
      map.set(key, {
        ...item,
        createdAt: item.createdAt || Date.now(),
      })
    }
  }

  const merged = Array.from(map.values()).sort((a, b) => {
    const timeA = new Date(a.createdAt || 0).getTime()
    const timeB = new Date(b.createdAt || 0).getTime()
    return timeB - timeA
  })

  return merged
}

// ── Save Order to Dual Storage ──
export function saveOrderSession(order: SavedOrderSession): SavedOrderSession[] {
  if (typeof window === 'undefined') return []
  if (!order || (!order.orderNumber && !order.token)) return getSavedOrders()

  const current = getSavedOrders()
  const key = (order.orderNumber || order.token || '').trim()

  // Remove existing duplicate
  const filtered = current.filter((o) => {
    const oKey = (o.orderNumber || o.token || '').trim()
    return oKey !== key && (!order.orderNumber || o.orderNumber !== order.orderNumber)
  })

  // Add new order at the top
  const updated: SavedOrderSession[] = [
    {
      ...order,
      orderNumber: order.orderNumber?.trim() || '',
      token: order.token?.trim() || '',
      createdAt: order.createdAt || Date.now(),
    },
    ...filtered,
  ].slice(0, 50) // Keep up to 50 recent orders

  const jsonStr = JSON.stringify(updated)

  // Write to LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY, jsonStr)
  } catch {
    // Ignore storage quota errors
  }

  // Write to Cookie (365 days)
  try {
    setCookie(COOKIE_KEY, jsonStr, 365)
  } catch {
    // Ignore cookie write errors
  }

  // Notify active listeners across application
  try {
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore dispatch errors
  }

  return updated
}

// ── Remove Order from Dual Storage ──
export function removeOrderSession(orderNumberOrToken: string): SavedOrderSession[] {
  if (typeof window === 'undefined') return []
  const key = (orderNumberOrToken || '').trim()
  if (!key) return getSavedOrders()

  const current = getSavedOrders()
  const updated = current.filter((o) => o.orderNumber !== key && o.token !== key)
  const jsonStr = JSON.stringify(updated)

  try {
    localStorage.setItem(STORAGE_KEY, jsonStr)
    setCookie(COOKIE_KEY, jsonStr, 365)
    window.dispatchEvent(new Event(EVENT_NAME))
  } catch {
    // Ignore errors
  }

  return updated
}

// ── React Hook for Reactive Components ──
export function useSavedOrders() {
  const [orders, setOrders] = useState<SavedOrderSession[]>(() => {
    return typeof window !== 'undefined' ? getSavedOrders() : []
  })

  const refresh = useCallback(() => {
    setOrders(getSavedOrders())
  }, [])

  useEffect(() => {
    refresh()

    const handleUpdate = () => {
      refresh()
    }

    window.addEventListener(EVENT_NAME, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [refresh])

  const save = useCallback((order: SavedOrderSession) => {
    const updated = saveOrderSession(order)
    setOrders(updated)
  }, [])

  const remove = useCallback((orderNumber: string) => {
    const updated = removeOrderSession(orderNumber)
    setOrders(updated)
  }, [])

  return {
    orders,
    count: orders.length,
    refresh,
    saveOrder: save,
    removeOrder: remove,
  }
}
