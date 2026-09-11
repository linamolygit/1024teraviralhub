// src/routes/settings.ts — Public Settings Route
import { Hono } from 'hono'
import type { Env } from '../worker'
import { getSetting } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

app.get('/public', async (c) => {
  const [
    upiDirect, preferredApp, checkoutMode, announcement,
    siteName, siteUrl, supportEmail, siteTagline, currencySymbol, siteTheme,
    showSeedReviews,
    activeGateway, defaultDualGateway, cfMode, rzpMode, rzpKeyId,
    // Google Services & Monetization
    gscEnabled, gscVerificationTag,
    ga4Enabled, ga4MeasurementId, ga4EcommerceTracking,
    adsenseEnabled, adsensePublisherId, adsenseAutoAds, adsenseHeadCode,
    adxEnabled, adxNetworkCode, adxHeadCode
  ] = await Promise.all([
    getSetting<boolean>(c.env.DB, 'upi_direct_launch', true),
    getSetting<string>(c.env.DB, 'preferred_upi_app', 'phonepe'),
    getSetting<string>(c.env.DB, 'guest_checkout_mode', 'instant'),
    getSetting<string>(c.env.DB, 'announcement_text', ''),
    getSetting<string>(c.env.DB, 'site_name', (c.env as any).SITE_NAME || 'Digital Store'),
    getSetting<string>(c.env.DB, 'site_url', c.env.SITE_URL || ''),
    getSetting<string>(c.env.DB, 'support_email', (c.env as any).SUPPORT_EMAIL || 'support@example.com'),
    getSetting<string>(c.env.DB, 'site_tagline', 'Premium Digital Downloads & Assets'),
    getSetting<string>(c.env.DB, 'currency_symbol', '₹'),
    getSetting<string>(c.env.DB, 'site_theme', 'dark'),
    getSetting<boolean>(c.env.DB, 'show_seed_reviews', true),
    getSetting<string>(c.env.DB, 'active_payment_gateway', 'cashfree'),
    getSetting<string>(c.env.DB, 'default_dual_gateway', 'cashfree'),
    getSetting<string>(c.env.DB, 'cashfree_mode', c.env.CASHFREE_API_URL?.includes('sandbox') ? 'sandbox' : 'production'),
    getSetting<string>(c.env.DB, 'razorpay_mode', 'test'),
    getSetting<string>(c.env.DB, 'razorpay_key_id', ''),
    // Google Search Console
    getSetting<boolean>(c.env.DB, 'gsc_enabled', true),
    getSetting<string>(c.env.DB, 'gsc_verification_tag', ''),
    // Google Analytics (GA4)
    getSetting<boolean>(c.env.DB, 'ga4_enabled', true),
    getSetting<string>(c.env.DB, 'ga4_measurement_id', ''),
    getSetting<boolean>(c.env.DB, 'ga4_ecommerce_tracking', true),
    // Google AdSense
    getSetting<boolean>(c.env.DB, 'adsense_enabled', false),
    getSetting<string>(c.env.DB, 'adsense_publisher_id', ''),
    getSetting<boolean>(c.env.DB, 'adsense_auto_ads', true),
    getSetting<string>(c.env.DB, 'adsense_head_code', ''),
    // Google AdX (Google Ad Manager)
    getSetting<boolean>(c.env.DB, 'adx_enabled', false),
    getSetting<string>(c.env.DB, 'adx_network_code', ''),
    getSetting<string>(c.env.DB, 'adx_head_code', ''),
  ])

  return c.json({
    upi_direct_launch: upiDirect ?? true,
    preferred_upi_app: preferredApp ?? 'phonepe',
    guest_checkout_mode: checkoutMode ?? 'instant',
    announcement_text: announcement ?? '',
    site_name: siteName,
    site_url: siteUrl,
    support_email: supportEmail,
    site_tagline: siteTagline,
    currency_symbol: currencySymbol,
    site_theme: siteTheme ?? 'dark',
    show_seed_reviews: showSeedReviews ?? true,
    active_payment_gateway: activeGateway ?? 'cashfree',
    default_dual_gateway: defaultDualGateway ?? 'cashfree',
    cashfree_mode: cfMode ?? 'sandbox',
    razorpay_mode: rzpMode ?? 'test',
    razorpay_key_id: rzpKeyId ?? '',
    // Google Services
    gsc_enabled: gscEnabled ?? true,
    gsc_verification_tag: gscVerificationTag ?? '',
    ga4_enabled: ga4Enabled ?? true,
    ga4_measurement_id: ga4MeasurementId ?? '',
    ga4_ecommerce_tracking: ga4EcommerceTracking ?? true,
    adsense_enabled: adsenseEnabled ?? false,
    adsense_publisher_id: adsensePublisherId ?? '',
    adsense_auto_ads: adsenseAutoAds ?? true,
    adsense_head_code: adsenseHeadCode ?? '',
    adx_enabled: adxEnabled ?? false,
    adx_network_code: adxNetworkCode ?? '',
    adx_head_code: adxHeadCode ?? '',
  })
})

export default app
