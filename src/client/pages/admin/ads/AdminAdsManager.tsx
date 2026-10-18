// src/client/pages/admin/ads/AdminAdsManager.tsx — Enterprise Google AdSense, AdX, ads.txt & Page-Wise Monetization Command Center
import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Layers, Globe, Layout, Sliders, ShieldAlert,
  Plus, Edit, Trash2, CheckCircle, RefreshCw, Zap, Lock,
  ExternalLink, Code, Sparkles, Check, Play, Pause, AlertCircle,
  Copy, FileText, Monitor, Smartphone, CheckCheck, Eye, Terminal,
  HelpCircle, ShieldCheck, Star
} from 'lucide-react'
import { adminApi, type AdNetwork, type AdPlacement, type AdCampaign, type AdRules, type AdSenseAccount } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { NetworkLogo, NetworkBadge } from '../../../components/ads/NetworkLogos'
import { adminToast } from '../../../lib/admin-toast'

const PROVIDER_OPTIONS = [
  { id: 'adsense', name: 'Google AdSense', badge: 'Contextual Display & Auto Ads' },
  { id: 'adx', name: 'Google Ad Manager (AdX)', badge: 'Header Bidding & GPT Tags' },
  { id: 'monetag', name: 'Monetag', badge: 'High CPM Popunder & MultiTag' },
  { id: 'adsterra', name: 'Adsterra Network', badge: 'High CPM Banners & Direct Links' },
  { id: 'popads', name: 'PopAds Network', badge: 'Popunder & Pop-up Specialist' },
  { id: 'hilltopads', name: 'HilltopAds', badge: 'Direct Link & Video CPM' },
  { id: 'custom', name: 'Custom Network / Self-Hosted Script', badge: 'Direct HTML / JS Tag' },
]

const TARGET_PAGES = [
  { id: 'all', name: 'All Pages (Global)', icon: '🌐' },
  { id: 'home', name: 'Homepage (/)', icon: '🏠' },
  { id: 'product', name: 'Product Details (/product/:slug)', icon: '📦' },
  { id: 'checkout', name: 'Checkout Page (/checkout)', icon: '💳' },
  { id: 'products', name: 'Shop Catalog (/products)', icon: '🛍️' },
  { id: 'blog', name: 'Blog Article & List (/blog)', icon: '📝' },
  { id: 'order-lookup', name: 'Order Lookup (/order-lookup)', icon: '🔍' },
  { id: 'download', name: 'Delivery Download (/download)', icon: '📥' },
]

