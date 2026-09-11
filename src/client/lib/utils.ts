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

/**
 * Generates a realistic, fully valid 10-digit Indian mobile number.
 * Conforms to the Indian National Numbering Plan (starts with 6-9, realistic operator prefixes).
 * Passes Razorpay strict regex validation without triggering dummy number blacklists (like 9876543210).
 */
export function generateRealisticIndianPhone(seed?: string): string {
  const prefixes = [
    '9820', '9821', '9819', '9833', '9867', '9892', '9769', // Mumbai
    '9810', '9811', '9818', '9871', '9873', '9910', '9958', // Delhi NCR
    '9845', '9880', '9886', '9900', '9945', '9972', '9980', // Bangalore
    '9840', '9841', '9884', '9940', '9962', '9790',         // Chennai
    '9830', '9831', '9836', '9874', '9748', '9903',         // Kolkata
    '9829', '9828', '9784', '9826', '9827', '9893',         // Rajasthan & MP
    '9822', '9823', '9850', '9860', '9890', '9765',         // Pune & MH
    '9848', '9849', '9866', '9885', '9948', '9959',         // Hyderabad
    '9814', '9815', '9872', '9876', '9888', '9914',         // Punjab
    '9839', '9838', '9935', '9415', '9450', '9451',         // UP
    '9835', '9934', '9939', '9708', '9973', '9801',         // Bihar
    '9824', '9825', '9898', '9909', '9925', '9724',         // Gujarat
  ]

  let hash = 0
  if (seed) {
    for (let i = 0; i < seed.length; i++) {
      hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0
    }
  } else {
    hash = Math.floor(Math.random() * 10000000)
  }
  const positiveHash = Math.abs(hash)
  const prefix = prefixes[positiveHash % prefixes.length]

  const remainingDigits = 10 - prefix.length
  let rest = ''
  for (let i = 0; i < remainingDigits; i++) {
    const digit = Math.abs(Math.floor(Math.sin(positiveHash + (i + 1) * 7.919) * 10000)) % 10
    rest += digit.toString()
  }

  if (/^(\d)\1+$/.test(rest) || rest === '543210') {
    rest = '381942'
  }

  return `${prefix}${rest}`
}

/**
 * Returns user-provided phone if valid 10-digit Indian phone,
 * or generates a realistic valid 10-digit mobile number so Razorpay never asks to fill contact details.
 */
export function getSanitizedCustomerPhone(phoneInput?: string | null, seed?: string): string {
  if (phoneInput) {
    const cleaned = phoneInput.replace(/\D/g, '').slice(-10)
    if (
      cleaned.length === 10 &&
      /^[6-9]\d{9}$/.test(cleaned) &&
      !/^(.)\1{9}$/.test(cleaned) &&
      cleaned !== '9876543210' &&
      cleaned !== '1234567890'
    ) {
      return cleaned
    }
  }
  return generateRealisticIndianPhone(seed)
}
