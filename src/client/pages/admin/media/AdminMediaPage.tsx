// src/client/pages/admin/media/AdminMediaPage.tsx — Production Media & Content Asset Command Center
import React, { useState, useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  HardDrive,
  Layers,
  Sparkles,
  UploadCloud,
  RefreshCw,
  Search,
  Grid,
  List,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  Info,
  X,
  FileImage,
  ArrowUpDown,
  Download,
  Eye,
  ShieldCheck,
  CheckCircle2,
  Package,
  Zap,
  Play,
  Film,
  Video,
  Image,
  Star,
} from 'lucide-react'
import { adminApi, type AdminMediaAsset, type AdminMediaMetrics } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatBytes, computeFileHash } from '../../../lib/hash-utils'
import { createImageVariants } from '../../../lib/image-optimizer'
import { adminToast } from '../../../lib/admin-toast'

export default function AdminMediaPage() {
  const { getToken } = useAuthStore()

  // Data states
  const [assets, setAssets] = useState<AdminMediaAsset[]>([])
  const [metrics, setMetrics] = useState<AdminMediaMetrics>({
    total_assets: 0,
    total_size_bytes: 0,
    storage_saved_bytes: 0,
    total_references: 0,
    total_images: 0,
    total_videos: 0,
    duplicates_prevented: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [mediaType, setMediaType] = useState<'all' | 'image' | 'video'>('all')
  const [activeFilter, setActiveFilter] = useState<'all' | 'reused' | 'single' | 'unused'>('all')
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'size_desc' | 'size_asc' | 'references_desc'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Modals & Drawers
  const [selectedAsset, setSelectedAsset] = useState<AdminMediaAsset | null>(null)
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<AdminMediaAsset | null>(null)
  const [forceDelete, setForceDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  // Upload processing state
  const [uploadQueue, setUploadQueue] = useState<
    Array<{
      id: string
      file: File
      status: 'pending' | 'hashing' | 'uploading' | 'deduplicated' | 'completed' | 'error'
      message?: string
      bytesSaved?: number
    }>
  >([])
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Copy state tracker
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(label)
    adminToast.success('Copied to Clipboard', label)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  // Helper to detect if asset is a video
  const isVideoAsset = (asset: AdminMediaAsset) => {
    if (asset.is_video) return true
    if (asset.mime_type?.startsWith('video/')) return true
    return /\.(mp4|webm|mov|mkv|avi|ogg)$/i.test(asset.original_filename)
  }

  // Fetch Media Assets
  const fetchMedia = async (isSilent = false) => {
    if (!isSilent) setLoading(true)
    else setRefreshing(true)

    try {
      const token = await getToken()
      if (!token) return

      const res = await adminApi.media.list(token, {
        q: searchQuery,
        filter: activeFilter,
        type: mediaType,
        sort: sortOption,
        limit: 120,
      })

      if (res.success) {
        setAssets(res.assets || [])
        if (res.metrics) {
          setMetrics(res.metrics)
        }
      }
    } catch (err: any) {
      console.error('Failed to load media assets:', err)
      adminToast.error('Failed to load media assets', err.message || 'Network error')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchMedia()
  }, [activeFilter, mediaType, sortOption])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchMedia(true)
    }, 320)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Handle Drag & Drop Uploads (Images & Videos)
  const handleFilesSelected = (files: FileList | File[]) => {
    const list = Array.from(files).filter(
      (f) =>
        f.type.startsWith('image/') ||
        f.type.startsWith('video/') ||
        /\.(jpg|jpeg|png|webp|gif|svg|mp4|webm|mov|mkv|pdf|zip)$/i.test(f.name)
    )
    if (list.length === 0) {
      adminToast.warning('Invalid file type', 'Please choose supported image (PNG, JPG, WebP) or video (MP4, WebM, MOV) files.')
      return
    }

    const newQueueItems = list.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      file,
      status: 'pending' as const,
    }))

    setUploadQueue((prev) => [...prev, ...newQueueItems])
    setUploadModalOpen(true)
  }

  // Process Upload Queue sequentially
  useEffect(() => {
    if (isUploading || uploadQueue.length === 0) return

    const pendingItem = uploadQueue.find((item) => item.status === 'pending')
    if (!pendingItem) return

    const processItem = async () => {
      setIsUploading(true)
      const token = await getToken()
      if (!token) {
        setIsUploading(false)
        return
      }

      // 1. Mark as hashing
      setUploadQueue((prev) =>
        prev.map((item) => (item.id === pendingItem.id ? { ...item, status: 'hashing' } : item))
      )

      try {
        const isVid =
          pendingItem.file.type.startsWith('video/') ||
          /\.(mp4|webm|mov|mkv|avi|ogg)$/i.test(pendingItem.file.name)

        // Fast client hash
        const hash = await computeFileHash(pendingItem.file)

        // 2. Generate WebP variants (images only)
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === pendingItem.id
              ? {
                  ...item,
                  status: 'uploading',
                  message: isVid ? 'Uploading video to R2...' : 'Generating WebP variants...',
                }
              : item
          )
        )

        let variants: { thumb?: Blob; medium?: Blob; large?: Blob } = {}
        if (!isVid) {
          try {
            const varRes = await createImageVariants(pendingItem.file)
            variants = {
              thumb: varRes.thumb,
              medium: varRes.medium,
              large: varRes.large,
            }
          } catch {
            // Fallback if canvas variant fails
          }
        }

        // 3. Upload to API
        const res = await adminApi.media.upload(token, pendingItem.file, variants)

        if (res.success) {
          const isDedup = Boolean(res.deduplicated)
          setUploadQueue((prev) =>
            prev.map((item) =>
              item.id === pendingItem.id
                ? {
                    ...item,
                    status: isDedup ? 'deduplicated' : 'completed',
                    message: res.message,
                    bytesSaved: res.bytes_saved,
                  }
                : item
            )
          )

          if (isDedup) {
            adminToast.info(
              '⚡ 0 KB Duplicate Detected!',
              `Reused existing ${isVid ? 'video' : 'asset'} for "${pendingItem.file.name}". Zero duplicate storage wasted.`
            )
          } else {
            adminToast.success('Asset Uploaded', `Indexed "${pendingItem.file.name}" to Cloudflare R2.`)
          }

          // Refresh media list in background
          fetchMedia(true)
        } else {
          throw new Error('Upload failed')
        }
      } catch (err: any) {
        console.error('Failed to upload file:', err)
        setUploadQueue((prev) =>
          prev.map((item) =>
            item.id === pendingItem.id
              ? { ...item, status: 'error', message: err.message || 'Upload error' }
              : item
          )
        )
        adminToast.error('Upload Failed', `Could not upload "${pendingItem.file.name}".`)
      } finally {
        setIsUploading(false)
      }
    }

    processItem()
  }, [uploadQueue, isUploading])

  // Handle Safe Deletion
  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)

    try {
      const token = await getToken()
      if (!token) return

      const res = await adminApi.media.delete(token, deleteTarget.id, forceDelete)
      if (res.success) {
        adminToast.success('Media Deleted', `Asset "${deleteTarget.original_filename}" removed from R2.`)
        setAssets((prev) => prev.filter((a) => a.id !== deleteTarget.id))
        if (selectedAsset?.id === deleteTarget.id) {
          setSelectedAsset(null)
        }
        setDeleteTarget(null)
        setForceDelete(false)
        fetchMedia(true)
      }
    } catch (err: any) {
      console.error('Failed to delete asset:', err)
      adminToast.error('Delete Denied', err.message || 'Could not delete media asset.')
    } finally {
      setDeleting(false)
    }
  }

  const [syncingSizes, setSyncingSizes] = useState(false)

  const handleSyncSizes = async () => {
    setSyncingSizes(true)
    try {
      const token = await getToken()
      if (!token) return
      const res = await adminApi.media.syncSizes(token)
      if (res.success) {
        adminToast.success('Storage Sizes Synced', res.message)
        await fetchMedia(true)
      }
    } catch (err: any) {
      adminToast.error('Sync Failed', err.message || 'Could not sync file sizes')
    } finally {
      setSyncingSizes(false)
    }
  }

  // Calculate efficiency percentage
  const savingsPct = useMemo(() => {
    const totalWithDupes = metrics.total_size_bytes + metrics.storage_saved_bytes
    if (totalWithDupes <= 0) return 0
    return Math.round((metrics.storage_saved_bytes / totalWithDupes) * 100)
  }, [metrics])

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', paddingBottom: 60 }}>
      {/* ─── Top Header ─── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(255, 210, 0, 0.12)',
                color: '#FFD200',
                fontSize: '0.75rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                border: '1px solid rgba(255, 210, 0, 0.25)',
              }}
            >
              <HardDrive size={13} /> Cloudflare R2 Storage
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 10px',
                borderRadius: 20,
                background: 'rgba(16, 185, 129, 0.12)',
                color: '#10B981',
                fontSize: '0.75rem',
                fontWeight: 700,
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <Zap size={13} /> SHA-256 Deduplication Active
            </span>
          </div>
          <h1
            style={{
              fontSize: '1.85rem',
              fontWeight: 800,
              color: 'var(--text-primary)',
              margin: '6px 0',
              letterSpacing: '-0.02em',
            }}
          >
            Media & Content Management
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: 650 }}>
            Inspect, upload, and manage all your digital assets. Enjoy real-time SHA-256 deduplication
            guaranteeing 0 KB double storage when the same image is reused.
          </p>
        </div>

        {/* Header Action Buttons */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button
            onClick={() => fetchMedia(true)}
            disabled={loading || refreshing || syncingSizes}
            className="btn"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-secondary)',
              padding: '9px 15px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Refresh asset list"
          >
            <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={handleSyncSizes}
            disabled={loading || refreshing || syncingSizes}
            className="btn"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-secondary)',
              padding: '9px 15px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.88rem',
              fontWeight: 600,
              transition: 'all 0.15s ease',
            }}
            title="Fetch accurate file sizes from Cloudflare R2"
          >
            <HardDrive size={16} className={syncingSizes ? 'animate-spin' : ''} />
            {syncingSizes ? 'Syncing...' : 'Sync Sizes'}
          </button>

          <button
            onClick={() => {
              if (fileInputRef.current) fileInputRef.current.value = ''
              fileInputRef.current?.click()
            }}
            className="btn"
            style={{
              background: '#FFD200',
              border: 'none',
              color: '#000',
              padding: '10px 18px',
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: '0.88rem',
              fontWeight: 700,
              boxShadow: '0 3px 12px rgba(255, 210, 0, 0.25)',
              transition: 'all 0.15s ease',
            }}
          >
            <UploadCloud size={17} />
            Upload Media
          </button>

          <input
            type="file"
            ref={fileInputRef}
            multiple
            accept="image/*,video/*,application/pdf,application/zip"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(e.target.files)
              }
            }}
          />
        </div>
      </div>

      {/* ─── Apple-Glass Metrics Ribbon ─── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 14,
          marginBottom: 26,
        }}
      >
        {/* Metric 1: Total Assets */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #3B82F6, #60A5FA)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              TOTAL MASTER ASSETS
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(59, 130, 246, 0.12)',
                color: '#3B82F6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileImage size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
            {metrics.total_assets.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <Image size={13} color="#3B82F6" />
              <span>{metrics.total_images ?? 0} Images</span>
            </span>
            <span style={{ color: 'var(--text-muted)', opacity: 0.6 }}>•</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              color: metrics.total_videos ? '#A78BFA' : 'inherit',
              fontWeight: metrics.total_videos ? 700 : 400,
            }}>
              <Video size={13} color={metrics.total_videos ? '#A78BFA' : 'currentColor'} />
              <span>{metrics.total_videos ?? 0} Videos</span>
            </span>
          </div>
        </div>

        {/* Metric 2: Storage Consumed */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #F59E0B, #FBBF24)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              STORAGE CONSUMED
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#F59E0B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <HardDrive size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
            {formatBytes(metrics.total_size_bytes)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Direct Cloudflare R2 object footprint
          </div>
        </div>

        {/* Metric 3: Storage Saved via Deduplication */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: metrics.storage_saved_bytes > 0 ? '1px solid rgba(16, 185, 129, 0.4)' : '1px solid var(--bg-border)',
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #10B981, #34D399)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10B981' }}>
              STORAGE SAVED (0 KB SHIELD)
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(16, 185, 129, 0.15)',
                color: '#10B981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Zap size={17} />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 8 }}>
            <span style={{ fontSize: '1.65rem', fontWeight: 800, color: '#10B981' }}>
              {formatBytes(metrics.storage_saved_bytes)}
            </span>
            {metrics.storage_saved_bytes > 0 ? (
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                }}
              >
                +{savingsPct}% saved
              </span>
            ) : (
              <span
                style={{
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <ShieldCheck size={12} color="#10B981" />
                <span>100% Unique</span>
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
            {metrics.storage_saved_bytes > 0 ? (
              `Saved by SHA-256 deduplication (${metrics.duplicates_prevented || 0} duplicate waste blocked)`
            ) : (
              <>
                <ShieldCheck size={12} color="#10B981" />
                <span>Active Shield: Re-uploading duplicate photos/videos will be blocked with 0 KB waste</span>
              </>
            )}
          </div>
        </div>

        {/* Metric 4: Active Store References */}
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 12,
            padding: '18px 20px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: 'linear-gradient(90deg, #8B5CF6, #A78BFA)',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              CATALOG USAGES
            </span>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'rgba(139, 92, 246, 0.12)',
                color: '#8B5CF6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Layers size={17} />
            </div>
          </div>
          <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 8 }}>
            {metrics.total_references.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 4 }}>
            Times assets are linked across catalog items
          </div>
        </div>
      </div>

      {/* ─── Control Bar: Search, Filters, Sort, View Toggle ─── */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          padding: '14px 16px',
          marginBottom: 20,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 14,
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Left: Search + Media Type + Usage Filter Tabs */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', flex: 1 }}>
          {/* Search Box */}
          <div
            style={{
              position: 'relative',
              minWidth: 240,
              flex: '1 1 240px',
              maxWidth: 340,
            }}
          >
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)',
              }}
            />
            <input
              type="text"
              placeholder="Search filename, R2 key, or hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                color: 'var(--text-primary)',
                fontSize: '0.85rem',
                outline: 'none',
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: 10,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 2,
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Media Type Tabs (All / Images / Videos) */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
              gap: 2,
            }}
          >
            <button
              onClick={() => setMediaType('all')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: mediaType === 'all' ? 700 : 500,
                border: 'none',
                background: mediaType === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: mediaType === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Media
            </button>
            <button
              onClick={() => setMediaType('image')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: mediaType === 'image' ? 700 : 500,
                border: 'none',
                background: mediaType === 'image' ? 'var(--bg-surface)' : 'transparent',
                color: mediaType === 'image' ? '#3B82F6' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <FileImage size={13} /> Images ({metrics.total_images ?? 0})
            </button>
            <button
              onClick={() => setMediaType('video')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: mediaType === 'video' ? 700 : 500,
                border: 'none',
                background: mediaType === 'video' ? 'var(--bg-surface)' : 'transparent',
                color: mediaType === 'video' ? '#A78BFA' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Video size={13} /> Videos ({metrics.total_videos ?? 0})
            </button>
          </div>

          {/* Usage Filter Pills */}
          <div
            style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
              gap: 2,
            }}
          >
            <button
              onClick={() => setActiveFilter('all')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'all' ? 700 : 500,
                border: 'none',
                background: activeFilter === 'all' ? 'var(--bg-surface)' : 'transparent',
                color: activeFilter === 'all' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              All Usages
            </button>
            <button
              onClick={() => setActiveFilter('reused')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'reused' ? 700 : 500,
                border: 'none',
                background: activeFilter === 'reused' ? 'var(--bg-surface)' : 'transparent',
                color: activeFilter === 'reused' ? '#10B981' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                transition: 'all 0.15s ease',
              }}
            >
              <Zap size={12} /> Reused
            </button>
            <button
              onClick={() => setActiveFilter('single')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'single' ? 700 : 500,
                border: 'none',
                background: activeFilter === 'single' ? 'var(--bg-surface)' : 'transparent',
                color: activeFilter === 'single' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Single
            </button>
            <button
              onClick={() => setActiveFilter('unused')}
              style={{
                padding: '6px 11px',
                borderRadius: 6,
                fontSize: '0.78rem',
                fontWeight: activeFilter === 'unused' ? 700 : 500,
                border: 'none',
                background: activeFilter === 'unused' ? 'var(--bg-surface)' : 'transparent',
                color: activeFilter === 'unused' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              Unused
            </button>
          </div>
        </div>

        {/* Right: Sort + View Mode */}
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <ArrowUpDown size={14} style={{ color: 'var(--text-secondary)' }} />
            <select
              value={sortOption}
              onChange={(e: any) => setSortOption(e.target.value)}
              style={{
                padding: '7px 10px',
                borderRadius: 8,
                background: 'var(--bg-primary)',
                border: '1px solid var(--bg-border)',
                color: 'var(--text-primary)',
                fontSize: '0.82rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="newest">Newest Uploaded</option>
              <option value="oldest">Oldest First</option>
              <option value="size_desc">Largest File Size</option>
              <option value="size_asc">Smallest File Size</option>
              <option value="references_desc">Most Product References</option>
            </select>
          </div>

          <div
            style={{
              display: 'flex',
              background: 'var(--bg-primary)',
              padding: 3,
              borderRadius: 8,
              border: '1px solid var(--bg-border)',
            }}
          >
            <button
              onClick={() => setViewMode('grid')}
              style={{
                padding: 6,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'grid' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'grid' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Grid View"
            >
              <Grid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              style={{
                padding: 6,
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'list' ? 'var(--bg-surface)' : 'transparent',
                color: viewMode === 'list' ? 'var(--text-primary)' : 'var(--text-secondary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Media Assets Presentation ─── */}
      {loading ? (
        <div
          style={{
            padding: 80,
            textAlign: 'center',
            background: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px solid var(--bg-border)',
          }}
        >
          <RefreshCw size={32} className="animate-spin" style={{ color: '#FFD200', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Loading media repository...</p>
        </div>
      ) : assets.length === 0 ? (
        <div
          style={{
            padding: 70,
            textAlign: 'center',
            background: 'var(--bg-surface)',
            borderRadius: 12,
            border: '1px dashed var(--bg-border)',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'rgba(255, 210, 0, 0.1)',
              color: '#FFD200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <UploadCloud size={28} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 6 }}>
            No Media Assets Found
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 420, margin: '0 auto 20px' }}>
            {searchQuery
              ? `No media matches "${searchQuery}". Try clearing search keywords or change the filter.`
              : 'Your media library is empty. Upload images or videos directly to populate assets.'}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: '#FFD200',
              color: '#000',
              border: 'none',
              padding: '9px 20px',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            Upload First Asset
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ── */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {assets.map((asset) => {
            const hasMultipleLinks = asset.products_linked && asset.products_linked.length > 1
            const isSingleLink = asset.products_linked && asset.products_linked.length === 1
            const isVid = isVideoAsset(asset)

            return (
              <div
                key={asset.id}
                onClick={() => setSelectedAsset(asset)}
                style={{
                  background: 'var(--bg-surface)',
                  border: isVid ? '1px solid rgba(167, 139, 250, 0.35)' : '1px solid var(--bg-border)',
                  borderRadius: 12,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                className="media-card-hover"
              >
                {/* Media Container (Video or Image) */}
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    aspectRatio: '16/10',
                    background: '#0a0a0a',
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isVid ? (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        height: '100%',
                        background: '#040404',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <video
                        src={asset.url}
                        preload="metadata"
                        muted
                        playsInline
                        style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'radial-gradient(circle, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.65) 100%)',
                        }}
                      >
                        <div
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: '50%',
                            background: 'rgba(255, 210, 0, 0.95)',
                            color: '#000',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 16px rgba(255, 210, 0, 0.45)',
                          }}
                        >
                          <Play size={19} fill="#000" style={{ marginLeft: 3 }} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={asset.thumb_url || asset.url}
                      alt={asset.original_filename}
                      loading="lazy"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        transition: 'transform 0.25s ease',
                      }}
                      onError={(e) => {
                        ;(e.target as any).src = asset.url
                      }}
                    />
                  )}

                  {/* Top Status Badges */}
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      right: 8,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pointerEvents: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {isVid && (
                        <span
                          style={{
                            background: 'rgba(139, 92, 246, 0.95)',
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            padding: '3px 8px',
                            borderRadius: 12,
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Film size={11} /> VIDEO
                        </span>
                      )}
                      {hasMultipleLinks ? (
                        <span
                          style={{
                            background: 'rgba(16, 185, 129, 0.92)',
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 700,
                            padding: '3px 8px',
                            borderRadius: 12,
                            backdropFilter: 'blur(4px)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                            boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                          }}
                        >
                          <Zap size={11} /> Reused ({asset.products_linked.length}x)
                        </span>
                      ) : isSingleLink ? (
                        <span
                          style={{
                            background: 'rgba(59, 130, 246, 0.85)',
                            color: '#fff',
                            fontSize: '0.68rem',
                            fontWeight: 600,
                            padding: '3px 8px',
                            borderRadius: 12,
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          1 Product
                        </span>
                      ) : (
                        <span
                          style={{
                            background: 'rgba(0,0,0,0.65)',
                            color: 'var(--text-secondary)',
                            fontSize: '0.68rem',
                            padding: '3px 7px',
                            borderRadius: 12,
                            backdropFilter: 'blur(4px)',
                          }}
                        >
                          Unused
                        </span>
                      )}
                    </div>

                    <span
                      style={{
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        fontSize: '0.68rem',
                        fontWeight: 600,
                        padding: '3px 7px',
                        borderRadius: 6,
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {formatBytes(asset.file_size)}
                    </span>
                  </div>
                </div>

                {/* Card Info Footer */}
                <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div
                    style={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: 'var(--text-primary)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      marginBottom: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                    title={asset.original_filename}
                  >
                    {isVid ? <Film size={14} style={{ color: '#A78BFA', flexShrink: 0 }} /> : null}
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{asset.original_filename}</span>
                  </div>

                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--text-secondary)',
                      fontFamily: 'monospace',
                      marginBottom: 8,
                    }}
                  >
                    #{asset.content_hash.slice(0, 12)}...
                  </div>

                  {/* Products Linked Chips */}
                  <div style={{ marginTop: 'auto', paddingTop: 6, borderTop: '1px solid var(--bg-border)' }}>
                    {asset.products_linked && asset.products_linked.length > 0 ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: '0.74rem',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        <Package size={13} style={{ color: '#FFD200', flexShrink: 0 }} />
                        <span
                          style={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {asset.products_linked[0].title}
                          {asset.products_linked.length > 1 && ` +${asset.products_linked.length - 1} more`}
                        </span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                        Not linked to any product
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ── List View ── */
        <div
          style={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            borderRadius: 12,
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr
                  style={{
                    borderBottom: '1px solid var(--bg-border)',
                    background: 'var(--bg-primary)',
                    fontSize: '0.78rem',
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  <th style={{ padding: '12px 16px', width: 60 }}>Asset</th>
                  <th style={{ padding: '12px 16px' }}>Filename & Storage Key</th>
                  <th style={{ padding: '12px 16px' }}>SHA-256 Fingerprint</th>
                  <th style={{ padding: '12px 16px' }}>File Size</th>
                  <th style={{ padding: '12px 16px' }}>Active Usages</th>
                  <th style={{ padding: '12px 16px' }}>Date Added</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((asset) => {
                  const hasMultiple = asset.products_linked && asset.products_linked.length > 1
                  const isVid = isVideoAsset(asset)

                  return (
                    <tr
                      key={asset.id}
                      style={{
                        borderBottom: '1px solid var(--bg-border)',
                        fontSize: '0.85rem',
                        color: 'var(--text-primary)',
                        transition: 'background 0.15s ease',
                      }}
                      className="table-row-hover"
                    >
                      {/* Thumbnail / Video Preview */}
                      <td style={{ padding: '10px 16px' }}>
                        <div
                          onClick={() => setSelectedAsset(asset)}
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: 8,
                            background: '#0a0a0a',
                            overflow: 'hidden',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: isVid ? '1px solid rgba(167, 139, 250, 0.4)' : '1px solid var(--bg-border)',
                            position: 'relative',
                          }}
                        >
                          {isVid ? (
                            <>
                              <video
                                src={asset.url}
                                preload="metadata"
                                muted
                                playsInline
                                style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }}
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  background: 'rgba(0,0,0,0.3)',
                                }}
                              >
                                <Play size={16} fill="#FFD200" color="#FFD200" />
                              </div>
                            </>
                          ) : (
                            <img
                              src={asset.thumb_url || asset.url}
                              alt=""
                              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            />
                          )}
                        </div>
                      </td>

                      {/* Filename */}
                      <td style={{ padding: '10px 16px' }}>
                        <div
                          onClick={() => setSelectedAsset(asset)}
                          style={{
                            fontWeight: 600,
                            cursor: 'pointer',
                            color: 'var(--text-primary)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                          }}
                        >
                          {isVid && (
                            <span
                              style={{
                                background: 'rgba(139, 92, 246, 0.15)',
                                color: '#A78BFA',
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                padding: '1px 6px',
                                borderRadius: 6,
                                border: '1px solid rgba(139, 92, 246, 0.3)',
                              }}
                            >
                              VIDEO
                            </span>
                          )}
                          <span>{asset.original_filename}</span>
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            fontFamily: 'monospace',
                            maxWidth: 240,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {asset.r2_key}
                        </div>
                      </td>

                      {/* Hash */}
                      <td style={{ padding: '10px 16px' }}>
                        <button
                          onClick={() => copyToClipboard(asset.content_hash, 'Hash')}
                          style={{
                            background: 'var(--bg-primary)',
                            border: '1px solid var(--bg-border)',
                            borderRadius: 6,
                            padding: '3px 8px',
                            fontFamily: 'monospace',
                            fontSize: '0.72rem',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                          }}
                          title="Click to copy full SHA-256 hash"
                        >
                          <span>{asset.content_hash.slice(0, 10)}...</span>
                          <Copy size={11} />
                        </button>
                      </td>

                      {/* Size */}
                      <td style={{ padding: '10px 16px', fontWeight: 600, fontSize: '0.82rem' }}>
                        {formatBytes(asset.file_size)}
                      </td>

                      {/* Usages */}
                      <td style={{ padding: '10px 16px' }}>
                        {hasMultiple ? (
                          <span
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              color: '#10B981',
                              fontWeight: 700,
                              fontSize: '0.74rem',
                              padding: '3px 9px',
                              borderRadius: 12,
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <Zap size={11} /> {asset.products_linked.length} Usages (0 KB Reused)
                          </span>
                        ) : asset.products_linked && asset.products_linked.length === 1 ? (
                          <span
                            style={{
                              background: 'rgba(59, 130, 246, 0.12)',
                              color: '#3B82F6',
                              fontWeight: 600,
                              fontSize: '0.74rem',
                              padding: '3px 9px',
                              borderRadius: 12,
                            }}
                          >
                            1 Catalog Item
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>0 (Unused)</span>
                        )}
                      </td>

                      {/* Date */}
                      <td style={{ padding: '10px 16px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        {asset.created_at ? new Date(asset.created_at).toLocaleDateString() : '—'}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => setSelectedAsset(asset)}
                            className="btn-icon"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid var(--bg-border)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            title={isVid ? 'Play & Inspect Video' : 'Inspect Details'}
                          >
                            {isVid ? <Play size={15} color="#A78BFA" /> : <Eye size={15} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(window.location.origin + asset.url, isVid ? 'Video Stream URL' : 'Image URL')}
                            className="btn-icon"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid var(--bg-border)',
                              background: 'var(--bg-primary)',
                              color: 'var(--text-secondary)',
                              cursor: 'pointer',
                            }}
                            title={isVid ? 'Copy Video Stream URL' : 'Copy Image CDN URL'}
                          >
                            <Copy size={15} />
                          </button>
                          <button
                            onClick={() => {
                              setDeleteTarget(asset)
                              setForceDelete(false)
                            }}
                            className="btn-icon"
                            style={{
                              padding: 6,
                              borderRadius: 6,
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              background: 'rgba(239, 68, 68, 0.08)',
                              color: '#EF4444',
                              cursor: 'pointer',
                            }}
                            title="Delete Asset"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Asset Inspector Modal (Video Player & Image Inspector) ─── */}
      {selectedAsset && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedAsset(null)
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 920,
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--bg-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: isVideoAsset(selectedAsset) ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 210, 0, 0.12)',
                    color: isVideoAsset(selectedAsset) ? '#A78BFA' : '#FFD200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isVideoAsset(selectedAsset) ? <Film size={19} /> : <FileImage size={18} />}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {isVideoAsset(selectedAsset) ? 'Video Asset Inspector & Streamer' : 'Asset Inspector & Linkages'}
                  </h3>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
                    Cloudflare R2 Master Object ID: #{selectedAsset.id}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAsset(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  padding: 4,
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body: Two Column */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: 20,
                padding: 20,
              }}
            >
              {/* Left Column: Interactive Video Player or Image Viewer */}
              <div>
                {isVideoAsset(selectedAsset) ? (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '16/9',
                      background: '#000',
                      borderRadius: 10,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--bg-border)',
                      marginBottom: 14,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
                    <video
                      src={selectedAsset.url}
                      controls
                      autoPlay={false}
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  </div>
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '4/3',
                      background: '#0a0a0a',
                      borderRadius: 10,
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--bg-border)',
                      marginBottom: 14,
                    }}
                  >
                    <img
                      src={selectedAsset.url}
                      alt={selectedAsset.original_filename}
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  <a
                    href={selectedAsset.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--bg-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                    }}
                  >
                    <ExternalLink size={14} /> {isVideoAsset(selectedAsset) ? 'Open Video in Tab' : 'Open Full Asset'}
                  </a>
                  <a
                    href={selectedAsset.url}
                    download={selectedAsset.original_filename}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--bg-border)',
                      color: 'var(--text-primary)',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      textDecoration: 'none',
                    }}
                    title="Download Master File"
                  >
                    <Download size={14} /> Download
                  </a>
                </div>
              </div>

              {/* Right Column: Metadata & Products */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Meta details */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid var(--bg-border)',
                  }}
                >
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', marginBottom: 2 }}>
                    FILENAME & TYPE
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    {isVideoAsset(selectedAsset) && (
                      <span
                        style={{
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#A78BFA',
                          fontSize: '0.7rem',
                          padding: '2px 6px',
                          borderRadius: 6,
                          border: '1px solid rgba(139, 92, 246, 0.3)',
                        }}
                      >
                        VIDEO
                      </span>
                    )}
                    <span style={{ wordBreak: 'break-all' }}>{selectedAsset.original_filename}</span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>FILE SIZE</div>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                        {formatBytes(selectedAsset.file_size)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>MIME FORMAT</div>
                      <div
                        style={{
                          fontWeight: 600,
                          color: isVideoAsset(selectedAsset) ? '#A78BFA' : 'var(--text-primary)',
                          fontSize: '0.85rem',
                        }}
                      >
                        {selectedAsset.mime_type || (isVideoAsset(selectedAsset) ? 'video/mp4' : 'image/webp')}
                      </div>
                    </div>
                  </div>

                  {/* SHA-256 Hash */}
                  <div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginBottom: 3 }}>
                      SHA-256 DEDUPLICATION FINGERPRINT
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        background: 'var(--bg-surface)',
                        padding: '6px 10px',
                        borderRadius: 6,
                        border: '1px solid var(--bg-border)',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'monospace',
                          fontSize: '0.74rem',
                          color: '#10B981',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {selectedAsset.content_hash}
                      </span>
                      <button
                        onClick={() => copyToClipboard(selectedAsset.content_hash, 'Hash')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                        title="Copy Hash"
                      >
                        {copiedKey === 'Hash' ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* CDN Endpoints */}
                <div
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: 10,
                    padding: '14px 16px',
                    border: '1px solid var(--bg-border)',
                  }}
                >
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                    {isVideoAsset(selectedAsset) ? 'Direct Video Streaming CDN' : 'Optimized CDN Endpoints'}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {/* Master / Stream URL */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                      <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', minWidth: 75 }}>
                        {isVideoAsset(selectedAsset) ? 'Stream CDN:' : 'Master CDN:'}
                      </span>
                      <input
                        readOnly
                        value={window.location.origin + selectedAsset.url}
                        style={{
                          flex: 1,
                          padding: '4px 8px',
                          borderRadius: 6,
                          background: 'var(--bg-surface)',
                          border: '1px solid var(--bg-border)',
                          color: 'var(--text-primary)',
                          fontSize: '0.72rem',
                          fontFamily: 'monospace',
                        }}
                      />
                      <button
                        onClick={() => copyToClipboard(window.location.origin + selectedAsset.url, 'Stream URL')}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                        }}
                        title="Copy Stream URL"
                      >
                        <Copy size={13} />
                      </button>
                    </div>

                    {/* Medium 600px WebP (only for images) */}
                    {!isVideoAsset(selectedAsset) && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
                        <span style={{ fontSize: '0.76rem', color: 'var(--text-secondary)', minWidth: 75 }}>
                          WebP 600px:
                        </span>
                        <input
                          readOnly
                          value={window.location.origin + selectedAsset.medium_url}
                          style={{
                            flex: 1,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: 'var(--bg-surface)',
                            border: '1px solid var(--bg-border)',
                            color: 'var(--text-primary)',
                            fontSize: '0.72rem',
                            fontFamily: 'monospace',
                          }}
                        />
                        <button
                          onClick={() => copyToClipboard(window.location.origin + selectedAsset.medium_url, 'Medium WebP')}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer',
                          }}
                          title="Copy WebP URL"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Linked Products Section */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 8,
                    }}
                  >
                    <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Catalog Items Using This Media ({selectedAsset.products_linked?.length || 0})
                    </span>
                    {selectedAsset.products_linked && selectedAsset.products_linked.length > 1 && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          color: '#10B981',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                      >
                        <Zap size={11} /> 0 KB Duplicate Reused
                      </span>
                    )}
                  </div>

                  {selectedAsset.products_linked && selectedAsset.products_linked.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 160, overflowY: 'auto' }}>
                      {selectedAsset.products_linked.map((prod) => (
                        <div
                          key={`${prod.id}_${prod.link_type || 'img'}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            background: 'var(--bg-primary)',
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid var(--bg-border)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Package size={14} style={{ color: '#FFD200' }} />
                            <div>
                              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                                {prod.title}
                              </div>
                              {prod.link_type === 'file' ? (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    color: '#A78BFA',
                                    fontWeight: 700,
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <Film size={11} /> Deliverable / Video File
                                </span>
                              ) : prod.is_thumbnail ? (
                                <span
                                  style={{
                                    fontSize: '0.68rem',
                                    color: '#FFD200',
                                    fontWeight: 700,
                                    textTransform: 'uppercase',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 4,
                                  }}
                                >
                                  <Star size={11} /> Primary Cover Image
                                </span>
                              ) : (
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  <Image size={11} /> Gallery Media
                                </span>
                              )}
                            </div>
                          </div>

                          <Link
                            to={`/admin/products/${prod.id}/edit`}
                            style={{
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              color: '#FFD200',
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              padding: '4px 8px',
                              borderRadius: 6,
                              background: 'rgba(255, 210, 0, 0.1)',
                            }}
                          >
                            Edit Product <ExternalLink size={12} />
                          </Link>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div
                      style={{
                        padding: '12px 14px',
                        background: 'var(--bg-primary)',
                        borderRadius: 8,
                        border: '1px solid var(--bg-border)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.8rem',
                      }}
                    >
                      This {isVideoAsset(selectedAsset) ? 'video' : 'asset'} is standalone in storage and not currently linked to any product catalog item. Safe to delete.
                    </div>
                  )}
                </div>

                {/* Delete button inside inspector */}
                <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                  <button
                    onClick={() => {
                      setDeleteTarget(selectedAsset)
                      setForceDelete(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '9px 14px',
                      borderRadius: 8,
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    <Trash2 size={15} /> Delete Asset from R2 Storage
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Direct Upload Progress Drawer / Modal ─── */}
      {uploadModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 580,
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid var(--bg-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255, 210, 0, 0.12)',
                    color: '#FFD200',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UploadCloud size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Media Uploader & Smart Deduplication
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Client-side SHA-256 analysis • Zero storage duplication
                  </span>
                </div>
              </div>
              <button
                disabled={isUploading}
                onClick={() => {
                  setUploadModalOpen(false)
                  setUploadQueue([])
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Queue List */}
            <div style={{ padding: '16px 20px', maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {uploadQueue.map((item) => (
                <div
                  key={item.id}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--bg-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div style={{ overflow: 'hidden', flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.84rem',
                        fontWeight: 600,
                        color: 'var(--text-primary)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.file.name}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {formatBytes(item.file.size)}
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div>
                    {item.status === 'pending' && (
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)' }}>Queued...</span>
                    )}
                    {item.status === 'hashing' && (
                      <span style={{ fontSize: '0.74rem', color: '#FFD200', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RefreshCw size={12} className="animate-spin" /> Hashing...
                      </span>
                    )}
                    {item.status === 'uploading' && (
                      <span style={{ fontSize: '0.74rem', color: '#3B82F6', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <RefreshCw size={12} className="animate-spin" /> Uploading WebP...
                      </span>
                    )}
                    {item.status === 'deduplicated' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#10B981',
                          background: 'rgba(16, 185, 129, 0.15)',
                          padding: '3px 8px',
                          borderRadius: 12,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Zap size={12} /> 0 KB Reused
                      </span>
                    )}
                    {item.status === 'completed' && (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: '#10B981',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <CheckCircle2 size={14} /> Uploaded
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span style={{ fontSize: '0.72rem', color: '#EF4444', fontWeight: 600 }}>
                        {item.message || 'Failed'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--bg-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'var(--bg-primary)',
              }}
            >
              <button
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#FFD200',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                + Add More Images
              </button>

              <button
                disabled={isUploading}
                onClick={() => {
                  setUploadModalOpen(false)
                  setUploadQueue([])
                }}
                style={{
                  background: '#FFD200',
                  border: 'none',
                  color: '#000',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: isUploading ? 'not-allowed' : 'pointer',
                }}
              >
                {isUploading ? 'Uploading...' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Delete Confirmation Dialog ─── */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(8px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              padding: 24,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: 'rgba(239, 68, 68, 0.15)',
                  color: '#EF4444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Confirm Media Deletion
                </h3>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  Cloudflare R2 Master & Variants Removal
                </span>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Are you sure you want to permanently delete{' '}
              <strong style={{ color: 'var(--text-primary)' }}>"{deleteTarget.original_filename}"</strong>? This will
              purge the master file and all associated WebP variants from Cloudflare R2.
            </p>

            {deleteTarget.products_linked && deleteTarget.products_linked.length > 0 && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 8,
                  padding: '12px 14px',
                  marginBottom: 16,
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#EF4444', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={14} color="#EF4444" />
                  <span>In Use Warning:</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: 8 }}>
                  This image is attached to{' '}
                  <strong style={{ color: 'var(--text-primary)' }}>
                    {deleteTarget.products_linked.length} product(s)
                  </strong>{' '}
                  (e.g.{' '}
                  {deleteTarget.products_linked
                    .slice(0, 2)
                    .map((p) => `"${p.title}"`)
                    .join(', ')}
                  ). Deleting it will cause missing images on those product pages!
                </div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: '0.8rem',
                    color: 'var(--text-primary)',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={forceDelete}
                    onChange={(e) => setForceDelete(e.target.checked)}
                  />
                  Force delete this asset and unlink from products
                </label>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                disabled={deleting}
                onClick={() => {
                  setDeleteTarget(null)
                  setForceDelete(false)
                }}
                style={{
                  padding: '9px 16px',
                  borderRadius: 8,
                  background: 'var(--bg-primary)',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-primary)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={deleting || (Boolean(deleteTarget.products_linked?.length) && !forceDelete)}
                onClick={confirmDelete}
                style={{
                  padding: '9px 18px',
                  borderRadius: 8,
                  background: '#EF4444',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  cursor:
                    deleting || (Boolean(deleteTarget.products_linked?.length) && !forceDelete)
                      ? 'not-allowed'
                      : 'pointer',
                  opacity:
                    deleting || (Boolean(deleteTarget.products_linked?.length) && !forceDelete) ? 0.5 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                {deleting ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} /> Delete Forever
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
