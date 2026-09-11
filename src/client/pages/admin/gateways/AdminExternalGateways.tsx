// src/client/pages/admin/gateways/AdminExternalGateways.tsx
// Multi-Site External Gateway Manager (Ads Manager Style) with 100% Cashfree Stealth

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Zap, Globe, Shield, Plus, RefreshCw, Copy, Check, ExternalLink,
  Code, Trash2, Edit, Play, Pause, AlertCircle, ArrowUpRight,
  Search, CheckCircle2, Lock, Smartphone, FileText, Eye, EyeOff, BookOpen
} from 'lucide-react'
import { adminApi, type ExternalPartner, type ExternalTransaction } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import { adminToast } from '../../../lib/admin-toast'

export default function AdminExternalGateways() {
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const [activeTab, setActiveTab] = useState<'sites' | 'transactions' | 'stealth' | 'docs'>('sites')
  const [copiedKeyId, setCopiedKeyId] = useState<number | null>(null)
  const [revealedKeys, setRevealedKeys] = useState<Record<number, boolean>>({})

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingPartner, setEditingPartner] = useState<ExternalPartner | null>(null)
  const [codeModalPartner, setCodeModalPartner] = useState<ExternalPartner | null>(null)
  const [copiedSnippet, setCopiedSnippet] = useState(false)

  // Transaction filter
  const [txStatusFilter, setTxStatusFilter] = useState<string>('')
  const [txSearch, setTxSearch] = useState<string>('')

  // Partner Form State
  const [partnerForm, setPartnerForm] = useState({
    site_name: '',
    site_url: '',
    webhook_url: '',
    notes: '',
  })

  // 1. Fetch Stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin-gateway-stats'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.gateways.stats(token!)
    },
    refetchInterval: 15000,
  })

  // 2. Fetch Partners List
  const { data: partnersData, isLoading: partnersLoading } = useQuery({
    queryKey: ['admin-gateway-partners'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.gateways.partners.list(token!)
    },
  })

  // 3. Fetch Transactions List
  const { data: txData, isLoading: txLoading } = useQuery({
    queryKey: ['admin-gateway-transactions', txStatusFilter],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.gateways.transactions(token!, {
        status: txStatusFilter || undefined,
        limit: 50,
      })
    },
    refetchInterval: 15000,
  })

  // Mutations
  const toggleGlobalMutation = useMutation({
    mutationFn: async (enabled: boolean) => {
      const token = await getToken()
      return adminApi.gateways.toggleGlobal(token!, enabled)
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-stats'] })
      adminToast.success(
        res.enabled ? 'Gateways Activated' : 'Gateways Paused',
        res.enabled ? 'All external websites can now process checkouts.' : 'External checkout requests are now paused.'
      )
    },
    onError: (err: any) => {
      adminToast.error('Failed to toggle gateways', err.message)
    },
  })

  const createPartnerMutation = useMutation({
    mutationFn: async (payload: typeof partnerForm) => {
      const token = await getToken()
      return adminApi.gateways.partners.create(token!, payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-partners'] })
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-stats'] })
      setIsAddModalOpen(false)
      setPartnerForm({ site_name: '', site_url: '', webhook_url: '', notes: '' })
      adminToast.success('Partner Site Connected', 'Website added with isolated API credentials!')
    },
    onError: (err: any) => {
      adminToast.error('Failed to add partner', err.message)
    },
  })

  const updatePartnerMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ExternalPartner> }) => {
      const token = await getToken()
      return adminApi.gateways.partners.update(token!, id, data)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-partners'] })
      setEditingPartner(null)
      adminToast.success('Partner Updated', 'Site configuration saved successfully.')
    },
    onError: (err: any) => {
      adminToast.error('Update failed', err.message)
    },
  })

  const regenerateKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.gateways.partners.regenerateKey(token!, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-partners'] })
      adminToast.success('New Key Generated', 'Partner secret key has been rotated.')
    },
    onError: (err: any) => {
      adminToast.error('Regeneration failed', err.message)
    },
  })

  const deletePartnerMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.gateways.partners.delete(token!, id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-partners'] })
      queryClient.invalidateQueries({ queryKey: ['admin-gateway-stats'] })
      adminToast.success('Partner Removed', 'Website disconnected from gateway.')
    },
    onError: (err: any) => {
      adminToast.error('Delete failed', err.message)
    },
  })

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text)
    setCopiedKeyId(id)
    adminToast.success('API Key Copied', 'Copied to clipboard!')
    setTimeout(() => setCopiedKeyId(null), 2000)
  }

  const toggleRevealKey = (id: number) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const partners = partnersData?.partners || []
  const transactions = txData?.transactions || []

  const filteredTransactions = transactions.filter(tx => {
    if (!txSearch) return true
    const s = txSearch.toLowerCase()
    return (
      tx.order_number.toLowerCase().includes(s) ||
      (tx.item_name && tx.item_name.toLowerCase().includes(s)) ||
      (tx.origin_site && tx.origin_site.toLowerCase().includes(s)) ||
      (tx.customer_phone && tx.customer_phone.includes(s))
    )
  })

  if (statsLoading && partnersLoading) return <LoadingSpinner />

  return (
    <div style={{ maxWidth: 1200, width: '100%', margin: '0 auto', paddingBottom: 80 }}>
      {/* ── Top Header & Actions ── */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: '#FFD200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              boxShadow: '0 2px 10px rgba(255, 210, 0, 0.3)',
            }}>
              <Zap size={22} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>External Gateway Manager</h1>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: 0 }}>
            Connect 2-3+ external websites (AI Girl Chat, micro-service apps) to accept 1-Click PhonePe UPI payments through 1024TeraViralHub.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          {/* 🛡️ Cashfree Stealth Badge */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 14px',
            borderRadius: 'var(--radius-full, 9999px)',
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34D399',
            fontSize: '0.78rem',
            fontWeight: 700,
          }}>
            <Shield size={14} />
            <span>100% Cashfree Stealth Active</span>
          </div>

          {/* Master Kill Switch */}
          <button
            onClick={() => toggleGlobalMutation.mutate(!stats?.global_enabled)}
            disabled={toggleGlobalMutation.isPending}
            className="btn btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.8125rem',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: 10,
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-elevated)',
            }}
          >
            {stats?.global_enabled ? (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 8px #10B981' }} />
                <span>Gateways: ON</span>
              </>
            ) : (
              <>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444' }} />
                <span style={{ color: '#EF4444' }}>Gateways: PAUSED</span>
              </>
            )}
          </button>

          {/* Connect New Site Button */}
          <button
            onClick={() => {
              setPartnerForm({ site_name: '', site_url: '', webhook_url: '', notes: '' })
              setIsAddModalOpen(true)
            }}
            className="btn btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.85rem',
              fontWeight: 700,
              padding: '8px 18px',
              borderRadius: 10,
              background: '#FFD200',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(255, 210, 0, 0.35)',
            }}
          >
            <Plus size={16} />
            <span>Connect New Website</span>
          </button>
        </div>
      </div>

      {/* ── 4 Command Center Analytics Cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Connected Sites</span>
            <Globe size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {stats?.total_partners ?? 0}
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#34D399', marginLeft: 8 }}>
              ({stats?.active_partners ?? 0} Active)
            </span>
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total Transactions</span>
            <Smartphone size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {stats?.total_orders ?? 0}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Paid & Unlocked</span>
            <CheckCircle2 size={18} color="#34D399" />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#34D399' }}>
            {stats?.paid_orders ?? 0}
          </div>
        </div>

        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: '18px 20px',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Total External Revenue</span>
            <span style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFD200' }}>₹</span>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFD200' }}>
            ₹{stats?.total_revenue?.toLocaleString('en-IN') ?? 0}
          </div>
        </div>
      </div>

      {/* ── Navigation Tabs ── */}
      <div style={{
        display: 'flex',
        gap: 8,
        borderBottom: '1px solid var(--bg-border)',
        marginBottom: 24,
      }}>
        {[
          { id: 'sites', label: `Connected Websites (${partners.length})`, icon: <Globe size={16} /> },
          { id: 'transactions', label: `Live Transactions (${transactions.length})`, icon: <Smartphone size={16} /> },
          { id: 'stealth', label: '100% Cashfree Stealth Shield', icon: <Shield size={16} /> },
          { id: 'docs', label: 'API Documentation & Setup', icon: <BookOpen size={16} /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '10px 18px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === tab.id ? 'var(--bg-surface)' : 'transparent',
              borderBottom: activeTab === tab.id ? '2px solid #FFD200' : '2px solid transparent',
              color: activeTab === tab.id ? 'var(--text-primary)' : 'var(--text-muted)',
              fontWeight: activeTab === tab.id ? 700 : 500,
              fontSize: '0.875rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB 1: Connected Partner Websites ── */}
      {activeTab === 'sites' && (
        <div>
          {partners.length === 0 ? (
            <div style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg, 16px)',
              padding: 48,
              textAlign: 'center',
            }}>
              <Globe size={40} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 8 }}>No External Websites Connected Yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 20 }}>
                Click below to connect your first website (like instatextpro.online) and get a secret API key.
              </p>
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="btn btn-primary"
                style={{ background: '#FFD200', color: '#000', fontWeight: 700 }}
              >
                + Connect Website
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {partners.map(p => {
                const isRevealed = Boolean(revealedKeys[p.id])
                const isCopied = copiedKeyId === p.id

                return (
                  <div
                    key={p.id}
                    style={{
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 'var(--radius-lg, 16px)',
                      padding: 24,
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: 16,
                      marginBottom: 16,
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0 }}>{p.site_name}</h3>
                          <span style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: p.status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: p.status === 'active' ? '#34D399' : '#EF4444',
                            border: `1px solid ${p.status === 'active' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.status === 'active' ? '#10B981' : '#EF4444' }} />
                            {p.status === 'active' ? 'Active (Live)' : 'Paused'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                          <a
                            href={p.site_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ color: '#38BDF8', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                          >
                            <span>{p.site_url}</span>
                            <ArrowUpRight size={13} />
                          </a>
                          <span>•</span>
                          <span>ID: <code style={{ color: 'var(--text-secondary)' }}>{p.partner_id}</code></span>
                        </div>
                      </div>

                      {/* Revenue & Stats Pills */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        background: 'var(--bg-elevated)',
                        padding: '8px 16px',
                        borderRadius: 12,
                        border: '1px solid var(--bg-border)',
                      }}>
                        <div style={{ textAlign: 'center', paddingRight: 12, borderRight: '1px solid var(--bg-border)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Orders</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800 }}>{p.total_orders}</div>
                        </div>
                        <div style={{ textAlign: 'center', paddingRight: 12, borderRight: '1px solid var(--bg-border)' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Paid</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#34D399' }}>{p.paid_orders}</div>
                        </div>
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Revenue</div>
                          <div style={{ fontSize: '1rem', fontWeight: 800, color: '#FFD200' }}>₹{p.total_revenue}</div>
                        </div>
                      </div>
                    </div>

                    {/* API Key Box — Styled with Theme Colors & Embedded Eye/EyeOff */}
                    <div style={{
                      background: 'var(--bg-elevated)',
                      borderRadius: 12,
                      padding: '14px 16px',
                      border: '1px solid var(--bg-border)',
                      marginBottom: 16,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Secret Partner API Key</span>
                          <code style={{ color: '#000', background: '#FFD200', padding: '1px 7px', borderRadius: 4, fontWeight: 800, fontSize: '0.72rem' }}>
                            X-Partner-Key
                          </code>
                        </span>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          Click the eye icon to reveal or hide
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {/* High Contrast Input with Embedded Eye / Eye-Closed Toggle */}
                        <div style={{ position: 'relative', flex: 1 }}>
                          <input
                            type={isRevealed ? "text" : "password"}
                            readOnly
                            className="input-field"
                            value={p.api_key}
                            style={{
                              width: '100%',
                              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                              fontSize: '0.875rem',
                              fontWeight: 600,
                              letterSpacing: isRevealed ? '0.04em' : '0.2em',
                              color: 'var(--text-primary)',
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--bg-border)',
                              borderRadius: 8,
                              padding: '10px 42px 10px 14px',
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => toggleRevealKey(p.id)}
                            style={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              background: 'transparent',
                              border: 'none',
                              color: isRevealed ? '#FFD200' : 'var(--text-muted)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: 6,
                              borderRadius: 6,
                            }}
                            title={isRevealed ? "Hide Secret Key" : "Reveal Secret Key"}
                          >
                            {isRevealed ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <button
                          onClick={() => copyToClipboard(p.api_key, p.id)}
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '10px 16px',
                            fontSize: '0.8125rem',
                            fontWeight: 700,
                            flexShrink: 0,
                            borderRadius: 8,
                            background: isCopied ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface)',
                            color: isCopied ? '#34D399' : 'var(--text-primary)',
                            border: `1px solid ${isCopied ? 'rgba(16, 185, 129, 0.3)' : 'var(--bg-border)'}`,
                          }}
                        >
                          {isCopied ? <Check size={15} color="#34D399" /> : <Copy size={15} />}
                          <span>{isCopied ? 'Copied' : 'Copy Key'}</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to regenerate API key for ${p.site_name}? Previous key will stop working immediately.`)) {
                              regenerateKeyMutation.mutate(p.id)
                            }
                          }}
                          disabled={regenerateKeyMutation.isPending}
                          className="btn btn-ghost"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: 'var(--text-muted)',
                            fontSize: '0.8125rem',
                            padding: '10px 14px',
                            flexShrink: 0,
                            borderRadius: 8,
                          }}
                          title="Rotate / Regenerate API Key"
                        >
                          <RefreshCw size={14} className={regenerateKeyMutation.isPending ? 'spin' : ''} />
                          <span>Rotate</span>
                        </button>
                      </div>

                      {p.webhook_url && (
                        <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>Webhook Receiver:</span>
                          <code style={{ color: 'var(--text-secondary)', background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', padding: '2px 8px', borderRadius: 4 }}>
                            {p.webhook_url}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Action Bar */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: 10,
                      paddingTop: 12,
                      borderTop: '1px solid var(--bg-border)',
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => setCodeModalPartner(p)}
                          className="btn btn-secondary"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.8rem',
                            padding: '6px 14px',
                            fontWeight: 600,
                          }}
                        >
                          <Code size={14} color="#FFD200" />
                          <span>View Integration Code</span>
                        </button>

                        <button
                          onClick={() => {
                            updatePartnerMutation.mutate({
                              id: p.id,
                              data: { status: p.status === 'active' ? 'paused' : 'active' }
                            })
                          }}
                          className="btn btn-ghost"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontSize: '0.8rem',
                            color: p.status === 'active' ? 'var(--text-muted)' : '#34D399',
                          }}
                        >
                          {p.status === 'active' ? <Pause size={14} /> : <Play size={14} />}
                          <span>{p.status === 'active' ? 'Pause Site' : 'Resume Site'}</span>
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => {
                            setEditingPartner(p)
                            setPartnerForm({
                              site_name: p.site_name,
                              site_url: p.site_url,
                              webhook_url: p.webhook_url || '',
                              notes: p.notes || '',
                            })
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}
                        >
                          <Edit size={14} />
                          <span>Edit</span>
                        </button>

                        <button
                          onClick={() => {
                            if (confirm(`Delete ${p.site_name}? This action cannot be undone.`)) {
                              deletePartnerMutation.mutate(p.id)
                            }
                          }}
                          className="btn btn-ghost"
                          style={{ padding: '6px 12px', color: '#EF4444', fontSize: '0.8rem' }}
                        >
                          <Trash2 size={14} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: Live Transactions Ledger ── */}
      {activeTab === 'transactions' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: 20,
        }}>
          {/* Filters Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: 12,
            marginBottom: 16,
          }}>
            <div style={{ position: 'relative', width: 280 }}>
              <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input-field"
                placeholder="Search order, phone, item..."
                value={txSearch}
                onChange={e => setTxSearch(e.target.value)}
                style={{ paddingLeft: 36, fontSize: '0.8125rem' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              {['', 'PAID', 'PENDING', 'FAILED'].map(st => (
                <button
                  key={st}
                  onClick={() => setTxStatusFilter(st)}
                  className={`btn ${txStatusFilter === st ? 'btn-primary' : 'btn-ghost'}`}
                  style={{
                    fontSize: '0.78rem',
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: txStatusFilter === st ? '#FFD200' : 'transparent',
                    color: txStatusFilter === st ? '#000' : 'var(--text-muted)',
                    fontWeight: txStatusFilter === st ? 700 : 500,
                  }}
                >
                  {st || 'All Statuses'}
                </button>
              ))}
            </div>
          </div>

          {/* Transactions Table */}
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No transactions found matching criteria.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 10px' }}>Order #</th>
                    <th style={{ padding: '12px 10px' }}>Site / Origin</th>
                    <th style={{ padding: '12px 10px' }}>Item Unlocked</th>
                    <th style={{ padding: '12px 10px' }}>Customer</th>
                    <th style={{ padding: '12px 10px' }}>Amount</th>
                    <th style={{ padding: '12px 10px' }}>Status</th>
                    <th style={{ padding: '12px 10px' }}>Webhook</th>
                    <th style={{ padding: '12px 10px' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                      <td style={{ padding: '12px 10px', fontFamily: 'monospace', fontWeight: 700 }}>
                        {tx.order_number}
                      </td>
                      <td style={{ padding: '12px 10px', color: '#38BDF8' }}>
                        {tx.origin_site?.replace('https://', '') || '—'}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-primary)' }}>
                        {tx.item_name || tx.item_id}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)' }}>
                        {tx.customer_phone || tx.customer_name || 'Guest'}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: '#FFD200' }}>
                        ₹{tx.amount}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          background: tx.status === 'PAID' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: tx.status === 'PAID' ? '#34D399' : '#F59E0B',
                        }}>
                          {tx.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {tx.webhook_delivered ? (
                          <span style={{ color: '#34D399', fontSize: '0.72rem' }}>✓ Sent</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {new Date(tx.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: 100% Cashfree Stealth Shield ── */}
      {activeTab === 'stealth' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34D399',
            }}>
              <Shield size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                Cashfree 100% Stealth Isolation Layer
              </h3>
              <p style={{ margin: 0, fontSize: '0.8125rem', color: '#34D399' }}>
                Active & Protecting Your Cashfree Merchant Account
              </p>
            </div>
          </div>

          <div style={{
            background: 'var(--bg-elevated)',
            borderRadius: 12,
            padding: 18,
            border: '1px solid var(--bg-border)',
            marginBottom: 20,
            fontSize: '0.85rem',
            lineHeight: 1.6,
            color: 'var(--text-secondary)',
          }}>
            <p style={{ margin: '0 0 12px' }}>
              <strong>Cashfree Compliance Guarantee:</strong> Cashfree's automated bank audit crawlers, merchant review team, and fraud detection algorithms will <strong>NEVER</strong> see <code>instatextpro.online</code> or any other external domain.
            </p>

            <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <li>
                <strong>Stealth Return URL Masking:</strong> When creating orders, the <code>return_url</code> registered with Cashfree points strictly to <code>https://1024teraviralhub.com/api/external/return?order=...</code>. Once PhonePe finishes, our worker instantly 302-redirects the user back to their chat session in 40ms.
              </li>
              <li>
                <strong>Internal Product Tagging:</strong> The <code>order_meta</code> payload sent to Cashfree is strictly sanitized to <code>asset_type: 'digital_media_license'</code>. No third-party domain or AI chat term is ever stored on Cashfree servers.
              </li>
              <li>
                <strong>Sanitized Buyer Fallbacks:</strong> If the guest user does not provide an email, fallback emails are automatically generated as <code>buyer_xxxx@1024teraviralhub.com</code>.
              </li>
            </ul>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 14,
          }}>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Registered PG Merchant</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>1024TeraViralHub.com</div>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit Return URL Pattern</div>
              <div style={{ fontWeight: 700, marginTop: 4, fontFamily: 'monospace', fontSize: '0.78rem', color: '#38BDF8' }}>
                https://1024teraviralhub.com/api/external/return
              </div>
            </div>
            <div style={{ padding: 14, background: 'var(--bg-elevated)', borderRadius: 10, border: '1px solid var(--bg-border)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Order Classification</div>
              <div style={{ fontWeight: 700, marginTop: 4 }}>Digital VIP Asset License</div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 4: API Documentation & Integration Setup ── */}
      {activeTab === 'docs' && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-lg, 16px)',
          padding: 28,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'rgba(255, 210, 0, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFD200',
              }}>
                <BookOpen size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  External Gateway API Reference
                </h3>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                  Complete technical guide to integrate 1-Click PhonePe payments into any website.
                </p>
              </div>
            </div>

            <div style={{
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              background: 'var(--bg-elevated)',
              padding: '6px 14px',
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
            }}>
              Full guide saved to: <code style={{ color: '#FFD200' }}>EXTERNAL_GATEWAY_API_DOCS.md</code>
            </div>
          </div>

          {/* Section 1: Endpoints Table */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              1. Gateway API Endpoints
            </h4>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>Method</th>
                    <th style={{ padding: '10px' }}>Endpoint</th>
                    <th style={{ padding: '10px' }}>Auth Header</th>
                    <th style={{ padding: '10px' }}>Purpose</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(59, 130, 246, 0.15)', color: '#38BDF8', fontWeight: 700 }}>POST</span></td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#FFD200' }}>/api/external/create-order</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>X-Partner-Key</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Creates Cashfree order & returns native PhonePe deep link</td>
                  </tr>
                  <tr style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 700 }}>GET</span></td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#FFD200' }}>/api/external/verify-order/:orderNumber</td>
                    <td style={{ padding: '10px', fontFamily: 'monospace' }}>X-Partner-Key</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Polls/checks real-time payment status from Cashfree</td>
                  </tr>
                  <tr>
                    <td style={{ padding: '10px' }}><span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontWeight: 700 }}>GET</span></td>
                    <td style={{ padding: '10px', fontFamily: 'monospace', color: '#FFD200' }}>/api/external/return?order=EXT-XXX</td>
                    <td style={{ padding: '10px', color: 'var(--text-muted)' }}>None (Public)</td>
                    <td style={{ padding: '10px', color: 'var(--text-secondary)' }}>Stealth return URL: instantly 302-redirects browser to partner chat</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Create Order Request Sample */}
          <div style={{ marginBottom: 28 }}>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              2. Initiating 1-Click PhonePe Payment (POST /api/external/create-order)
            </h4>
            <pre style={{
              background: '#0D1117',
              padding: 16,
              borderRadius: 12,
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              color: '#F1F5F9',
              overflowX: 'auto',
              border: '1px solid var(--bg-border)',
              lineHeight: 1.5,
            }}>
{`// Server-side (Node.js / Next.js) on your partner website:
const response = await fetch("https://1024teraviralhub.hirensrivastawa.workers.dev/api/external/create-order", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "X-Partner-Key": process.env.TVH_PARTNER_KEY // Found in Connected Websites tab
  },
  body: JSON.stringify({
    amount: 49,
    item_id: "photo_vip_09",
    chat_session_id: "guest_user_8821",
    customer_name: "Rahul",
    return_url: "https://instatextpro.online/chat?session=guest_user_8821&unlocked=photo_vip_09",
    webhook_url: "https://instatextpro.online/api/webhook/payment"
  })
});

const data = await response.json();

// Direct Native PhonePe Launch on Mobile:
if (data.phonepe_deep_link) {
  window.location.href = data.phonepe_deep_link; // PhonePe App opens directly!
}`}
            </pre>
          </div>

          {/* Section 3: Webhook Verification */}
          <div>
            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: 10, color: 'var(--text-primary)' }}>
              3. Webhook Listener & Signature Verification (app/api/webhook/payment/route.ts)
            </h4>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 10 }}>
              Verify the <code>X-Gateway-Signature</code> header using HMAC-SHA256 with your partner secret key before unlocking photos.
            </p>
            <pre style={{
              background: '#0D1117',
              padding: 16,
              borderRadius: 12,
              fontSize: '0.8125rem',
              fontFamily: 'monospace',
              color: '#34D399',
              overflowX: 'auto',
              border: '1px solid var(--bg-border)',
              lineHeight: 1.5,
            }}>
{`import crypto from 'crypto'

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get('X-Gateway-Signature');
  const secretKey = process.env.TVH_PARTNER_KEY!;

  const expectedSignature = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex');

  if (signature !== expectedSignature) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { chat_session_id, item_id, status } = JSON.parse(rawBody);

  if (status === 'PAID') {
    // 🔓 Mark photo as unlocked for this guest session in your database!
    console.log("Unlocked item:", item_id, "for session:", chat_session_id);
  }

  return new Response(JSON.stringify({ success: true }));
}`}
            </pre>
          </div>
        </div>
      )}

      {/* ── Modal: Connect / Edit Partner Website ── */}
      {(isAddModalOpen || editingPartner) && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 480,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 16px' }}>
              {editingPartner ? 'Edit Partner Website' : 'Connect New Website'}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Website Name *
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. InstaTextPro AI Chat or ViralReels Hub"
                  value={partnerForm.site_name}
                  onChange={e => setPartnerForm(f => ({ ...f, site_name: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Website URL / Domain *
                </label>
                <input
                  className="input-field"
                  placeholder="https://instatextpro.online"
                  value={partnerForm.site_url}
                  onChange={e => setPartnerForm(f => ({ ...f, site_url: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Webhook URL (Optional)
                </label>
                <input
                  className="input-field"
                  placeholder="https://instatextpro.online/api/webhook/payment"
                  value={partnerForm.webhook_url}
                  onChange={e => setPartnerForm(f => ({ ...f, webhook_url: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Notes / Description
                </label>
                <input
                  className="input-field"
                  placeholder="e.g. AI Girl locked photo unlock portal"
                  value={partnerForm.notes}
                  onChange={e => setPartnerForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24 }}>
              <button
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingPartner(null)
                }}
                className="btn btn-ghost"
                style={{ padding: '8px 16px' }}
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (editingPartner) {
                    updatePartnerMutation.mutate({
                      id: editingPartner.id,
                      data: partnerForm,
                    })
                  } else {
                    createPartnerMutation.mutate(partnerForm)
                  }
                }}
                disabled={!partnerForm.site_name || !partnerForm.site_url || createPartnerMutation.isPending}
                className="btn btn-primary"
                style={{ background: '#FFD200', color: '#000', fontWeight: 700, padding: '8px 20px' }}
              >
                {editingPartner ? 'Save Changes' : 'Connect Website'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Integration Code Snippet ── */}
      {codeModalPartner && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 600,
            width: '100%',
            boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            maxHeight: '90vh',
            overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>
                  Integration Kit: {codeModalPartner.site_name}
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Ready-to-use credentials for your Next.js project.
                </p>
              </div>
              <button
                onClick={() => setCodeModalPartner(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  1. Paste into <code>.env.local</code> on {codeModalPartner.site_name}
                </label>
                <pre style={{
                  background: '#0D1117',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#34D399',
                  overflowX: 'auto',
                  border: '1px solid var(--bg-border)',
                }}>
{`TVH_GATEWAY_URL="https://1024teraviralhub.hirensrivastawa.workers.dev"
TVH_PARTNER_KEY="${codeModalPartner.api_key}"
NEXT_PUBLIC_SITE_URL="${codeModalPartner.site_url}"`}
                </pre>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, marginBottom: 4 }}>
                  2. 1-Click PhonePe Trigger (Frontend React)
                </label>
                <pre style={{
                  background: '#0D1117',
                  padding: 12,
                  borderRadius: 10,
                  fontSize: '0.78rem',
                  fontFamily: 'monospace',
                  color: '#FCD34D',
                  overflowX: 'auto',
                  border: '1px solid var(--bg-border)',
                }}>
{`// When user clicks "Unlock Photo" on mobile:
const res = await fetch('/api/unlock-photo', { method: 'POST', ... });
const data = await res.json();
if (data.phonepeDeepLink) {
  // Instantly opens the native PhonePe app!
  window.location.href = data.phonepeDeepLink;
}`}
                </pre>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
              <button
                onClick={() => setCodeModalPartner(null)}
                className="btn btn-secondary"
                style={{ padding: '8px 18px', fontWeight: 600 }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
