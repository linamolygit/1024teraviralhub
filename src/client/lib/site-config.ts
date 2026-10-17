// src/client/lib/site-config.ts — Dynamic Store & Official Merchant Configuration
import { useQuery } from '@tanstack/react-query'
import { api } from './api'

export interface LegalPagesConfig {
  privacyPolicy: boolean
  termsConditions: boolean
  refundPolicy: boolean
  disclaimer: boolean
  cookiePolicy: boolean
  about: boolean
  contact: boolean
}

export interface SiteConfig {
  siteName: string
  siteUrl: string
  supportEmail: string
  siteTagline: string
  preferredUpiApp: string
  upiDirectLaunch: boolean
  currencySymbol: string
  siteTheme: 'dark' | 'light'
  showMsmeBadge: boolean
  legalPages: LegalPagesConfig
  fomoLootDealEnabled: boolean
  fomoSocialProofEnabled: boolean
  fomoSlotsTotal: number
  fomoDealOfDayEnabled: boolean
  metaPixelId: string
  metaPixelEnabled: boolean
  siteShutdownEnabled: boolean
  siteShutdownMessage: string
}

/**
 * Official Merchant & Compliance Details
 * Used for Cashfree, Payment Gateway, and Legal Verification
 */
export const BUSINESS_CONFIG = {
  legalName: '1024 Tera Viral Hub Digital Network',
  businessName: '1024 Tera Viral Hub',
  proprietor: 'Operations & Grievance Redressal Desk',
  registeredEntity: '1024 Tera Viral Hub Digital Network',
  brandName: '1024TeraViralHub',
  registeredOffice: 'TeraViralHub Operations Desk, Connaught Place, New Delhi - 110001, India',
  udyamRegistration: 'DL-01-DIGITAL-MEDIA-HUB',
  registrationType: 'Registered Digital Media & E-Commerce Network',
  operatingState: 'Delhi, India',
  city: 'New Delhi',
  pincode: '110001',
  phone: 'Digital In-App Chat Support (24/7)',
  supportEmail: 'support@1024teraviralhub.com',
  complianceEmail: 'support@1024teraviralhub.com',
  supportHours: 'Monday – Sunday: 24/7 Digital Operations Desk',
  grievanceOfficer: 'Operations & Grievance Redressal Desk',
  grievanceEmail: 'support@1024teraviralhub.com',
  paymentPartner: 'Authorized RBI-Compliant Payment Gateway Partner',
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
  showMsmeBadge: true,
  fomoLootDealEnabled: true,
  fomoSocialProofEnabled: true,
  fomoSlotsTotal: 200,
  fomoDealOfDayEnabled: true,
  metaPixelId: '',
  metaPixelEnabled: true,
  legalPages: {
    privacyPolicy: true,
    termsConditions: true,
    refundPolicy: true,
    disclaimer: true,
    cookiePolicy: true,
    about: true,
    contact: true,
  },
  siteShutdownEnabled: false,
  siteShutdownMessage: '',
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
    showMsmeBadge: (publicSettings as any).show_msme_badge ?? true,
    fomoLootDealEnabled: (publicSettings as any).fomo_loot_deal_enabled ?? true,
    fomoSocialProofEnabled: (publicSettings as any).fomo_social_proof_enabled ?? true,
    fomoSlotsTotal: Number((publicSettings as any).fomo_slots_total) || 200,
    fomoDealOfDayEnabled: (publicSettings as any).fomo_deal_of_day_enabled ?? true,
    metaPixelId: String((publicSettings as any).meta_pixel_id || (import.meta.env.VITE_META_PIXEL_ID ?? '')).trim(),
    metaPixelEnabled: (publicSettings as any).meta_pixel_enabled !== false,
    legalPages: {
      privacyPolicy: (publicSettings as any).page_privacy_policy_enabled ?? true,
      termsConditions: (publicSettings as any).page_terms_conditions_enabled ?? true,
      refundPolicy: (publicSettings as any).page_refund_policy_enabled ?? true,
      disclaimer: (publicSettings as any).page_disclaimer_enabled ?? true,
      cookiePolicy: (publicSettings as any).page_cookie_policy_enabled ?? true,
      about: (publicSettings as any).page_about_enabled ?? true,
      contact: (publicSettings as any).page_contact_enabled ?? true,
    },
    siteShutdownEnabled: Boolean((publicSettings as any).site_shutdown_enabled),
    siteShutdownMessage: String((publicSettings as any).site_shutdown_message || ''),
  }
}

export function useLegalPages(): LegalPagesConfig {
  const { legalPages } = useSiteConfig()
  return legalPages
}
