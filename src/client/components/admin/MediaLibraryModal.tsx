// src/client/components/admin/MediaLibraryModal.tsx — Apple Glass Media Library & Zero-Storage Asset Browser
import { useState, useEffect } from 'react'
import {
  X,
  Search,
  CheckCircle2,
  HardDrive,
  Layers,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Play,
  Film,
  Video,
} from 'lucide-react'
import { adminApi } from '../../lib/api'
import { useAuthStore } from '../../lib/auth-store'
import { formatBytes } from '../../lib/hash-utils'

export interface MediaAssetItem {
  id: number
  content_hash: string
  r2_key: string
  url: string
  thumb_url: string
  original_filename: string
  file_size: number
  mime_type: string
  reference_count: number
  created_at: string
}

export interface MediaLibraryModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectAsset: (asset: MediaAssetItem) => void
  onSelectMultiple?: (assets: MediaAssetItem[]) => void
  alreadyAttachedKeys?: string[]
  mediaType?: 'image' | 'video' | 'all'
  title?: string
}

export default function MediaLibraryModal({
  isOpen,
  onClose,
  onSelectAsset,
  onSelectMultiple,
  alreadyAttachedKeys = [],
  mediaType = 'all',
  title,
}: MediaLibraryModalProps) {
  const isVideoMode = mediaType === 'video'
  const { getToken } = useAuthStore()
  const [assets, setAssets] = useState<MediaAssetItem[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set())

  const fetchAssets = async (query = '') => {
    setLoading(true)
    try {
      const token = await getToken()
      if (!token) return
      const res = await adminApi.products.getMediaLibrary(token, {
        q: query,
        limit: 60,
        type: mediaType || 'all',
      })
      if (res.success) {
        let loaded = res.assets || []
        if (isVideoMode) {
          loaded = loaded.filter(
            (a) =>
              (a.mime_type && a.mime_type.startsWith('video/')) ||
              /\.(mp4|webm|mov|mkv)$/i.test(a.original_filename || a.r2_key)
          )
        }
        setAssets(loaded)
      }
    } catch (err) {
      console.error('Failed to load media library assets:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      setSelectedKeys(new Set())
      fetchAssets(searchQuery)
    }
  }, [isOpen])

  // Debounced search
  useEffect(() => {
    if (!isOpen) return
    const timer = setTimeout(() => {
      fetchAssets(searchQuery)
    }, 280)
    return () => clearTimeout(timer)
  }, [searchQuery])

  if (!isOpen) return null

  const toggleSelect = (asset: MediaAssetItem) => {
    if (isVideoMode) {
      const next = new Set<string>()
      if (!selectedKeys.has(asset.r2_key)) {
        next.add(asset.r2_key)
      }
      setSelectedKeys(next)
      return
    }
    const next = new Set(selectedKeys)
    if (next.has(asset.r2_key)) {
      next.delete(asset.r2_key)
    } else {
      next.add(asset.r2_key)
    }
    setSelectedKeys(next)
  }

  const handleConfirmMulti = () => {
    if (selectedKeys.size === 0) return
    const chosen = assets.filter((a) => selectedKeys.has(a.r2_key))
    if (onSelectMultiple && !isVideoMode) {
      onSelectMultiple(chosen)
    } else if (chosen.length > 0) {
      onSelectAsset(chosen[0])
    }
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        backgroundColor: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '960px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--bg-surface, #131722)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '20px',
          boxShadow: '0 24px 70px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255,255,255,0.08)',
          overflow: 'hidden',
        }}
      >
        {/* ── Modal Header ── */}
        <div
          style={{
            padding: '20px 24px 16px',
            borderBottom: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: isVideoMode
                  ? 'linear-gradient(135deg, rgba(17,98,242,0.2) 0%, rgba(124,58,237,0.2) 100%)'
                  : 'linear-gradient(135deg, rgba(17,98,242,0.2) 0%, rgba(16,185,129,0.2) 100%)',
                border: isVideoMode ? '1px solid rgba(124,58,237,0.3)' : '1px solid rgba(16,185,129,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isVideoMode ? '#8B5CF6' : '#10B981',
              }}
            >
              {isVideoMode ? <Film size={22} /> : <Layers size={22} />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary, #fff)' }}>
                  {title || (isVideoMode ? 'Video Storage Library' : 'Media Library & Asset Storage')}
                </h3>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 8px',
                    borderRadius: 999,
                    background: 'rgba(16,185,129,0.15)',
                    border: '1px solid rgba(16,185,129,0.3)',
                    color: '#34D399',
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    letterSpacing: '0.02em',
                  }}
                >
                  <Sparkles size={11} /> 0 KB Deduplication Active
                </span>
              </div>
              <p style={{ margin: '3px 0 0', fontSize: '0.8rem', color: 'var(--text-muted, #94A3B8)' }}>
                {isVideoMode
                  ? 'Re-use any previously uploaded promotional or showcase video. Zero duplicate storage used!'
                  : 'Re-use any previously uploaded image across products without duplicating files or consuming extra R2 storage.'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-elevated, rgba(255,255,255,0.06))',
              border: '1px solid var(--bg-border, rgba(255,255,255,0.1))',
              color: 'var(--text-muted, #94A3B8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* ── Search & Controls Bar ── */}
        <div
          style={{
            padding: '14px 24px',
            borderBottom: '1px solid var(--bg-border, rgba(255,255,255,0.06))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            background: 'var(--bg-elevated, rgba(255,255,255,0.02))',
          }}
        >
          <div style={{ position: 'relative', flex: 1, maxWidth: 460 }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted, #94A3B8)',
              }}
            />
            <input
              type="text"
              placeholder={isVideoMode ? 'Search existing videos by filename...' : 'Search existing images by filename...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '9px 14px 9px 38px',
                borderRadius: 10,
                background: 'var(--bg-surface, rgba(0,0,0,0.3))',
                border: '1px solid var(--bg-border, rgba(255,255,255,0.12))',
                color: 'var(--text-primary, #fff)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94A3B8)',
                  cursor: 'pointer',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94A3B8)' }}>
              {assets.length} {assets.length === 1 ? (isVideoMode ? 'video' : 'image') : (isVideoMode ? 'videos' : 'images')} in storage
            </span>
            <button
              type="button"
              onClick={() => fetchAssets(searchQuery)}
              disabled={loading}
              style={{
                background: 'none',
                border: '1px solid var(--bg-border, rgba(255,255,255,0.1))',
                borderRadius: 8,
                padding: '7px 12px',
                color: 'var(--text-secondary, #E2E8F0)',
                fontSize: '0.78rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Image Grid Content ── */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '20px 24px',
            minHeight: '320px',
          }}
        >
          {loading && assets.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 280,
                color: 'var(--text-muted, #94A3B8)',
                gap: 12,
              }}
            >
              <RefreshCw size={28} className="animate-spin" style={{ color: '#1162F2' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Loading media assets from Cloudflare R2...</span>
            </div>
          ) : assets.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: 280,
                color: 'var(--text-muted, #94A3B8)',
                textAlign: 'center',
                gap: 12,
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isVideoMode ? <Video size={26} color="#8B5CF6" /> : <ImageIcon size={26} />}
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary, #fff)' }}>
                {searchQuery
                  ? (isVideoMode ? 'No matching videos found' : 'No matching images found')
                  : (isVideoMode ? 'No showcase videos uploaded yet' : 'No images uploaded yet')}
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', maxWidth: 360 }}>
                {searchQuery
                  ? `Try a different keyword or clear your search.`
                  : (isVideoMode
                      ? `Upload videos in the product video card. They will automatically be cataloged here for instant zero-storage reuse!`
                      : `Upload images in any product creation form. They will automatically be cataloged here for zero-storage reuse!`)}
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
                gap: 14,
              }}
            >
              {assets.map((asset) => {
                const isSelected = selectedKeys.has(asset.r2_key)
                const isAlreadyAttached = alreadyAttachedKeys.includes(asset.r2_key)

                return (
                  <div
                    key={asset.id || asset.r2_key}
                    onClick={() => {
                      if (isAlreadyAttached) return
                      toggleSelect(asset)
                    }}
                    style={{
                      position: 'relative',
                      borderRadius: 12,
                      border: isSelected
                        ? '2px solid #10B981'
                        : isAlreadyAttached
                        ? '1px solid rgba(255,255,255,0.06)'
                        : '1px solid var(--bg-border, rgba(255,255,255,0.1))',
                      background: 'var(--bg-elevated, rgba(255,255,255,0.03))',
                      overflow: 'hidden',
                      cursor: isAlreadyAttached ? 'not-allowed' : 'pointer',
                      opacity: isAlreadyAttached ? 0.45 : 1,
                      boxShadow: isSelected
                        ? '0 0 16px rgba(16,185,129,0.35)'
                        : '0 2px 6px rgba(0,0,0,0.2)',
                      transition: 'all 0.15s ease',
                      transform: isSelected ? 'scale(0.98)' : 'scale(1)',
                    }}
                    title={
                      isAlreadyAttached
                        ? 'Already attached to this product'
                        : `${asset.original_filename} (${formatBytes(asset.file_size)})`
                    }
                  >
                    {/* Thumbnail Image / Video Preview */}
                    <div style={{ width: '100%', aspectRatio: '1/1', background: '#0B0F19', position: 'relative' }}>
                      {isVideoMode || asset.mime_type?.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(asset.original_filename || asset.r2_key) ? (
                        <>
                          <video
                            src={`${asset.url}#t=0.5`}
                            preload="metadata"
                            muted
                            playsInline
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              display: 'block',
                              pointerEvents: 'none',
                            }}
                          />
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                            }}
                          >
                            <div
                              style={{
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg, #1162F2 0%, #7C3AED 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                              }}
                            >
                              <Play size={13} fill="#fff" style={{ marginLeft: 2 }} />
                            </div>
                            <span
                              style={{
                                fontSize: '0.6rem',
                                fontWeight: 800,
                                color: '#fff',
                                textTransform: 'uppercase',
                                background: 'rgba(0,0,0,0.6)',
                                padding: '1px 6px',
                                borderRadius: 4,
                              }}
                            >
                              Video
                            </span>
                          </div>
                        </>
                      ) : (
                        <img
                          src={asset.thumb_url || asset.url}
                          alt={asset.original_filename}
                          loading="lazy"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block',
                          }}
                        />
                      )}

                      {/* Selected Overlay Checkmark */}
                      {isSelected && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(16,185,129,0.25)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: '50%',
                              background: '#10B981',
                              color: '#fff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
                            }}
                          >
                            <Check size={18} strokeWidth={3} />
                          </div>
                        </div>
                      )}

                      {/* Already Attached Badge */}
                      {isAlreadyAttached && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 6,
                            left: 6,
                            right: 6,
                            background: 'rgba(0,0,0,0.85)',
                            borderRadius: 4,
                            padding: '2px 6px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            color: '#94A3B8',
                            textAlign: 'center',
                          }}
                        >
                          Already In Gallery
                        </div>
                      )}

                      {/* Reference count pill */}
                      {asset.reference_count > 1 && !isAlreadyAttached && (
                        <span
                          style={{
                            position: 'absolute',
                            top: 6,
                            left: 6,
                            background: 'rgba(0,0,0,0.7)',
                            backdropFilter: 'blur(4px)',
                            color: '#34D399',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            padding: '2px 6px',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Layers size={9} /> {asset.reference_count}x used
                        </span>
                      )}
                    </div>

                    {/* Metadata Footer */}
                    <div style={{ padding: '8px 10px' }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.74rem',
                          fontWeight: 600,
                          color: 'var(--text-primary, #fff)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {asset.original_filename}
                      </p>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginTop: 3,
                          fontSize: '0.66rem',
                          color: 'var(--text-muted, #94A3B8)',
                        }}
                      >
                        <span>{formatBytes(asset.file_size)}</span>
                        <span style={{ color: '#10B981', fontWeight: 600 }}>0 KB duplicate</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Modal Footer ── */}
        <div
          style={{
            padding: '16px 24px',
            borderTop: '1px solid var(--bg-border, rgba(255,255,255,0.08))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-elevated, rgba(255,255,255,0.02))',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', color: 'var(--text-muted, #94A3B8)' }}>
            <HardDrive size={15} style={{ color: '#10B981' }} />
            <span>
              {selectedKeys.size > 0 ? (
                <strong style={{ color: '#10B981' }}>
                  {selectedKeys.size} {isVideoMode ? 'video' : 'image(s)'} selected
                </strong>
              ) : (
                `Select a ${isVideoMode ? 'showcase video' : 'image'} to attach with 0 KB storage consumption`
              )}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                background: 'transparent',
                border: '1px solid var(--bg-border, rgba(255,255,255,0.12))',
                color: 'var(--text-secondary, #E2E8F0)',
                fontSize: '0.8125rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedKeys.size === 0}
              onClick={handleConfirmMulti}
              style={{
                padding: '8px 20px',
                borderRadius: 9,
                background: selectedKeys.size > 0 ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)' : 'rgba(255,255,255,0.08)',
                color: selectedKeys.size > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
                border: 'none',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: selectedKeys.size > 0 ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: selectedKeys.size > 0 ? '0 4px 14px rgba(16,185,129,0.3)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <CheckCircle2 size={15} />
              {isVideoMode ? 'Attach Selected Video (0 KB Reuse)' : `Attach Selected (${selectedKeys.size}) [0 KB Upload]`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
