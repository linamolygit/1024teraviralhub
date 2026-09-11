// src/client/pages/admin/AdminSettings.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Save, Check, Zap, Smartphone, Shield, Globe, Moon, Sun, Palette,
  CheckCircle2, Sparkles, Key, AlertCircle, Loader2, Bot, Star, Copy, RefreshCw, ExternalLink,
  Eye, EyeOff
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useThemeStore } from '../../lib/theme-store'
import { PhonePeIcon, GPayIcon, PaytmIcon, UpiGenericIcon } from '../../components/ui/UpiIcons'
import { adminToast } from '../../lib/admin-toast'

export default function AdminSettings() {
  const { getToken } = useAuthStore()
  const { setTheme } = useThemeStore()
  const [success, setSuccess] = useState(false)

  // Gemini AI Test State
  const [testingKey, setTestingKey] = useState(false)
  const [showGeminiKey, setShowGeminiKey] = useState(false)
  const [testResult, setTestResult] = useState<{ success?: boolean; message?: string; error?: string; details?: string } | null>(null)

  const [settings, setSettings] = useState({
    site_name: '1024TeraViralHub',
    site_description: 'Premium digital downloads with instant access',
    support_email: 'support@1024teraviralhub.com',
    currency: 'INR',
    default_download_limit: 3,
    default_access_hours: 12,
    meta_pixel_id: '',
    announcement_text: '',
    upi_direct_launch: true,
    preferred_upi_app: 'phonepe',
    guest_checkout_mode: 'instant',
    site_theme: 'dark' as 'dark' | 'light',
    gemini_api_key: '',
    gemini_model: 'gemini-flash-latest',
    show_seed_reviews: true,
    external_payments_enabled: true,
    external_partner_api_key: '',
    external_allowed_origins: '',
    // Google Services & Monetization Suite
    gsc_enabled: true,
    gsc_verification_tag: '',
    ga4_enabled: true,
    ga4_measurement_id: '',
    ga4_ecommerce_tracking: true,
    adsense_enabled: false,
    adsense_publisher_id: '',
    adsense_auto_ads: true,
    adsense_head_code: '',
    adx_enabled: false,
    adx_network_code: '',
    adx_head_code: '',
  })

  const [sitemapCopied, setSitemapCopied] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.settings.get(token!)
    },
  })

  useEffect(() => {
    if (data?.settings) {
      setSettings(prev => ({
        ...prev,
        ...data.settings,
      }))
    }
  }, [data])

  const queryClient = useQueryClient()

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      if (!token) {
        throw new Error('Authentication token not found. Please log in again.')
      }
      return adminApi.settings.update(token, settings)
    },
    onSuccess: () => {
      setSuccess(true)
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] })
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
      setTimeout(() => setSuccess(false), 3500)
      adminToast.success('Settings Saved', 'All store and Google services settings saved successfully.')
    },
    onError: (err: any) => {
      console.error('[Settings Save Error]', err)
      adminToast.error('Save Failed', err?.message || 'Could not save store settings.')
    },
  })

  const handleTestGeminiKey = async () => {
    setTestingKey(true)
    setTestResult(null)
    try {
      const token = await getToken()
      const res = await adminApi.ai.testKey(token!, settings.gemini_api_key)
      setTestResult(res)
      if (res.success) {
        adminToast.success('Gemini AI Connected', 'API key is valid and responsive!')
      } else {
        adminToast.error('Gemini Test Failed', res.error || 'Connection failed.')
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message || 'Connection failed' })
      adminToast.error('Gemini Connection Error', err.message || 'Connection failed')
    } finally {
      setTestingKey(false)
    }
  }

  if (isLoading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: 960, width: '100%', paddingBottom: 60 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Store & System Settings</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
            Configure Google Gemini AI, UPI checkout intent, theme, and store policies
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate()}
          className="btn-primary"
          disabled={saveMutation.isPending}
          style={{ fontSize: '0.875rem', padding: '10px 20px', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {success ? <><Check size={16} /> Saved!</> : <><Save size={16} /> Save Changes</>}
        </button>
      </div>

      {success && <div className="alert alert-success" style={{ marginBottom: 20 }}>Settings updated successfully!</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* ── Google Gemini AI Configuration Card ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.07) 0%, rgba(124, 58, 237, 0.07) 100%)',
            border: '1px solid rgba(17, 98, 242, 0.3)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: '0 4px 20px rgba(17, 98, 242, 0.05)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 'var(--radius-md)',
                  background: 'linear-gradient(135deg, #1162f2, #7c3aed)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Sparkles size={18} />
              </div>
              <div>
                <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Google Gemini AI Engine
                  <span
                    style={{
                      fontSize: '0.68rem',
                      background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.15), rgba(124, 58, 237, 0.15))',
                      color: '#1162F2',
                      border: '1px solid rgba(17, 98, 242, 0.3)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                    }}
                  >
                    Active Copilot
                  </span>
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                  Powers 1-click product generation, high-converting descriptions, SEO meta tags, and smart copywriting
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Gemini API Key */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Gemini API Key
                </label>
                <span style={{ fontSize: '0.72rem', color: settings.gemini_api_key ? '#10B981' : 'var(--text-muted)', fontWeight: settings.gemini_api_key ? 700 : 400 }}>
                  {settings.gemini_api_key ? '● Secret Stored' : '● Not Configured'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <input
                    type={showGeminiKey ? 'text' : 'password'}
                    className="input-field"
                    placeholder="Enter Gemini API key (e.g. AIzaSy...)"
                    value={settings.gemini_api_key}
                    onChange={e => setSettings(s => ({ ...s, gemini_api_key: e.target.value }))}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem', width: '100%', paddingRight: 38 }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowGeminiKey(!showGeminiKey)}
                    style={{
                      position: 'absolute',
                      right: 10,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      padding: 4,
                    }}
                    title={showGeminiKey ? 'Hide API key' : 'Show API key'}
                  >
                    {showGeminiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestGeminiKey}
                  disabled={testingKey || !settings.gemini_api_key}
                  className="btn-ghost"
                  style={{
                    flexShrink: 0,
                    padding: '0 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    border: '1px solid rgba(17,98,242,0.3)',
                    background: 'var(--bg-surface)',
                  }}
                >
                  {testingKey ? <Loader2 size={14} className="animate-spin" /> : <Key size={14} />}
                  Test Connection
                </button>
              </div>
            </div>

            {/* Test Result Message */}
            {testResult && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  background: testResult.success ? 'linear-gradient(135deg, rgba(17, 98, 242, 0.12), rgba(124, 58, 237, 0.12))' : 'rgba(255,160,0,0.12)',
                  border: `1px solid ${testResult.success ? 'rgba(17, 98, 242, 0.3)' : 'rgba(255,160,0,0.3)'}`,
                  fontSize: '0.8125rem',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                }}
              >
                {testResult.success ? (
                  <CheckCircle2 size={18} color="#1162F2" style={{ flexShrink: 0, marginTop: 1 }} />
                ) : (
                  <AlertCircle size={18} color="#d97706" style={{ flexShrink: 0, marginTop: 1 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: testResult.success ? '#1162F2' : '#d97706' }}>
                    {testResult.message || (testResult.success ? 'API Key Valid!' : 'Note on API Key')}
                  </div>
                  {testResult.error && (
                    <div style={{ fontSize: '0.75rem', marginTop: 4, color: 'var(--text-secondary)' }}>
                      Google API Note: {testResult.error}
                    </div>
                  )}
                  {testResult.details && (
                    <div style={{ fontSize: '0.72rem', marginTop: 4, color: 'var(--text-muted)' }}>
                      {testResult.details}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* AI Model Selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  AI Model Endpoint
                </label>
                <select
                  className="input-field"
                  value={settings.gemini_model}
                  onChange={e => setSettings(s => ({ ...s, gemini_model: e.target.value }))}
                >
                  <option value="gemini-flash-latest">gemini-flash-latest (Recommended - Fast & High Quality)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash</option>
                  <option value="gemini-2.0-flash">gemini-2.0-flash</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Auto-Fallback Engine
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-md)',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  <Bot size={16} color="#1162F2" />
                  <span>Smart Heuristic Fallback: <strong>Enabled</strong></span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
              💡 If Google Gemini returns temporary quota or permission notices, the built-in smart heuristic engine automatically generates complete high-converting copy, pricing, tags, and SEO tags without interruptions.
            </div>
          </div>
        </div>

        {/* ── Appearance & Theme Section ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Palette size={20} color="var(--brand-purple-light)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Site Appearance & Theme</h3>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                {settings.site_theme === 'dark'
                  ? <><Moon size={16} color="var(--brand-purple-light)" /> Dark Mode (Current)</>  
                  : <><Sun size={16} color="var(--brand-amber)" /> Light Mode (Current)</>}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Toggle the entire site theme for all visitors. Changes apply after Save.
              </div>
            </div>
            <label className="toggle-switch" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={settings.site_theme === 'light'}
                onChange={e => {
                  const newTheme = e.target.checked ? 'light' : 'dark'
                  setSettings(s => ({ ...s, site_theme: newTheme }))
                  setTheme(newTheme)
                }}
              />
              <span className="toggle-slider" />
            </label>
          </label>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 10 }}>
            {settings.site_theme === 'light'
              ? '☀️ Light mode is active. A clean white/gray palette will be shown to all visitors.'
              : '🌙 Dark mode is active. The premium dark purple/black palette is shown to all visitors.'}
          </p>
        </div>

        {/* ── Customer Ratings & Reviews Control Card ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              <Star size={18} fill="#fff" />
            </div>
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                Customer Ratings & Reviews Mode
                <span
                  style={{
                    fontSize: '0.68rem',
                    background: settings.show_seed_reviews ? 'rgba(245, 158, 11, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                    color: settings.show_seed_reviews ? '#F59E0B' : 'var(--text-muted)',
                    border: '1px solid ' + (settings.show_seed_reviews ? 'rgba(245, 158, 11, 0.3)' : 'rgba(107, 114, 128, 0.3)'),
                    padding: '2px 8px',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                  }}
                >
                  {settings.show_seed_reviews ? '⚡ Social Proof Active' : '🛡️ Strict Real Only'}
                </span>
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '2px 0 0 0' }}>
                Toggle between boosted social proof reviews (15–25 reviews, 4.8★) and strictly verified organic buyer reviews
              </p>
            </div>
          </div>

          <label style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 18px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            border: settings.show_seed_reviews ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid var(--bg-border)',
            transition: 'all 0.2s ease',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem', marginBottom: 4 }}>
                {settings.show_seed_reviews ? (
                  <span style={{ color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 6 }}>
                    ⭐ Social Proof Reviews: ON (High Conversion)
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🛡️ Strict Real Buyer Mode: OFF (Organic Only)
                  </span>
                )}
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 650, lineHeight: 1.45 }}>
                {settings.show_seed_reviews
                  ? 'Jab ye ON hai: Har product par 15–25 high-rating social proof reviews (4.7–4.8★) aur real buyers ke reviews storefront par show honge taaki conversion rate maximize ho.'
                  : 'Jab ye OFF hai: Seed reviews hide ho jayenge. Client side par sirf aur sirf genuine buyers ke real reviews aur ratings show honge.'}
              </div>
            </div>

            <label className="toggle-switch" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={settings.show_seed_reviews}
                onChange={e => setSettings(s => ({ ...s, show_seed_reviews: e.target.checked }))}
              />
              <span className="toggle-slider" />
            </label>
          </label>

          <div style={{
            marginTop: 12,
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            background: settings.show_seed_reviews ? 'rgba(245, 158, 11, 0.08)' : 'var(--bg-elevated)',
            border: '1px solid ' + (settings.show_seed_reviews ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-border)'),
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <span style={{ fontSize: '1rem' }}>{settings.show_seed_reviews ? '💡' : '🔒'}</span>
            <span>
              {settings.show_seed_reviews
                ? 'Social Proof Mode is active. New real reviews submitted by verified buyers will also automatically append.'
                : 'Organic Mode is active. Products with zero real reviews will have rating badges hidden until first verified customer reviews are submitted.'}
            </span>
          </div>
        </div>

        {/* ── UPI & Instant Payment Controls ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Zap size={20} color="var(--brand-amber)" />
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>UPI App & 1-Click Checkout Controls</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Direct UPI Launch Toggle */}
            <label style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-md)', cursor: 'pointer'
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>⚡ Automatic UPI App Launch (Recommended: ON)</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  When user clicks BUY on mobile, directly launch PhonePe/UPI app without showing intermediate forms.
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.upi_direct_launch}
                onChange={e => setSettings(s => ({ ...s, upi_direct_launch: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: 'var(--brand-purple)' }}
              />
            </label>

            {/* Preferred UPI App with Visual Cards */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 8, color: 'var(--text-secondary)' }}>
                Preferred Recommended UPI App & Logo
              </label>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: 12,
                marginBottom: 14,
              }}>
                {[
                  {
                    id: 'phonepe',
                    name: 'PhonePe',
                    desc: 'Deep link & 1-click launch',
                    badge: 'Recommended',
                    icon: <PhonePeIcon size={26} />,
                    activeColor: '#5F259F',
                  },
                  {
                    id: 'gpay',
                    name: 'Google Pay',
                    desc: 'GPay intent direct launch',
                    icon: <GPayIcon size={26} />,
                    activeColor: '#1A73E8',
                  },
                  {
                    id: 'paytm',
                    name: 'Paytm',
                    desc: 'Paytm UPI direct link',
                    icon: <PaytmIcon size={26} />,
                    activeColor: '#002E6E',
                  },
                  {
                    id: 'all',
                    name: 'All UPI Apps',
                    desc: 'Universal intent chooser',
                    icon: <UpiGenericIcon size={26} />,
                    activeColor: 'var(--brand-purple)',
                  },
                ].map((app) => {
                  const isSelected = settings.preferred_upi_app === app.id
                  return (
                    <div
                      key={app.id}
                      onClick={() => setSettings(s => ({ ...s, preferred_upi_app: app.id }))}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 'var(--radius-md)',
                        background: isSelected ? 'var(--bg-surface)' : 'var(--bg-elevated)',
                        border: isSelected ? `2px solid ${app.activeColor}` : '1px solid var(--bg-border)',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                        boxShadow: isSelected ? `0 4px 16px ${app.activeColor}25` : 'none',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        {app.icon}
                        {isSelected && (
                          <CheckCircle2 size={16} color={app.activeColor} style={{ flexShrink: 0 }} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                          {app.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          {app.desc}
                        </div>
                      </div>
                      {app.badge && (
                        <span className="badge badge-amber" style={{ fontSize: '0.62rem', alignSelf: 'flex-start', padding: '1px 6px' }}>
                          {app.badge}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Live Button Preview */}
              <div style={{
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-md)',
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Buyer Button Preview on Store:
                </div>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  background:
                    settings.preferred_upi_app === 'phonepe'
                      ? 'linear-gradient(135deg, #6739B7 0%, #5F259F 100%)'
                      : settings.preferred_upi_app === 'gpay'
                      ? 'linear-gradient(135deg, #1A73E8 0%, #1557B0 100%)'
                      : settings.preferred_upi_app === 'paytm'
                      ? 'linear-gradient(135deg, #002E6E 0%, #001B44 100%)'
                      : 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
                  color: '#FFFFFF',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                }}>
                  {settings.preferred_upi_app === 'phonepe' && <PhonePeIcon size={16} />}
                  {settings.preferred_upi_app === 'gpay' && <GPayIcon size={16} />}
                  {settings.preferred_upi_app === 'paytm' && <PaytmIcon size={16} />}
                  {settings.preferred_upi_app === 'all' && <UpiGenericIcon size={16} />}
                  <span>
                    BUY NOW via{' '}
                    {settings.preferred_upi_app === 'phonepe'
                      ? 'PhonePe'
                      : settings.preferred_upi_app === 'gpay'
                      ? 'Google Pay'
                      : settings.preferred_upi_app === 'paytm'
                      ? 'Paytm'
                      : 'UPI'}
                  </span>
                </div>
              </div>
            </div>

            {/* Guest Checkout Mode */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Customer Information Requirement
              </label>
              <select
                className="input-field"
                value={settings.guest_checkout_mode}
                onChange={e => setSettings(s => ({ ...s, guest_checkout_mode: e.target.value }))}
              >
                <option value="instant">⚡ 1-Click Instant Buy (Zero required fields — Auto Guest Profile)</option>
                <option value="optional">✉️ Optional Contact Inputs (User can optionally type email)</option>
                <option value="required">📝 Standard Checkout Form (Name, Email & Phone Required)</option>
              </select>
            </div>
          </div>
        </div>

        {/* ── External Gateway Manager Link Card (Theme Matched) ── */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: '#FFD200',
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(255, 210, 0, 0.3)',
            }}>
              <Zap size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                  External Gateway Manager
                </h3>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(255, 210, 0, 0.15)', color: '#FFD200', border: '1px solid rgba(255, 210, 0, 0.3)', fontWeight: 700 }}>
                  Multi-Site Hub
                </span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, background: 'rgba(16, 185, 129, 0.12)', color: '#34D399', border: '1px solid rgba(16, 185, 129, 0.3)', fontWeight: 700 }}>
                  100% Cashfree Stealth
                </span>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Accept 1-Click PhonePe payments for multiple websites (instatextpro.online & more) without Cashfree detecting third-party origins.
              </p>
            </div>
          </div>

          <a
            href="/admin/gateways"
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFD200',
              color: '#000',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '8px 18px',
              borderRadius: 10,
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(255, 210, 0, 0.3)',
            }}
          >
            <span>Open Gateway Manager</span>
            <ExternalLink size={14} />
          </a>
        </div>

        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>White-Label Store Configuration</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Site / Store Name</label>
                <input className="input-field" placeholder="e.g. My Digital Store" value={settings.site_name} onChange={e => setSettings(s => ({ ...s, site_name: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Production Site URL</label>
                <input className="input-field" placeholder="e.g. https://yourdomain.com" value={(settings as any).site_url || ''} onChange={e => setSettings(s => ({ ...s, site_url: e.target.value }))} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Support Email Address</label>
                <input className="input-field" placeholder="support@yourdomain.com" value={settings.support_email} onChange={e => setSettings(s => ({ ...s, support_email: e.target.value }))} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Currency Symbol</label>
                <input className="input-field" placeholder="₹ or $ or €" value={(settings as any).currency_symbol || '₹'} onChange={e => setSettings(s => ({ ...s, currency_symbol: e.target.value }))} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Brand Tagline</label>
              <input className="input-field" placeholder="Premium digital downloads with instant delivery" value={(settings as any).site_tagline || ''} onChange={e => setSettings(s => ({ ...s, site_tagline: e.target.value }))} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Site Description (SEO)</label>
              <textarea className="input-field" rows={2} value={settings.site_description} onChange={e => setSettings(s => ({ ...s, site_description: e.target.value }))} />
            </div>
          </div>
        </div>

        {/* ── Download Policy ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Recommended Download Policies</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Access Window (Hours)</label>
              <input type="number" className="input-field" value={settings.default_access_hours} onChange={e => setSettings(s => ({ ...s, default_access_hours: parseInt(e.target.value) || 12 }))} min="1" max="168" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Max Download Attempts</label>
              <input type="number" className="input-field" value={settings.default_download_limit} onChange={e => setSettings(s => ({ ...s, default_download_limit: parseInt(e.target.value) || 3 }))} min="1" max="20" />
            </div>
          </div>
        </div>

        {/* ── Tracking & Pixel ── */}
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 16 }}>Meta Pixel & Tracking</h3>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>Meta Pixel ID</label>
            <input className="input-field" placeholder="e.g. 123456789012345" value={settings.meta_pixel_id} onChange={e => setSettings(s => ({ ...s, meta_pixel_id: e.target.value }))} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            ── Google Services & Ad Monetization Suite ──
        ══════════════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: 12, marginBottom: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <Globe size={22} color="#4285F4" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Google Services & Monetization Suite</h2>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: 0 }}>
            Configure live Google Search indexing, GA4 user analytics, and enterprise ad monetization with official branding and real-time storefront injection.
          </p>
        </div>

        {/* ── 1. Google Analytics 4 (GA4) Card (Primary Color: Amber #F9AB00) ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249, 171, 0, 0.08) 0%, rgba(227, 116, 0, 0.03) 100%), var(--bg-surface)',
            border: '1px solid rgba(249, 171, 0, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: '0 4px 20px rgba(249, 171, 0, 0.06)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(249, 171, 0, 0.35)',
                  boxShadow: '0 2px 10px rgba(249, 171, 0, 0.15)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://www.gstatic.com/analytics-suite/header/suite/v2/ic_analytics.svg"
                  alt="Google Analytics"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                    Google Analytics 4 (GA4)
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: settings.ga4_enabled && settings.ga4_measurement_id ? 'rgba(249, 171, 0, 0.16)' : 'rgba(107, 114, 128, 0.15)',
                      color: settings.ga4_enabled && settings.ga4_measurement_id ? '#F9AB00' : 'var(--text-muted)',
                      border: '1px solid ' + (settings.ga4_enabled && settings.ga4_measurement_id ? 'rgba(249, 171, 0, 0.4)' : 'rgba(107, 114, 128, 0.3)'),
                      fontWeight: 700,
                    }}
                  >
                    {settings.ga4_enabled && settings.ga4_measurement_id ? '● Tracking Active' : '● Not Configured'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                  Real-time visitor tracking, traffic sources, page views, and full digital product checkout funnel analytics
                </p>
              </div>
            </div>

            {/* Enable Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settings.ga4_enabled ? '#F9AB00' : 'var(--text-muted)' }}>
                {settings.ga4_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={settings.ga4_enabled}
                  onChange={e => setSettings(s => ({ ...s, ga4_enabled: e.target.checked }))}
                />
                <span className="toggle-slider" style={{ accentColor: '#F9AB00' }} />
              </label>
            </div>
          </div>

          {/* Form Controls inside Card Padding Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  GA4 Measurement ID (Stream ID)
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Format: G-XXXXXXXXXX
                </span>
              </div>
              <input
                className="input-field"
                placeholder="e.g. G-ABC123XYZ0"
                value={settings.ga4_measurement_id}
                onChange={e => setSettings(s => ({ ...s, ga4_measurement_id: e.target.value.trim() }))}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  borderColor: settings.ga4_measurement_id ? 'rgba(249, 171, 0, 0.4)' : undefined,
                }}
              />
            </div>

            {/* E-Commerce Funnel Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(249, 171, 0, 0.06)',
                border: '1px solid rgba(249, 171, 0, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ⚡ Enhanced Digital E-Commerce Auto-Tracking
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Automatically sends `view_item`, `add_to_cart`, `begin_checkout`, and `purchase` events with revenue to GA4
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.ga4_ecommerce_tracking}
                onChange={e => setSettings(s => ({ ...s, ga4_ecommerce_tracking: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: '#F9AB00', cursor: 'pointer' }}
              />
            </label>

            {/* Quick Action Link to GA Console */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Automatically injects official <code>gtag.js</code> and records SPA page navigations without page reload.
              </div>
              <a
                href="https://analytics.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.78rem',
                  color: '#F9AB00',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Open Google Analytics</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ── 2. Google Search Console (GSC) Card (Primary Color: Google Blue #4285F4) ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.08) 0%, rgba(26, 115, 232, 0.03) 100%), var(--bg-surface)',
            border: '1px solid rgba(66, 133, 244, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: '0 4px 20px rgba(66, 133, 244, 0.06)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  padding: 6,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(66, 133, 244, 0.35)',
                  boxShadow: '0 2px 10px rgba(66, 133, 244, 0.15)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="https://ssl.gstatic.com/search-console/scfe/logo_search_console.svg"
                  alt="Google Search Console"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                    Google Search Console (GSC)
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: settings.gsc_enabled && settings.gsc_verification_tag ? 'rgba(66, 133, 244, 0.16)' : 'rgba(107, 114, 128, 0.15)',
                      color: settings.gsc_enabled && settings.gsc_verification_tag ? '#4285F4' : 'var(--text-muted)',
                      border: '1px solid ' + (settings.gsc_enabled && settings.gsc_verification_tag ? 'rgba(66, 133, 244, 0.4)' : 'rgba(107, 114, 128, 0.3)'),
                      fontWeight: 700,
                    }}
                  >
                    {settings.gsc_enabled && settings.gsc_verification_tag ? '● Verification Active' : '● Needs Verification'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                  Website ownership verification, Google Search index status, keyword rankings, and XML sitemap submission
                </p>
              </div>
            </div>

            {/* Enable Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settings.gsc_enabled ? '#4285F4' : 'var(--text-muted)' }}>
                {settings.gsc_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={settings.gsc_enabled}
                  onChange={e => setSettings(s => ({ ...s, gsc_enabled: e.target.checked }))}
                />
                <span className="toggle-slider" style={{ accentColor: '#4285F4' }} />
              </label>
            </div>
          </div>

          {/* Form Controls inside Card Padding Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  Google Site Verification HTML Tag or Code
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Paste tag or token
                </span>
              </div>
              <input
                className="input-field"
                placeholder='e.g. <meta name="google-site-verification" content="ABC...XYZ" /> or token'
                value={settings.gsc_verification_tag}
                onChange={e => setSettings(s => ({ ...s, gsc_verification_tag: e.target.value }))}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.825rem',
                  borderColor: settings.gsc_verification_tag ? 'rgba(66, 133, 244, 0.4)' : undefined,
                }}
              />
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Search Console me &quot;HTML tag&quot; option choose karke tag ya verification code yahan paste karein. Automatic meta tag render hoga.
              </p>
            </div>

            {/* Sitemap Quick Copy Box */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(66, 133, 244, 0.06)',
                border: '1px solid rgba(66, 133, 244, 0.2)',
                borderRadius: 'var(--radius-md)',
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  🗺️ Google Search Console XML Sitemap
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, fontFamily: 'monospace' }}>
                  {typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : 'https://1024teraviralhub.com/sitemap.xml'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  const sitemapUrl = typeof window !== 'undefined' ? `${window.location.origin}/sitemap.xml` : 'https://1024teraviralhub.com/sitemap.xml'
                  navigator.clipboard.writeText(sitemapUrl)
                  setSitemapCopied(true)
                  setTimeout(() => setSitemapCopied(false), 2500)
                }}
                className="btn-ghost"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.75rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  borderColor: 'rgba(66, 133, 244, 0.4)',
                  color: '#4285F4',
                  fontWeight: 700,
                  background: 'var(--bg-surface)',
                }}
              >
                {sitemapCopied ? <><Check size={14} color="#10B981" /> Copied!</> : <><Copy size={14} /> Copy Sitemap URL</>}
              </button>
            </div>

            {/* Quick Action Link to Search Console */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Google bot automatically crawls dynamic products, collections, categories & blog posts via this sitemap.
              </div>
              <a
                href="https://search.google.com/search-console"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.78rem',
                  color: '#4285F4',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Open Search Console</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ── 3. Google AdSense Card (Primary Color: Google Green #0F9D58) ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(15, 157, 88, 0.08) 0%, rgba(11, 128, 67, 0.03) 100%), var(--bg-surface)',
            border: '1px solid rgba(15, 157, 88, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: '0 4px 20px rgba(15, 157, 88, 0.06)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(15, 157, 88, 0.35)',
                  boxShadow: '0 2px 10px rgba(15, 157, 88, 0.15)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="/assets/ads/adsense.png"
                  alt="Google AdSense"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                    Google AdSense
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: settings.adsense_enabled && settings.adsense_publisher_id ? 'rgba(15, 157, 88, 0.16)' : 'rgba(107, 114, 128, 0.15)',
                      color: settings.adsense_enabled && settings.adsense_publisher_id ? '#0F9D58' : 'var(--text-muted)',
                      border: '1px solid ' + (settings.adsense_enabled && settings.adsense_publisher_id ? 'rgba(15, 157, 88, 0.4)' : 'rgba(107, 114, 128, 0.3)'),
                      fontWeight: 700,
                    }}
                  >
                    {settings.adsense_enabled && settings.adsense_publisher_id ? '● AdSense Active' : '● Inactive'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                  Monetize non-paying traffic, blog visitors, and download waiting pages with Google auto responsive ads
                </p>
              </div>
            </div>

            {/* Enable Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settings.adsense_enabled ? '#0F9D58' : 'var(--text-muted)' }}>
                {settings.adsense_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={settings.adsense_enabled}
                  onChange={e => setSettings(s => ({ ...s, adsense_enabled: e.target.checked }))}
                />
                <span className="toggle-slider" style={{ accentColor: '#0F9D58' }} />
              </label>
            </div>
          </div>

          {/* Form Controls inside Card Padding Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  AdSense Publisher Client ID
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  e.g. ca-pub-XXXXXXXXXXXXXXXX or pub-XXXXXXXXXXXXXXXX
                </span>
              </div>
              <input
                className="input-field"
                placeholder="ca-pub-1234567890123456"
                value={settings.adsense_publisher_id}
                onChange={e => setSettings(s => ({ ...s, adsense_publisher_id: e.target.value.trim() }))}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  borderColor: settings.adsense_publisher_id ? 'rgba(15, 157, 88, 0.4)' : undefined,
                }}
              />
            </div>

            {/* Auto Ads Toggle */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(15, 157, 88, 0.06)',
                border: '1px solid rgba(15, 157, 88, 0.2)',
                borderRadius: 'var(--radius-md)',
                cursor: 'pointer',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  ⚡ Auto Ads Injection (Recommended)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Automatically loads <code>adsbygoogle.js</code> script in storefront head for AI-optimized placements
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.adsense_auto_ads}
                onChange={e => setSettings(s => ({ ...s, adsense_auto_ads: e.target.checked }))}
                style={{ width: 18, height: 18, accentColor: '#0F9D58', cursor: 'pointer' }}
              />
            </label>

            {/* Custom AdSense Head Code */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                AdSense Custom Script / Head Snippet (Optional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="<script async src='https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-...' crossorigin='anonymous'></script>"
                value={settings.adsense_head_code}
                onChange={e => setSettings(s => ({ ...s, adsense_head_code: e.target.value }))}
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
              />
            </div>

            {/* Quick Action Links */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Ensure your <code>/ads.txt</code> record is active to prevent AdSense crawler earnings warnings.
              </div>
              <a
                href="https://www.google.com/adsense"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.78rem',
                  color: '#0F9D58',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Open Google AdSense</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ── 4. Google AdX (Google Ad Manager) Card (Primary Color: Royal Blue & Teal #1A73E8) ── */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(26, 115, 232, 0.08) 0%, rgba(2, 132, 199, 0.03) 100%), var(--bg-surface)',
            border: '1px solid rgba(26, 115, 232, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: '0 4px 20px rgba(26, 115, 232, 0.06)',
            position: 'relative',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: '#FFFFFF',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid rgba(26, 115, 232, 0.35)',
                  boxShadow: '0 2px 10px rgba(26, 115, 232, 0.15)',
                  flexShrink: 0,
                }}
              >
                <img
                  src="/assets/ads/google-adx.webp"
                  onError={(e) => {
                    ;(e.currentTarget as HTMLImageElement).src = 'https://adsparc.com/wp-content/uploads/2022/03/google-adx-logo-1-1.webp'
                  }}
                  alt="Google AdX"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--text-primary)' }}>
                    Google AdX (Google Ad Manager)
                  </h3>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)',
                      background: settings.adx_enabled && settings.adx_network_code ? 'rgba(26, 115, 232, 0.16)' : 'rgba(107, 114, 128, 0.15)',
                      color: settings.adx_enabled && settings.adx_network_code ? '#1A73E8' : 'var(--text-muted)',
                      border: '1px solid ' + (settings.adx_enabled && settings.adx_network_code ? 'rgba(26, 115, 232, 0.4)' : 'rgba(107, 114, 128, 0.3)'),
                      fontWeight: 700,
                    }}
                  >
                    {settings.adx_enabled && settings.adx_network_code ? '● AdX Exchange Live' : '● Standby'}
                  </span>
                </div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', margin: '3px 0 0 0' }}>
                  Enterprise programmatic exchange, Google Publisher Tag (GPT), header bidding & high CPM premium deals
                </p>
              </div>
            </div>

            {/* Enable Toggle Switch */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: settings.adx_enabled ? '#1A73E8' : 'var(--text-muted)' }}>
                {settings.adx_enabled ? 'Enabled' : 'Disabled'}
              </span>
              <label className="toggle-switch" onClick={e => e.stopPropagation()}>
                <input
                  type="checkbox"
                  checked={settings.adx_enabled}
                  onChange={e => setSettings(s => ({ ...s, adx_enabled: e.target.checked }))}
                />
                <span className="toggle-slider" style={{ accentColor: '#1A73E8' }} />
              </label>
            </div>
          </div>

          {/* Form Controls inside Card Padding Container */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                  AdX / GAM Network Code
                </label>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  e.g. 12345678 or /12345678/
                </span>
              </div>
              <input
                className="input-field"
                placeholder="12345678"
                value={settings.adx_network_code}
                onChange={e => setSettings(s => ({ ...s, adx_network_code: e.target.value.trim() }))}
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.85rem',
                  borderColor: settings.adx_network_code ? 'rgba(26, 115, 232, 0.4)' : undefined,
                }}
              />
            </div>

            {/* Google Publisher Tag (GPT) Script Snippet */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Google Publisher Tag (GPT) Header Snippet (Optional)
              </label>
              <textarea
                className="input-field"
                rows={2}
                placeholder="window.googletag = window.googletag || {cmd: []}; googletag.cmd.push(function() { ... });"
                value={settings.adx_head_code}
                onChange={e => setSettings(s => ({ ...s, adx_head_code: e.target.value }))}
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
              />
            </div>

            {/* Quick Action Links */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 4, flexWrap: 'wrap', gap: 8 }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Automatically initializes <code>securepubads.g.doubleclick.net/tag/js/gpt.js</code> with asynchronous loading.
              </div>
              <a
                href="https://admanager.google.com"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.78rem',
                  color: '#1A73E8',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <span>Open Google Ad Manager</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* ── Bottom Save Action Bar ── */}
        <div
          style={{
            marginTop: 20,
            padding: '20px 24px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
              Ready to save all settings?
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
              Saves Google Search Console, Analytics, AdSense, AdX, UPI intent, and store configuration instantly to database.
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {success && (
              <span style={{ fontSize: '0.85rem', color: '#10B981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle2 size={16} /> All settings saved!
              </span>
            )}
            <button
              onClick={() => saveMutation.mutate()}
              className="btn-primary"
              disabled={saveMutation.isPending}
              style={{
                fontSize: '0.9rem',
                padding: '12px 28px',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                boxShadow: '0 4px 16px rgba(17, 98, 242, 0.35)',
              }}
            >
              {saveMutation.isPending ? (
                <><Loader2 size={16} className="animate-spin" /> Saving Settings...</>
              ) : success ? (
                <><Check size={16} /> Saved Successfully!</>
              ) : (
                <><Save size={16} /> Save All Settings</>
              )}
            </button>
          </div>
        </div>

        {/* ── Floating Sticky Quick-Save Bar (Always visible while scrolling) ── */}
        <div
          style={{
            position: 'sticky',
            bottom: 20,
            zIndex: 40,
            marginTop: 20,
            padding: '12px 20px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 'var(--radius-full)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={16} color="var(--brand-purple-light)" />
            <span style={{ fontWeight: 600 }}>Save button is always accessible while customizing</span>
          </div>
          <button
            onClick={() => saveMutation.mutate()}
            className="btn-primary"
            disabled={saveMutation.isPending}
            style={{
              fontSize: '0.825rem',
              padding: '8px 22px',
              borderRadius: 'var(--radius-full)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            {saveMutation.isPending ? (
              <><Loader2 size={14} className="animate-spin" /> Saving...</>
            ) : success ? (
              <><Check size={14} /> Saved!</>
            ) : (
              <><Save size={14} /> Save Changes</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
