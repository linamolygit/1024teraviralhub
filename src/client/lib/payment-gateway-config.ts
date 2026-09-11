// src/client/lib/payment-gateway-config.ts — Dynamic Payment Gateway Configuration Hook & Utilities
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export type PaymentGatewayMode = 'cashfree' | 'razorpay' | 'both' | 'offline'

export interface GatewayLogoInfo {
  name: string
  src: string
  alt: string
  width?: number
  height?: number
}

export interface PaymentGatewayInfo {
  mode: PaymentGatewayMode
  isCashfree: boolean
  isRazorpay: boolean
  isBoth: boolean
  isOffline: boolean
  defaultDualGateway: 'cashfree' | 'razorpay'

  // Dynamic names
  name: string                 // "Cashfree" | "Razorpay" | "Cashfree & Razorpay"
  fullName: string             // "Cashfree Payments" | "Razorpay Payments" | "Cashfree & Razorpay Payments"
  legalEntity: string          // "Cashfree Payments India Pvt. Ltd." | "Razorpay Software Pvt. Ltd." | "Cashfree Payments & Razorpay"
  shortName: string            // "Cashfree" | "Razorpay" | "Cashfree / Razorpay"

  // Contextual copy
  securedByText: string        // "Secured by Cashfree Payments" | "Secured by Razorpay" | "Secured by Cashfree & Razorpay"
  connectingText: string       // "Connecting to Cashfree..." | "Connecting to Razorpay..." | "Connecting to Secure Gateway..."
  checkoutNotice: string       // Next-step payment notice
  errorConnectingMessage: string
  deliveryPolicyText: string   // Policy text on product page
  orderLookupText: string      // Webhook wait text
  announcementText: string     // Top banner text

  // Brand logos
  logos: GatewayLogoInfo[]
  primaryLogo: GatewayLogoInfo

  // Raw public settings
  publicSettings?: any
}

export function usePaymentGatewayInfo(): PaymentGatewayInfo {
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
    staleTime: 30000,
  })

  const rawGateway = (publicSettings?.active_payment_gateway || 'cashfree').toLowerCase()
  const mode: PaymentGatewayMode =
    rawGateway === 'razorpay'
      ? 'razorpay'
      : rawGateway === 'both'
      ? 'both'
      : rawGateway === 'offline'
      ? 'offline'
      : 'cashfree'

  const isCashfree = mode === 'cashfree'
  const isRazorpay = mode === 'razorpay'
  const isBoth = mode === 'both'
  const isOffline = mode === 'offline'
  const defaultDualGateway: 'cashfree' | 'razorpay' =
    ((publicSettings as any)?.default_dual_gateway || 'cashfree').toLowerCase() === 'razorpay'
      ? 'razorpay'
      : 'cashfree'

  // Logos configuration
  const cashfreeLogo: GatewayLogoInfo = {
    name: 'Cashfree Payments',
    src: '/assets/cashfree-logo.png',
    alt: 'Cashfree Payments',
  }

  const razorpayLogo: GatewayLogoInfo = {
    name: 'Razorpay',
    src: '/assets/razorpay-logo.png',
    alt: 'Razorpay',
  }

  const logos: GatewayLogoInfo[] = isRazorpay
    ? [razorpayLogo]
    : isBoth
    ? [cashfreeLogo, razorpayLogo]
    : [cashfreeLogo]

  const primaryLogo: GatewayLogoInfo = isRazorpay ? razorpayLogo : cashfreeLogo

  // Dynamic names
  const name = isRazorpay
    ? 'Razorpay'
    : isBoth
    ? 'Cashfree & Razorpay'
    : 'Cashfree'

  const fullName = isRazorpay
    ? 'Razorpay Payments'
    : isBoth
    ? 'Cashfree & Razorpay Payments'
    : 'Cashfree Payments'

  const legalEntity = isRazorpay
    ? 'Razorpay Software Pvt. Ltd.'
    : isBoth
    ? 'Cashfree Payments India Pvt. Ltd. & Razorpay Software Pvt. Ltd.'
    : 'Cashfree Payments India Pvt. Ltd.'

  const shortName = isRazorpay
    ? 'Razorpay'
    : isBoth
    ? 'Cashfree / Razorpay'
    : 'Cashfree'

  const securedByText = isRazorpay
    ? 'Secured by Razorpay'
    : isBoth
    ? 'Secured by Cashfree & Razorpay'
    : 'Secured by Cashfree Payments'

  const connectingText = isRazorpay
    ? 'Connecting to Razorpay...'
    : isBoth
    ? 'Connecting to Secure Gateway...'
    : 'Connecting to Cashfree...'

  const checkoutNotice = isRazorpay
    ? 'Credit/Debit Cards, Net Banking, and Wallet options are also available on the next step via Razorpay.'
    : isBoth
    ? 'Credit/Debit Cards, Net Banking, and Wallet options are also available on the next step via Cashfree & Razorpay.'
    : 'Credit/Debit Cards, Net Banking, and Wallet options are also available on the next step via Cashfree.'

  const errorConnectingMessage = isRazorpay
    ? 'Unable to connect to Razorpay payment gateway. Please try again.'
    : isBoth
    ? 'Unable to connect to payment gateway (Cashfree/Razorpay). Please try again.'
    : 'Unable to connect to Cashfree payment gateway. Please try again.'

  const deliveryPolicyText = isRazorpay
    ? 'This is a pure digital product — no physical shipment will be mailed. After your payment is verified by Razorpay, you will be redirected to an instant download screen.'
    : isBoth
    ? 'This is a pure digital product — no physical shipment will be mailed. After your payment is verified by Cashfree or Razorpay, you will be redirected to an instant download screen.'
    : 'This is a pure digital product — no physical shipment will be mailed. After your payment is verified by Cashfree, you will be redirected to an instant download screen.'

  const orderLookupText = isRazorpay
    ? 'If your account was debited, please wait 2–5 minutes for Razorpay webhook confirmation or reach out to customer support.'
    : isBoth
    ? 'If your account was debited, please wait 2–5 minutes for Cashfree/Razorpay webhook confirmation or reach out to customer support.'
    : 'If your account was debited, please wait 2–5 minutes for Cashfree webhook confirmation or reach out to customer support.'

  const announcementText = isRazorpay
    ? 'Verified Razorpay & UPI Payments'
    : isBoth
    ? 'Verified Cashfree, Razorpay & UPI Payments'
    : 'Verified Cashfree & UPI Payments'

  return {
    mode,
    isCashfree,
    isRazorpay,
    isBoth,
    isOffline,
    defaultDualGateway,
    name,
    fullName,
    legalEntity,
    shortName,
    securedByText,
    connectingText,
    checkoutNotice,
    errorConnectingMessage,
    deliveryPolicyText,
    orderLookupText,
    announcementText,
    logos,
    primaryLogo,
    publicSettings,
  }
}
