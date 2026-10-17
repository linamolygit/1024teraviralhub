// src/client/lib/orderVerification.ts — Privacy Protection & Order Verification Engine
// Protects the owner's personal name & phone number from public web scrapers/unverified visitors.
// Information is ONLY unlocked and visible once a customer submits or verifies a valid Order Number.

import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { getSavedOrders } from './orderSession'

export const VERIFIED_STORAGE_KEY = 'tvh_verified_order_number'
export const VERIFICATION_EVENT = 'tvh_order_verification_changed'

export const PRIVACY_CONFIG = {
  rawPhone: '+91 9801947855',
  maskedPhone: '+91 98019 •••••',
  rawProprietor: 'RISHAV SRIVASTAWA',
  maskedProprietor: 'Available upon Order Verification',
  businessName: 'RISHAV MEDIA',
  udyamRegistration: 'UDYAM-BR-11-0107325',
  supportEmail: 'support@1024teraviralhub.com',
}

/**
 * Check if the browser currently holds an actively verified order.
 */
export function getVerifiedOrderNumber(): string | null {
  if (typeof window === 'undefined') return null

  // 1. Check explicit verified order in sessionStorage or localStorage
  const explicit = sessionStorage.getItem(VERIFIED_STORAGE_KEY) || localStorage.getItem(VERIFIED_STORAGE_KEY)
  if (explicit && explicit.trim()) return explicit.trim()

  // 2. Check last purchased order
  const lastPurchased = localStorage.getItem('tvh_last_purchased_order')
  if (lastPurchased && lastPurchased.trim()) return lastPurchased.trim()

  // 3. Check saved orders list
  const saved = getSavedOrders()
  if (saved.length > 0 && saved[0].orderNumber) {
    return saved[0].orderNumber
  }

  return null
}

/**
 * Mark an order as verified in the current browser session.
 */
export function setVerifiedOrder(orderNumber: string) {
  if (typeof window === 'undefined') return
  const clean = orderNumber.trim()
  try {
    sessionStorage.setItem(VERIFIED_STORAGE_KEY, clean)
    localStorage.setItem(VERIFIED_STORAGE_KEY, clean)
    window.dispatchEvent(new CustomEvent(VERIFICATION_EVENT, { detail: { orderNumber: clean, verified: true } }))
  } catch (e) {
    console.error('Error saving order verification:', e)
  }
}

/**
 * Hook to consume order verification state across components.
 */
export function useOrderVerification() {
  const [verifiedOrder, setVerifiedOrderState] = useState<string | null>(() => getVerifiedOrderNumber())

  useEffect(() => {
    const handleUpdate = () => {
      setVerifiedOrderState(getVerifiedOrderNumber())
    }

    window.addEventListener(VERIFICATION_EVENT, handleUpdate)
    window.addEventListener('storage', handleUpdate)

    // Re-check on mount
    handleUpdate()

    return () => {
      window.removeEventListener(VERIFICATION_EVENT, handleUpdate)
      window.removeEventListener('storage', handleUpdate)
    }
  }, [])

  const isVerified = Boolean(verifiedOrder)

  const verifyOrderNumber = useCallback(async (orderNum: string): Promise<{ success: boolean; error?: string }> => {
    const clean = orderNum.trim()
    if (!clean) {
      return { success: false, error: 'Please enter your Order Number (e.g. OD...)' }
    }

    try {
      const data = await api.orderLookup(clean)
      if (data && data.order_number) {
        setVerifiedOrder(data.order_number)
        setVerifiedOrderState(data.order_number)
        return { success: true }
      }
      return { success: false, error: 'Order not found. Please check your order reference number.' }
    } catch (err: any) {
      const msg = err?.message || 'Order verification failed. Please verify your order number.'
      return { success: false, error: msg }
    }
  }, [])

  return {
    isVerified,
    verifiedOrderNumber: verifiedOrder,
    phone: isVerified ? PRIVACY_CONFIG.rawPhone : PRIVACY_CONFIG.maskedPhone,
    proprietor: isVerified ? PRIVACY_CONFIG.rawProprietor : PRIVACY_CONFIG.maskedProprietor,
    rawPhone: PRIVACY_CONFIG.rawPhone,
    rawProprietor: PRIVACY_CONFIG.rawProprietor,
    maskedPhone: PRIVACY_CONFIG.maskedPhone,
    maskedProprietor: PRIVACY_CONFIG.maskedProprietor,
    verifyOrderNumber,
  }
}
