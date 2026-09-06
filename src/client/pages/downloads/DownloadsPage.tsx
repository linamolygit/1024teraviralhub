// src/client/pages/downloads/DownloadsPage.tsx — Production Downloads & Purchase Access Hub
import { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, AlertCircle, RefreshCw, Clock, ShieldCheck, Search } from 'lucide-react'
import { api, type PurchasedDownloadItem } from '../../lib/api'
import DownloadProductCard from '../../components/downloads/DownloadProductCard'
import DownloadsAccessInfo from '../../components/downloads/DownloadsAccessInfo'
import DownloadsHelpSection from '../../components/downloads/DownloadsHelpSection'
import NoDownloadsState from '../../components/downloads/NoDownloadsState'
import { useSiteConfig } from '../../lib/site-config'

export default function DownloadsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { siteName } = useSiteConfig()

  const orderParam = searchParams.get('order') || ''
  const tokenParam = searchParams.get('token') || ''
  const emailParam = searchParams.get('email') || ''

  const [searchOrder, setSearchOrder] = useState(orderParam)
  const [searchEmail, setSearchEmail] = useState(emailParam)

  // Dynamic Browser Page Title
  useEffect(() => {
    document.title = `Your Downloads — ${siteName}`
  }, [siteName])

  // Fetch Purchases from backend
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['my-downloads', orderParam, tokenParam, emailParam],
    queryFn: () =>
      api.download.getPurchases({
        order: orderParam || undefined,
        tokens: tokenParam || undefined,
        email: emailParam || undefined,
      }),
  })

  const activePurchases: PurchasedDownloadItem[] = data?.active || []
  const expiredPurchases: PurchasedDownloadItem[] = data?.expired || []
  const hasPurchases = activePurchases.length > 0 || expiredPurchases.length > 0

  const handleLookupSubmit = (orderNum: string, emailStr: string) => {
    setSearchOrder(orderNum)
    setSearchEmail(emailStr)
    const newParams = new URLSearchParams()
    if (orderNum) newParams.set('order', orderNum)
    if (emailStr) newParams.set('email', emailStr)
    setSearchParams(newParams)
  }

  return (
    <div className="section" style={{ minHeight: '80vh', paddingTop: '32px', paddingBottom: '80px' }}>
      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* ── 1. Page Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'rgba(124, 58, 237, 0.15)',
              border: '1px solid rgba(124, 58, 237, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              color: 'var(--brand-purple-light)',
            }}
          >
            <Download size={26} />
          </div>

          <h1
            style={{
              fontSize: 'clamp(1.75rem, 4vw, 2.35rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Your Downloads
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '560px',
              margin: '0 auto',
              lineHeight: 1.6,
            }}
          >
            Access your purchased digital products before their secure 12-hour download access expires.
          </p>
        </div>

        {/* ── 2. Loading Skeleton ── */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {[1, 2].map((k) => (
              <div
                key={k}
                className="glass-card"
                style={{
                  padding: '24px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  height: '180px',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={18} className="spin" />
                  <span>Loading your purchases...</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 3. Error State ── */}
        {isError && !isLoading && (
          <div
            className="glass-card"
            style={{
              padding: '40px 24px',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--bg-border)',
              textAlign: 'center',
              maxWidth: '500px',
              margin: '0 auto 40px',
            }}
          >
            <AlertCircle size={44} color="var(--error)" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>
              Unable to Load Your Downloads
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px', lineHeight: 1.6 }}>
              Please check your internet connection or try refreshing the request.
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="btn-primary"
              style={{ padding: '10px 20px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Try Again
            </button>
          </div>
        )}

        {/* ── 4. Active Downloads Section ── */}
        {!isLoading && !isError && activePurchases.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: 'var(--success)',
                    display: 'inline-block',
                  }}
                />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                  Active Downloads ({activePurchases.length})
                </h2>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                12-Hour Access Window Active
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {activePurchases.map((item) => (
                <DownloadProductCard key={item.token} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* ── 5. Expired Downloads Section ── */}
        {!isLoading && !isError && expiredPurchases.length > 0 && (
          <div style={{ marginBottom: '48px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: 'var(--error)',
                  display: 'inline-block',
                }}
              />
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
                Expired Downloads ({expiredPurchases.length})
              </h2>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '24px',
              }}
            >
              {expiredPurchases.map((item) => (
                <DownloadProductCard key={item.token} item={item} isExpired />
              ))}
            </div>
          </div>
        )}

        {/* ── 6. No Purchases Found Empty State ── */}
        {!isLoading && !isError && !hasPurchases && (
          <NoDownloadsState onSearchOrder={handleLookupSubmit} isLoading={isFetching} />
        )}

        {/* ── 7. Important Purchase Access Information ── */}
        <DownloadsAccessInfo />

        {/* ── 8. Need Help Section ── */}
        <DownloadsHelpSection />
      </div>
    </div>
  )
}
