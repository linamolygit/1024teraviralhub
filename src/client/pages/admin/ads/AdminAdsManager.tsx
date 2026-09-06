// src/client/pages/admin/ads/AdminAdsManager.tsx — Modern Ads Manager & Monetization Command Center
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Layers, Globe, Layout, Flag, Sliders, ShieldAlert,
  Plus, Edit, Trash2, CheckCircle, RefreshCw, Zap, Lock,
  ExternalLink, Code, Sparkles, Check, Play, Pause, AlertCircle
} from 'lucide-react'
import { adminApi, type AdNetwork, type AdPlacement, type AdCampaign, type AdRules } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { NetworkLogo, NetworkBadge } from '../../../components/ads/NetworkLogos'
import { adminToast } from '../../../lib/admin-toast'

const PROVIDER_OPTIONS = [
  { id: 'monetag', name: 'Monetag', badge: 'High CPM Popunder & MultiTag' },
  { id: 'adsterra', name: 'Adsterra Network', badge: 'High CPM Banners & Direct Links' },
  { id: 'adsense', name: 'Google AdSense', badge: 'Standard Contextual Display' },
  { id: 'popads', name: 'PopAds Network', badge: 'Popunder & Pop-up Specialist' },
  { id: 'hilltopads', name: 'HilltopAds', badge: 'Direct Link & Video CPM' },
  { id: 'custom', name: 'Custom Network / Self-Hosted Script', badge: 'Direct HTML / JS Tag' },
]

