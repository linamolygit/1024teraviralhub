// src/client/components/admin/UploadProgressToast.tsx
import React from 'react'
import {
  CheckCircle2, Loader2, Image as ImageIcon,
  Package, FileArchive, X, ExternalLink, Sparkles, AlertTriangle
} from 'lucide-react'

export interface UploadStepItem {
  id: string
  label: string
  type: 'gallery' | 'deliverable' | 'data'
  status: 'pending' | 'processing' | 'completed' | 'error'
  detail?: string
}

export interface UploadProgressToastProps {
  isOpen: boolean
  overallProgress: number // 0 to 100
  title?: string
  statusText?: string
  currentItem?: {
    name: string
    type: 'gallery' | 'deliverable' | 'data'
    index?: number
    total?: number
    size?: number
  } | null
  steps?: UploadStepItem[]
  isCompleted?: boolean
  errorMessage?: string
  productSlug?: string
  onClose?: () => void
}

export default function UploadProgressToast({
  isOpen,
  overallProgress,
  title = 'Uploading Product Assets & Media',
  statusText,
  currentItem,
  steps = [],
  isCompleted = false,
  errorMessage,
  productSlug,
  onClose,
}: UploadProgressToastProps) {
  if (!isOpen) return null

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        width: 420,
        maxWidth: 'calc(100vw - 32px)',
        zIndex: 9999,
        background: 'var(--bg-surface, #FFFFFF)',
        border: isCompleted
          ? '1px solid rgba(17, 98, 242, 0.4)'
          : errorMessage
          ? '1px solid rgba(239, 68, 68, 0.4)'
          : '1px solid rgba(17, 98, 242, 0.35)',
        borderRadius: '16px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.18), 0 4px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Progress Indicator Bar on Top ── */}
      <div
        style={{
          height: 5,
          width: '100%',
          background: 'rgba(0,0,0,0.06)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${Math.min(100, Math.max(0, overallProgress))}%`,
            background: errorMessage
              ? '#EF4444'
              : 'linear-gradient(90deg, #1162F2, #7C3AED)',
            transition: 'width 0.25s ease-out',
          }}
        />
      </div>

      {/* ── Toast Header ── */}
      <div
        style={{
          padding: '16px 18px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--bg-border, #E5E7EB)',
          background: isCompleted
            ? 'linear-gradient(180deg, rgba(17, 98, 242, 0.08) 0%, rgba(124, 58, 237, 0.03) 100%)'
            : 'linear-gradient(180deg, rgba(17, 98, 242, 0.04) 0%, transparent 100%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: isCompleted
                ? 'linear-gradient(135deg, rgba(17, 98, 242, 0.18), rgba(124, 58, 237, 0.18))'
                : errorMessage
                ? 'rgba(239, 68, 68, 0.15)'
                : 'rgba(17, 98, 242, 0.12)',
              color: errorMessage ? '#EF4444' : '#1162F2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isCompleted ? (
              <CheckCircle2 size={18} />
            ) : errorMessage ? (
              <AlertTriangle size={18} />
            ) : (
              <Loader2 size={18} className="animate-spin" />
            )}
          </div>

          <div>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)' }}>
              {isCompleted ? '✓ Upload & Sync Complete!' : errorMessage ? 'Upload Encountered an Issue' : title}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {isCompleted
                ? 'All gallery images and deliverable files are ready'
                : `${Math.round(overallProgress)}% Completed`}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Active Currently Uploading Item Card ── */}
      {!isCompleted && !errorMessage && currentItem && (
        <div
          style={{
            padding: '14px 18px',
            background: 'var(--bg-elevated, #F8FAFC)',
            borderBottom: '1px solid var(--bg-border, #E5E7EB)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {currentItem.type === 'gallery' ? (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(17, 98, 242, 0.12)',
                  color: '#1162F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ImageIcon size={11} /> Showcase Gallery Image {currentItem.index ? `[${currentItem.index}/${currentItem.total}]` : ''}
              </span>
            ) : currentItem.type === 'deliverable' ? (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.14), rgba(124, 58, 237, 0.14))',
                  border: '1px solid rgba(17, 98, 242, 0.25)',
                  color: '#1162F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Package size={11} /> Product Deliverable Asset
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: 'rgba(124, 58, 237, 0.12)',
                  color: '#7C3AED',
                }}
              >
                Syncing Database
              </span>
            )}

            {currentItem.size && (
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                ({formatFileSize(currentItem.size)})
              </span>
            )}
          </div>

          <div
            style={{
              fontWeight: 700,
              fontSize: '0.825rem',
              color: 'var(--text-primary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {currentItem.name}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {statusText ||
              (currentItem.type === 'gallery'
                ? 'Generating responsive WebP variants (Thumb, Medium, Large) & Uploading...'
                : 'Uploading direct deliverable file to Cloudflare R2 bucket...')}
          </div>
        </div>
      )}

      {/* ── Step-by-Step Checklist ── */}
      {steps.length > 0 && (
        <div
          style={{
            padding: '12px 18px',
            maxHeight: 160,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {steps.map((step) => {
            const isDone = step.status === 'completed'
            const isCurrent = step.status === 'processing'
            const isErr = step.status === 'error'

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.78rem',
                  gap: 8,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
                  {isDone ? (
                    <CheckCircle2 size={15} color="#1162F2" style={{ flexShrink: 0 }} />
                  ) : isCurrent ? (
                    <Loader2 size={15} color="#1162F2" className="animate-spin" style={{ flexShrink: 0 }} />
                  ) : isErr ? (
                    <X size={15} color="#EF4444" style={{ flexShrink: 0 }} />
                  ) : (
                    <div
                      style={{
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        border: '2px solid var(--bg-border, #CBD5E1)',
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: isDone ? 'var(--text-primary)' : isCurrent ? '#1162F2' : 'var(--text-muted)',
                      fontWeight: isCurrent ? 700 : isDone ? 500 : 400,
                    }}
                  >
                    {step.label}
                  </span>
                </div>

                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 600,
                    padding: '1px 6px',
                    borderRadius: 4,
                    background: isDone
                      ? 'linear-gradient(135deg, rgba(17, 98, 242, 0.12), rgba(124, 58, 237, 0.12))'
                      : isCurrent
                      ? 'rgba(17,98,242,0.1)'
                      : 'transparent',
                    color: isDone ? '#1162F2' : isCurrent ? '#1162F2' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? 'Done' : isCurrent ? 'Uploading...' : 'Waiting'}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Completed Footer with Quick Links ── */}
      {isCompleted && (
        <div
          style={{
            padding: '12px 18px',
            borderTop: '1px solid var(--bg-border, #E5E7EB)',
            background: 'var(--bg-elevated, #F8FAFC)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          {productSlug && (
            <a
              href={`/product/${productSlug}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#1162F2',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={14} /> View Product on Store
            </a>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="btn-primary"
              style={{
                fontSize: '0.78rem',
                padding: '6px 14px',
                marginLeft: 'auto',
                background: 'linear-gradient(135deg, #1162f2, #7c3aed)',
                borderColor: '#1162f2',
              }}
            >
              Done & Close
            </button>
          )}
        </div>
      )}

      {/* ── Error Notification ── */}
      {errorMessage && (
        <div
          style={{
            padding: '10px 18px',
            background: 'rgba(239, 68, 68, 0.08)',
            borderTop: '1px solid rgba(239, 68, 68, 0.2)',
            fontSize: '0.78rem',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>{errorMessage}</span>
          {onClose && (
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#EF4444',
                fontWeight: 700,
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      )}
    </div>
  )
}
