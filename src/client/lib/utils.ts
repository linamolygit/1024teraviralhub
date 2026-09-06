// ============================================
// src/client/lib/utils.ts — Utility Functions
// ============================================

import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

// cn utility for conditional class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency (INR)
export function formatPrice(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format file size
export function formatFileSize(bytes: number | null): string {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
}

// Format date
export function formatDate(dateStr: string): string {
  try { return format(new Date(dateStr), 'dd MMM yyyy') } catch { return dateStr }
}

// Format relative time
export function timeAgo(dateStr: string): string {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }) } catch { return dateStr }
}

// Calculate discount percentage
export function discountPercent(original: number, sale: number): number {
  return Math.round(((original - sale) / original) * 100)
}

// Get UTM params from current URL
export function getUtmParams(): Record<string, string> {
  const params = new URLSearchParams(window.location.search)
  const utm: Record<string, string> = {}
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']) {
    const val = params.get(key)
    if (val) utm[key] = val
  }
  return utm
}

// Save UTM to sessionStorage (persist across navigation)
export function saveUtmParams(): void {
  const utm = getUtmParams()
  if (Object.keys(utm).length > 0) {
    sessionStorage.setItem('utm_params', JSON.stringify(utm))
  }
}

export function getSavedUtmParams(): Record<string, string> {
  try {
    const saved = sessionStorage.getItem('utm_params')
    return saved ? JSON.parse(saved) : {}
  } catch { return {} }
}

// Truncate text
export function truncate(str: string, len: number): string {
  return str.length > len ? `${str.slice(0, len)}…` : str
}

// Debounce
export function debounce<T extends (...args: unknown[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), ms)
  }) as T
}

// Fire Meta Pixel event (if pixel loaded)
export function trackPixelEvent(event: string, data?: Record<string, unknown>): void {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fbq = (window as any).fbq
    if (typeof fbq === 'function') {
      fbq('track', event, data)
    }
  } catch { /* Pixel not loaded */ }
}

// Time remaining string
export function timeRemaining(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m remaining`
  return `${minutes}m remaining`
}
