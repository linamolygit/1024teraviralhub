// src/client/pages/admin/gateways/AdminPaymentGateways.tsx
// Comprehensive Payment Gateway Command Center (Cashfree & Razorpay)

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CreditCard, CheckCircle2, XCircle, AlertTriangle, ShieldCheck,
  Eye, EyeOff, Copy, Check, RefreshCw, Zap, Smartphone, Activity, Save,
  BookOpen, ExternalLink, KeyRound, HelpCircle, CheckCircle, ArrowRight, RotateCcw
} from 'lucide-react'
import { adminApi, type PaymentGatewaysConfig, type PaymentGatewaysConfigUpdate } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { adminToast } from '../../../lib/admin-toast'

export default function AdminPaymentGateways() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  // Gateway form state
  const [activeGateway, setActiveGateway] = useState<'cashfree' | 'razorpay' | 'both' | 'offline'>('cashfree')
  const [defaultDualGateway, setDefaultDualGateway] = useState<'cashfree' | 'razorpay'>('cashfree')

  // Cashfree state
  const [cfEnabled, setCfEnabled] = useState(true)
  const [cfMode, setCfMode] = useState<'sandbox' | 'production'>('sandbox')
  const [cfAppId, setCfAppId] = useState('')
  const [cfSecretKey, setCfSecretKey] = useState('')
  const [showCfSecret, setShowCfSecret] = useState(false)
  const [cfApiUrl, setCfApiUrl] = useState('')
  const [cfWebhookSecret, setCfWebhookSecret] = useState('')

  // Razorpay state
  const [rzpEnabled, setRzpEnabled] = useState(false)
  const [rzpMode, setRzpMode] = useState<'test' | 'live'>('test')
  const [rzpKeyId, setRzpKeyId] = useState('')
  const [rzpKeySecret, setRzpKeySecret] = useState('')
  const [showRzpSecret, setShowRzpSecret] = useState(false)
  const [rzpWebhookSecret, setRzpWebhookSecret] = useState('')

  // UPI preferences
  const [upiDirectLaunch, setUpiDirectLaunch] = useState(true)
  const [preferredUpiApp, setPreferredUpiApp] = useState('phonepe')
  const [guestCheckoutMode, setGuestCheckoutMode] = useState('instant')

  // Copied states
  const [copiedCfWebhook, setCopiedCfWebhook] = useState(false)
  const [copiedRzpWebhook, setCopiedRzpWebhook] = useState(false)

  // Test connection states
  const [cfTestLoading, setCfTestLoading] = useState(false)
  const [cfTestResult, setCfTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [rzpTestLoading, setRzpTestLoading] = useState(false)
  const [rzpTestResult, setRzpTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [guideTab, setGuideTab] = useState<'cashfree' | 'razorpay'>('cashfree')

  // Auto-select on first click, deselect on second click
  const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
    const input = e.currentTarget
    if (!input.value) return
    if (input.dataset.allSelected === 'true') {
      input.setSelectionRange(input.value.length, input.value.length)
      input.dataset.allSelected = 'false'
    } else {
      input.select()
      input.dataset.allSelected = 'true'
    }
  }

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.dataset.allSelected = 'false'
  }

  // Populate form with server config
  const populateFromConfig = (cfg: PaymentGatewaysConfig) => {
    setActiveGateway((cfg.active_payment_gateway as any) || 'cashfree')
    setDefaultDualGateway((cfg.default_dual_gateway as any) || 'cashfree')

    // Cashfree
    setCfEnabled(cfg.cashfree.enabled)
    setCfMode((cfg.cashfree.mode as any) || 'sandbox')
    setCfAppId(cfg.cashfree.app_id || '')
    setCfSecretKey(cfg.cashfree.secret_key || cfg.cashfree.masked_secret_key || '')
    setCfApiUrl(cfg.cashfree.api_url || '')
    setCfWebhookSecret(cfg.cashfree.webhook_secret || '')

    // Razorpay
    setRzpEnabled(cfg.razorpay.enabled)
    setRzpMode((cfg.razorpay.mode as any) || 'test')
    setRzpKeyId(cfg.razorpay.key_id || '')
    setRzpKeySecret(cfg.razorpay.key_secret || cfg.razorpay.masked_key_secret || '')
    setRzpWebhookSecret(cfg.razorpay.webhook_secret || '')

    // UPI
    setUpiDirectLaunch(cfg.upi?.upi_direct_launch ?? true)
    setPreferredUpiApp(cfg.upi?.preferred_upi_app || 'phonepe')
    setGuestCheckoutMode(cfg.upi?.guest_checkout_mode || 'instant')

    setHasUnsavedChanges(false)
  }

  // Fetch current gateway configuration
  const { data: config, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-payment-gateways-config'],
    queryFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')
      return adminApi.paymentGateways.get(token)
    },
    staleTime: 60000,
  })

  // Populate form when data loads
  useEffect(() => {
    if (config) {
      populateFromConfig(config)
    }
  }, [config])

  // Explicit refresh handler with visual spinning feedback & toast
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways-config'] })
      const result = await refetch()
      if (result.data) {
        populateFromConfig(result.data)
      }
      adminToast.success('Refreshed', 'Payment gateway settings reloaded from server.')
    } catch (err: any) {
      adminToast.error('Refresh Error', err.message || 'Failed to reload gateway settings.')
    } finally {
      setTimeout(() => setIsRefreshing(false), 500)
    }
  }

  const markDirty = () => {
    if (!hasUnsavedChanges) setHasUnsavedChanges(true)
  }

  // Discard all unsaved changes and revert form inputs to saved server values
  const handleDiscard = () => {
    if (config) {
      populateFromConfig(config)
      adminToast.info('Changes Discarded', 'Reverted back to saved gateway settings.')
    } else {
      setHasUnsavedChanges(false)
    }
  }

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const payload: PaymentGatewaysConfigUpdate = {
        active_payment_gateway: activeGateway,
        default_dual_gateway: defaultDualGateway,
        cashfree: {
          enabled: cfEnabled,
          mode: cfMode,
          app_id: cfAppId,
          secret_key: cfSecretKey,
          webhook_secret: cfWebhookSecret,
          api_url: cfApiUrl,
        },
        razorpay: {
          enabled: rzpEnabled,
          mode: rzpMode,
          key_id: rzpKeyId,
          key_secret: rzpKeySecret,
          webhook_secret: rzpWebhookSecret,
        },
        upi: {
          upi_direct_launch: upiDirectLaunch,
          preferred_upi_app: preferredUpiApp,
          guest_checkout_mode: guestCheckoutMode,
        },
      }

      return adminApi.paymentGateways.update(token, payload)
    },
    onSuccess: (res) => {
      adminToast.success('Gateway Settings Saved', res.message || 'Payment gateways successfully updated.')
      setHasUnsavedChanges(false)
      queryClient.invalidateQueries({ queryKey: ['admin-payment-gateways-config'] })
      queryClient.invalidateQueries({ queryKey: ['public-settings'] })
    },
    onError: (err: any) => {
      adminToast.error('Save Failed', err.message || 'Could not save payment gateway settings.')
    },
  })

  // Test Cashfree Connection
  const handleTestCashfree = async () => {
    setCfTestLoading(true)
    setCfTestResult(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')

      const res = await adminApi.paymentGateways.test(token, 'cashfree', {
        app_id: cfAppId,
        secret_key: cfSecretKey,
        api_url: cfApiUrl,
      })
      setCfTestResult(res)
      if (res.success) {
        adminToast.success('Cashfree Connected', res.message)
      } else {
        adminToast.error('Cashfree Authentication Failed', res.message)
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to ping Cashfree servers'
      setCfTestResult({ success: false, message: msg })
      adminToast.error('Cashfree Test Error', msg)
    } finally {
      setCfTestLoading(false)
    }
  }

  // Test Razorpay Connection
  const handleTestRazorpay = async () => {
    setRzpTestLoading(true)
    setRzpTestResult(null)
    try {
      const token = await getToken()
      if (!token) throw new Error('Authentication required')

      const res = await adminApi.paymentGateways.test(token, 'razorpay', {
        key_id: rzpKeyId,
        key_secret: rzpKeySecret,
      })
      setRzpTestResult(res)
      if (res.success) {
        adminToast.success('Razorpay Connected', res.message)
      } else {
        adminToast.error('Razorpay Authentication Failed', res.message)
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to ping Razorpay servers'
      setRzpTestResult({ success: false, message: msg })
      adminToast.error('Razorpay Test Error', msg)
    } finally {
      setRzpTestLoading(false)
    }
  }

  const copyToClipboard = (text: string, type: 'cf' | 'rzp') => {
    navigator.clipboard.writeText(text)
    if (type === 'cf') {
      setCopiedCfWebhook(true)
      setTimeout(() => setCopiedCfWebhook(false), 2500)
    } else {
      setCopiedRzpWebhook(true)
      setTimeout(() => setCopiedRzpWebhook(false), 2500)
    }
    adminToast.info('Copied to Clipboard', 'Webhook URL ready to paste in dashboard.')
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
        <LoadingSpinner size="lg" />
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Loading Payment Gateway Configuration...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div style={{ padding: 32, textAlign: 'center', maxWidth: 480, margin: '48px auto', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16 }}>
        <AlertTriangle size={48} color="#EF4444" style={{ margin: '0 auto 12px' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 8 }}>Failed to load Gateway Settings</h2>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 24 }}>Could not fetch payment gateway credentials from database.</p>
        <button
          onClick={() => refetch()}
          style={{ padding: '10px 20px', background: '#EF4444', color: '#fff', borderRadius: 10, fontWeight: 700, border: 'none', cursor: 'pointer' }}
        >
          Try Again
        </button>
      </div>
    )
  }

  const siteOrigin = config?.site_url || window.location.origin
  const cfWebhookUrl = `${siteOrigin}/api/cashfree/webhook`
  const rzpWebhookUrl = `${siteOrigin}/api/razorpay/webhook`

  return (
    <div style={{ maxWidth: 1080, margin: '0 auto', paddingBottom: 110, display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* Page Header */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        gap: 16, borderBottom: '1px solid var(--bg-border)', paddingBottom: 20,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 42, height: 42, borderRadius: 12, background: 'rgba(6, 182, 212, 0.12)',
              border: '1px solid rgba(6, 182, 212, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#06B6D4',
            }}>
              <CreditCard size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Payment Gateways &amp; Checkout
            </h1>
            <span style={{
              fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
              background: 'rgba(16, 185, 129, 0.12)', color: '#10B981', border: '1px solid rgba(16, 185, 129, 0.25)',
              padding: '2px 8px', borderRadius: 999,
            }}>
              Live Control
            </span>
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: 0, maxWidth: 640 }}>
            Switch between Cashfree and Razorpay in real-time, configure merchant API credentials, verify connections instantly, and customize checkout parameters without opening code files.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={isRefreshing}
            style={{
              padding: '10px 16px', background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
              border: '1px solid var(--bg-border)', borderRadius: 10, fontSize: '0.85rem', fontWeight: 600,
              cursor: isRefreshing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8,
              opacity: isRefreshing ? 0.7 : 1, transition: 'all 0.2s ease',
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                transition: 'transform 0.3s ease',
              }}
            />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            style={{
              height: 40,
              minHeight: 0,
              maxHeight: 40,
              padding: '0 20px',
              background: 'linear-gradient(135deg, #00A37A, #0C83FD)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: '0.875rem',
              fontWeight: 800,
              cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(0, 163, 122, 0.3)',
              opacity: saveMutation.isPending ? 0.75 : 1,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {saveMutation.isPending ? (
              <>
                <RefreshCw size={15} style={{ animation: 'spin 0.8s linear infinite' }} />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save size={16} />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Section 1: Active Gateway Selection ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Zap size={18} color="#F59E0B" />
            Primary Active Payment Processor
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Select which gateway handles all buyer orders and checkout flows on your store.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18 }}>
          {/* Cashfree Card */}
          <div
            onClick={() => {
              setActiveGateway('cashfree')
              markDirty()
            }}
            style={{
              padding: '24px 22px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.22s ease',
              background: activeGateway === 'cashfree'
                ? 'linear-gradient(145deg, rgba(0, 163, 122, 0.09) 0%, rgba(255, 112, 67, 0.04) 100%)'
                : 'var(--bg-surface)',
              border: activeGateway === 'cashfree' ? '2px solid #00A37A' : '1px solid var(--bg-border)',
              boxShadow: activeGateway === 'cashfree' ? '0 10px 28px rgba(0, 163, 122, 0.18)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#FFFFFF',
                  border: '1.5px solid rgba(0, 163, 122, 0.28)',
                  boxShadow: '0 3px 10px rgba(0, 163, 122, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, flexShrink: 0,
                }}>
                  <img
                    src="/assets/cashfree-logo.png"
                    alt="Cashfree Payments"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://play-lh.googleusercontent.com/UAVAgdBLFEZSWrSbT5RRkHNBT3FU8SFrESyH8BTMDlOTz1VfY3RtNpDHc5zNK9KHaxvJeOyo44o-AEbEvmFv=w480-h960-rw'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>Cashfree Payments</h3>
                  <span style={{ fontSize: '0.74rem', color: '#00A37A', fontWeight: 600 }}>PG + Direct UPI Deeplink</span>
                </div>
              </div>

              {activeGateway === 'cashfree' ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 999,
                  background: '#00A37A', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(0, 163, 122, 0.35)',
                }}>
                  <CheckCircle2 size={13} /> ACTIVE
                </span>
              ) : (
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Inactive
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Zero-friction UPI payments. Seamless auto-redirect to PhonePe, Google Pay, Paytm without app switching friction.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
              <span style={{
                padding: '3px 9px', borderRadius: 6, fontWeight: 700,
                background: cfMode === 'production' ? 'rgba(0, 163, 122, 0.15)' : 'rgba(255, 138, 0, 0.15)',
                color: cfMode === 'production' ? '#00A37A' : '#FF8A00',
              }}>
                {cfMode.toUpperCase()}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: config?.cashfree.has_secret_key ? '#00A37A' : 'var(--text-muted)', fontWeight: 600 }}>
                {config?.cashfree.has_secret_key ? '✓ Key Configured' : 'No Key'}
              </span>
            </div>
          </div>

          {/* Razorpay Card */}
          <div
            onClick={() => {
              setActiveGateway('razorpay')
              markDirty()
            }}
            style={{
              padding: '24px 22px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.22s ease',
              background: activeGateway === 'razorpay'
                ? 'linear-gradient(145deg, rgba(12, 131, 253, 0.09) 0%, rgba(12, 35, 64, 0.04) 100%)'
                : 'var(--bg-surface)',
              border: activeGateway === 'razorpay' ? '2px solid #0C83FD' : '1px solid var(--bg-border)',
              boxShadow: activeGateway === 'razorpay' ? '0 10px 28px rgba(12, 131, 253, 0.18)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: '#FFFFFF',
                  border: '1.5px solid rgba(12, 131, 253, 0.28)',
                  boxShadow: '0 3px 10px rgba(12, 131, 253, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 6, flexShrink: 0,
                }}>
                  <img
                    src="/assets/razorpay-logo.png"
                    alt="Razorpay"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    onError={(e) => {
                      e.currentTarget.src = 'https://assets.stickpng.com/images/62cc1d95150d5de9a3dad5fa.png'
                    }}
                  />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>Razorpay</h3>
                  <span style={{ fontSize: '0.74rem', color: '#0C83FD', fontWeight: 600 }}>Standard Modal + Cards + UPI</span>
                </div>
              </div>

              {activeGateway === 'razorpay' ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 999,
                  background: '#0C83FD', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(12, 131, 253, 0.35)',
                }}>
                  <CheckCircle2 size={13} /> ACTIVE
                </span>
              ) : (
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Inactive
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              India's industry standard. Features Razorpay Standard Modal with QR Code, Cards, Netbanking, Wallets &amp; International support.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
              <span style={{
                padding: '3px 9px', borderRadius: 6, fontWeight: 700,
                background: rzpMode === 'live' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: rzpMode === 'live' ? '#10B981' : '#F59E0B',
              }}>
                {rzpMode.toUpperCase()}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{ color: config?.razorpay.has_key_secret ? '#0C83FD' : 'var(--text-muted)', fontWeight: 600 }}>
                {config?.razorpay.has_key_secret ? '✓ Key Configured' : 'No Key'}
              </span>
            </div>
          </div>

          {/* Dual / Both Gateways Card */}
          <div
            onClick={() => {
              setActiveGateway('both')
              markDirty()
            }}
            style={{
              padding: '24px 22px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.22s ease',
              background: activeGateway === 'both'
                ? 'linear-gradient(145deg, rgba(0, 163, 122, 0.12) 0%, rgba(12, 131, 253, 0.12) 100%)'
                : 'var(--bg-surface)',
              border: activeGateway === 'both' ? '2px solid #0C83FD' : '1px solid var(--bg-border)',
              boxShadow: activeGateway === 'both' ? '0 10px 28px rgba(12, 131, 253, 0.2)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* Combined Logos */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: '#FFFFFF',
                    border: '1.5px solid rgba(0, 163, 122, 0.3)',
                    boxShadow: '0 2px 8px rgba(0, 163, 122, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 4, flexShrink: 0,
                  }}>
                    <img
                      src="/assets/cashfree-logo.png"
                      alt="Cashfree"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  <span style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-muted)' }}>+</span>
                  <div style={{
                    width: 38, height: 38, borderRadius: 10, background: '#FFFFFF',
                    border: '1.5px solid rgba(12, 131, 253, 0.3)',
                    boxShadow: '0 2px 8px rgba(12, 131, 253, 0.12)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 4, flexShrink: 0,
                  }}>
                    <img
                      src="/assets/razorpay-logo.png"
                      alt="Razorpay"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                </div>

                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>Both Gateways (Dual Mode)</h3>
                  <span style={{ fontSize: '0.74rem', color: '#0C83FD', fontWeight: 600 }}>Cashfree + Razorpay Active</span>
                </div>
              </div>

              {activeGateway === 'both' ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 999,
                  background: 'linear-gradient(135deg, #00A37A, #0C83FD)', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                  boxShadow: '0 2px 10px rgba(12, 131, 253, 0.35)',
                }}>
                  <CheckCircle2 size={13} /> BOTH ACTIVE
                </span>
              ) : (
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Inactive
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Simultaneously displays both Cashfree &amp; Razorpay brand names, trust seals, and dual checkout options across your entire storefront.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
              <span style={{
                padding: '3px 9px', borderRadius: 6, fontWeight: 700,
                background: 'rgba(0, 163, 122, 0.15)', color: '#00A37A',
              }}>
                CF: {cfMode.toUpperCase()}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>•</span>
              <span style={{
                padding: '3px 9px', borderRadius: 6, fontWeight: 700,
                background: 'rgba(12, 131, 253, 0.15)', color: '#0C83FD',
              }}>
                RZP: {rzpMode.toUpperCase()}
              </span>
            </div>

            {activeGateway === 'both' && (
              <div
                onClick={(e) => e.stopPropagation()}
                style={{
                  marginTop: 16,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'var(--bg-elevated)',
                  border: '1.5px solid rgba(12, 131, 253, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
                  <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    Default Active Processor
                  </span>
                  <span style={{ fontSize: '0.68rem', color: '#0C83FD', fontWeight: 700 }}>
                    Auto-selected for buyer
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setDefaultDualGateway('cashfree')
                      markDirty()
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: defaultDualGateway === 'cashfree' ? '2px solid #00A37A' : '1px solid var(--bg-border)',
                      background: defaultDualGateway === 'cashfree' ? 'rgba(0, 163, 122, 0.15)' : 'var(--bg-surface)',
                      color: defaultDualGateway === 'cashfree' ? '#00A37A' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CheckCircle size={13} style={{ opacity: defaultDualGateway === 'cashfree' ? 1 : 0.3 }} />
                    Cashfree First
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setDefaultDualGateway('razorpay')
                      markDirty()
                    }}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 8,
                      border: defaultDualGateway === 'razorpay' ? '2px solid #0C83FD' : '1px solid var(--bg-border)',
                      background: defaultDualGateway === 'razorpay' ? 'rgba(12, 131, 253, 0.15)' : 'var(--bg-surface)',
                      color: defaultDualGateway === 'razorpay' ? '#0C83FD' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <CheckCircle size={13} style={{ opacity: defaultDualGateway === 'razorpay' ? 1 : 0.3 }} />
                    Razorpay First
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Offline Card */}
          <div
            onClick={() => {
              setActiveGateway('offline')
              markDirty()
            }}
            style={{
              padding: '24px 22px', borderRadius: 18, cursor: 'pointer', transition: 'all 0.22s ease',
              background: activeGateway === 'offline' ? 'rgba(239, 68, 68, 0.08)' : 'var(--bg-surface)',
              border: activeGateway === 'offline' ? '2px solid #EF4444' : '1px solid var(--bg-border)',
              boxShadow: activeGateway === 'offline' ? '0 10px 28px rgba(239, 68, 68, 0.18)' : 'none',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12, background: 'linear-gradient(135deg, #EF4444, #B91C1C)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
                }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h3 style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1rem', margin: 0 }}>Offline / Maintenance</h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>Pause Checkout</span>
                </div>
              </div>

              {activeGateway === 'offline' ? (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 4, padding: '4px 11px', borderRadius: 999,
                  background: '#EF4444', color: '#fff', fontSize: '0.72rem', fontWeight: 800,
                  boxShadow: '0 2px 8px rgba(239, 68, 68, 0.35)',
                }}>
                  <CheckCircle2 size={13} /> ACTIVE
                </span>
              ) : (
                <span style={{ padding: '3px 8px', borderRadius: 6, background: 'var(--bg-elevated)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  Inactive
                </span>
              )}
            </div>

            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
              Temporarily halts orders with a graceful maintenance notice. Useful while migrating bank accounts or waiting for KYC review.
            </p>

            <div style={{ fontSize: '0.75rem', color: '#EF4444', fontWeight: 600 }}>
              Orders will be stopped gracefully.
            </div>
          </div>
        </div>
      </div>

      {/* ── Section 2: Cashfree Configuration ── */}
      <div style={{
        padding: '28px 28px', borderRadius: 20,
        background: (activeGateway === 'cashfree' || activeGateway === 'both')
          ? 'linear-gradient(180deg, rgba(0, 163, 122, 0.04) 0%, var(--bg-surface) 100%)'
          : 'var(--bg-surface)',
        border: (activeGateway === 'cashfree' || activeGateway === 'both') ? '2px solid #00A37A' : '1px solid var(--bg-border)',
        boxShadow: (activeGateway === 'cashfree' || activeGateway === 'both') ? '0 8px 30px rgba(0, 163, 122, 0.12)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBottom: 22, borderBottom: '1px solid var(--bg-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#FFFFFF',
              border: '1.5px solid rgba(0, 163, 122, 0.3)',
              boxShadow: '0 4px 14px rgba(0, 163, 122, 0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 7, flexShrink: 0,
            }}>
              <img
                src="/assets/cashfree-logo.png"
                alt="Cashfree Payments"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = 'https://play-lh.googleusercontent.com/UAVAgdBLFEZSWrSbT5RRkHNBT3FU8SFrESyH8BTMDlOTz1VfY3RtNpDHc5zNK9KHaxvJeOyo44o-AEbEvmFv=w480-h960-rw'
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Cashfree Payments API Credentials</h3>
                {(activeGateway === 'cashfree' || activeGateway === 'both') && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: activeGateway === 'both' ? 'linear-gradient(135deg, rgba(0, 163, 122, 0.15), rgba(12, 131, 253, 0.15))' : 'rgba(0, 163, 122, 0.12)',
                    color: '#00A37A', border: '1px solid rgba(0, 163, 122, 0.3)',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    {activeGateway === 'both' ? 'ACTIVE (DUAL MODE)' : 'PRIMARY ACTIVE'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Direct integration with Cashfree PG 2023-08-01 API · Auto UPI Deeplinking</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--bg-border)' }}>
              <button
                type="button"
                onClick={() => {
                  setCfMode('sandbox')
                  setCfApiUrl('https://sandbox.cashfree.com/pg')
                  markDirty()
                }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: cfMode === 'sandbox' ? '#FF8A00' : 'transparent',
                  color: cfMode === 'sandbox' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Sandbox (Test)
              </button>
              <button
                type="button"
                onClick={() => {
                  setCfMode('production')
                  setCfApiUrl('https://api.cashfree.com/pg')
                  markDirty()
                }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: cfMode === 'production' ? '#00A37A' : 'transparent',
                  color: cfMode === 'production' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Production (Live)
              </button>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestCashfree}
              disabled={cfTestLoading || !cfAppId}
              style={{
                height: 34,
                minHeight: 0,
                maxHeight: 34,
                padding: '0 14px',
                background: 'rgba(0, 163, 122, 0.08)',
                color: '#00A37A',
                border: '1px solid rgba(0, 163, 122, 0.35)',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: cfTestLoading || !cfAppId ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: cfTestLoading || !cfAppId ? 0.5 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {cfTestLoading ? (
                <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Activity size={14} />
              )}
              {cfTestLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {cfTestResult && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: cfTestResult.success ? 'rgba(0, 163, 122, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: cfTestResult.success ? '1px solid rgba(0, 163, 122, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: cfTestResult.success ? '#00A37A' : '#EF4444',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {cfTestResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{cfTestResult.message}</span>
            </div>
            <button
              onClick={() => setCfTestResult(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 22 }}>
          {/* App ID */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Cashfree App ID / Client ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={cfAppId}
              onChange={(e) => {
                setCfAppId(e.target.value)
                markDirty()
              }}
              onClick={handleInputClick}
              onBlur={handleInputBlur}
              placeholder="e.g. CF123456TEST..."
              className="input-field"
              style={{ fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Found in Cashfree Merchant Dashboard &gt; Developers &gt; API Keys
            </span>
          </div>

          {/* Secret Key */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Cashfree Secret Key <span style={{ color: '#EF4444' }}>*</span></span>
              {config?.cashfree.has_secret_key && (
                <span style={{ fontSize: '0.72rem', color: '#00A37A', fontWeight: 600 }}>● Secret Stored</span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showCfSecret ? 'text' : 'password'}
                value={cfSecretKey}
                onChange={(e) => {
                  setCfSecretKey(e.target.value)
                  markDirty()
                }}
                onClick={handleInputClick}
                onBlur={handleInputBlur}
                placeholder={config?.cashfree.has_secret_key ? '••••••••••••••••••••' : 'Enter secret key'}
                className="input-field"
                style={{ paddingRight: 40, fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => setShowCfSecret(!showCfSecret)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title={showCfSecret ? 'Hide secret key' : 'Show secret key'}
              >
                {showCfSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Click the eye icon to show or hide your full secret key.
            </span>
          </div>

          {/* API Base URL */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              API Base URL
            </label>
            <input
              type="text"
              value={cfApiUrl}
              onChange={(e) => {
                setCfApiUrl(e.target.value)
                markDirty()
              }}
              onClick={handleInputClick}
              onBlur={handleInputBlur}
              placeholder="https://api.cashfree.com/pg"
              className="input-field"
              style={{ fontFamily: 'monospace' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <button
                type="button"
                onClick={() => {
                  setCfApiUrl('https://sandbox.cashfree.com/pg')
                  markDirty()
                }}
                style={{ fontSize: '0.72rem', color: '#00A37A', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Use Sandbox URL
              </button>
              <span style={{ color: 'var(--text-muted)' }}>|</span>
              <button
                type="button"
                onClick={() => {
                  setCfApiUrl('https://api.cashfree.com/pg')
                  markDirty()
                }}
                style={{ fontSize: '0.72rem', color: '#00A37A', background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                Use Production URL
              </button>
            </div>
          </div>

          {/* Webhook Secret Key */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Cashfree Webhook Secret Key (Optional)
            </label>
            <input
              type="text"
              value={cfWebhookSecret}
              onChange={(e) => {
                setCfWebhookSecret(e.target.value)
                markDirty()
              }}
              onClick={handleInputClick}
              onBlur={handleInputBlur}
              placeholder="From Cashfree Dashboard > Webhooks"
              className="input-field"
              style={{ fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Used to verify signature header on instant payment notifications.
            </span>
          </div>
        </div>

        {/* Cashfree Webhook URL Banner */}
        <div style={{
          marginTop: 22, padding: '18px 20px', borderRadius: 14, background: 'rgba(0, 163, 122, 0.04)',
          border: '1px solid rgba(0, 163, 122, 0.22)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#00A37A" /> Cashfree Webhook Endpoint
            </span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Configure this URL in Cashfree Dashboard &gt; Developers &gt; Webhooks. Events: <code style={{ color: '#00A37A' }}>ORDER.PAID</code>, <code style={{ color: '#00A37A' }}>PAYMENT.SUCCESS</code>
            </p>
            <code style={{ fontSize: '0.8rem', color: '#00A37A', fontFamily: 'monospace', paddingTop: 2 }}>
              {cfWebhookUrl}
            </code>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(cfWebhookUrl, 'cf')}
            style={{
              padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {copiedCfWebhook ? <Check size={14} color="#00A37A" /> : <Copy size={14} />}
            {copiedCfWebhook ? 'Copied!' : 'Copy Webhook URL'}
          </button>
        </div>
      </div>

      {/* ── Section 3: Razorpay Configuration ── */}
      <div style={{
        padding: '28px 28px', borderRadius: 20,
        background: (activeGateway === 'razorpay' || activeGateway === 'both')
          ? 'linear-gradient(180deg, rgba(12, 131, 253, 0.04) 0%, var(--bg-surface) 100%)'
          : 'var(--bg-surface)',
        border: (activeGateway === 'razorpay' || activeGateway === 'both') ? '2px solid #0C83FD' : '1px solid var(--bg-border)',
        boxShadow: (activeGateway === 'razorpay' || activeGateway === 'both') ? '0 8px 30px rgba(12, 131, 253, 0.12)' : 'none',
        transition: 'all 0.2s ease',
      }}>
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
          gap: 16, paddingBottom: 22, borderBottom: '1px solid var(--bg-border)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 14, background: '#FFFFFF',
              border: '1.5px solid rgba(12, 131, 253, 0.3)',
              boxShadow: '0 4px 14px rgba(12, 131, 253, 0.14)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: 7, flexShrink: 0,
            }}>
              <img
                src="/assets/razorpay-logo.png"
                alt="Razorpay"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onError={(e) => {
                  e.currentTarget.src = 'https://assets.stickpng.com/images/62cc1d95150d5de9a3dad5fa.png'
                }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Razorpay API Credentials</h3>
                {(activeGateway === 'razorpay' || activeGateway === 'both') && (
                  <span style={{
                    fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                    background: activeGateway === 'both' ? 'linear-gradient(135deg, rgba(0, 163, 122, 0.15), rgba(12, 131, 253, 0.15))' : 'rgba(12, 131, 253, 0.12)',
                    color: '#0C83FD', border: '1px solid rgba(12, 131, 253, 0.3)',
                    padding: '2px 8px', borderRadius: 999,
                  }}>
                    {activeGateway === 'both' ? 'ACTIVE (DUAL MODE)' : 'PRIMARY ACTIVE'}
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>Standard Checkout SDK + Orders API · Cards, Netbanking, UPI</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Mode Switcher */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 10, border: '1px solid var(--bg-border)' }}>
              <button
                type="button"
                onClick={() => {
                  setRzpMode('test')
                  markDirty()
                }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: rzpMode === 'test' ? '#F59E0B' : 'transparent',
                  color: rzpMode === 'test' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Test Mode
              </button>
              <button
                type="button"
                onClick={() => {
                  setRzpMode('live')
                  markDirty()
                }}
                style={{
                  padding: '6px 12px', borderRadius: 8, fontSize: '0.75rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: rzpMode === 'live' ? '#0C83FD' : 'transparent',
                  color: rzpMode === 'live' ? '#fff' : 'var(--text-secondary)',
                }}
              >
                Live Mode
              </button>
            </div>

            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestRazorpay}
              disabled={rzpTestLoading || !rzpKeyId}
              style={{
                height: 34,
                minHeight: 0,
                maxHeight: 34,
                padding: '0 14px',
                background: 'rgba(12, 131, 253, 0.08)',
                color: '#0C83FD',
                border: '1px solid rgba(12, 131, 253, 0.35)',
                borderRadius: 8,
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: rzpTestLoading || !rzpKeyId ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                opacity: rzpTestLoading || !rzpKeyId ? 0.5 : 1,
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {rzpTestLoading ? (
                <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <Activity size={14} />
              )}
              {rzpTestLoading ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
        </div>

        {/* Test Result Message */}
        {rzpTestResult && (
          <div style={{
            marginTop: 16, padding: '12px 16px', borderRadius: 10, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: rzpTestResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            border: rzpTestResult.success ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
            color: rzpTestResult.success ? '#10B981' : '#EF4444',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {rzpTestResult.success ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
              <span>{rzpTestResult.message}</span>
            </div>
            <button
              onClick={() => setRzpTestResult(null)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              ✕
            </button>
          </div>
        )}

        {/* Form Inputs Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginTop: 22 }}>
          {/* Key ID */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Razorpay Key ID <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              value={rzpKeyId}
              onChange={(e) => {
                setRzpKeyId(e.target.value)
                markDirty()
              }}
              onClick={handleInputClick}
              onBlur={handleInputBlur}
              placeholder="rzp_test_... or rzp_live_..."
              className="input-field"
              style={{ fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Found in Razorpay Dashboard &gt; Settings &gt; API Keys
            </span>
          </div>

          {/* Key Secret */}
          <div>
            <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              <span>Razorpay Key Secret <span style={{ color: '#EF4444' }}>*</span></span>
              {config?.razorpay.has_key_secret && (
                <span style={{ fontSize: '0.72rem', color: '#10B981', fontWeight: 600 }}>● Secret Stored</span>
              )}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showRzpSecret ? 'text' : 'password'}
                value={rzpKeySecret}
                onChange={(e) => {
                  setRzpKeySecret(e.target.value)
                  markDirty()
                }}
                onClick={handleInputClick}
                onBlur={handleInputBlur}
                placeholder={config?.razorpay.has_key_secret ? '••••••••••••••••••••' : 'Enter key secret'}
                className="input-field"
                style={{ paddingRight: 40, fontFamily: 'monospace' }}
              />
              <button
                type="button"
                onClick={() => setShowRzpSecret(!showRzpSecret)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                title={showRzpSecret ? 'Hide key secret' : 'Show key secret'}
              >
                {showRzpSecret ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Click the eye icon to show or hide your full key secret.
            </span>
          </div>

          {/* Webhook Secret */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 6 }}>
              Razorpay Webhook Secret (Recommended)
            </label>
            <input
              type="text"
              value={rzpWebhookSecret}
              onChange={(e) => {
                setRzpWebhookSecret(e.target.value)
                markDirty()
              }}
              onClick={handleInputClick}
              onBlur={handleInputBlur}
              placeholder="A secure secret configured in Razorpay Webhook settings"
              className="input-field"
              style={{ fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
              Razorpay signs webhook notifications with HMAC-SHA256 using this secret.
            </span>
          </div>
        </div>

        {/* Razorpay Webhook URL Banner */}
        <div style={{
          marginTop: 22, padding: '18px 20px', borderRadius: 14, background: 'rgba(12, 131, 253, 0.04)',
          border: '1px solid rgba(12, 131, 253, 0.22)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={16} color="#0C83FD" /> Razorpay Webhook Endpoint
            </span>
            <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: 0 }}>
              Configure this URL in Razorpay Dashboard &gt; Settings &gt; Webhooks. Events: <code style={{ color: '#0C83FD' }}>order.paid</code>, <code style={{ color: '#0C83FD' }}>payment.captured</code>
            </p>
            <code style={{ fontSize: '0.8rem', color: '#0C83FD', fontFamily: 'monospace', paddingTop: 2 }}>
              {rzpWebhookUrl}
            </code>
          </div>
          <button
            type="button"
            onClick={() => copyToClipboard(rzpWebhookUrl, 'rzp')}
            style={{
              padding: '8px 14px', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
              borderRadius: 8, fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)',
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            {copiedRzpWebhook ? <Check size={14} color="#0C83FD" /> : <Copy size={14} />}
            {copiedRzpWebhook ? 'Copied!' : 'Copy Webhook URL'}
          </button>
        </div>
      </div>

      {/* ── Section 4: UPI & Mobile Checkout Optimization ── */}
      <div style={{
        padding: '28px 28px', borderRadius: 20, background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: 20,
      }}>
        <div>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Smartphone size={18} color="#00A37A" />
            UPI &amp; Mobile Checkout Optimization
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Tune the customer purchasing experience for high conversion on mobile devices and UPI apps.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
          {/* Direct UPI Launch Toggle */}
          <div style={{
            padding: 18, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14,
          }}>
            <div>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', display: 'block', marginBottom: 4 }}>Direct UPI Intent Launch</span>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                When customer clicks Buy on mobile, directly triggers PhonePe / GPay app deeplink without extra screens.
              </p>
            </div>
            <label className="toggle-switch" onClick={e => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={upiDirectLaunch}
                onChange={e => {
                  setUpiDirectLaunch(e.target.checked)
                  markDirty()
                }}
              />
              <span className="toggle-slider" />
            </label>
          </div>

          {/* Preferred UPI App */}
          <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Default App Deeplink
            </label>
            <select
              value={preferredUpiApp}
              onChange={(e) => {
                setPreferredUpiApp(e.target.value)
                markDirty()
              }}
              className="input-field"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="phonepe">PhonePe (Highest Success Rate)</option>
              <option value="gpay">Google Pay (GPay)</option>
              <option value="paytm">Paytm</option>
              <option value="generic">Universal UPI Intent (Ask User)</option>
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Target app for instant 1-tap mobile payment intent.</p>
          </div>

          {/* Guest Checkout Mode */}
          <div style={{ padding: 18, borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Post-Payment Fulfillment
            </label>
            <select
              value={guestCheckoutMode}
              onChange={(e) => {
                setGuestCheckoutMode(e.target.value)
                markDirty()
              }}
              className="input-field"
              style={{ fontSize: '0.82rem' }}
            >
              <option value="instant">Instant Download Page &amp; Email</option>
              <option value="account_optional">Instant + Prompt Account Creation</option>
            </select>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>Delivers one-click encrypted R2 access token immediately.</p>
          </div>
        </div>
      </div>

      {/* ── Section 5: Comprehensive Step-by-Step API Setup Guide ── */}
      <div style={{
        padding: '28px 28px', borderRadius: 20, background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)', display: 'flex', flexDirection: 'column', gap: 22,
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
      }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: 9 }}>
              <BookOpen size={20} color="#00A37A" />
              Payment Gateway Setup &amp; API Key Guide
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: 4, margin: 0 }}>
              Complete step-by-step instructions to obtain API credentials from Cashfree and Razorpay and connect them to your store.
            </p>
          </div>

          {/* Guide Switcher Tabs */}
          <div style={{ display: 'flex', background: 'var(--bg-elevated)', padding: 4, borderRadius: 12, border: '1px solid var(--bg-border)', gap: 4 }}>
            <button
              type="button"
              onClick={() => setGuideTab('cashfree')}
              style={{
                padding: '8px 16px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: guideTab === 'cashfree' ? '#00A37A' : 'transparent',
                color: guideTab === 'cashfree' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/assets/cashfree-logo.png" alt="CF" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              Cashfree Guide
            </button>
            <button
              type="button"
              onClick={() => setGuideTab('razorpay')}
              style={{
                padding: '8px 16px', borderRadius: 9, fontSize: '0.8rem', fontWeight: 700, border: 'none', cursor: 'pointer',
                background: guideTab === 'razorpay' ? '#0C83FD' : 'transparent',
                color: guideTab === 'razorpay' ? '#FFFFFF' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s ease',
              }}
            >
              <div style={{ width: 18, height: 18, borderRadius: 4, background: '#FFFFFF', padding: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/assets/razorpay-logo.png" alt="RZ" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              Razorpay Guide
            </button>
          </div>
        </div>

        {/* ── Cashfree Step-by-Step Content ── */}
        {guideTab === 'cashfree' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Info Banner with Direct Link */}
            <div style={{
              padding: '16px 20px', borderRadius: 14, background: 'rgba(0, 163, 122, 0.05)',
              border: '1px solid rgba(0, 163, 122, 0.25)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#00A37A', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} /> Cashfree Merchant Portal
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>
                  Access merchant credentials in Cashfree Merchant Portal. Switch between <strong>Sandbox</strong> (testing) and <strong>Production</strong> (live payments).
                </p>
              </div>
              <a
                href="https://merchant.cashfree.com/merchants/login"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', background: '#00A37A', color: '#fff', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(0, 163, 122, 0.3)',
                }}
              >
                Open Cashfree Dashboard <ExternalLink size={14} />
              </a>
            </div>

            {/* Steps Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Step 1 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0, 163, 122, 0.15)', color: '#00A37A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    1
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Log In &amp; Choose Mode</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Sign in at <strong>merchant.cashfree.com</strong>. In the top navigation bar, toggle between <strong>Sandbox</strong> (for testing with simulated UPI/cards) or <strong>Production</strong> (for real buyer payments).
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0, 163, 122, 0.15)', color: '#00A37A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    2
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Generate API Keys</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  In the left sidebar, click <strong>Developers &gt; API Keys</strong>. Under <em>Payment Gateway</em>, click <strong>Generate API Keys</strong>. Copy your <strong>App ID / Client ID</strong> and <strong>Secret Key</strong>, then paste them into the Cashfree card above.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0, 163, 122, 0.15)', color: '#00A37A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    3
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Configure Webhook</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  In Cashfree, open <strong>Developers &gt; Webhooks</strong> and click <strong>Add Webhook</strong>. Paste the store webhook URL: <code style={{ color: '#00A37A' }}>{cfWebhookUrl}</code>. Select events <code style={{ color: '#00A37A' }}>ORDER.PAID</code> and <code style={{ color: '#00A37A' }}>PAYMENT.SUCCESS</code>. Copy the generated Webhook Secret Key.
                </p>
              </div>

              {/* Step 4 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0, 163, 122, 0.15)', color: '#00A37A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    4
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Test Connection &amp; Save</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Click the <strong>Test Connection</strong> button on the Cashfree card. Once you receive the green checkmark, click <strong>Save Changes</strong>. Customers can now pay using Cashfree with instant UPI deeplinking!
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Razorpay Step-by-Step Content ── */}
        {guideTab === 'razorpay' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Top Info Banner with Direct Link */}
            <div style={{
              padding: '16px 20px', borderRadius: 14, background: 'rgba(12, 131, 253, 0.05)',
              border: '1px solid rgba(12, 131, 253, 0.25)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 12,
            }}>
              <div>
                <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0C83FD', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <ShieldCheck size={16} /> Razorpay Merchant Dashboard
                </span>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0, marginTop: 2 }}>
                  Access API Keys in Razorpay Settings. Toggle between <strong>Test Mode</strong> and <strong>Live Mode</strong> in the top header.
                </p>
              </div>
              <a
                href="https://dashboard.razorpay.com/signin"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  padding: '8px 16px', background: '#0C83FD', color: '#fff', borderRadius: 8,
                  fontSize: '0.8rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                  boxShadow: '0 2px 8px rgba(12, 131, 253, 0.3)',
                }}
              >
                Open Razorpay Dashboard <ExternalLink size={14} />
              </a>
            </div>

            {/* Steps Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              {/* Step 1 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(12, 131, 253, 0.15)', color: '#0C83FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    1
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Log In to Razorpay</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Sign in at <strong>dashboard.razorpay.com</strong>. Make sure you switch to <strong>Test Mode</strong> (orange badge) to test orders, or <strong>Live Mode</strong> (green badge) for real customer payments.
                </p>
              </div>

              {/* Step 2 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(12, 131, 253, 0.15)', color: '#0C83FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    2
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Generate Key ID &amp; Secret</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  In the bottom left menu, click <strong>Settings &gt; API Keys</strong> tab. Click <strong>Generate Key</strong>. Copy your <strong>Key ID</strong> (<code style={{ color: '#0C83FD' }}>rzp_test_...</code> or <code style={{ color: '#0C83FD' }}>rzp_live_...</code>) and <strong>Key Secret</strong> immediately into the Razorpay card above.
                </p>
              </div>

              {/* Step 3 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(12, 131, 253, 0.15)', color: '#0C83FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    3
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Configure Webhook</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Go to <strong>Settings &gt; Webhooks</strong> tab and click <strong>+ Add New Webhook</strong>. Paste the store Webhook URL: <code style={{ color: '#0C83FD' }}>{rzpWebhookUrl}</code>. Enter a secret and check events: <code style={{ color: '#0C83FD' }}>order.paid</code> and <code style={{ color: '#0C83FD' }}>payment.captured</code>. Paste the exact same secret into Razorpay Webhook Secret above.
                </p>
              </div>

              {/* Step 4 */}
              <div style={{ padding: '20px', borderRadius: 14, background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(12, 131, 253, 0.15)', color: '#0C83FD', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem' }}>
                    4
                  </div>
                  <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Test Connection &amp; Save</h4>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
                  Click the <strong>Test Connection</strong> button on the Razorpay card above. Razorpay will verify credentials against its Orders API. Click <strong>Save Changes</strong> to commit your configuration.
                </p>
              </div>
            </div>

            {/* ── Deep-Dive Razorpay Webhook Configuration Guide Card ── */}
            <div style={{
              padding: '24px 24px',
              borderRadius: 16,
              background: 'var(--bg-elevated)',
              border: '2px solid rgba(12, 131, 253, 0.35)',
              boxShadow: '0 8px 24px rgba(12, 131, 253, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
            }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, borderBottom: '1px solid var(--bg-border)', paddingBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, background: 'rgba(12, 131, 253, 0.15)',
                    color: '#0C83FD', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <BookOpen size={20} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                      Razorpay Webhook Setup: Complete Detailed Guide
                    </h3>
                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                      Follow these exact steps in your Razorpay Dashboard so orders get automatically verified and unlocked!
                    </p>
                  </div>
                </div>

                <a
                  href="https://dashboard.razorpay.com/app/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 14px', background: '#0C83FD', color: '#fff', borderRadius: 8,
                    fontSize: '0.78rem', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6,
                    boxShadow: '0 2px 8px rgba(12, 131, 253, 0.25)',
                  }}
                >
                  Direct Link to Webhooks <ExternalLink size={13} />
                </a>
              </div>

              {/* Webhook URL Copy Box */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(12, 131, 253, 0.06)',
                border: '1.5px solid rgba(12, 131, 253, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#0C83FD', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>
                    Your Store Webhook Endpoint URL
                  </div>
                  <code style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-primary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>
                    {rzpWebhookUrl}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(rzpWebhookUrl)
                    setCopiedRzpWebhook(true)
                    setTimeout(() => setCopiedRzpWebhook(false), 2500)
                  }}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 8,
                    background: copiedRzpWebhook ? '#10B981' : '#0C83FD',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    boxShadow: '0 2px 8px rgba(12, 131, 253, 0.3)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {copiedRzpWebhook ? (
                    <>
                      <Check size={15} /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={15} /> Copy Webhook URL
                    </>
                  )}
                </button>
              </div>

              {/* Step-by-Step Walkthrough */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Step 1 */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C83FD', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      1
                    </span>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Log In &amp; Switch to Live Mode (Important!)
                    </h5>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 30 }}>
                    Sign in to <a href="https://dashboard.razorpay.com" target="_blank" rel="noreferrer" style={{ color: '#0C83FD', fontWeight: 700 }}>Razorpay Dashboard</a>. Look at the top bar toggle switch. If you are taking real payments, ensure it says <strong>Live Mode (Green badge)</strong>. Webhooks created in Test Mode do NOT receive Live payment events!
                  </p>
                </div>

                {/* Step 2 */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C83FD', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      2
                    </span>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Navigate to Settings &gt; Webhooks
                    </h5>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 30 }}>
                    In the left navigation menu, click <strong>Account &amp; Settings</strong> (or the gear icon). Under the <strong>Website and app settings</strong> section, click <strong>Webhooks</strong>. Then click the blue <strong>+ Add New Webhook</strong> button in the top right corner.
                  </p>
                </div>

                {/* Step 3 */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C83FD', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      3
                    </span>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Paste Webhook URL &amp; Enter Secret
                    </h5>
                  </div>
                  <div style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 30 }}>
                    <p style={{ margin: '0 0 6px' }}>
                      • In the <strong>Webhook URL</strong> field: Paste <code style={{ color: '#0C83FD', fontWeight: 700 }}>{rzpWebhookUrl}</code>
                    </p>
                    <p style={{ margin: 0 }}>
                      • In the <strong>Secret</strong> field: Enter a secret string (e.g. <code style={{ color: '#0C83FD' }}>tvh_rzp_webhook_2026</code>). <strong>⚠️ CRITICAL:</strong> Enter this exact same secret into the <strong>Razorpay Webhook Secret</strong> field in the Razorpay card above and click <strong>Save Changes</strong>! Both secrets must match for HMAC signature verification.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C83FD', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      4
                    </span>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Select Required Active Events (Checkboxes)
                    </h5>
                  </div>
                  <div style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 30 }}>
                    <p style={{ margin: '0 0 6px' }}>In the <strong>Active Events</strong> checklist, search and check these 3 events:</p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: 6 }}>
                        <CheckCircle2 size={16} color="#10B981" />
                        <span style={{ fontWeight: 800, color: '#10B981', fontFamily: 'monospace', fontSize: '0.82rem' }}>payment.captured</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>— <strong>Required!</strong> Automatically marks order as PAID and unlocks instant customer download link.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(12, 131, 253, 0.08)', border: '1px solid rgba(12, 131, 253, 0.25)', borderRadius: 6 }}>
                        <CheckCircle2 size={16} color="#0C83FD" />
                        <span style={{ fontWeight: 800, color: '#0C83FD', fontFamily: 'monospace', fontSize: '0.82rem' }}>order.paid</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>— <strong>Required!</strong> Confirms Razorpay Order status settlement.</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', borderRadius: 6 }}>
                        <CheckCircle2 size={16} color="#F59E0B" />
                        <span style={{ fontWeight: 800, color: '#F59E0B', fontFamily: 'monospace', fontSize: '0.82rem' }}>payment.failed</span>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>— Recommended to track customer failed/dropped UPI transactions.</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 5 */}
                <div style={{ padding: '14px 16px', borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--bg-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: '#0C83FD', color: '#fff', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      5
                    </span>
                    <h5 style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Enter Alert Email &amp; Click Create Webhook
                    </h5>
                  </div>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: 30 }}>
                    Enter your email address in the <strong>Alert Email</strong> field so Razorpay notifies you if any webhook ever fails. Click <strong>Create Webhook</strong>. Your webhook will now display a green <strong>Active</strong> badge!
                  </p>
                </div>
              </div>

              {/* Troubleshooting Tips */}
              <div style={{
                padding: '14px 18px',
                borderRadius: 12,
                background: 'rgba(245, 158, 11, 0.06)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
              }}>
                <AlertTriangle size={18} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  <strong style={{ color: '#F59E0B' }}>Quick Troubleshooting Checklist:</strong>
                  <div style={{ marginTop: 4 }}>
                    • If customer payment succeeds but order shows "Pending", check if <strong>payment.captured</strong> event was enabled.<br />
                    • If Razorpay shows "Webhook Delivery Failed (401)", verify that the <strong>Secret</strong> entered in Razorpay exactly matches <strong>Razorpay Webhook Secret</strong> in our website settings.<br />
                    • Always confirm that if your store uses <strong>Live Key ID (rzp_live_...)</strong>, your webhook is configured in <strong>Razorpay Live Mode</strong>, not Test Mode.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Sticky Save Bar ── */}
      {hasUnsavedChanges && (
        <div style={{
          position: 'fixed',
          bottom: 24,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 32px)',
          maxWidth: 580,
          zIndex: 999,
        }}>
          <div style={{
            padding: '12px 18px',
            borderRadius: 14,
            background: 'var(--bg-surface)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1.5px solid #00A37A',
            boxShadow: '0 12px 36px rgba(0,0,0,0.35), 0 0 20px rgba(0, 163, 122, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            flexWrap: 'wrap',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <div style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: '#00A37A',
                boxShadow: '0 0 10px #00A37A',
              }} />
              <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                You have unsaved changes
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0, marginLeft: 'auto' }}>
              <button
                type="button"
                onClick={handleDiscard}
                title="Discard all changes and revert to saved settings"
                style={{
                  height: 36,
                  minHeight: 0,
                  maxHeight: 36,
                  padding: '0 14px',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated, rgba(255,255,255,0.06))',
                  border: '1px solid var(--bg-border, rgba(255,255,255,0.12))',
                  borderRadius: 8,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#EF4444'
                  e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.35)'
                  e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--text-secondary)'
                  e.currentTarget.style.borderColor = 'var(--bg-border, rgba(255,255,255,0.12))'
                  e.currentTarget.style.background = 'var(--bg-elevated, rgba(255,255,255,0.06))'
                }}
              >
                <RotateCcw size={13} />
                <span>Discard</span>
              </button>

              <button
                type="button"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                style={{
                  height: 36,
                  minHeight: 0,
                  maxHeight: 36,
                  padding: '0 16px',
                  background: 'linear-gradient(135deg, #00A37A, #0C83FD)',
                  color: '#FFFFFF',
                  borderRadius: 8,
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: saveMutation.isPending ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 4px 14px rgba(0, 163, 122, 0.35)',
                  opacity: saveMutation.isPending ? 0.75 : 1,
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!saveMutation.isPending) {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.boxShadow = '0 6px 18px rgba(0, 163, 122, 0.45)'
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 163, 122, 0.35)'
                }}
              >
                {saveMutation.isPending ? (
                  <>
                    <RefreshCw size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={14} />
                    <span>Save Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
