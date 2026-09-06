// src/routes/settings.ts — Public Settings Route
import { Hono } from 'hono'
import type { Env } from '../worker'
import { getSetting } from '../lib/db'

const app = new Hono<{ Bindings: Env }>()

app.get('/public', async (c) => {
  const [
    upiDirect, preferredApp, checkoutMode, announcement,
    siteName, siteUrl, supportEmail, siteTagline, currencySymbol, siteTheme,
    showSeedReviews
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
  })
})

export default app
