// src/client/components/downloads/DownloadProductCard.tsx — Reusable Active/Expired Download Card
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  Download, Clock, CheckCircle2, AlertTriangle, FileText,
  Package, ChevronDown, ChevronUp, ExternalLink, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'
import type { PurchasedDownloadItem, DownloadFile } from '../../lib/api'
import { formatFileSize, timeRemaining } from '../../lib/utils'

interface Props {
  item: PurchasedDownloadItem
  isExpired?: boolean
}

export default function DownloadProductCard({ item, isExpired = false }: Props) {
  const [showFiles, setShowFiles] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null)
  const [isBulkDownloading, setIsBulkDownloading] = useState(false)
  const [timeLeft, setTimeLeft] = useState<string>(() => timeRemaining(item.expires_at))

  // Live countdown update every 30s
  useEffect(() => {
    if (isExpired) return
    const interval = setInterval(() => {
      setTimeLeft(timeRemaining(item.expires_at))
    }, 30000)
    return () => clearInterval(interval)
  }, [item.expires_at, isExpired])

  const isAccessActive = !isExpired && item.status === 'ACTIVE' && item.remaining_downloads > 0
  const isExpiringSoon = isAccessActive && new Date(item.expires_at).getTime() - Date.now() < 60 * 60 * 1000 // < 1 hour

  // Format purchase date
  const purchaseDate = (() => {
    try {
      const d = new Date(item.purchased_at)
      return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    } catch {
      return 'Recent purchase'
    }
  })()

  // Single file streaming download
  const handleDownloadFile = async (file: DownloadFile) => {
    if (!isAccessActive) return
    setDownloadingFileId(file.id)

    try {
      // Trigger native browser download stream
      const link = document.createElement('a')
      link.href = file.download_url
      link.setAttribute('download', file.filename)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      console.error('Download stream error:', err)
    } finally {
      setTimeout(() => setDownloadingFileId(null), 2500)
    }
  }

  // Download all files in sequence
  const handleDownloadAll = async () => {
    if (!isAccessActive || !item.files || item.files.length === 0) return
    setIsBulkDownloading(true)

    try {
      for (let i = 0; i < item.files.length; i++) {
        const f = item.files[i]
        const link = document.createElement('a')
        link.href = f.download_url
        link.setAttribute('download', f.filename)
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Small pause between sequential downloads to allow browser handling
        if (i < item.files.length - 1) {
          await new Promise((res) => setTimeout(res, 800))
        }
      }
    } catch (err) {
      console.error('Bulk download error:', err)
    } finally {
      setTimeout(() => setIsBulkDownloading(false), 2000)
    }
  }

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 'var(--radius-xl)',
        border: `1px solid ${isAccessActive ? 'var(--bg-border)' : 'rgba(239, 68, 68, 0.2)'}`,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-surface)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
    >
      {/* ── Card Header: Thumbnail + Title & Status ── */}
      <div style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
        {/* Thumbnail Preview */}
        <div
          style={{
            width: '84px',
            height: '64px',
            borderRadius: '10px',
            overflow: 'hidden',
            background: 'var(--bg-elevated)',
            border: '1px solid var(--bg-border)',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {item.product.thumbnail_url ? (
            <img
              src={item.product.thumbnail_url}
              alt={item.product.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              loading="lazy"
            />
          ) : (
            <Package size={28} color="var(--text-muted)" />
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Order #{item.order_number}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>•</span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{purchaseDate}</span>
          </div>

          <h3
            style={{
              fontSize: '1rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              lineHeight: 1.3,
              marginBottom: '6px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {item.product.title}
          </h3>

          {/* Access Status Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isAccessActive ? (
              <>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    color: isExpiringSoon ? 'var(--brand-amber)' : 'var(--success)',
                    background: isExpiringSoon ? 'rgba(245, 158, 11, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '6px',
                  }}
                >
                  <Clock size={12} /> {timeLeft}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {item.remaining_downloads}/{item.max_downloads} downloads left
                </span>
              </>
            ) : (
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--error)',
                  background: 'rgba(239, 68, 68, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                <AlertTriangle size={12} /> Download Access Expired
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Card Body / Action Bar ── */}
      <div
        style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--bg-border)',
          background: 'rgba(255, 255, 255, 0.02)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {isAccessActive ? (
          <>
            <button
              type="button"
              onClick={handleDownloadAll}
              disabled={isBulkDownloading}
              className="btn-primary"
              style={{
                padding: '10px 18px',
                fontSize: '0.8125rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontWeight: 700,
                cursor: isBulkDownloading ? 'not-allowed' : 'pointer',
              }}
            >
              {isBulkDownloading ? (
                <>
                  <RefreshCw size={14} className="spin" /> Preparing secure download...
                </>
              ) : (
                <>
                  <Download size={14} /> Download All Files ({item.files?.length || item.product.file_count})
                </>
              )}
            </button>

            {item.google_drive_link && (
              <a
                href={item.google_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  color: '#2563EB',
                  fontSize: '0.8125rem',
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={14} /> Drive Backup
              </a>
            )}

            {item.files && item.files.length > 0 && (
              <button
                type="button"
                onClick={() => setShowFiles(!showFiles)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: '0.8125rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                }}
              >
                <span>{showFiles ? 'Hide Files' : 'View File List'}</span>
                {showFiles ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', gap: '10px', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
              12-Hour access window has elapsed.
            </span>
            <Link to="/contact" className="btn-ghost" style={{ fontSize: '0.78125rem', padding: '6px 12px' }}>
              Contact Support
            </Link>
          </div>
        )}
      </div>

      {/* ── Expandable Individual File List ── */}
      {showFiles && isAccessActive && item.files && item.files.length > 0 && (
        <div
          style={{
            borderTop: '1px solid var(--bg-border)',
            padding: '14px 20px',
            background: 'var(--bg-elevated)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '2px' }}>
            Available Deliverables
          </div>

          {item.files.map((file) => {
            const isThisDownloading = downloadingFileId === file.id
            return (
              <div
                key={file.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 12px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  gap: '10px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                  <FileText size={16} color="#111827" style={{ flexShrink: 0 }} />
                  <span
                    style={{
                      fontSize: '0.8125rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {file.filename}
                  </span>
                  {file.size && (
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                      ({formatFileSize(file.size)})
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleDownloadFile(file)}
                  disabled={isThisDownloading}
                  className="btn-ghost"
                  style={{
                    padding: '4px 10px',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  {isThisDownloading ? (
                    <>
                      <RefreshCw size={12} className="spin" /> Streaming...
                    </>
                  ) : (
                    <>
                      <Download size={12} /> Download
                    </>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </motion.div>
  )
}