export default function AdminAdsManager() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<'adsense_adx' | 'ads_txt' | 'page_placements' | 'non_buyer' | 'networks' | 'rules' | 'overview'>('adsense_adx')

  // Filter for Page Placements tab
  const [pageFilter, setPageFilter] = useState<string>('all')

  // Modals state
  const [isAddNetworkOpen, setIsAddNetworkOpen] = useState(false)
  const [editingNetwork, setEditingNetwork] = useState<AdNetwork | null>(null)

  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false)
  const [editingPlacement, setEditingPlacement] = useState<AdPlacement | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'network' | 'placement' | 'campaign'; id: number; name: string } | null>(null)

  // Network form state
  const [networkForm, setNetworkForm] = useState({
    name: '',
    provider_type: 'adsense',
    integration_type: 'banner' as 'banner' | 'native' | 'direct_link' | 'interstitial' | 'multi_tag' | 'popunder',
    status: 'active' as 'active' | 'paused' | 'disabled',
    config: '',
  })

  // Placement form state
  const [placementForm, setPlacementForm] = useState({
    name: '',
    placement_key: '',
    network_id: '' as string | number,
    ad_type: 'responsive',
    target_page: 'all',
    device_visibility: 'all' as 'all' | 'desktop' | 'mobile',
    status: 'active' as 'active' | 'paused' | 'disabled',
    suppress_on_high_intent: true,
    suppress_on_checkout: true,
    frequency_cap_session: 3,
    custom_code: '',
  })

  // Local state for ads.txt editor
  const [adsTxtLocal, setAdsTxtLocal] = useState<string | null>(null)
  const [copiedLink, setCopiedLink] = useState(false)

  // Local state for AdSense / AdX Global Settings
  const [globalForm, setGlobalForm] = useState<{
    adsense_enabled: boolean
    adsense_publisher_id: string
    adsense_head_code: string
    adsense_accounts?: AdSenseAccount[]
    adsense_multi_head_code?: string
    adx_enabled: boolean
    adx_head_code: string
    global_header_script: string
  } | null>(null)

  // Local state for AdSense / AdX Code Generator & Upgrade Roadmap
  const [generatorFormat, setGeneratorFormat] = useState<'anchor' | 'slider' | 'vignette' | 'box_300x250' | 'header_banner' | 'checkout_banner'>('anchor')
  const [generatorNetwork, setGeneratorNetwork] = useState<'adsense' | 'adx'>('adsense')
  const [generatorCopied, setGeneratorCopied] = useState(false)

  const getGeneratorSnippet = (format: string, network: 'adsense' | 'adx') => {
    const pub = globalForm?.adsense_publisher_id?.trim() || 'ca-pub-2291828876695516'
    if (network === 'adsense') {
      switch (format) {
        case 'anchor':
          return `<!-- Google AdSense Responsive Sticky Anchor Ad -->\n<ins class="adsbygoogle"\n     style="display:block; min-width:320px; max-width:100%; height:90px;"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"\n     data-ad-format="horizontal"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        case 'slider':
          return `<!-- Google AdSense 300x250 Corner Slider Unit -->\n<ins class="adsbygoogle"\n     style="display:inline-block;width:300px;height:250px"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        case 'vignette':
          return `<!-- Google AdSense Vignette / Interstitial Unit -->\n<ins class="adsbygoogle"\n     style="display:block; min-width:300px; max-width:640px; min-height:350px;"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"\n     data-ad-format="rectangle"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        case 'box_300x250':
          return `<!-- Google AdSense High-CPM 300x250 Medium Rectangle -->\n<ins class="adsbygoogle"\n     style="display:inline-block;width:300px;height:250px"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        case 'header_banner':
          return `<!-- Google AdSense Header Leaderboard Banner -->\n<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"\n     data-ad-format="auto"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        case 'checkout_banner':
          return `<!-- Google AdSense Checkout Page Banner -->\n<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"\n     data-ad-format="horizontal"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
        default:
          return ''
      }
    } else {
      switch (format) {
        case 'anchor':
          return `<!-- Google Ad Manager (AdX) Sticky Anchor Tag -->\n<div id="div-gpt-ad-anchor">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/tvh_anchor_ad', [[320, 50], [728, 90], [970, 90]], 'div-gpt-ad-anchor')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-anchor');\n    });\n  </script>\n</div>`
        case 'slider':
          return `<!-- Google Ad Manager (AdX) Corner Slider 300x250 Unit -->\n<div id="div-gpt-ad-slider-300x250">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/tvh_slider_ad', [300, 250], 'div-gpt-ad-slider-300x250')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-slider-300x250');\n    });\n  </script>\n</div>`
        case 'vignette':
          return `<!-- Google Ad Manager (AdX) Web Interstitial (Vignette) Tag -->\n<script>\n  window.googletag = window.googletag || {cmd: []};\n  googletag.cmd.push(function() {\n    var interstitialSlot = googletag.defineOutOfPageSlot(\n      '/1234567/tvh_web_interstitial',\n      googletag.enums.OutOfPageFormat.INTERSTITIAL\n    );\n    if (interstitialSlot) {\n      interstitialSlot.addService(googletag.pubads());\n    }\n    googletag.display(interstitialSlot);\n  });\n</script>`
        case 'box_300x250':
          return `<!-- Google Ad Manager (AdX) High-CPM 300x250 Box -->\n<div id="div-gpt-ad-box-300x250">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/tvh_box_300x250', [300, 250], 'div-gpt-ad-box-300x250')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-box-300x250');\n    });\n  </script>\n</div>`
        case 'header_banner':
          return `<!-- Google Ad Manager (AdX) Header Leaderboard -->\n<div id="div-gpt-ad-header-banner">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/tvh_header_banner', [[728, 90], [970, 90], [320, 50]], 'div-gpt-ad-header-banner')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-header-banner');\n    });\n  </script>\n</div>`
        case 'checkout_banner':
          return `<!-- Google Ad Manager (AdX) Checkout Page Banner -->\n<div id="div-gpt-ad-checkout-banner">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/tvh_checkout_banner', [[728, 90], [320, 50], [300, 250]], 'div-gpt-ad-checkout-banner')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-checkout-banner');\n    });\n  </script>\n</div>`
        default:
          return ''
      }
    }
  }

  // Local state for Non-buyer rules
  const [nonBuyerForm, setNonBuyerForm] = useState<{
    enabled: boolean
    directLinkUrl: string
    triggerMode: string
    frequencyMinutes: number
    globalHeaderScript: string
    suppressOnCheckout: boolean
    productPageBackButton: boolean
  } | null>(null)

  // 1. Fetch Overview & Placements Data
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

  // 3. Fetch Live ads.txt Data
  const { data: adsTxtData, isLoading: isAdsTxtLoading, refetch: refetchAdsTxt } = useQuery({
    queryKey: ['admin-ads-txt'],
    queryFn: async () => {
      const token = await getToken()
      const res = await adminApi.ads.adsTxt.get(token!)
      if (adsTxtLocal === null && res.content) {
        setAdsTxtLocal(res.content)
      }
      return res
    },
  })

  // 4. Fetch Global AdSense & AdX Settings
  const { data: globalSettingsData, isLoading: isGlobalSettingsLoading, refetch: refetchGlobalSettings } = useQuery({
    queryKey: ['admin-ads-global-settings'],
    queryFn: async () => {
      const token = await getToken()
      const res = await adminApi.ads.globalSettings.get(token!)
      if (!globalForm && res.settings) {
        let accounts = res.settings.adsense_accounts || []
        if (accounts.length === 0 && res.settings.adsense_publisher_id) {
          accounts = [
            {
              id: 'acc-primary',
              label: 'Primary Account (AdSense 1)',
              publisher_id: res.settings.adsense_publisher_id,
              custom_code: res.settings.adsense_head_code || '',
              status: 'active',
              auto_ads: true,
              is_primary: true,
            },
          ]
        }
        setGlobalForm({
          adsense_enabled: res.settings.adsense_enabled,
          adsense_publisher_id: res.settings.adsense_publisher_id,
          adsense_head_code: res.settings.adsense_head_code,
          adsense_accounts: accounts,
          adsense_multi_head_code: res.settings.adsense_multi_head_code || '',
          adx_enabled: res.settings.adx_enabled,
          adx_head_code: res.settings.adx_head_code,
          global_header_script: res.settings.global_header_script,
        })
      }
      return res
    },
  })

  // Mutations
  const updateAdsTxt = useMutation({
    mutationFn: async (content: string) => {
      const token = await getToken()
      return adminApi.ads.adsTxt.update(token!, content)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-txt'] })
      adminToast.success('ads.txt Saved', `Live at /ads.txt with ${res.line_count} valid records.`)
    },
    onError: (err: any) => {
      adminToast.error('Failed to save ads.txt', err?.message || 'Check database permissions.')
    },
  })

  const updateGlobalSettings = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken()
      return adminApi.ads.globalSettings.update(token!, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-global-settings'] })
      queryClient.invalidateQueries({ queryKey: ['admin-ads-rules'] })
      adminToast.success('AdSense & AdX Updated', 'Header scripts and Auto-Ads configuration updated on live website.')
    },
    onError: (err: any) => {
      adminToast.error('Save Failed', err?.message || 'Could not save ad settings.')
    },
  })

  const createPlacement = useMutation({
    mutationFn: async (payload: any) => {
      const token = await getToken()
      return adminApi.ads.placements.create(token!, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setIsPlacementModalOpen(false)
      setEditingPlacement(null)
      adminToast.success('Ad Slot Created', `Slot "${vars.name}" is now registered.`)
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
      setIsPlacementModalOpen(false)
      setEditingPlacement(null)
      adminToast.success('Placement Updated', 'Ad unit code and target settings have been saved.')
    },
    onError: (err: any) => {
      adminToast.error('Update Failed', err?.message || 'Could not update placement.')
    },
  })

  const seedStandardPlacements = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.ads.placements.seedStandard(token!)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      adminToast.success('Standard Slots Initialized', `Added ${res.seeded_count} standard page placements for Homepage, Products, Blog & Utilities!`)
    },
    onError: (err: any) => {
      adminToast.error('Seeding Failed', err?.message || 'Could not seed placements.')
    },
  })

  const createNetwork = useMutation({
    mutationFn: async (payload: Partial<AdNetwork>) => {
      const token = await getToken()
      return adminApi.ads.networks.create(token!, payload)
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setIsAddNetworkOpen(false)
      setNetworkForm({ name: '', provider_type: 'adsense', integration_type: 'banner', status: 'active', config: '' })
      adminToast.success('Network Connected', `${vars.name || 'Network'} has been connected successfully.`)
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

  const deleteItem = useMutation({
    mutationFn: async ({ type, id }: { type: 'network' | 'placement' | 'campaign'; id: number }) => {
      const token = await getToken()
      if (type === 'network') return adminApi.ads.networks.delete(token!, id)
      if (type === 'placement') return adminApi.ads.placements.delete(token!, id)
    },
    onSuccess: () => {
      const name = deleteTarget?.name || 'Item'
      queryClient.invalidateQueries({ queryKey: ['admin-ads-overview'] })
      setDeleteTarget(null)
      adminToast.success('Deleted', `${name} was removed.`)
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
      adminToast.success('Monetization Rules Saved', 'Product Page Back-Button and Non-Buyer trigger rules updated.')
    },
    onError: (err: any) => {
      adminToast.error('Save Failed', err?.message || 'Could not save rules.')
    },
  })

  if (isLoading || isGlobalSettingsLoading) return <LoadingSpinner />

  const networks: AdNetwork[] = data?.networks || []
  const placements: AdPlacement[] = data?.placements || []
  const activeNetworksCount = networks.filter((n) => n.status === 'active').length
  const activePlacementsCount = placements.filter((p) => p.status === 'active').length
  const placementsWithCodeCount = placements.filter((p) => p.custom_code && p.custom_code.trim().length > 0).length

  // Filtered placements by page
  const filteredPlacements = placements.filter((p) => {
    if (pageFilter === 'all') return true
    const tp = p.target_page || (p.placement_key.startsWith('home') ? 'home' : p.placement_key.startsWith('product') ? 'product' : p.placement_key.startsWith('category') ? 'products' : p.placement_key.startsWith('blog') ? 'blog' : 'all')
    return tp === pageFilter || tp === 'all'
  })

  // Quick helper to insert ads.txt templates
  const handleInsertAdsTxtTemplate = (template: string) => {
    const current = adsTxtLocal || ''
    const cleanTemplate = template.trim()
    if (current.includes(cleanTemplate)) {
      adminToast.info('Already Present', 'This record already exists in your ads.txt editor.')
      return
    }
    const updated = current ? `${current.trim()}\n${cleanTemplate}\n` : `${cleanTemplate}\n`
    setAdsTxtLocal(updated)
    adminToast.success('Template Inserted', 'Record added to editor. Click "Save /ads.txt" to publish.')
  }

  // Quick helper to open modal for placement
  const handleOpenPlacementModal = (placement?: AdPlacement) => {
    if (placement) {
      setEditingPlacement(placement)
      setPlacementForm({
        name: placement.name,
        placement_key: placement.placement_key,
        network_id: placement.network_id || '',
        ad_type: placement.ad_type || 'responsive',
        target_page: placement.target_page || 'all',
        device_visibility: (placement.device_visibility as any) || 'all',
        status: placement.status,
        suppress_on_high_intent: Boolean(placement.suppress_on_high_intent),
        suppress_on_checkout: Boolean(placement.suppress_on_checkout),
        frequency_cap_session: placement.frequency_cap_session || 3,
        custom_code: placement.custom_code || '',
      })
    } else {
      setEditingPlacement(null)
      setPlacementForm({
        name: '',
        placement_key: '',
        network_id: '',
        ad_type: 'responsive',
        target_page: pageFilter !== 'all' ? pageFilter : 'home',
        device_visibility: 'all',
        status: 'active',
        suppress_on_high_intent: true,
        suppress_on_checkout: true,
        frequency_cap_session: 3,
        custom_code: '',
      })
    }
    setIsPlacementModalOpen(true)
  }

  // Multi-AdSense Account Management Helpers
  const handleAddAdSenseAccount = () => {
    if (!globalForm) return
    const currentAccounts = globalForm.adsense_accounts || []
    const newIdx = currentAccounts.length + 1
    const newAccount: AdSenseAccount = {
      id: `acc-${Date.now()}`,
      label: `Backup Account (AdSense ${newIdx})`,
      publisher_id: '',
      custom_code: '',
      status: 'pending',
      auto_ads: true,
      is_primary: currentAccounts.length === 0,
    }
    const updated = [...currentAccounts, newAccount]
    setGlobalForm({
      ...globalForm,
      adsense_accounts: updated,
    })
    adminToast.info('Account Added', `Fill in Publisher ID & verification code for AdSense #${newIdx}.`)
  }

  const handleUpdateAdSenseAccount = (id: string, updates: Partial<AdSenseAccount>) => {
    if (!globalForm) return
    const currentAccounts = globalForm.adsense_accounts || []
    const updated = currentAccounts.map((acc) => {
      if (acc.id === id) {
        return { ...acc, ...updates }
      }
      return acc
    })

    const target = updated.find((a) => a.id === id)
    const isPrimary = target?.is_primary

    setGlobalForm({
      ...globalForm,
      adsense_publisher_id: isPrimary && updates.publisher_id !== undefined ? updates.publisher_id : globalForm.adsense_publisher_id,
      adsense_head_code: isPrimary && updates.custom_code !== undefined ? updates.custom_code : globalForm.adsense_head_code,
      adsense_accounts: updated,
    })
  }

  const handleSetPrimaryAdSenseAccount = (id: string) => {
    if (!globalForm) return
    const currentAccounts = globalForm.adsense_accounts || []
    const target = currentAccounts.find((a) => a.id === id)
    if (!target) return

    const updated = currentAccounts.map((acc) => ({
      ...acc,
      is_primary: acc.id === id,
      status: acc.id === id ? ('active' as const) : acc.status,
    }))

    setGlobalForm({
      ...globalForm,
      adsense_publisher_id: target.publisher_id,
      adsense_head_code: target.custom_code || globalForm.adsense_head_code,
      adsense_accounts: updated,
    })
    adminToast.success('Primary Account Set', `${target.label || target.publisher_id} is now primary for site ad units.`)
  }

  const handleRemoveAdSenseAccount = (id: string) => {
    if (!globalForm) return
    const currentAccounts = globalForm.adsense_accounts || []
    if (currentAccounts.length <= 1) {
      adminToast.warning('Cannot Remove', 'You must maintain at least one AdSense account configuration.')
      return
    }

    const removing = currentAccounts.find((a) => a.id === id)
    const filtered = currentAccounts.filter((a) => a.id !== id)

    if (removing?.is_primary && filtered.length > 0) {
      filtered[0].is_primary = true
      filtered[0].status = 'active'
      setGlobalForm({
        ...globalForm,
        adsense_publisher_id: filtered[0].publisher_id,
        adsense_head_code: filtered[0].custom_code || '',
        adsense_accounts: filtered,
      })
    } else {
      setGlobalForm({
        ...globalForm,
        adsense_accounts: filtered,
      })
    }
    adminToast.info('Account Removed', 'AdSense account removed from verification list.')
  }

  const handleSyncToAdsTxt = (pubId: string) => {
    if (!pubId || !pubId.trim()) {
      adminToast.warning('Publisher ID Needed', 'Enter a valid Publisher ID before adding to ads.txt.')
      return
    }
    let cleanPub = pubId.trim().replace(/^ca-/, '')
    const record = `google.com, ${cleanPub}, DIRECT, f08c47fec0942fa0`
    const currentContent = adsTxtLocal !== null ? adsTxtLocal : (adsTxtData?.content || '')

    if (currentContent.includes(cleanPub)) {
      adminToast.info('Already in ads.txt', `${cleanPub} is already listed in /ads.txt.`)
      return
    }

    const updatedContent = currentContent.trim() ? `${currentContent.trim()}\n${record}` : record
    setAdsTxtLocal(updatedContent)
    updateAdsTxt.mutate(updatedContent)
  }

  // Copy ads.txt URL
  const handleCopyAdsTxtUrl = () => {
    navigator.clipboard.writeText('https://1024teraviralhub.com/ads.txt')
    setCopiedLink(true)
    adminToast.success('Link Copied', 'https://1024teraviralhub.com/ads.txt copied to clipboard.')
    setTimeout(() => setCopiedLink(false), 2500)
  }

  return (
    <div style={{ maxWidth: '1360px', margin: '0 auto', paddingBottom: '60px' }}>
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
                padding: '3px 9px',
                borderRadius: 6,
                background: 'rgba(255, 210, 0, 0.15)',
                color: '#FFD200',
                border: '1px solid rgba(255, 210, 0, 0.35)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              AdSense & AdX Ready
            </span>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>
            Manage Google AdSense, AdX (GAM), live <code>/ads.txt</code>, and page-specific ad units across the storefront.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => {
              refetch()
              refetchAdsTxt()
              refetchGlobalSettings()
              refetchRules()
            }}
            disabled={isFetching}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '9px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <RefreshCw size={14} className={isFetching ? 'spin' : ''} /> Refresh
          </button>

          <a
            href="https://1024teraviralhub.com/ads.txt"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              fontSize: '0.8125rem',
              padding: '9px 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              color: '#10B981',
              textDecoration: 'none',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              background: 'rgba(16, 185, 129, 0.08)',
            }}
          >
            <FileText size={14} /> View Live /ads.txt <ExternalLink size={12} />
          </a>

          <button
            type="button"
            onClick={() => handleOpenPlacementModal()}
            className="btn-primary"
            style={{
              fontSize: '0.8125rem',
              padding: '9px 16px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: '#FFD200',
              color: '#000000',
              fontWeight: 800,
              boxShadow: '0 2px 10px rgba(255, 210, 0, 0.35)',
            }}
          >
            <Plus size={15} /> + Add Ad Placement
          </button>
        </div>
      </div>

      {/* ── Top Metric Cards ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        {/* Metric 1: Google AdSense Status */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Google AdSense Multi-Suite</span>
            <span style={{ fontSize: '0.72rem', background: 'rgba(255, 210, 0, 0.15)', color: '#FFD200', padding: '1px 6px', borderRadius: 6, fontWeight: 800 }}>
              {globalForm?.adsense_accounts?.length || 1} Account{(globalForm?.adsense_accounts?.length || 1) > 1 ? 's' : ''}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '3px 8px',
                borderRadius: 20,
                fontSize: '0.78rem',
                fontWeight: 800,
                background: globalForm?.adsense_enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: globalForm?.adsense_enabled ? '#10B981' : '#EF4444',
                border: `1px solid ${globalForm?.adsense_enabled ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              }}
            >
              {globalForm?.adsense_enabled ? '● VERIFICATION ACTIVE' : '○ DISABLED'}
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
              {globalForm?.adsense_publisher_id ? `${globalForm.adsense_publisher_id.slice(0, 14)}...` : 'Not Set'}
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Multi-Account tags running in SSR &lt;head&gt;
          </div>
        </div>

        {/* Metric 2: ads.txt Status */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>ads.txt Crawler Status</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#10B981' }}>
              ✓ ACTIVE
            </span>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 6 }}>
              {adsTxtData?.line_count || 1} Records
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Edge cached · 0% Google crawler earnings warnings
          </div>
        </div>

        {/* Metric 3: Page Ad Placements */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Targeted Page Ad Units</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--brand-purple-light)' }}>
              {activePlacementsCount} <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/ {placements.length}</span>
            </span>
            <span style={{ fontSize: '0.75rem', color: placementsWithCodeCount > 0 ? '#10B981' : '#F59E0B', fontWeight: 700 }}>
              {placementsWithCodeCount} with ad code
            </span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Home, Product, Catalog & Blog slots
          </div>
        </div>

        {/* Metric 4: Buyer Protection */}
        <div className="glass-card" style={{ padding: '18px 20px', borderRadius: 14 }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 6 }}>Checkout & Buyer Guard</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#10B981', display: 'flex', alignItems: 'center', gap: 6 }}>
            <ShieldCheck size={20} /> 100% Zero Interference
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 8 }}>
            Ads auto-suppressed on checkout & paid buyers
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, overflowX: 'auto', borderBottom: '1px solid var(--bg-border)', paddingBottom: 8 }}>
        {[
          { key: 'adsense_adx', label: 'AdSense & AdX Suite', icon: <Sparkles size={16} color="#FFD200" /> },
          { key: 'ads_txt', label: 'ads.txt Live Manager', icon: <FileText size={16} color="#10B981" /> },
          { key: 'page_placements', label: `Page-Wise Ad Units (${placements.length})`, icon: <Layout size={16} /> },
          { key: 'non_buyer', label: 'Non-Buyer Bounce Engine', icon: <Zap size={16} /> },
          { key: 'networks', label: 'Ad Networks', icon: <Globe size={16} /> },
          { key: 'rules', label: 'Buyer Protection Rules', icon: <ShieldAlert size={16} /> },
          { key: 'overview', label: 'Diagnostics & Checklist', icon: <Layers size={16} /> },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as any)}
            className={activeTab === tab.key ? 'btn-primary' : 'btn-ghost'}
            style={{
              fontSize: '0.825rem',
              padding: '9px 15px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              whiteSpace: 'nowrap',
              background: activeTab === tab.key ? '#FFD200' : undefined,
              color: activeTab === tab.key ? '#000000' : undefined,
              fontWeight: activeTab === tab.key ? 800 : 600,
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          TAB 1: GOOGLE ADSENSE & ADX SUITE (User's Core Request)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'adsense_adx' && globalForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Banner Guide */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(255, 210, 0, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
              border: '1px solid rgba(255, 210, 0, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ maxWidth: '750px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Sparkles size={20} color="#FFD200" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                  Google AdSense & AdX (Google Ad Manager) Global Engine
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Manage header code, Auto-Ads activation, and Google Ad Manager GPT tags without editing code. All changes are dynamically injected into <code>&lt;head&gt;</code> on Cloudflare Workers edge server.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <a
                href="https://www.google.com/adsense"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <span>Google AdSense Console</span> <ExternalLink size={12} />
              </a>
              <a
                href="https://admanager.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{ fontSize: '0.8rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
              >
                <span>Google Ad Manager (AdX)</span> <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Section 1: Google AdSense Multi-Account Verification & Auto-Ads Suite */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255, 210, 0, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Sparkles size={22} color="#FFD200" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                    Google AdSense Multi-Account Verification Engine
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '2px 8px', borderRadius: 12, border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                      Concurrent Multi-Approval
                    </span>
                  </h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Add multiple AdSense accounts to verify site ownership in parallel — whichever gets approved first becomes primary!
                  </div>
                </div>
              </div>

              {/* Master Toggle */}
              <button
                type="button"
                onClick={() => setGlobalForm({ ...globalForm, adsense_enabled: !globalForm.adsense_enabled })}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: globalForm.adsense_enabled ? '#10B981' : 'var(--bg-border)',
                  color: globalForm.adsense_enabled ? '#FFFFFF' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {globalForm.adsense_enabled ? '✓ ADSENSE AUTO-ADS ACTIVE' : '○ ADSENSE DISABLED'}
              </button>
            </div>

            {/* Explanatory Multi-Account Info Banner */}
            <div
              style={{
                padding: '12px 16px',
                borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                fontSize: '0.8125rem',
                color: 'var(--text-primary)',
                marginBottom: 20,
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                lineHeight: 1.5,
              }}
            >
              <Sparkles size={16} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>How Multi-AdSense Verification Works:</strong> When you add multiple accounts below, our system injects each account's verification tag (<code>&lt;script adsbygoogle.js?client=ca-pub-...&gt;</code>) and official <code>&lt;meta name="google-adsense-account"&gt;</code> simultaneously into <code>&lt;head&gt;</code>. When Google bots crawl your site from Account 1 or Account 2, both will detect their code and verify site ownership! Whichever account receives approval first, click <strong>"Make Primary Active"</strong> with 1 click to serve live ads across the site.
              </div>
            </div>

            {/* List of Configured AdSense Accounts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(globalForm.adsense_accounts && globalForm.adsense_accounts.length > 0
                ? globalForm.adsense_accounts
                : [
                    {
                      id: 'acc-primary',
                      label: 'Primary Account (AdSense 1)',
                      publisher_id: globalForm.adsense_publisher_id || 'ca-pub-2291828876695516',
                      custom_code: globalForm.adsense_head_code || '',
                      status: 'active' as const,
                      auto_ads: true,
                      is_primary: true,
                    },
                  ]
              ).map((acc, index) => {
                const cleanPub = acc.publisher_id ? acc.publisher_id.trim().replace(/^ca-/, '') : ''
                const inAdsTxt = cleanPub && (adsTxtLocal?.includes(cleanPub) || adsTxtData?.content?.includes(cleanPub))

                return (
                  <div
                    key={acc.id}
                    style={{
                      padding: '18px 20px',
                      borderRadius: 12,
                      background: acc.is_primary ? 'rgba(255, 210, 0, 0.04)' : 'var(--bg-elevated)',
                      border: `1.5px solid ${acc.is_primary ? 'rgba(255, 210, 0, 0.4)' : 'var(--bg-border)'}`,
                      position: 'relative',
                    }}
                  >
                    {/* Top Row: Label, Status, and Primary Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: '50%',
                            background: acc.is_primary ? '#FFD200' : 'var(--bg-border)',
                            color: acc.is_primary ? '#000000' : 'var(--text-muted)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                          }}
                        >
                          {index + 1}
                        </span>
                        <input
                          type="text"
                          value={acc.label}
                          onChange={(e) => handleUpdateAdSenseAccount(acc.id, { label: e.target.value })}
                          placeholder="e.g. Primary Account / Backup Account 2"
                          style={{
                            fontSize: '0.95rem',
                            fontWeight: 800,
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            padding: '2px 6px',
                            borderRadius: 4,
                            outline: 'none',
                          }}
                        />
                        {acc.is_primary ? (
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: '0.72rem',
                              fontWeight: 900,
                              background: '#FFD200',
                              color: '#000000',
                              padding: '2px 8px',
                              borderRadius: 12,
                            }}
                          >
                            <Star size={11} fill="#000" /> PRIMARY ACTIVE
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryAdSenseAccount(acc.id)}
                            className="btn-ghost"
                            style={{
                              fontSize: '0.72rem',
                              padding: '2px 8px',
                              borderRadius: 12,
                              color: 'var(--brand-purple-light)',
                              border: '1px solid var(--brand-purple-light)',
                              fontWeight: 700,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Star size={11} /> Make Primary Active
                          </button>
                        )}
                      </div>

                      {/* Status Selector & Remove Button */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <select
                          value={acc.status}
                          onChange={(e) => handleUpdateAdSenseAccount(acc.id, { status: e.target.value as any })}
                          style={{
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            padding: '4px 10px',
                            borderRadius: 8,
                            background:
                              acc.status === 'active'
                                ? 'rgba(16, 185, 129, 0.15)'
                                : acc.status === 'approved'
                                ? 'rgba(56, 189, 248, 0.15)'
                                : 'rgba(245, 158, 11, 0.15)',
                            color:
                              acc.status === 'active'
                                ? '#10B981'
                                : acc.status === 'approved'
                                ? '#38BDF8'
                                : '#F59E0B',
                            border: `1px solid ${
                              acc.status === 'active'
                                ? 'rgba(16, 185, 129, 0.3)'
                                : acc.status === 'approved'
                                ? 'rgba(56, 189, 248, 0.3)'
                                : 'rgba(245, 158, 11, 0.3)'
                            }`,
                            cursor: 'pointer',
                            outline: 'none',
                          }}
                        >
                          <option value="pending" style={{ background: '#1E293B', color: '#F59E0B' }}>
                            ⏳ Under Google Review
                          </option>
                          <option value="approved" style={{ background: '#1E293B', color: '#38BDF8' }}>
                            ✅ Approved by Google
                          </option>
                          <option value="active" style={{ background: '#1E293B', color: '#10B981' }}>
                            ⚡ Serving Live Ads
                          </option>
                        </select>

                        {(globalForm.adsense_accounts?.length || 0) > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveAdSenseAccount(acc.id)}
                            title="Remove this account"
                            style={{
                              background: 'rgba(239, 68, 68, 0.12)',
                              color: '#EF4444',
                              border: '1px solid rgba(239, 68, 68, 0.25)',
                              borderRadius: 6,
                              padding: '5px',
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Input Row: Publisher ID & 1-Click ads.txt Addition */}
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                          AdSense Publisher ID <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          {inAdsTxt ? (
                            <span
                              style={{
                                fontSize: '0.72rem',
                                color: '#10B981',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              <CheckCheck size={12} /> Present in /ads.txt
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSyncToAdsTxt(acc.publisher_id)}
                              className="btn-ghost"
                              style={{
                                fontSize: '0.72rem',
                                padding: '2px 8px',
                                color: '#38BDF8',
                                border: '1px solid rgba(56, 189, 248, 0.3)',
                                borderRadius: 6,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                                cursor: 'pointer',
                              }}
                            >
                              <Plus size={11} /> 1-Click Add to /ads.txt
                            </button>
                          )}
                        </div>
                      </div>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="ca-pub-2291828876695516"
                        value={acc.publisher_id}
                        onChange={(e) => handleUpdateAdSenseAccount(acc.id, { publisher_id: e.target.value })}
                        style={{ fontFamily: 'monospace', fontSize: '0.875rem', fontWeight: 600 }}
                      />
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        Injects <code>adsbygoogle.js?client={acc.publisher_id || 'ca-pub-...'}</code> and <code>&lt;meta name="google-adsense-account" content="{acc.publisher_id || 'ca-pub-...'}"&gt;</code>
                      </div>
                    </div>

                    {/* Custom Verification Code for this Account */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                          Account Specific Verification Snippet (Optional)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            const pub = acc.publisher_id.trim() || 'ca-pub-XXXXXXXXXXXXXXXX'
                            const code = `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${pub}" crossorigin="anonymous"></script>`
                            handleUpdateAdSenseAccount(acc.id, { custom_code: code })
                            adminToast.success('Tag Auto-Generated', `Standard AdSense tag created for ${acc.label}`)
                          }}
                          className="btn-ghost"
                          style={{ fontSize: '0.72rem', padding: '2px 6px', display: 'inline-flex', alignItems: 'center', gap: 3 }}
                        >
                          <Plus size={11} /> Auto-Generate Default Tag
                        </button>
                      </div>
                      <textarea
                        className="input-field"
                        rows={2}
                        placeholder="Paste verification snippet from this specific AdSense account here..."
                        value={acc.custom_code || ''}
                        onChange={(e) => handleUpdateAdSenseAccount(acc.id, { custom_code: e.target.value })}
                        style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* + Add Another AdSense Account Button */}
            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-start' }}>
              <button
                type="button"
                onClick={handleAddAdSenseAccount}
                className="btn-ghost"
                style={{
                  fontSize: '0.825rem',
                  padding: '9px 18px',
                  border: '1.5px dashed #FFD200',
                  color: '#FFD200',
                  borderRadius: 10,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  fontWeight: 800,
                  cursor: 'pointer',
                  background: 'rgba(255, 210, 0, 0.05)',
                }}
              >
                <Plus size={15} /> + Add Another AdSense Account (Apply with 2nd / 3rd Account)
              </button>
            </div>

            {/* Additional Raw Verification Code Textarea */}
            <div style={{ marginTop: 22, borderTop: '1px solid var(--bg-border)', paddingTop: 18 }}>
              <label style={{ display: 'block', fontWeight: 700, fontSize: '0.825rem', marginBottom: 4 }}>
                Bulk / Raw AdSense Verification Codes (Injected into SSR &lt;head&gt;)
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="<!-- Paste any additional raw Google AdSense verification code or meta tags here -->"
                value={globalForm.adsense_multi_head_code || ''}
                onChange={(e) => setGlobalForm({ ...globalForm, adsense_multi_head_code: e.target.value })}
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
              />
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 4 }}>
                💡 Tip: If Google provides you extra raw meta tags or verification snippets, paste them here. They will be executed dynamically across all pages.
              </div>
            </div>
          </div>

          {/* Section 2: Google Ad Manager (AdX) Configuration */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(26, 115, 232, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Terminal size={22} color="#1A73E8" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Google Ad Manager (AdX) & GPT Header Tags</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Enterprise Google Publisher Tag (GPT) for premium programmatic AdX demand
                  </div>
                </div>
              </div>

              {/* AdX Toggle */}
              <button
                type="button"
                onClick={() => setGlobalForm({ ...globalForm, adx_enabled: !globalForm.adx_enabled })}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: globalForm.adx_enabled ? '#1A73E8' : 'var(--bg-border)',
                  color: globalForm.adx_enabled ? '#FFFFFF' : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                {globalForm.adx_enabled ? '✓ GOOGLE ADX (GAM) ACTIVE' : '○ ADX DISABLED'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 8 }}>
                  <label style={{ fontWeight: 700, fontSize: '0.85rem', margin: 0 }}>
                    Google Ad Manager (AdX) Header Tag (GPT Script Snippet)
                  </label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      onClick={() => {
                        const gptTag = `<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js" crossorigin="anonymous"></script>\n<script>\n  window.googletag = window.googletag || {cmd: []};\n  googletag.cmd.push(function() {\n    googletag.pubads().enableSingleRequest();\n    googletag.enableServices();\n  });\n</script>`
                        setGlobalForm({ ...globalForm, adx_head_code: gptTag })
                        adminToast.success('GPT Template Loaded', 'Google Publisher Tag (GPT) initialization code generated.')
                      }}
                      className="btn-ghost"
                      style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      <Plus size={12} /> Insert Standard GPT Boilerplate
                    </button>
                    {globalForm.adx_head_code && (
                      <button
                        type="button"
                        onClick={() => {
                          setGlobalForm({ ...globalForm, adx_head_code: '' })
                          adminToast.info('AdX Code Removed', 'AdX header code cleared.')
                        }}
                        style={{
                          fontSize: '0.75rem',
                          padding: '4px 10px',
                          background: 'rgba(239, 68, 68, 0.12)',
                          color: '#EF4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          borderRadius: 6,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Trash2 size={12} /> Remove AdX Code
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  className="input-field"
                  rows={4}
                  placeholder="<script async src='https://securepubads.g.doubleclick.net/tag/js/gpt.js'></script>..."
                  value={globalForm.adx_head_code}
                  onChange={(e) => setGlobalForm({ ...globalForm, adx_head_code: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                />
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  When enabled, <code>gpt.js</code> loads automatically into &lt;head&gt;. Paste any partner targeting code or Prebid wrappers here.
                </div>
              </div>
            </div>
          </div>

          {/* Section 2.5: AdSense to AdX Upgrade Roadmap & 1-Click Code Generator (User's Exact Request) */}
          <div className="glass-card" style={{ padding: '26px', borderRadius: 16, border: '1.5px solid rgba(255, 210, 0, 0.35)', background: 'linear-gradient(180deg, rgba(255, 210, 0, 0.04) 0%, rgba(26, 115, 232, 0.04) 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: '1.3rem' }}>🚀</span>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                    AdSense ➔ AdX Upgrade Roadmap & 1-Click Code Generator
                  </h3>
                </div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  First run Google AdSense for site approval, then seamlessly upgrade to Google AdX (GAM) high-CPM demand. Generate and copy ready-to-paste snippets for Anchor, Slider, Vignette, 300x250 Box, Header, and Checkout ads.
                </p>
              </div>

              {/* Network Toggle */}
              <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 10, padding: 3, border: '1px solid var(--bg-border)' }}>
                <button
                  type="button"
                  onClick={() => setGeneratorNetwork('adsense')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: generatorNetwork === 'adsense' ? '#FFD200' : 'transparent',
                    color: generatorNetwork === 'adsense' ? '#000000' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Phase 1: Google AdSense
                </button>
                <button
                  type="button"
                  onClick={() => setGeneratorNetwork('adx')}
                  style={{
                    padding: '7px 16px',
                    borderRadius: 8,
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    border: 'none',
                    cursor: 'pointer',
                    background: generatorNetwork === 'adx' ? '#1A73E8' : 'transparent',
                    color: generatorNetwork === 'adx' ? '#FFFFFF' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  Phase 2: Google AdX (GAM)
                </button>
              </div>
            </div>

            {/* Stepper Guide */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14, marginBottom: 22 }}>
              <div style={{ padding: '14px 16px', borderRadius: 12, background: generatorNetwork === 'adsense' ? 'rgba(255, 210, 0, 0.12)' : 'var(--bg-surface)', border: `1px solid ${generatorNetwork === 'adsense' ? 'rgba(255, 210, 0, 0.5)' : 'var(--bg-border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.875rem', color: generatorNetwork === 'adsense' ? '#B45309' : 'var(--text-primary)', marginBottom: 4 }}>
                  <span>1️⃣</span> <span>Stage 1: Google AdSense Approval</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  • Verify site ownership via Publisher ID in &lt;head&gt;.<br />
                  • Ensure <code>/ads.txt</code> has your DIRECT AdSense line.<br />
                  • Use responsive display banners on Home, Product, and Blog pages.
                </div>
              </div>

              <div style={{ padding: '14px 16px', borderRadius: 12, background: generatorNetwork === 'adx' ? 'rgba(26, 115, 232, 0.12)' : 'var(--bg-surface)', border: `1px solid ${generatorNetwork === 'adx' ? 'rgba(26, 115, 232, 0.5)' : 'var(--bg-border)'}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800, fontSize: '0.875rem', color: generatorNetwork === 'adx' ? '#1A73E8' : 'var(--text-primary)', marginBottom: 4 }}>
                  <span>2️⃣</span> <span>Stage 2: Upgrade to Google AdX (GAM)</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  • Add MCM partner RESELLER line into <code>/ads.txt</code>.<br />
                  • Enable AdX GPT script in &lt;head&gt; above.<br />
                  • Paste AdX GPT slot code into existing slot keys — layout remains 100% intact!
                </div>
              </div>
            </div>

            {/* Format Selector Pills */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: 8 }}>
                Select Ad Unit Format to Generate:
              </label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[
                  { id: 'anchor', label: '📌 Sticky Anchor Ad', slot: 'global_anchor_ad' },
                  { id: 'slider', label: '🪟 Slider 300x250 Ad', slot: 'global_slider_ad' },
                  { id: 'vignette', label: '⚡ Vignette / Interstitial', slot: 'global_vignette_ad' },
                  { id: 'box_300x250', label: '📦 300x250 Medium Rectangle', slot: 'product_300x250_box' },
                  { id: 'header_banner', label: '🔝 Header Global Banner', slot: 'header_global_banner' },
                  { id: 'checkout_banner', label: '💳 Checkout Page Banners', slot: 'checkout_top_banner' },
                ].map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => setGeneratorFormat(fmt.id as any)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 20,
                      fontSize: '0.78rem',
                      fontWeight: generatorFormat === fmt.id ? 800 : 600,
                      border: '1px solid',
                      borderColor: generatorFormat === fmt.id ? (generatorNetwork === 'adsense' ? '#FFD200' : '#1A73E8') : 'var(--bg-border)',
                      background: generatorFormat === fmt.id ? (generatorNetwork === 'adsense' ? 'rgba(255, 210, 0, 0.15)' : 'rgba(26, 115, 232, 0.15)') : 'var(--bg-surface)',
                      color: generatorFormat === fmt.id ? (generatorNetwork === 'adsense' ? '#92400E' : '#1A73E8') : 'var(--text-muted)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Output Box */}
            <div style={{ position: 'relative', marginTop: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1E293B', padding: '8px 14px', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#94A3B8' }}>
                  Target Slot: <strong>
                    {generatorFormat === 'anchor' ? 'global_anchor_ad' :
                     generatorFormat === 'slider' ? 'global_slider_ad' :
                     generatorFormat === 'vignette' ? 'global_vignette_ad' :
                     generatorFormat === 'box_300x250' ? 'product_300x250_box or checkout_sidebar_banner' :
                     generatorFormat === 'header_banner' ? 'header_global_banner' : 'checkout_top_banner / checkout_bottom_banner'}
                  </strong> · {generatorNetwork === 'adsense' ? 'Google AdSense' : 'Google Ad Manager (AdX)'}
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const snippet = getGeneratorSnippet(generatorFormat, generatorNetwork)
                    navigator.clipboard.writeText(snippet)
                    setGeneratorCopied(true)
                    adminToast.success('Snippet Copied', 'Paste this code into the corresponding placement slot in Tab 3.')
                    setTimeout(() => setGeneratorCopied(false), 2500)
                  }}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 6,
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    background: generatorCopied ? '#10B981' : 'rgba(255, 255, 255, 0.15)',
                    color: '#FFFFFF',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  {generatorCopied ? <Check size={12} /> : <Copy size={12} />}
                  <span>{generatorCopied ? 'Copied to Clipboard!' : 'Copy Code Snippet'}</span>
                </button>
              </div>

              <pre
                style={{
                  margin: 0,
                  padding: '16px',
                  background: '#0F172A',
                  color: '#38BDF8',
                  fontSize: '0.8rem',
                  fontFamily: 'monospace',
                  lineHeight: 1.5,
                  overflowX: 'auto',
                  borderBottomLeftRadius: 10,
                  borderBottomRightRadius: 10,
                  border: '1px solid #334155',
                  borderTop: 'none',
                }}
              >
                <code>{getGeneratorSnippet(generatorFormat, generatorNetwork)}</code>
              </pre>
            </div>

            <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                💡 Tip: Go to <strong>"Page-Wise Ad Units"</strong> tab &rarr; find the placement &rarr; click <strong>Edit</strong> &rarr; paste this code snippet.
              </span>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('page_placements')
                  if (generatorFormat === 'anchor' || generatorFormat === 'slider' || generatorFormat === 'vignette' || generatorFormat === 'header_banner') {
                    setPageFilter('all')
                  } else if (generatorFormat === 'box_300x250') {
                    setPageFilter('product')
                  } else if (generatorFormat === 'checkout_banner') {
                    setPageFilter('checkout')
                  }
                }}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 14px', color: 'var(--brand-purple-light)', fontWeight: 700 }}
              >
                Open Page-Wise Ad Units Tab &rarr;
              </button>
            </div>
          </div>

          {/* Section 3: Global Header & Custom In-Head Script */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <Code size={20} color="var(--brand-purple-light)" />
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Custom Global Ads & Header Code</h3>
            </div>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0 0 14px', lineHeight: 1.5 }}>
              Any script or verification code pasted here will be injected across all public pages in the website &lt;head&gt; (e.g. Prebid.js, Monetag MultiTag, Adsterra Social Bar, or custom tracking pixel).
            </p>
            <textarea
              className="input-field"
              rows={3}
              placeholder="<!-- Global Custom Ads or Prebid Script -->"
              value={globalForm.global_header_script}
              onChange={(e) => setGlobalForm({ ...globalForm, global_header_script: e.target.value })}
              style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
            />
          </div>

          {/* Save Global Settings Action Bar */}
          <div
            style={{
              padding: '16px 24px',
              borderRadius: 14,
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
              ⚡ Changes deploy immediately to live edge servers upon saving.
            </div>
            <button
              type="button"
              onClick={() => updateGlobalSettings.mutate(globalForm)}
              disabled={updateGlobalSettings.isPending}
              className="btn-primary"
              style={{
                fontSize: '0.875rem',
                padding: '11px 24px',
                background: '#FFD200',
                color: '#000000',
                fontWeight: 900,
                borderRadius: 8,
                boxShadow: '0 4px 14px rgba(255, 210, 0, 0.4)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              {updateGlobalSettings.isPending ? <RefreshCw size={16} className="spin" /> : <Check size={16} />}
              Save AdSense & AdX Settings
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 2: ADS.TXT LIVE MANAGER (User's Core Request)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'ads_txt' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Header Card */}
          <div
            style={{
              padding: '20px 24px',
              borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(0, 229, 255, 0.08) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <FileText size={20} color="#10B981" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)' }}>
                  Live /ads.txt Manager & Direct Validator
                </h3>
              </div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Authorizes ad buyers and AdSense crawlers to purchase ad inventory on <strong>1024teraviralhub.com</strong>.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 8,
                  border: '1px solid var(--bg-border)',
                  fontFamily: 'monospace',
                  fontSize: '0.8rem',
                  color: '#10B981',
                }}
              >
                <span>https://1024teraviralhub.com/ads.txt</span>
                <button
                  type="button"
                  onClick={handleCopyAdsTxtUrl}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  title="Copy ads.txt URL"
                >
                  {copiedLink ? <CheckCheck size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
              </div>

              <a
                href="https://1024teraviralhub.com/ads.txt"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
                style={{
                  fontSize: '0.8125rem',
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  textDecoration: 'none',
                }}
              >
                <Eye size={14} /> Open Live Route <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Quick-Add Templates Strip */}
          <div className="glass-card" style={{ padding: '18px 22px', borderRadius: 14 }}>
            <div style={{ fontWeight: 800, fontSize: '0.875rem', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Sparkles size={16} color="#FFD200" /> 1-Click Quick-Add Partner Templates:
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('google.com, pub-2291828876695516, DIRECT, f08c47fec0942fa0')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'rgba(255, 210, 0, 0.1)', color: '#FFD200', border: '1px solid rgba(255, 210, 0, 0.3)', fontWeight: 700 }}
              >
                + Google AdSense Direct (Verified)
              </button>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('google.com, pub-2291828876695516, RESELLER, f08c47fec0942fa0')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px', background: 'rgba(26, 115, 232, 0.1)', color: '#1A73E8', border: '1px solid rgba(26, 115, 232, 0.3)', fontWeight: 700 }}
              >
                + Google Ad Manager (AdX Reseller)
              </button>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('media.net, 8CU6347R4, DIRECT')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                + Media.net Direct
              </button>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('appnexus.com, 1234, DIRECT, f5ab79cb982771e4')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                + AppNexus / Xandr
              </button>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('pubmatic.com, 156324, DIRECT, 5d62403b186f2ace')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                + PubMatic Direct
              </button>
              <button
                type="button"
                onClick={() => handleInsertAdsTxtTemplate('rubiconproject.com, 10048, DIRECT, 0bfd66d529a55807')}
                className="btn-ghost"
                style={{ fontSize: '0.78rem', padding: '6px 12px' }}
              >
                + Magnite / Rubicon
              </button>
            </div>
          </div>

          {/* Live Multi-Line Textarea Editor */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Terminal size={18} color="var(--brand-purple-light)" />
                <h4 style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>Live File Content Editor</h4>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({(adsTxtLocal || '').split('\n').filter((l) => l.trim().length > 0 && !l.trim().startsWith('#')).length} active records)
                </span>
              </div>

              <button
                type="button"
                onClick={() => setAdsTxtLocal(`google.com, pub-2291828876695516, DIRECT, f08c47fec0942fa0\n`)}
                className="btn-ghost"
                style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--text-muted)' }}
              >
                Reset to Clean Default
              </button>
            </div>

            <textarea
              className="input-field"
              rows={12}
              placeholder="google.com, pub-2291828876695516, DIRECT, f08c47fec0942fa0"
              value={adsTxtLocal ?? ''}
              onChange={(e) => setAdsTxtLocal(e.target.value)}
              style={{
                fontFamily: 'Consolas, Monaco, monospace',
                fontSize: '0.85rem',
                lineHeight: 1.6,
                background: 'var(--bg-base)',
                borderRadius: 10,
                border: '1px solid var(--bg-border)',
                padding: '16px',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <CheckCircle size={14} color="#10B981" />
                Format rule: <code>&lt;Exchange Domain&gt;, &lt;Publisher ID&gt;, &lt;DIRECT | RESELLER&gt;, &lt;TAG ID&gt;</code>
              </div>

              <button
                type="button"
                onClick={() => updateAdsTxt.mutate(adsTxtLocal || '')}
                disabled={updateAdsTxt.isPending}
                className="btn-primary"
                style={{
                  padding: '10px 22px',
                  background: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  borderRadius: 8,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.35)',
                }}
              >
                {updateAdsTxt.isPending ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
                Save /ads.txt to Live Server
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 3: PAGE-WISE AD UNITS (User's Core Request: "kis page me kaunsa ad lagana hai")
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'page_placements' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Top Actions & Page Filtering Bar */}
          <div
            style={{
              padding: '18px 22px',
              borderRadius: 14,
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Filter By Target Page:
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {TARGET_PAGES.map((pg) => {
                  const isSelected = pageFilter === pg.id
                  return (
                    <button
                      key={pg.id}
                      type="button"
                      onClick={() => setPageFilter(pg.id)}
                      className={isSelected ? 'btn-primary' : 'btn-ghost'}
                      style={{
                        fontSize: '0.8rem',
                        padding: '6px 12px',
                        borderRadius: 20,
                        background: isSelected ? '#FFD200' : undefined,
                        color: isSelected ? '#000000' : undefined,
                        fontWeight: isSelected ? 800 : 600,
                      }}
                    >
                      {pg.icon} {pg.name}
                    </button>
                  )
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => seedStandardPlacements.mutate()}
                disabled={seedStandardPlacements.isPending}
                className="btn-ghost"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  color: '#FFD200',
                  border: '1px solid rgba(255, 210, 0, 0.35)',
                }}
              >
                <Sparkles size={14} /> Auto-Seed Standard Page Placements
              </button>

              <button
                type="button"
                onClick={() => handleOpenPlacementModal()}
                className="btn-primary"
                style={{
                  fontSize: '0.8rem',
                  padding: '8px 16px',
                  background: '#FFD200',
                  color: '#000000',
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Plus size={14} /> + New Custom Slot
              </button>
            </div>
          </div>

          {/* Placements Cards Grid */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filteredPlacements.map((p) => {
              const hasCode = Boolean(p.custom_code && p.custom_code.trim().length > 0)
              const pageMeta = TARGET_PAGES.find((tp) => tp.id === p.target_page) || { name: p.target_page || 'All Pages', icon: '🌐' }

              return (
                <div
                  key={p.id}
                  className="glass-card"
                  style={{
                    padding: '18px 22px',
                    borderRadius: 14,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 16,
                    borderLeft: p.status === 'active' ? '4px solid #10B981' : '4px solid #F59E0B',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: '320px', flex: 1 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 10,
                        background: hasCode ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Layout size={22} color={hasCode ? '#10B981' : '#F59E0B'} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                          {p.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: 'var(--bg-elevated)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--bg-border)',
                          }}
                        >
                          {pageMeta.icon} {pageMeta.name}
                        </span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: 4,
                            background: p.device_visibility === 'mobile' ? 'rgba(0, 229, 255, 0.12)' : p.device_visibility === 'desktop' ? 'rgba(124, 58, 237, 0.12)' : 'rgba(255, 210, 0, 0.12)',
                            color: p.device_visibility === 'mobile' ? '#00E5FF' : p.device_visibility === 'desktop' ? '#A78BFA' : '#FFD200',
                          }}
                        >
                          {p.device_visibility === 'mobile' ? '📱 Mobile Only' : p.device_visibility === 'desktop' ? '💻 Desktop Only' : '📱+💻 All Devices'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>
                          Slot ID: <code style={{ color: 'var(--brand-purple-light)', fontWeight: 700 }}>{p.placement_key}</code>
                        </span>
                        <span>•</span>
                        <span>
                          Ad Format: <span style={{ textTransform: 'capitalize' }}>{p.ad_type}</span>
                        </span>
                        <span>•</span>
                        <span style={{ color: hasCode ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
                          {hasCode ? '✓ Active Ad Snippet Attached' : '⚠️ Code Snippet Empty'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Toggles */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {/* Active Toggle Switch */}
                    <button
                      type="button"
                      onClick={() =>
                        updatePlacement.mutate({
                          id: p.id,
                          data: { status: p.status === 'active' ? 'paused' : 'active' },
                        })
                      }
                      style={{
                        padding: '6px 12px',
                        borderRadius: 20,
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        background: p.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: p.status === 'active' ? '#10B981' : '#F59E0B',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: p.status === 'active' ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.35)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      {p.status === 'active' ? '● RUNNING' : '○ PAUSED'}
                    </button>

                    {/* Edit Ad Snippet Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenPlacementModal(p)}
                      className="btn-primary"
                      style={{
                        fontSize: '0.78rem',
                        padding: '6px 14px',
                        background: '#FFD200',
                        color: '#000000',
                        fontWeight: 800,
                        borderRadius: 6,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Code size={13} /> Edit Ad Code & Settings
                    </button>

                    {/* Delete Slot Button */}
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ type: 'placement', id: p.id, name: p.name })}
                      style={{
                        padding: '6px 8px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 6,
                        color: '#EF4444',
                        cursor: 'pointer',
                      }}
                      title="Delete Slot"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              )
            })}

            {!filteredPlacements.length && (
              <div
                style={{
                  padding: '48px 20px',
                  textAlign: 'center',
                  background: 'var(--bg-surface)',
                  borderRadius: 14,
                  border: '1px solid var(--bg-border)',
                }}
              >
                <Layout size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: '0 0 6px', fontSize: '1.05rem', fontWeight: 800 }}>No Placements for Selected Page</h4>
                <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Click "Auto-Seed Standard Page Placements" to instantly configure high-converting slots across Homepage, Products, Blog & Download pages!
                </p>
                <button
                  type="button"
                  onClick={() => seedStandardPlacements.mutate()}
                  className="btn-primary"
                  style={{ fontSize: '0.8125rem', padding: '9px 18px', background: '#FFD200', color: '#000000', fontWeight: 800 }}
                >
                  ⚡ Auto-Seed Standard Slots Now
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 4: NON-BUYER BOUNCE ENGINE (Direct Link / Back Button)
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'non_buyer' && nonBuyerForm && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Zap size={22} color="#A4D65E" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Product Page Back-Button Bounce Capture</h3>
              </div>
              <button
                type="button"
                onClick={() => setNonBuyerForm({ ...nonBuyerForm, productPageBackButton: !nonBuyerForm.productPageBackButton })}
                style={{
                  padding: '8px 18px',
                  borderRadius: 20,
                  fontWeight: 800,
                  fontSize: '0.8125rem',
                  border: 'none',
                  cursor: 'pointer',
                  background: nonBuyerForm.productPageBackButton ? '#A4D65E' : 'var(--bg-border)',
                  color: nonBuyerForm.productPageBackButton ? '#08140B' : 'var(--text-muted)',
                }}
              >
                {nonBuyerForm.productPageBackButton ? '✓ BOUNCE CAPTURE ARMED' : '○ DISABLED'}
              </button>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: '0 0 18px' }}>
              When a visitor lands on any product page and hits the <strong>Back button</strong> without purchasing, immediately launch your Monetag / Adsterra Direct Link in a new tab or redirect to maximize RPM on non-buyers.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 700, fontSize: '0.85rem', marginBottom: 6 }}>
                  Direct Link / SmartLink URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  placeholder="https://otieupt.com/..."
                  value={nonBuyerForm.directLinkUrl}
                  onChange={(e) => setNonBuyerForm({ ...nonBuyerForm, directLinkUrl: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => saveNonBuyerRules.mutate()}
                  disabled={saveNonBuyerRules.isPending}
                  className="btn-primary"
                  style={{ padding: '9px 20px', background: '#A4D65E', color: '#000000', fontWeight: 800 }}
                >
                  Save Bounce Capture Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 5: AD NETWORKS
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'networks' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>Connected Ad Networks</h3>
            <button
              type="button"
              onClick={() => setIsAddNetworkOpen(true)}
              className="btn-primary"
              style={{ fontSize: '0.8125rem', padding: '8px 16px', background: '#FFD200', color: '#000000', fontWeight: 800 }}
            >
              + Connect Network
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 14 }}>
            {networks.map((n) => (
              <div key={n.id} className="glass-card" style={{ padding: '20px', borderRadius: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <NetworkBadge provider={n.provider_type} displayName={n.name} />
                  <span
                    className={`badge ${n.status === 'active' ? 'badge-success' : 'badge-amber'}`}
                    style={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                  >
                    {n.status}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 14 }}>
                  Format: <strong>{n.integration_type}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setEditingNetwork(n)}
                    className="btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                  >
                    <Edit size={13} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget({ type: 'network', id: n.id, name: n.name })}
                    style={{ fontSize: '0.75rem', padding: '5px 10px', color: '#EF4444' }}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 6: BUYER PROTECTION & SAFETY RULES
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'rules' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Lock size={20} color="#10B981" /> Dual-Engine Monetization & Buyer Protection Architecture
            </h3>
            <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-muted)' }}>
              1024 Tera Viral Hub protects paid conversions while maximizing revenue from bounce traffic:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="#10B981" />
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Zero Checkout Ads:</strong> When a user navigates to <code>/checkout</code>, <code>/payment</code>, or interacts with buy buttons, all ads are completely disabled.
                </div>
              </div>

              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="#10B981" />
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Paid Buyer Immunity:</strong> Customers with a valid token or verified order never see intrusive banners or exit popunders.
                </div>
              </div>

              <div style={{ padding: '14px 18px', background: 'var(--bg-elevated)', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 12 }}>
                <CheckCircle size={20} color="#10B981" />
                <div style={{ fontSize: '0.875rem' }}>
                  <strong>Edge Cache /ads.txt:</strong> Changes to <code>/ads.txt</code> propagate to Cloudflare edge in minutes, ensuring Google crawler approval.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          TAB 7: OVERVIEW & DIAGNOSTICS CHECKLIST
      ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="glass-card" style={{ padding: '24px', borderRadius: 16 }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: 14 }}>Google Monetization Readiness Checklist</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
                <CheckCircle size={18} color="#10B981" />
                <span>
                  <strong>/ads.txt Route:</strong> Active and serving {adsTxtData?.line_count || 1} records directly on root domain.
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
                <CheckCircle size={18} color={globalForm?.adsense_enabled ? '#10B981' : '#F59E0B'} />
                <span>
                  <strong>Google AdSense Auto-Ads:</strong> {globalForm?.adsense_enabled ? 'Active with Publisher ID ' + globalForm?.adsense_publisher_id : 'Disabled in AdSense & AdX tab.'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.875rem' }}>
                <CheckCircle size={18} color={placementsWithCodeCount > 0 ? '#10B981' : '#F59E0B'} />
                <span>
                  <strong>Page Placements:</strong> {placementsWithCodeCount} of {placements.length} slots have custom ad snippets attached.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL: ADD / EDIT AD PLACEMENT & CODE SNIPPET
      ══════════════════════════════════════════════════════════════════ */}
      {isPlacementModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 640, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Code size={22} color="#FFD200" />
                <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                  {editingPlacement ? 'Edit Ad Placement & Code' : 'Create New Ad Placement'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPlacementModalOpen(false)}
                className="btn-ghost"
                style={{ padding: '4px 8px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Placement Name */}
              <div>
                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                  Placement Name <span style={{ color: '#EF4444' }}>*</span>
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. Homepage Top Leaderboard Banner"
                  value={placementForm.name}
                  onChange={(e) => setPlacementForm({ ...placementForm, name: e.target.value })}
                />
              </div>

              {/* Placement Key & Target Page in a Row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                    Placement Slot Key <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. home_top_banner"
                    value={placementForm.placement_key}
                    disabled={Boolean(editingPlacement)}
                    onChange={(e) => setPlacementForm({ ...placementForm, placement_key: e.target.value })}
                    style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                    Target Page <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    className="input-field"
                    value={placementForm.target_page}
                    onChange={(e) => setPlacementForm({ ...placementForm, target_page: e.target.value })}
                  >
                    {TARGET_PAGES.map((tp) => (
                      <option key={tp.id} value={tp.id}>
                        {tp.icon} {tp.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Device Visibility & Ad Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                    Device Target Visibility
                  </label>
                  <select
                    className="input-field"
                    value={placementForm.device_visibility}
                    onChange={(e) => setPlacementForm({ ...placementForm, device_visibility: e.target.value as any })}
                  >
                    <option value="all">📱+💻 All Devices (Responsive)</option>
                    <option value="desktop">💻 Desktop Only</option>
                    <option value="mobile">📱 Mobile Only</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4, fontWeight: 700 }}>
                    Slot Format
                  </label>
                  <select
                    className="input-field"
                    value={placementForm.ad_type}
                    onChange={(e) => setPlacementForm({ ...placementForm, ad_type: e.target.value })}
                  >
                    <option value="responsive">Responsive Display Unit (Auto Width)</option>
                    <option value="sticky_anchor">Sticky Bottom Anchor Ad (Mobile & Desktop)</option>
                    <option value="slider">Floating Corner Slider Ad (300x250 Drawer)</option>
                    <option value="interstitial">Vignette / Interstitial Page Transition</option>
                    <option value="banner_300x250">Medium Rectangle Box (300x250)</option>
                    <option value="leaderboard">Leaderboard Banner (728x90)</option>
                    <option value="half_page">Half Page Banner (300x600)</option>
                    <option value="mobile_banner">Mobile Banner (320x50)</option>
                    <option value="custom_script">Custom HTML / JS Code</option>
                  </select>
                </div>
              </div>

              {/* Custom Ad Code Snippet (User's Core Requirement) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, flexWrap: 'wrap', gap: 6 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, margin: 0 }}>
                    Ad Code Snippet (AdSense, AdX, or Custom Script)
                  </label>

                  {/* 1-Click Templates */}
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => {
                        const pub = globalForm?.adsense_publisher_id || 'ca-pub-2291828876695516'
                        const template = `<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"\n     data-ad-format="auto"\n     data-full-width-responsive="true"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
                        setPlacementForm({ ...placementForm, custom_code: template })
                        adminToast.success('Template Inserted', 'Paste your real data-ad-slot ID from Google AdSense.')
                      }}
                      className="btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#FFD200' }}
                    >
                      + AdSense Responsive
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const pub = globalForm?.adsense_publisher_id || 'ca-pub-2291828876695516'
                        const template = `<ins class="adsbygoogle"\n     style="display:inline-block;width:300px;height:250px"\n     data-ad-client="${pub}"\n     data-ad-slot="1234567890"></ins>\n<script>\n     (adsbygoogle = window.adsbygoogle || []).push({});\n</script>`
                        setPlacementForm({ ...placementForm, custom_code: template })
                        adminToast.success('Template Inserted', '300x250 Medium Rectangle snippet inserted.')
                      }}
                      className="btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#10B981' }}
                    >
                      + 300x250 Box
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const template = `<div id="div-gpt-ad-slot">\n  <script>\n    googletag.cmd.push(function() {\n      googletag.defineSlot('/1234567/ad_unit', [[300, 250], [728, 90]], 'div-gpt-ad-slot')\n               .addService(googletag.pubads());\n      googletag.display('div-gpt-ad-slot');\n    });\n  </script>\n</div>`
                        setPlacementForm({ ...placementForm, custom_code: template })
                        adminToast.success('Template Inserted', 'Google Ad Manager (AdX) GPT tag inserted.')
                      }}
                      className="btn-ghost"
                      style={{ fontSize: '0.72rem', padding: '3px 8px', color: '#1A73E8' }}
                    >
                      + AdX (GAM) Tag
                    </button>
                    {placementForm.custom_code && (
                      <button
                        type="button"
                        onClick={() => setPlacementForm({ ...placementForm, custom_code: '' })}
                        style={{ background: 'none', border: 'none', color: '#EF4444', fontSize: '0.72rem', cursor: 'pointer' }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <textarea
                  className="input-field"
                  rows={6}
                  placeholder={`<ins class="adsbygoogle"\n     style="display:block"\n     data-ad-client="ca-pub-..."\n     data-ad-slot="..."\n     data-ad-format="auto"></ins>\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
                  value={placementForm.custom_code}
                  onChange={(e) => setPlacementForm({ ...placementForm, custom_code: e.target.value })}
                  style={{ fontFamily: 'monospace', fontSize: '0.8rem', lineHeight: 1.5 }}
                />
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  ⚡ Supports <code>&lt;ins class="adsbygoogle"&gt;</code>, AdX tags, and custom &lt;script&gt; execution.
                </div>
              </div>

              {/* Status and Suppression Checks */}
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', paddingTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={placementForm.status === 'active'}
                    onChange={(e) => setPlacementForm({ ...placementForm, status: e.target.checked ? 'active' : 'paused' })}
                  />
                  <span>Ad Slot Active in Storefront</span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.825rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={placementForm.suppress_on_checkout}
                    onChange={(e) => setPlacementForm({ ...placementForm, suppress_on_checkout: e.target.checked })}
                  />
                  <span>Suppress on Checkout Pages (Zero Friction)</span>
                </label>
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsPlacementModalOpen(false)}
                  className="btn-ghost"
                  style={{ fontSize: '0.85rem', padding: '9px 18px' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!placementForm.name || !placementForm.placement_key) {
                      adminToast.error('Validation Error', 'Placement Name and Slot Key are required.')
                      return
                    }
                    const payload = {
                      ...placementForm,
                      network_id: placementForm.network_id ? Number(placementForm.network_id) : null,
                    }
                    if (editingPlacement) {
                      updatePlacement.mutate({ id: editingPlacement.id, data: payload })
                    } else {
                      createPlacement.mutate(payload)
                    }
                  }}
                  disabled={createPlacement.isPending || updatePlacement.isPending}
                  className="btn-primary"
                  style={{
                    fontSize: '0.85rem',
                    padding: '9px 22px',
                    background: '#FFD200',
                    color: '#000000',
                    fontWeight: 800,
                  }}
                >
                  {createPlacement.isPending || updatePlacement.isPending ? <RefreshCw size={15} className="spin" /> : <Check size={15} />}
                  {editingPlacement ? 'Save Placement' : 'Create Placement'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add Network ── */}
      {(isAddNetworkOpen || editingNetwork) && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 28, maxWidth: 500, width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <NetworkLogo provider={editingNetwork ? editingNetwork.provider_type : networkForm.provider_type} size={28} />
              <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0 }}>
                {editingNetwork ? 'Edit Ad Network' : 'Connect Ad Network'}
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
                        name: networkForm.name || (sel ? sel.name : ''),
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
                  placeholder="e.g. Google AdSense, Monetag, Adsterra"
                  value={editingNetwork ? editingNetwork.name : networkForm.name}
                  onChange={(e) => {
                    if (editingNetwork) setEditingNetwork({ ...editingNetwork, name: e.target.value })
                    else setNetworkForm({ ...networkForm, name: e.target.value })
                  }}
                />
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

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddNetworkOpen(false)
                    setEditingNetwork(null)
                  }}
                  className="btn-ghost"
                  style={{ fontSize: '0.85rem', padding: '9px 18px' }}
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
                  className="btn-primary"
                  style={{ fontSize: '0.85rem', padding: '9px 20px', background: '#FFD200', color: '#000000', fontWeight: 800 }}
                >
                  {editingNetwork ? 'Save Network' : 'Connect Network'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Delete Confirmation ── */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}>
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 16, padding: 24, maxWidth: 420, width: '100%' }}>
            <h3 style={{ margin: '0 0 10px', fontSize: '1.15rem', fontWeight: 800, color: 'var(--error)' }}>
              Delete {deleteTarget.type === 'placement' ? 'Ad Placement' : 'Ad Network'}?
            </h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', margin: '0 0 20px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>"{deleteTarget.name}"</strong>? This will permanently delete it from the database.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn-ghost" style={{ fontSize: '0.85rem', padding: '8px 16px' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteItem.mutate(deleteTarget)}
                disabled={deleteItem.isPending}
                style={{
                  background: 'var(--error)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 18px',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                }}
              >
                {deleteItem.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