export default function AdminAdsManager() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'overview' | 'networks' | 'placements' | 'non_buyer' | 'campaigns' | 'rules'>('overview')

  // Modals state
  const [isAddNetworkOpen, setIsAddNetworkOpen] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<AdNetwork | null>(null)

  const [isAddPlacementOpen, setIsAddPlacementOpen] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null)

  const [isAddCampaignOpen, setIsAddCampaignOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'network' | 'placement' | 'campaign'; id: number; name: string } | null>(null)

  // Network form state
  const [networkForm, setNetworkForm] = useState({
    name: '',
    provider_type: 'monetag',
    integration_type: 'banner' as 'banner' | 'native' | 'direct_link' | 'interstitial' | 'multi_tag' | 'popunder',
    status: 'active' as 'active' | 'paused' | 'disabled',
    config: '',
  })

  // Placement form state
  const [placementForm, setPlacementForm] = useState({
    name: '',
    placement_key: '',
    network_id: '' as string | number,
    ad_type: 'banner',
    status: 'active' as 'active' | 'paused' | 'disabled',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 3,
    custom_code: '',
  })

  // Campaign form state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    network_id: '' as string | number,
    placement_id: '' as string | number,
    status: 'active' as 'active' | 'paused' | 'archived',
    target_rule: 'low_intent' as 'all' | 'low_intent' | 'non_buyers',
    max_impressions_day: 1000,
  })

  // Non-buyer rules local state for editing
  const [nonBuyerForm, setNonBuyerForm] = useState<{
    enabled: boolean
    directLinkUrl: string
    triggerMode: string
    frequencyMinutes: number
    globalHeaderScript: string
    suppressOnCheckout: boolean
    productPageBackButton: boolean
  } | null>(null)

  // 1. Fetch Overview Data
  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-ads-overview'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.ads.overview(token!)
    },
  })

  // 2. Fetch Rules Data
  const { data: rulesData, refetch: refetchRules } = useQuery({
    queryKey: ['admin-ads-rules'],
    queryFn: async () => {
      const token = await getToken()
      const res = await adminApi.ads.rules.get(token!)
      if (res.rules && !nonBuyerForm) {
        setNonBuyerForm({
          enabled: res.rules.non_buyer_ads_enabled !== 'false',
          directLinkUrl: res.rules.non_buyer_direct_link_url || '',
          triggerMode: res.rules.non_buyer_trigger_mode || 'all',
          frequencyMinutes: parseInt(res.rules.non_buyer_frequency_minutes || '10', 10),
          globalHeaderScript: res.rules.global_header_script || '',
          suppressOnCheckout: res.rules.suppress_on_checkout !== 'false',
          productPageBackButton: res.rules.product_page_back_button_ad !== 'false',
        })
      }
      return res
    },
  })

  // Mutations
  const createNetwork = useMutation({
    mutationFn: async (payload: Partial<AdNetwork>) => {
      const token = await getToken()
      return adminApi.ads.networks.create(token!, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setIsAddNetworkOpen(false)
      setNetworkForm({ name: '', provider_type: 'monetag', integration_type: 'banner', status: 'active', config: '' })
      adminToast.success('Ad Network Connected', `${vars.name || 'Network'} has been connected successfully.`)
    },
    onError: (err: any) => {
      adminToast.error('Network Connection Failed', err?.message || 'Please check configuration.')
    },
  })

  const updateNetwork = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdNetwork> }) => {
      const token = await getToken()
      return adminApi.ads.networks.update(token!, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setEditingNetwork(null)
      adminToast.success('Network Updated', 'Ad network settings have been saved.')
    },
    onError: (err: any) => {
      adminToast.error('Update Failed', err?.message || 'Could not update network.')
    },
  })

  const createPlacement = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken()
      return adminApi.ads.placements.create(token!, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setIsAddPlacementOpen(false)
      setPlacementForm({
        name: '', placement_key: '', network_id: '', ad_type: 'banner',
        status: 'active', suppress_on_high_intent: true, suppress_on_checkout: true,
        frequency_cap_session: 3, custom_code: '',
      })
      adminToast.success('Ad Placement Created', `Slot "${vars.name}" is now active in storefront.`)
    },
    onError: (err: any) => {
      adminToast.error('Placement Failed', err?.message || 'Could not create placement.')
    },
  })

  const updatePlacement = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<AdPlacement> }) => {
      const token = await getToken()
      return adminApi.ads.placements.update(token!, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setEditingPlacement(null)
      adminToast.success('Placement Updated', 'Ad script snippet and slot settings updated.')
    },
    onError: (err: any) => {
      adminToast.error('Update Failed', err?.message || 'Could not update placement.')
    },
  })

  const createCampaign = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken()
      return adminApi.ads.campaigns.create(token!, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setIsAddCampaignOpen(false)
      setCampaignForm({
        name: '', network_id: '', placement_id: '',
        status: 'active', target_rule: 'low_intent', max_impressions_day: 1000,
      })
      adminToast.success('Campaign Created', `Target cap set to ${vars.max_impressions_day} impressions/day.`)
    },
    onError: (err: any) => {
      adminToast.error('Campaign Failed', err?.message || 'Could not create campaign.')
    },
  })

  const deleteItem = useMutation({
    mutationFn: async ({ type, id }: { type: 'network' | 'placement' | 'campaign'; id: number }) => {
      const token = await getToken()
      if (type === 'network') return adminApi.ads.networks.delete(token!, id)
      if (type === 'placement') return adminApi.ads.placements.delete(token!, id)
      if (type === 'campaign') return adminApi.ads.campaigns.delete(token!, id)
    },
    onSuccess: () => {
      const name = deleteTarget?.name || 'Item'
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setDeleteTarget(null)
      adminToast.success('Deleted Successfully', `${name} was removed from database.`)
    },
    onError: (err: any) => {
      adminToast.error('Delete Failed', err?.message || 'Item could not be deleted.')
    },
  })

  const saveNonBuyerRules = useMutation({
    mutationFn: async () => {
      if (!nonBuyerForm) return
      const token = await getToken()
      return adminApi.ads.rules.update(token!, {
        non_buyer_ads_enabled: String(nonBuyerForm.enabled),
        non_buyer_direct_link_url: nonBuyerForm.directLinkUrl.trim(),
        non_buyer_trigger_mode: nonBuyerForm.triggerMode,
        non_buyer_frequency_minutes: String(nonBuyerForm.frequencyMinutes),
        global_header_script: nonBuyerForm.globalHeaderScript.trim(),
        suppress_on_checkout: String(nonBuyerForm.suppressOnCheckout),
        product_page_back_button_ad: String(nonBuyerForm.productPageBackButton),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-rules'] })
      adminToast.success('Monetization Rules Saved', 'Product Page Back-Button and Direct Link rules are now active!')
    },
    onError: (err: any) => {
      adminToast.error('Save Failed', err?.message || 'Could not save monetization settings.')
    },
  })

  if (isLoading) return <LoadingSpinner />

  const networks: AdNetwork[] = data?.networks || []
  const placements: AdPlacement[] = data?.placements || []
  const campaigns: AdCampaign[] = data?.campaigns || []
  const activeNetworksCount = networks.filter((n) => n.status === 'active').length
  const activePlacementsCount = placements.filter((p) => p.status === 'active').length

  // Quick Preset Handlers
  const handleQuickPreset = (preset: 'monetag' | 'adsterra' | 'adsense') => {
    if (preset === 'monetag') {
      setNetworkForm({
        name: 'Monetag',
        provider_type: 'monetag',
        integration_type: 'multi_tag',
        status: 'active',
        config: '',
      })
    } else if (preset === 'adsterra') {
      setNetworkForm({
        name: 'Adsterra',
        provider_type: 'adsterra',
        integration_type: 'banner',
        status: 'active',
        config: '',
      })
    } else {
      setNetworkForm({
        name: 'Google AdSense',
        provider_type: 'adsense',
        integration_type: 'banner',
        status: 'active',
        config: '',
      })
    }
    setIsAddNetworkOpen(true)
  }

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', paddingBottom: '60px' }}>
      {/* ── Top Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
              Ads & Monetization Command Center
            </h1>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: 6,
                background: 'rgba(0, 229, 255, 0.12)',
                color: '#00E5FF',
                border: '1px solid rgba(0, 229, 255, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Monetag Ready
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Manage ad networks, custom banner placements, and automated <strong>Non-Buyer Monetization</strong>.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
          </button>
          <button
            type="button"
            onClick={() => handleQuickPreset('monetag')}
            style={{
              fontSize: '0.8125rem',
              padding: '9px 14px',
              borderRadius: 8,
              border: '1px solid rgba(0, 229, 255, 0.4)',
              background: 'rgba(0, 229, 255, 0.1)',
              color: '#00E5FF',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <NetworkLogo provider="monetag" size={18} /> + Add Monetag
          </button>
          <button
            type="button"
            onClick={() => setIsAddPlacementOpen(true)}
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Plus size={15} /> + New Ad Placement
          </button>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Connected Networks</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {activeNetworksCount}
            </span>
            <div style={{ display: 'flex', gap: 4 }}>
              {networks.slice(0, 3).map((n) => (
                <NetworkLogo key={n.id} provider={n.provider_type} size={24} />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            {networks.length} total configured
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Active Ad Placements</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--brand-purple-light)' }}>
            {activePlacementsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Homepage, Product, & Blog slots
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Non-Buyer Trigger Engine</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.8rem',
                fontWeight: 800,
                background: nonBuyerForm?.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: nonBuyerForm?.enabled ? '#10B981' : '#EF4444',
                border: `1px solid ${nonBuyerForm?.enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {nonBuyerForm?.enabled ? '● ACTIVE (MONETIZING)' : '○ PAUSED'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>
            {nonBuyerForm?.directLinkUrl ? 'SmartLink Connected' : 'Direct Link not set yet'}
          </div>
        </div>

        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Buyer Checkout Protection</div>
          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <ShieldAlert size={18} /> 100% Zero Friction
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Active buyers never see ads
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', borderBottom: '1px solid var(--bg-border)', paddingBottom: 8 }}>
        {[
          { key: 'overview', label: 'Overview', icon: <Layers size={16} /> },
          { key: 'non_buyer', label: 'Non-Buyer Monetization Engine', icon: <Zap size={16} color="#FFD200" /> },
          { key: 'networks', label: 'Ad Networks (Monetag & More)', icon: <Globe size={16} /> },
          { key: 'placements', label: 'Ad Placements & Slots', icon: <Layout size={16} /> },
          { key: 'campaigns', label: 'Targeted Campaigns', icon: <Flag size={16} /> },
          { key: 'rules', label: 'Frequency & Safety Rules', icon: <Sliders size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}
            style={{ fontSize: '0.825rem', padding: '9px 15px', display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap' }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick Preset Banner */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
              border: '1px solid rgba(0, 229, 255, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <Sparkles size={18} color="#00E5FF" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Monetize Non-Purchasing Visitors Automatically
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Users who click "Buy Now" and pay get a 100% clean experience. For visitors who browse, check out previews, or cancel checkout without buying, the <strong>Non-Buyer Monetization Engine</strong> automatically triggers your Monetag / Adsterra Direct Link or Popunder.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('non_buyer')}
              className="btn-primary"
              style={{ fontSize: '0.85rem', padding: '10px 18px', display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              Configure Non-Buyer Ads <Zap size={15} />
            </button>
          </div>

          {/* Connected Networks and Placements Preview Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: 20 }}>
            {/* Connected Networks Card */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Active Ad Networks</h3>
                <button
                  type="button"
                  onClick={() => setIsAddNetworkOpen(true)}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  + Add Network
                </button>
              </div>

              {networks.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {networks.map((n) => (
                    <div
                      key={n.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 10,
                        border: '1px solid var(--bg-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <NetworkBadge provider={n.provider_type} displayName={n.name} />
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className={`badge ${n.status === 'active' ? 'badge-success' : 'badge-amber'}`}
                          style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                        >
                          {n.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingNetwork(n)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Edit network"
                        >
                          <Edit size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No networks connected yet. Connect Monetag or Adsterra to start!
                </div>
              )}
            </div>

            {/* Configured Placements Card */}
            <div className="glass-card" style={{ padding: '22px', borderRadius: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Ad Placements</h3>
                <button
                  type="button"
                  onClick={() => setIsAddPlacementOpen(true)}
                  className="btn-ghost"
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  + Add Placement
                </button>
              </div>

              {placements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {placements.map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 10,
                        border: '1px solid var(--bg-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{p.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          Slot: {p.placement_key}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-amber'}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {p.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingPlacement(p)}
                          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                          title="Edit placement code"
                        >
                          <Code size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No placement slots active. Add slots for Homepage or Product details!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: NON-BUYER MONETIZATION ENGINE ── */}
      {activeTab === 'non_buyer' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '28px', borderRadius: 16, border: '1px solid var(--bg-border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'rgba(255, 210, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Zap size={20} color="#FFD200" />
              </div>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>
                  Non-Buyer Monetization Engine
                </h2>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Targeted specifically for visitors who browse or abandon checkout without buying.
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.7, margin: '12px 0 24px' }}>
              When enabled, any visitor who explores products, clicks previews, or leaves checkout without completing a purchase will trigger your monetization ad (Monetag SmartLink / Direct Link / Popunder). Verified buyers who successfully pay are automatically whitelisted so they never see intrusive ads.
            </p>

            {nonBuyerForm ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
                {/* Enable Toggle Switch */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 12,
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                      Enable Non-Buyer Monetization
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Automatically monetizes non-paying visitors via Direct Link or Popunder.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setNonBuyerForm({ ...nonBuyerForm, enabled: !nonBuyerForm.enabled })}
                    style={{
                      padding: '8px 18px',
                      borderRadius: 20,
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: nonBuyerForm.enabled ? '#10B981' : 'var(--bg-border)',
                      color: nonBuyerForm.enabled ? '#FFFFFF' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {nonBuyerForm.enabled ? '✓ ACTIVE' : '○ DISABLED'}
                  </button>
                </div>

                {/* SPECIAL: Product Page Back-Button Direct Link Trigger */}
                <div
                  style={{
                    padding: '18px 20px',
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, rgba(164, 214, 94, 0.08) 0%, rgba(164, 214, 94, 0.02) 100%)',
                    border: '1px solid rgba(164, 214, 94, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ maxWidth: '80%' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 800, fontSize: '0.975rem', color: '#A4D65E' }}>
                        🔙 Product Page Back-Button Direct Link Trigger
                      </span>
                      <span
                        style={{
                          fontSize: '0.68rem',
                          padding: '2px 8px',
                          borderRadius: 4,
                          background: 'rgba(164, 214, 94, 0.18)',
                          color: '#A4D65E',
                          fontWeight: 800,
                          border: '1px solid rgba(164, 214, 94, 0.35)',
                        }}
                      >
                        ⚡ 100% BOUNCE CAPTURE
                      </span>
                    </div>
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>
                      When a visitor lands on any product page and hits the <strong>Back button</strong> (browser back, mobile back gesture, or hardware key) without purchasing, immediately launch your Monetag / Adsterra Direct Link in a new tab or redirect.
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setNonBuyerForm({ ...nonBuyerForm, productPageBackButton: !nonBuyerForm.productPageBackButton })
                    }
                    style={{
                      padding: '8px 18px',
                      borderRadius: 20,
                      fontWeight: 800,
                      fontSize: '0.8125rem',
                      border: 'none',
                      cursor: 'pointer',
                      background: nonBuyerForm.productPageBackButton ? '#A4D65E' : 'var(--bg-border)',
                      color: nonBuyerForm.productPageBackButton ? '#08140B' : 'var(--text-muted)',
                      transition: 'all 0.2s',
                    }}
                  >
                    {nonBuyerForm.productPageBackButton ? '✓ ARMED & ACTIVE' : '○ DISABLED'}
                  </button>
                </div>

                {/* Direct Link / SmartLink URL Input */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                    Monetag / Adsterra Direct Link (SmartLink URL) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    placeholder="e.g. https://monetag.com/direct-link or https://otieupt.com/..."
                    value={nonBuyerForm.directLinkUrl}
                    onChange={(e) => setNonBuyerForm({ ...nonBuyerForm, directLinkUrl: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Get this from your Monetag dashboard (Direct Link format) or Adsterra SmartLink.
                    </span>
                    {nonBuyerForm.directLinkUrl && (
                      <button
                        type="button"
                        onClick={() => window.open(nonBuyerForm.directLinkUrl, '_blank')}
                        className="btn-ghost"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                      >
                        <ExternalLink size={12} /> Test Link
                      </button>
                    )}
                  </div>
                </div>

                {/* Trigger Mode & Frequency Cap Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                      Trigger Condition
                    </label>
                    <select
                      className="input-field"
                      value={nonBuyerForm.triggerMode}
                      onChange={(e) => setNonBuyerForm({ ...nonBuyerForm, triggerMode: e.target.value })}
                    >
                      <option value="all">All Non-Buyer Traffic (Checkout Abandonment + Browse Clicks)</option>
                      <option value="checkout_abandonment">Checkout Abandonment Only (When user exits without paying)</option>
                      <option value="browse_interaction">Browse Clicks Only (When exploring products without buying)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                      Frequency Cap (Minutes between ads)
                    </label>
                    <select
                      className="input-field"
                      value={nonBuyerForm.frequencyMinutes}
                      onChange={(e) => setNonBuyerForm({ ...nonBuyerForm, frequencyMinutes: parseInt(e.target.value, 10) })}
                    >
                      <option value={3}>Every 3 Minutes (High Aggression)</option>
                      <option value={5}>Every 5 Minutes (Recommended for Viral)</option>
                      <option value={10}>Every 10 Minutes (Balanced)</option>
                      <option value={15}>Every 15 Minutes (Safe & Gentle)</option>
                      <option value={30}>Every 30 Minutes (Very Conservative)</option>
                    </select>
                  </div>
                </div>

                {/* Global Head/Body Script (e.g. Monetag Multi-Tag / In-Page Push) */}
                <div>
                  <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                    Global Ad Network Script (Monetag Multi-Tag or Adsterra Popunder Script)
                  </label>
                  <textarea
                    className="input-field"
                    rows={4}
                    placeholder="<!-- Paste your Monetag Multi-Tag or Popunder script here -->&#10;<script src='https://alwingulla.com/...'>&#10;</script>"
                    value={nonBuyerForm.globalHeaderScript}
                    onChange={(e) => setNonBuyerForm({ ...nonBuyerForm, globalHeaderScript: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                  />
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    This script tag executes automatically on public storefront pages (except checkout and admin).
                  </span>
                </div>

                {/* Save Button */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                  <button
                    type="button"
                    onClick={() => saveNonBuyerRules.mutate()}
                    disabled={saveNonBuyerRules.isPending}
                    className="btn-primary"
                    style={{ fontSize: '0.9rem', padding: '12px 28px', fontWeight: 800 }}
                  >
                    {saveNonBuyerRules.isPending ? 'Saving Settings...' : 'Save Non-Buyer Monetization'}
                  </button>
                </div>
              </div>
            ) : (
              <LoadingSpinner />
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: AD NETWORKS ── */}
      {activeTab === 'networks' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Connected Ad Networks</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Officially supports Monetag, Adsterra, Google AdSense, PopAds, and custom tags.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddNetworkOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Add Network
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 18 }}>
            {networks.map((n) => (
              <div key={n.id} className="glass-card" style={{ padding: '22px', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <NetworkLogo provider={n.provider_type} size={36} />
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0 }}>{n.name}</h3>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {n.provider_type === 'monetag' || n.provider_type === 'propeller'
                          ? 'Monetag'
                          : n.provider_type}
                      </div>
                    </div>
                  </div>

                  <span className={`badge ${n.status === 'active' ? 'badge-success' : 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                    {n.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: '0.825rem', marginBottom: 18 }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Format:</span>{' '}
                    <strong style={{ textTransform: 'capitalize' }}>{n.integration_type.replace('_', ' ')}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Added On:</span>{' '}
                    {new Date(n.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, borderTop: '1px solid var(--bg-border)', paddingTop: 14 }}>
                  <button
                    type="button"
                    onClick={() => setEditingNetwork(n)}
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'network', id: n.id, name: n.name })}
                    className="btn-ghost"
                    style={{ fontSize: '0.8rem', padding: '6px 12px', color: 'var(--error)', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}

            {!networks.length && (
              <div className="empty-state" style={{ padding: '48px 20px', textAlign: 'center', gridColumn: '1 / -1' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>🌐</div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 8 }}>No Ad Networks Connected</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
                  Click below to quickly connect Monetag or Adsterra to start monetizing traffic!
                </p>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <button type="button" onClick={() => handleQuickPreset('monetag')} className="btn-primary">
                    <NetworkLogo provider="monetag" size={18} /> Connect Monetag
                  </button>
                  <button type="button" onClick={() => handleQuickPreset('adsterra')} className="btn-ghost">
                    <NetworkLogo provider="adsterra" size={18} /> Connect Adsterra
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 4: AD PLACEMENTS & CODE INJECTION ── */}
      {activeTab === 'placements' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Active Storefront Ad Slots</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Banners and native recommendation widgets placed dynamically in high-CTR positions.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddPlacementOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> + Add Placement
            </button>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Slot Name</th>
                    <th>Placement Key</th>
                    <th>Network</th>
                    <th>Ad Script / Snippet</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {placements.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 700 }}>{p.name}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--brand-purple-light)' }}>
                        {p.placement_key}
                      </td>
                      <td>
                        <NetworkBadge provider={p.network_provider || 'custom'} displayName={p.network_name || 'Custom'} />
                      </td>
                      <td>
                        {p.custom_code ? (
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontFamily: 'monospace',
                              padding: '2px 8px',
                              borderRadius: 4,
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10B981',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              fontWeight: 700,
                            }}
                          >
                            ✓ Script Tag Active ({p.custom_code.length} chars)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No code pasted</span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${p.status === 'active' ? 'badge-success' : 'badge-amber'}`} style={{ textTransform: 'capitalize' }}>
                          {p.status}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            type="button"
                            onClick={() => setEditingPlacement(p)}
                            style={{
                              padding: '6px 10px',
                              background: 'var(--bg-elevated)',
                              border: '1px solid var(--bg-border)',
                              borderRadius: 6,
                              color: 'var(--text-primary)',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.75rem',
                            }}
                            title="Edit Ad Snippet Code"
                          >
                            <Code size={13} /> Edit Code
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ type: 'placement', id: p.id, name: p.name })}
                            style={{
                              padding: '6px 8px',
                              background: 'rgba(239,68,68,0.1)',
                              border: '1px solid rgba(239,68,68,0.2)',
                              borderRadius: 6,
                              color: 'var(--error)',
                              cursor: 'pointer',
                            }}
                            title="Delete"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!placements.length && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No ad placements configured yet. Click "+ Add Placement" to create slots for Homepage or Product pages.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 5: CAMPAIGNS ── */}
      {activeTab === 'campaigns' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>Targeted Ad Campaigns</h2>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Control daily impression caps and audience targeting.
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsAddCampaignOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '9px 16px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <Plus size={15} /> Create Campaign
            </button>
          </div>

          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Campaign Name</th>
                    <th>Network</th>
                    <th>Placement</th>
                    <th>Target Rule</th>
                    <th>Daily Cap</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: 700 }}>{c.name}</td>
                      <td>{c.network_name || 'All Connected'}</td>
                      <td>{c.placement_name || 'All Slots'}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.72rem' }}>
                          {c.target_rule === 'low_intent' ? 'Low Intent Visitors' : 'All Visitors'}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{c.max_impressions_day} / day</td>
                      <td>
                        <span className={`badge ${c.status === 'active' ? 'badge-success' : 'badge-amber'}`}>
                          {c.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ type: 'campaign', id: c.id, name: c.name })}
                          style={{
                            padding: '6px 8px',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.2)',
                            borderRadius: 6,
                            color: 'var(--error)',
                            cursor: 'pointer',
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {!campaigns.length && (
              <div style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                No campaigns created yet. Click "+ Create Campaign" to set specific caps.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 6: RULES & SAFETY ── */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: 14 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={18} color="var(--brand-purple-light)" /> Checkout & High-Intent Conversion Guard
            </h3>
            <div style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
              1024 Tera Viral Hub uses a dual-engine architecture:
              <ul style={{ marginTop: 10, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <li>✅ <strong>Zero Ad Interference in Checkout:</strong> When a user enters the payment flow or completes a purchase, all ads are disabled to prevent lost sales.</li>
                <li>✅ <strong>Non-Buyer Monetization:</strong> Only visitors who do not purchase are served Monetag / Adsterra direct links or banners.</li>
                <li>✅ <strong>Frequency Capping:</strong> Visitors are not bombarded with spam; ads respect the cooldown timer set in the Non-Buyer tab.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Ad Network ── */}
      {(isAddNetworkOpen || editingNetwork) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <NetworkLogo provider={editingNetwork ? editingNetwork.provider_type : networkForm.provider_type} size={28} />
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                {editingNetwork ? 'Edit Ad Network' : 'Add Ad Network'}
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Network Provider
                </label>
                <select
                  className="input-field"
                  value={editingNetwork ? editingNetwork.provider_type : networkForm.provider_type}
                  onChange={(e) => {
                    const val = e.target.value
                    if (editingNetwork) {
                      setEditingNetwork({ ...editingNetwork, provider_type: val })
                    } else {
                      const sel = PROVIDER_OPTIONS.find((p) => p.id === val)
                      setNetworkForm({
                        ...networkForm,
                        provider_type: val,
                        name: networkForm.name || (sel ? (val === 'monetag' ? 'Monetag' : sel.name) : ''),
                      })
                    }
                  }}
                >
                  {PROVIDER_OPTIONS.map((opt) => (
                    <option key={opt.id} value={opt.id}>
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Display Name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Monetag, Adsterra, Google AdSense"
                  value={editingNetwork ? editingNetwork.name : networkForm.name}
                  onChange={(e) => {
                    if (editingNetwork) setEditingNetwork({ ...editingNetwork, name: e.target.value })
                    else setNetworkForm({ ...networkForm, name: e.target.value })
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Integration Format
                </label>
                <select
                  className="input-field"
                  value={editingNetwork ? editingNetwork.integration_type : networkForm.integration_type}
                  onChange={(e) => {
                    const val = e.target.value as any
                    if (editingNetwork) setEditingNetwork({ ...editingNetwork, integration_type: val })
                    else setNetworkForm({ ...networkForm, integration_type: val })
                  }}
                >
                  <option value="banner">Display Banner (300x250 / 728x90)</option>
                  <option value="multi_tag">Monetag Multi-Tag (Smart Universal Tag)</option>
                  <option value="direct_link">Direct Link / SmartLink</option>
                  <option value="popunder">On-Click Popunder</option>
                  <option value="native">Native Recommendation Widget</option>
                  <option value="interstitial">Interstitial Overlay</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Status
                </label>
                <select
                  className="input-field"
                  value={editingNetwork ? editingNetwork.status : networkForm.status}
                  onChange={(e) => {
                    const val = e.target.value as any
                    if (editingNetwork) setEditingNetwork({ ...editingNetwork, status: val })
                    else setNetworkForm({ ...networkForm, status: val })
                  }}
                >
                  <option value="active">Active</option>
                  <option value="paused">Paused</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddNetworkOpen(false)
                    setEditingNetwork(null)
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingNetwork) {
                      updateNetwork.mutate({ id: editingNetwork.id, data: editingNetwork })
                    } else {
                      createNetwork.mutate(networkForm)
                    }
                  }}
                  disabled={
                    editingNetwork
                      ? !editingNetwork.name || updateNetwork.isPending
                      : !networkForm.name || createNetwork.isPending
                  }
                  className="btn-primary"
                >
                  {createNetwork.isPending || updateNetwork.isPending ? 'Saving...' : 'Save Network'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add / Edit Ad Placement (With Script Code Area) ── */}
      {(isAddPlacementOpen || editingPlacement) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 540, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 16 }}>
              {editingPlacement ? 'Edit Ad Placement Snippet' : 'Add Ad Placement'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Placement Name
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Homepage Mid Banner, Product Details Banner"
                  value={editingPlacement ? editingPlacement.name : placementForm.name}
                  onChange={(e) => {
                    if (editingPlacement) setEditingPlacement({ ...editingPlacement, name: e.target.value })
                    else setPlacementForm({ ...placementForm, name: e.target.value })
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Placement Key (Unique slot identifier used in code)
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. home_banner_mid, product_details_banner"
                  value={editingPlacement ? editingPlacement.placement_key : placementForm.placement_key}
                  disabled={Boolean(editingPlacement)}
                  onChange={(e) =>
                    setPlacementForm({
                      ...placementForm,
                      placement_key: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                    })
                  }
                  style={{ fontFamily: 'monospace' }}
                />
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Supported default keys: <code style={{ color: '#00E5FF' }}>home_banner_mid</code>, <code style={{ color: '#00E5FF' }}>product_details_banner</code>, <code style={{ color: '#00E5FF' }}>blog_article_banner</code>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Assign Ad Network
                </label>
                <select
                  className="input-field"
                  value={
                    editingPlacement
                      ? editingPlacement.network_id ?? ''
                      : placementForm.network_id
                  }
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value, 10) : null
                    if (editingPlacement) setEditingPlacement({ ...editingPlacement, network_id: val })
                    else setPlacementForm({ ...placementForm, network_id: val || '' })
                  }}
                >
                  <option value="">-- Custom / Direct Script --</option>
                  {networks.map((n) => (
                    <option key={n.id} value={n.id}>
                      {n.name} ({n.provider_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Real Raw Script Code Editor */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Ad Script Code / HTML Tag Snippet
                  </label>
                  <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>Supports &lt;script&gt; tags</span>
                </div>
                <textarea
                  className="input-field"
                  rows={5}
                  placeholder="<!-- Paste your Monetag banner tag, Adsterra code, or AdSense ins tag here -->&#10;<script type='text/javascript'>&#10;  atOptions = { 'key' : '...', 'format' : 'iframe' };&#10;</script>"
                  value={editingPlacement ? editingPlacement.custom_code || '' : placementForm.custom_code}
                  onChange={(e) => {
                    if (editingPlacement) setEditingPlacement({ ...editingPlacement, custom_code: e.target.value })
                    else setPlacementForm({ ...placementForm, custom_code: e.target.value })
                  }}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Status
                </label>
                <select
                  className="input-field"
                  value={editingPlacement ? editingPlacement.status : placementForm.status}
                  onChange={(e) => {
                    const val = e.target.value as any
                    if (editingPlacement) setEditingPlacement({ ...editingPlacement, status: val })
                    else setPlacementForm({ ...placementForm, status: val })
                  }}
                >
                  <option value="active">Active (Visible)</option>
                  <option value="paused">Paused (Hidden)</option>
                  <option value="disabled">Disabled</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddPlacementOpen(false)
                    setEditingPlacement(null)
                  }}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editingPlacement) {
                      updatePlacement.mutate({ id: editingPlacement.id, data: editingPlacement })
                    } else {
                      createPlacement.mutate(placementForm)
                    }
                  }}
                  disabled={
                    editingPlacement
                      ? !editingPlacement.name || updatePlacement.isPending
                      : !placementForm.name || !placementForm.placement_key || createPlacement.isPending
                  }
                  className="btn-primary"
                >
                  {createPlacement.isPending || updatePlacement.isPending ? 'Saving...' : 'Save Placement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Create Campaign ── */}
      {isAddCampaignOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 16 }}>Create Ad Campaign</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Campaign Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. Monetag Fall Blitz"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Daily Cap</label>
                <input
                  type="number"
                  className="input-field"
                  value={campaignForm.max_impressions_day}
                  onChange={(e) => setCampaignForm({ ...campaignForm, max_impressions_day: parseInt(e.target.value, 10) || 1000 })}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                <button type="button" onClick={() => setIsAddCampaignOpen(false)} className="btn-ghost">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => createCampaign.mutate(campaignForm)}
                  disabled={!campaignForm.name || createCampaign.isPending}
                  className="btn-primary"
                >
                  {createCampaign.isPending ? 'Saving...' : 'Create Campaign'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 300, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 420, width: '100%' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.2rem', marginBottom: 8, color: 'var(--error)' }}>
              Delete {deleteTarget.type}?
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 20 }}>
              Are you sure you want to delete <strong>"{deleteTarget.name}"</strong>? This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteItem.mutate({ type: deleteTarget.type, id: deleteTarget.id })}
                disabled={deleteItem.isPending}
                style={{
                  background: 'var(--error)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 18px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {deleteItem.isPending ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
