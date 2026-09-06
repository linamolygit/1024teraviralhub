// src/client/lib/site-config.ts — Dynamic Store & Official Merchant Configuration
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface SiteConfig {
  siteName: string
  siteUrl: string
  supportEmail: string
  siteTagline: string
  preferredUpiApp: string
  upiDirectLaunch: boolean
  currencySymbol: string
  siteTheme: 'dark' | 'light'
}

/**
 * Official Merchant & Compliance Details
 * Used for Cashfree, Payment Gateway, and Legal Verification
 */
export const BUSINESS_CONFIG = {
  legalName: 'RISHAV MEDIA',
  brandName: '1024TeraViralHub',
  udyamRegistration: 'UDYAM-BR-11-0107325',
  registrationType: 'Govt. of India MSME / Udyam Registered Micro Enterprise',
  operatingState: 'Bihar, India',
  supportEmail: 'support@1024teraviralhub.com',
  supportHours: 'Monday – Saturday: 10:00 AM – 6:00 PM IST',
  grievanceOfficer: 'Nodal Grievance Redressal Officer, RISHAV MEDIA',
  grievanceEmail: 'support@1024teraviralhub.com',
  paymentPartner: 'Cashfree Payments India Pvt. Ltd.',
}

export const DEFAULT_SITE_CONFIG: SiteConfig = {
  siteName: '1024TeraViralHub',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://1024teraviralhub.com',
  supportEmail: 'support@1024teraviralhub.com',
  siteTagline: 'Premium Digital Products, Wallpapers & Assets',
  preferredUpiApp: 'phonepe',
  upiDirectLaunch: true,
  currencySymbol: '₹',
  siteTheme: 'dark',
}

export function useSiteConfig(): SiteConfig {
  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
    staleTime: 1000 * 60 * 10, // 10 minutes cache
  })

  if (!publicSettings) return DEFAULT_SITE_CONFIG

  return {
    siteName: publicSettings.site_name || DEFAULT_SITE_CONFIG.siteName,
    siteUrl: publicSettings.site_url || (typeof window !== 'undefined' ? window.location.origin : DEFAULT_SITE_CONFIG.siteUrl),
    supportEmail: publicSettings.support_email || DEFAULT_SITE_CONFIG.supportEmail,
    siteTagline: publicSettings.site_tagline || DEFAULT_SITE_CONFIG.siteTagline,
    preferredUpiApp: publicSettings.preferred_upi_app || 'phonepe',
    upiDirectLaunch: publicSettings.upi_direct_launch ?? true,
    currencySymbol: publicSettings.currency_symbol || '₹',
    siteTheme: ((publicSettings as any).site_theme as 'dark' | 'light') || 'dark',
  }
}
