// src/client/pages/admin/AdminSettings.tsx
import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Save, Check, Zap, Smartphone, Shield, Globe, Moon, Sun, Palette,
  CheckCircle2, Sparkles, Key, AlertCircle, Loader2, Bot, Star
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
    gemini_api_key: 'AQ.Ab8RN6KxN6h49tNcQy64pk_VQxf4mkDsoDKJXMU89LJYI6lAEw',
    gemini_model: 'gemini-flash-latest',
    show_seed_reviews: true,
  })

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.settings.update(token!, settings)
    },
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      adminToast.success('Settings Saved', 'Store and system configuration updated successfully.')
    },
    onError: (err: any) => {
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
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Project: 254454021555
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="AQ.Ab8RN6..."
                  value={settings.gemini_api_key}
                  onChange={e => setSettings(s => ({ ...s, gemini_api_key: e.target.value }))}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
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

        {/* ── General Store Information (White-Label Config) ── */}
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
      </div>
    </div>
  )
}
