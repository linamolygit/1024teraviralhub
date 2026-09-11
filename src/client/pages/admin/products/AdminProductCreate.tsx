// src/client/pages/admin/products/AdminProductCreate.tsx — Modern Product Creation with AI, Multi-Image Upload & Live Deliverables Previews
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Upload, Plus, X, Sparkles, Image as ImageIcon,
  CheckCircle, Star, FileCheck, Layers, Link as LinkIcon, Loader2, Video, Play, Film, Crop
} from 'lucide-react'
import ImageCropModal from '../../../components/admin/ImageCropModal'
import { optimizeVideo } from '../../../lib/video-optimizer'
import { adminApi, type Category } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { createImageVariants } from '../../../lib/image-optimizer'
import UploadProgressToast, { type UploadStepItem } from '../../../components/admin/UploadProgressToast'
import DeliverableFilePreviewCard from '../../../components/admin/DeliverableFilePreviewCard'
import GoogleDrivePreviewCard from '../../../components/admin/GoogleDrivePreviewCard'
import { adminToast } from '../../../lib/admin-toast'
import MediaLibraryModal, { type MediaAssetItem } from '../../../components/admin/MediaLibraryModal'
import { computeFileHash } from '../../../lib/hash-utils'

export interface ProductImageItem {
  file?: File
  preview: string
  name: string
  size: number
  isExisting?: boolean
  r2_key?: string
  content_hash?: string
  isDuplicate?: boolean
}

export default function AdminProductCreate() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getToken } = useAuthStore()
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [newProductId, setNewProductId] = useState<number | null>(null)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: 0,
    price: 0,
    sale_price: '',
    is_published: true,
    is_featured: false,
    file_type: 'image',
    license_type: 'personal',
    button_text: 'Buy',
    google_drive_link: '',
    video_url: '',
    download_limit: 3,
    access_duration_hours: 12,
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
  })

  // Multiple preview images management (supports both new files and existing zero-storage assets)
  const [imageFiles, setImageFiles] = useState<ProductImageItem[]>([])
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0)
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [videoMediaModalOpen, setVideoMediaModalOpen] = useState(false)
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropIdx, setCropIdx] = useState<number | null>(null)

  // Direct deliverable file
  const [productFile, setProductFile] = useState<File | null>(null)
  const [showDriveInput, setShowDriveInput] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // AI Assistant State
  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiBanner, setAiBanner] = useState('')

  // ── Live Upload Progress Toast States ──
  const [uploadToastOpen, setUploadToastOpen] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatusText, setUploadStatusText] = useState('')
  const [uploadCurrentItem, setUploadCurrentItem] = useState<{
    name: string
    type: 'gallery' | 'deliverable' | 'data'
    index?: number
    total?: number
    size?: number
  } | null>(null)
  const [uploadSteps, setUploadSteps] = useState<UploadStepItem[]>([])
  const [uploadCompleted, setUploadCompleted] = useState(false)
  const [uploadError, setUploadError] = useState('')

  // Video Upload & Smart Compression States
  const [videoInputMode, setVideoInputMode] = useState<'upload' | 'url'>('upload')
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoCompressProgress, setVideoCompressProgress] = useState(0)
  const [videoStatusText, setVideoStatusText] = useState('')
  const [videoStats, setVideoStats] = useState<{ originalMB: string; optimizedMB: string; liteKB?: number; savedPct: number } | null>(null)

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      return res.json() as Promise<{ categories: Category[] }>
    },
  })

  // Handle Multi-file image select with automated background SHA-256 deduplication
  const handleImageFilesSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: ProductImageItem[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
        name: file.name,
        size: file.size,
        isExisting: false,
      })
    }
    setImageFiles((prev) => [...prev, ...newItems])

    // Background deduplication pre-check
    try {
      const token = await getToken()
      if (token) {
        const hashes = await Promise.all(newItems.map((item) => computeFileHash(item.file!)))
        const res = await adminApi.products.checkDedup(token, hashes)
        if (res.success && res.matches && Object.keys(res.matches).length > 0) {
          const matchCount = Object.keys(res.matches).length
          setImageFiles((prev) =>
            prev.map((item) => {
              if (item.file) {
                const itemIdx = newItems.findIndex((n) => n.file === item.file)
                const itemHash = hashes[itemIdx]
                if (itemHash && res.matches[itemHash]) {
                  return {
                    ...item,
                    isDuplicate: true,
                    content_hash: itemHash,
                    r2_key: res.matches[itemHash].r2_key,
                  }
                }
              }
              return item
            })
          )
          adminToast.info(
            'Smart Deduplication',
            `⚡ ${matchCount} image(s) already exist in storage! Zero extra bytes will be uploaded.`
          )
        }
      }
    } catch {}
  }

  // Handle Video File Select & Smart Client Compression
  const handleVideoFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    const file = files[0]
    setVideoUploading(true)
    setVideoCompressProgress(5)
    setVideoStatusText('Analyzing video for fast, 0-buffering web playback...')
    setError('')

    try {
      // 1. Client-side smart optimization
      const optResult = await optimizeVideo(file, (msg, pct) => {
        setVideoStatusText(msg)
        setVideoCompressProgress(pct)
      })

      // 2. Upload to Cloudflare R2 Edge CDN
      setVideoStatusText('Uploading optimized stream to Cloudflare Edge R2...')
      setVideoCompressProgress(88)

      const token = await getToken()
      if (!token) throw new Error('Not authenticated')

      const res = await adminApi.products.uploadVideo(token, optResult.file, optResult.liteFile)
      if (!res.success) throw new Error(res.message || 'Upload failed')

      setForm((f) => ({ ...f, video_url: res.url }))
      setVideoCompressProgress(100)
      setVideoStatusText('✓ Video ready and published with 0-buffering adaptive streams!')

      setVideoStats({
        originalMB: (optResult.originalSize / (1024 * 1024)).toFixed(1),
        optimizedMB: (optResult.optimizedSize / (1024 * 1024)).toFixed(1),
        liteKB: optResult.liteSize ? Math.round(optResult.liteSize / 1024) : undefined,
        savedPct: optResult.savedPct,
      })
      adminToast.success('Video Uploaded', 'Dual adaptive streams (720p HD + 480p Lite) ready for 0-buffering playback')
    } catch (err: any) {
      setError(err.message || 'Video upload failed')
      adminToast.error('Upload Error', err.message || 'Video upload failed')
    } finally {
      setVideoUploading(false)
    }
  }

  // Handle attaching from existing media library
  const handleSelectFromLibrary = (asset: MediaAssetItem) => {
    setImageFiles((prev) => [
      ...prev,
      {
        preview: asset.thumb_url || asset.url,
        name: asset.original_filename,
        size: asset.file_size,
        isExisting: true,
        r2_key: asset.r2_key,
        content_hash: asset.content_hash,
      },
    ])
    adminToast.success('Existing Image Reused', `✓ Attached "${asset.original_filename}" (0 KB storage consumed)!`)
  }

  // Handle attaching video from existing media library (zero storage duplicate)
  const handleSelectVideoFromLibrary = (asset: MediaAssetItem) => {
    setForm((f) => ({ ...f, video_url: asset.url }))
    setVideoStats({
      originalMB: (asset.file_size / (1024 * 1024)).toFixed(1),
      optimizedMB: (asset.file_size / (1024 * 1024)).toFixed(1),
      savedPct: 100,
    })
    adminToast.success('Video Reused', `✓ Attached "${asset.original_filename}" (0 KB storage consumed)!`)
  }

  const handleSelectMultipleFromLibrary = (chosenAssets: MediaAssetItem[]) => {
    const newExisting: ProductImageItem[] = chosenAssets.map((asset) => ({
      preview: asset.thumb_url || asset.url,
      name: asset.original_filename,
      size: asset.file_size,
      isExisting: true,
      r2_key: asset.r2_key,
      content_hash: asset.content_hash,
    }))
    setImageFiles((prev) => [...prev, ...newExisting])
    adminToast.success('Media Assets Attached', `✓ Reusing ${chosenAssets.length} image(s) from storage (0 KB duplicate upload)`)
  }

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== index))
    if (primaryImageIdx === index) {
      setPrimaryImageIdx(0)
    } else if (primaryImageIdx > index) {
      setPrimaryImageIdx((prev) => prev - 1)
    }
  }

  const handleOpenCrop = (idx: number) => {
    setCropIdx(idx)
    setCropModalOpen(true)
  }

  const handleApplyCrop = (croppedFile: File, croppedPreviewUrl: string) => {
    if (cropIdx === null) return
    setImageFiles((prev) =>
      prev.map((item, i) =>
        i === cropIdx
          ? { ...item, file: croppedFile, preview: croppedPreviewUrl }
          : item
      )
    )
    adminToast.success('Crop Applied', 'Image adjusted and updated for product showcase')
  }

  // AI Generation Handler
  const handleAiGenerate = async () => {
    const topic = (aiPrompt || form.title).trim()
    if (!topic) {
      setError('Please enter a product topic or title in the AI generator field')
      return
    }

    setError('')
    setAiLoading(true)
    setAiBanner('')

    try {
      const token = await getToken()
      const categoryName = cats?.categories.find((c) => c.id === form.category_id)?.name

      const res = await adminApi.ai.generateProduct(token!, {
        prompt: topic,
        title: form.title,
        category_name: categoryName,
        file_type: form.file_type,
      })

      if (res.success && res.data) {
        const d = res.data
        setForm((f) => ({
          ...f,
          title: d.title || f.title,
          slug: d.slug || f.slug,
          short_description: d.short_description || f.short_description,
          description: d.description || f.description,
          price: d.suggested_price || f.price || 199,
          sale_price: d.suggested_sale_price ? d.suggested_sale_price.toString() : f.sale_price,
          tags: d.tags && d.tags.length > 0 ? d.tags : f.tags,
          meta_title: d.meta_title || f.meta_title,
          meta_description: d.meta_description || f.meta_description,
        }))

        setAiBanner(
          res.source === 'gemini-ai'
            ? '✨ Successfully generated by Gemini AI with high-converting copy & SEO!'
            : '✨ Generated via Smart Product Assistant! Review fields and save.'
        )
        adminToast.success('AI Content Generated', 'Title, SEO description, and pricing suggestions ready')
      }
    } catch (err: any) {
      setError(`AI Assistant Note: ${err.message}. You can still fill out the fields manually.`)
      adminToast.warning('AI Assistant Note', err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const createMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.products.create(token!, {
        ...form,
        category_id: form.category_id || undefined,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        tags: form.tags,
        video_url: form.video_url?.trim() || null,
      })
    },
    onMutate: () => {
      // Initialize steps for the live progress toast
      const stepsList: UploadStepItem[] = [
        { id: 'step-data', label: 'Saving Product Specifications & Meta', type: 'data', status: 'processing' },
      ]

      imageFiles.forEach((img, idx) => {
        stepsList.push({
          id: `step-gallery-${idx}`,
          label: `Showcase Gallery Image ${idx + 1} of ${imageFiles.length}: "${img.file.name}"`,
          type: 'gallery',
          status: 'pending',
        })
      })

      if (productFile) {
        stepsList.push({
          id: 'step-deliverable',
          label: `Deliverable Asset: "${productFile.name}"`,
          type: 'deliverable',
          status: 'pending',
        })
      }

      stepsList.push({
        id: 'step-finalize',
        label: 'Finalizing & Realtime Cache Invalidation',
        type: 'data',
        status: 'pending',
      })

      setUploadSteps(stepsList)
      setUploadProgress(10)
      setUploadCurrentItem({ name: form.title || 'Product Data', type: 'data' })
      setUploadStatusText('Saving product records to D1 database...')
      setUploadCompleted(false)
      setUploadError('')
      setUploadToastOpen(true)
    },
    onSuccess: async (result) => {
      setNewProductId(result.id)

      // Mark step-data completed
      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-data' ? { ...s, status: 'completed' } : s))
      )

      const token = await getToken()
      const totalSteps = imageFiles.length + (productFile ? 1 : 0) + 1
      let completedCount = 1

      // 1. Upload All Selected Showcase Gallery Images with WebP Variants
      if (imageFiles.length > 0) {
        for (let idx = 0; idx < imageFiles.length; idx++) {
          const item = imageFiles[idx]
          const isCover = idx === primaryImageIdx

          setUploadSteps((prev) =>
            prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'processing' } : s))
          )

          setUploadCurrentItem({
            name: item.name,
            type: 'gallery',
            index: idx + 1,
            total: imageFiles.length,
            size: item.size,
          })

          try {
            // Case A: Existing asset picked from Media Library (0 KB duplicate upload)
            if (item.isExisting && item.r2_key) {
              setUploadStatusText(
                `⚡ Instant Smart Deduplication: Attaching existing asset "${item.name}" (0 KB upload)...`
              )
              await adminApi.products.attachExistingImage(token!, result.id, {
                r2_key: item.r2_key,
                content_hash: item.content_hash,
                alt_text: item.name,
                is_thumbnail: isCover,
              })
              setUploadSteps((prev) =>
                prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'deduplicated' } : s))
              )
            } else if (item.isDuplicate && item.r2_key) {
              // Case B: File matched an existing hash in storage (0 KB duplicate upload)
              setUploadStatusText(
                `⚡ Instant Smart Deduplication: Duplicate detected! Reusing existing asset "${item.name}" (0 KB upload)...`
              )
              await adminApi.products.attachExistingImage(token!, result.id, {
                r2_key: item.r2_key,
                content_hash: item.content_hash,
                alt_text: item.name,
                is_thumbnail: isCover,
              })
              setUploadSteps((prev) =>
                prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'deduplicated' } : s))
              )
            } else if (item.file) {
              // Case C: New master image upload with HVS WebP perceptual variants
              setUploadStatusText(
                `Meta Perceptual Compression (HVS-Tuned WebP + Sharpened) & Uploading ${idx + 1}/${imageFiles.length}${isCover ? ' [Primary Cover]' : ''}...`
              )
              const variants = await createImageVariants(item.file)
              const uploadRes = await adminApi.products.uploadImage(token!, result.id, item.file, isCover, {
                thumb: variants.thumb,
                medium: variants.medium,
                large: variants.large,
                blurDataUrl: variants.blurDataUrl,
              })

              setUploadSteps((prev) =>
                prev.map((s) =>
                  s.id === `step-gallery-${idx}`
                    ? { ...s, status: uploadRes.deduplicated ? 'deduplicated' : 'completed' }
                    : s
                )
              )
            }
          } catch (imgErr: any) {
            console.error(`Failed to process gallery image #${idx}:`, imgErr)
            setUploadSteps((prev) =>
              prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'error', detail: imgErr.message } : s))
            )
          }

          completedCount++
          setUploadProgress(Math.round((completedCount / (totalSteps + 1)) * 90))
        }
      }

      // 2. Upload Direct Deliverable Asset File if attached
      if (productFile) {
        setUploadSteps((prev) =>
          prev.map((s) => (s.id === 'step-deliverable' ? { ...s, status: 'processing' } : s))
        )

        setUploadCurrentItem({
          name: productFile.name,
          type: 'deliverable',
          size: productFile.size,
        })

        setUploadStatusText('Uploading primary downloadable digital asset file to Cloudflare R2 bucket...')

        try {
          const fileRes = await adminApi.products.uploadFile(token!, result.id, productFile)
          setUploadSteps((prev) =>
            prev.map((s) =>
              s.id === 'step-deliverable'
                ? { ...s, status: fileRes.deduplicated ? 'deduplicated' : 'completed' }
                : s
            )
          )
        } catch (fileErr: any) {
          console.error('Deliverable file upload error:', fileErr)
          setUploadSteps((prev) =>
            prev.map((s) => (s.id === 'step-deliverable' ? { ...s, status: 'error', detail: fileErr.message } : s))
          )
        }

        completedCount++
        setUploadProgress(90)
      }

      // 3. Finalize & Realtime Invalidate
      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-finalize' ? { ...s, status: 'processing' } : s))
      )
      setUploadStatusText('Invalidating caches for instant live update...')

      await queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-analytics'] })

      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-finalize' ? { ...s, status: 'completed' } : s))
      )

      setUploadProgress(100)
      setUploadCompleted(true)
      setSuccess('Product and all assets created successfully!')
      adminToast.success('Product Created Successfully', `"${form.title}" is published and live!`)

      // Auto navigate back after 2 seconds
      setTimeout(() => {
        navigate('/admin/products')
      }, 2000)
    },
    onError: (err: any) => {
      setError(err.message)
      setUploadError(err.message)
      adminToast.error('Product Creation Failed', err.message)
    },
  })

  const setSlug = (title: string) => {
    setForm((f) => ({
      ...f,
      title,
      slug: title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, ''),
    }))
  }

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
      setTagInput('')
    }
  }

  return (
    <div style={{ maxWidth: 1280, width: '100%', paddingBottom: 60 }}>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => navigate('/admin/products')}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '8px',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Add New Product
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.825rem', margin: '2px 0 0' }}>
              Create a digital product with instant delivery, Gemini AI description, and multi-image gallery
            </p>
          </div>
        </div>

        <button
          onClick={() => createMutation.mutate()}
          className="btn-primary"
          disabled={createMutation.isPending || !form.title || !form.slug || form.price <= 0}
          style={{ padding: '10px 22px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: 8 }}
        >
          {createMutation.isPending ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Save size={16} />
              Publish Product
            </>
          )}
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>{error}</div>}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* ── ✨ AI Magic Assistant Card ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.08) 0%, rgba(124, 58, 237, 0.08) 100%)',
          border: '1px solid rgba(17, 98, 242, 0.3)',
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 24,
          boxShadow: '0 4px 20px rgba(17, 98, 242, 0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
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
              <div style={{ fontWeight: 800, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                AI Magic Product Generator
                <span
                  style={{
                    fontSize: '0.7rem',
                    background: 'rgba(17,98,242,0.15)',
                    color: '#1162f2',
                    padding: '2px 8px',
                    borderRadius: 99,
                    fontWeight: 700,
                  }}
                >
                  Powered by Gemini
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Type your topic (e.g. <em>"1000+ Viral Reels Bundle"</em>) and let AI generate complete product specs, features, tags & SEO
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
          <input
            type="text"
            className="input-field"
            placeholder="Enter product topic, theme or title for 1-Click Generation..."
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAiGenerate())}
            style={{ flex: 1, minWidth: 280 }}
          />
          <button
            type="button"
            onClick={handleAiGenerate}
            disabled={aiLoading}
            className="btn-primary"
            style={{
              padding: '10px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #1162f2, #7c3aed)',
              borderColor: '#1162f2',
              whiteSpace: 'nowrap',
            }}
          >
            {aiLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {aiLoading ? 'AI Working...' : '✨ 1-Click Auto Fill'}
          </button>
        </div>

        {aiBanner && (
          <div
            style={{
              marginTop: 12,
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.1), rgba(124, 58, 237, 0.1))',
              border: '1px solid rgba(17, 98, 242, 0.3)',
              borderRadius: 6,
              color: '#1162F2',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {aiBanner}
          </div>
        )}
      </div>

      {/* ── 2-Column Form Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 24, alignItems: 'start' }}>
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* Card: Basic Information */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 22 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 18, color: 'var(--text-primary)' }}>
              Product Details
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 500+ Aesthetic Lightroom Presets Pack"
                  value={form.title}
                  onChange={(e) => {
                    setSlug(e.target.value)
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Slug (URL Path) *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      borderRight: 'none',
                      borderRadius: '8px 0 0 8px',
                      padding: '9px 12px',
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    /product/
                  </span>
                  <input
                    type="text"
                    className="input-field"
                    style={{ borderRadius: '0 8px 8px 0' }}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Short Description (1-Liner Summary)
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="Quick highlight shown in checkout & card view"
                  value={form.short_description}
                  onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                  maxLength={300}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                    Full Description (Markdown Supported) *
                  </label>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Use # Headings, *bullets*, and bold text
                  </span>
                </div>
                <textarea
                  className="input-field"
                  rows={9}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Full breakdown of what buyers will receive, features, and instructions..."
                  style={{ resize: 'vertical', lineHeight: 1.5 }}
                />
              </div>
            </div>
          </div>

          {/* Card: Multi-Image Gallery Showcase */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Product Gallery Showcase ({imageFiles.length} Selected)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '3px 0 0' }}>
                  Upload multiple product showcase images or reuse existing storage assets. Click the star to set primary cover thumbnail.
                </p>
              </div>

              {/* Browse Media Storage Button */}
              <button
                type="button"
                onClick={() => setMediaModalOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(17,98,242,0.14) 100%)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  color: '#10B981',
                  borderRadius: 9,
                  padding: '7px 13px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                }}
              >
                <Layers size={14} /> Browse Media Storage (0 KB Reuse)
              </button>
            </div>

            {/* Selected Images Grid */}
            {imageFiles.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {imageFiles.map((item, idx) => {
                  const isPrimary = idx === primaryImageIdx
                  const isReused = item.isExisting || item.isDuplicate

                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 10,
                        border: isPrimary ? '2px solid #1162F2' : isReused ? '1.5px solid rgba(16,185,129,0.6)' : '1px solid var(--bg-border)',
                        background: 'var(--bg-elevated)',
                        overflow: 'hidden',
                        boxShadow: isPrimary
                          ? '0 2px 8px rgba(17,98,242,0.25)'
                          : isReused
                          ? '0 2px 8px rgba(16,185,129,0.2)'
                          : 'none',
                      }}
                    >
                      <img
                        src={item.preview}
                        alt={`Preview ${idx + 1}`}
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                      />

                      {/* Primary Cover Badge */}
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIdx(idx)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          left: 6,
                          background: isPrimary ? '#1162F2' : 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: 4,
                          padding: '3px 6px',
                          fontSize: '0.65rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                        }}
                        title="Set as Main Storefront Thumbnail"
                      >
                        <Star size={10} fill={isPrimary ? '#fff' : 'none'} />
                        {isPrimary ? 'Main Cover' : 'Make Cover'}
                      </button>

                      {/* Remove Image Button */}
                      <button
                        type="button"
                        onClick={() => removeImageFile(idx)}
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 6,
                          background: 'rgba(0,0,0,0.65)',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                        title="Remove Image"
                      >
                        <X size={12} />
                      </button>

                      {/* ✂️ Crop Image Button */}
                      <button
                        type="button"
                        onClick={() => handleOpenCrop(idx)}
                        style={{
                          position: 'absolute',
                          bottom: isReused ? 26 : 6,
                          left: 6,
                          background: 'rgba(0,0,0,0.7)',
                          backdropFilter: 'blur(4px)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.15)',
                          borderRadius: 6,
                          padding: '3px 7px',
                          fontSize: '0.64rem',
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 3,
                          cursor: 'pointer',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        }}
                        title="Crop & Adjust image framing"
                      >
                        <Crop size={10} /> Crop
                      </button>

                      {/* Smart Deduplication Badge */}
                      {isReused && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            left: 0,
                            right: 0,
                            background: 'linear-gradient(180deg, transparent 0%, rgba(5,150,105,0.94) 40%, rgba(4,120,87,1) 100%)',
                            color: '#fff',
                            padding: '10px 4px 4px',
                            fontSize: '0.62rem',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                          }}
                        >
                          <Sparkles size={10} /> 0 KB Deduplicated
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Dropzone for Multi-Image */}
            <div
              style={{
                border: '2px dashed var(--bg-border)',
                borderRadius: 10,
                padding: '24px 16px',
                textAlign: 'center',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
              }}
              onClick={() => document.getElementById('create-multi-image-input')?.click()}
            >
              <input
                id="create-multi-image-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageFilesSelect(e.target.files)}
                style={{ display: 'none' }}
              />
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(17,98,242,0.1)',
                  color: '#1162F2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                }}
              >
                <ImageIcon size={22} />
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3 }}>
                Click to upload showcase images (Multi-Select)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Select multiple PNG, JPG, or WEBP photos • Automatically optimizes into responsive WebP thumbnails
              </div>
            </div>
          </div>

          {/* Card: High-Conversion Product Showcase Video (Auto-Slide 2nd Slot) */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 22, position: 'relative', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '180px',
                height: '180px',
                background: 'radial-gradient(circle, rgba(17, 98, 242, 0.08) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #1162F2 0%, #7C3AED 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 12px rgba(17, 98, 242, 0.25)',
                  }}
                >
                  <Video size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                      High-Conversion Gallery Video
                    </h3>
                    <span
                      style={{
                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(17, 98, 242, 0.15) 100%)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        color: '#10B981',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: 6,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      🚀 2nd Slide Auto-Play
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '3px 0 0' }}>
                    Buyer will see cover photo first, then after 2.5s it automatically slides to 2nd position and plays video unmuted!
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Browse Media Storage Button (Videos Only) */}
                <button
                  type="button"
                  onClick={() => setVideoMediaModalOpen(true)}
                  style={{
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.14) 0%, rgba(17,98,242,0.14) 100%)',
                    border: '1px solid rgba(16,185,129,0.35)',
                    color: '#10B981',
                    borderRadius: 9,
                    padding: '7px 13px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                  }}
                >
                  <Layers size={14} /> Browse Media Storage (0 KB Reuse)
                </button>

                {form.video_url && (
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, video_url: '' }))}
                    style={{
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.25)',
                      color: '#EF4444',
                      borderRadius: 8,
                      padding: '5px 10px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <X size={13} /> Remove Video
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Input Mode Selector: Upload File vs Paste URL */}
              <div style={{ display: 'flex', gap: 6, background: 'var(--bg-elevated)', padding: 4, borderRadius: 8, width: 'fit-content' }}>
                <button
                  type="button"
                  onClick={() => setVideoInputMode('upload')}
                  style={{
                    background: videoInputMode === 'upload' ? '#1162F2' : 'transparent',
                    color: videoInputMode === 'upload' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Upload size={13} /> Upload Video File
                </button>
                <button
                  type="button"
                  onClick={() => setVideoInputMode('url')}
                  style={{
                    background: videoInputMode === 'url' ? '#1162F2' : 'transparent',
                    color: videoInputMode === 'url' ? '#fff' : 'var(--text-secondary)',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <LinkIcon size={13} /> Paste Video URL
                </button>
              </div>

              {videoInputMode === 'upload' ? (
                <div>
                  <input
                    id="create-video-upload-input"
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime,video/x-matroska,video/*"
                    onChange={(e) => handleVideoFileSelect(e.target.files)}
                    style={{ display: 'none' }}
                  />

                  {videoUploading ? (
                    <div
                      style={{
                        border: '2px solid rgba(17, 98, 242, 0.4)',
                        borderRadius: 10,
                        padding: '24px 20px',
                        background: 'rgba(17, 98, 242, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Loader2 size={16} className="animate-spin" color="#1162F2" />
                          {videoStatusText}
                        </span>
                        <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#1162F2' }}>
                          {videoCompressProgress}%
                        </span>
                      </div>

                      <div style={{ width: '100%', height: '8px', background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                        <div
                          style={{
                            height: '100%',
                            width: `${videoCompressProgress}%`,
                            background: 'linear-gradient(90deg, #1162F2 0%, #10B981 100%)',
                            borderRadius: 4,
                            transition: 'width 0.25s ease',
                          }}
                        />
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Optimizing resolution and bitrate to prevent buffering for all mobile & 4G visitors...
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => document.getElementById('create-video-upload-input')?.click()}
                      style={{
                        border: '2px dashed var(--bg-border)',
                        borderRadius: 10,
                        padding: '24px 16px',
                        textAlign: 'center',
                        background: 'var(--bg-elevated)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#1162F2'
                        e.currentTarget.style.background = 'rgba(17, 98, 242, 0.03)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'var(--bg-border)'
                        e.currentTarget.style.background = 'var(--bg-elevated)'
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: '50%',
                          background: 'rgba(17,98,242,0.1)',
                          color: '#1162F2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          margin: '0 auto 10px',
                        }}
                      >
                        <Film size={22} />
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem', marginBottom: 3, color: 'var(--text-primary)' }}>
                        Click or Drag & Drop Showcase Video here
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Supports MP4, WebM, MOV, MKV • Auto-compresses camera raw files into web-ready streams with 0-buffering byte-range streaming (Max 150MB)
                      </div>
                    </div>
                  )}

                  {videoStats && (
                    <div
                      style={{
                        marginTop: 10,
                        padding: '10px 14px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        borderRadius: 8,
                        fontSize: '0.76rem',
                        color: '#10B981',
                        fontWeight: 600,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Sparkles size={15} />
                        <span>
                          <strong>Dual Adaptive Streams Active (0-Buffering):</strong> Master 720p HD ({videoStats.optimizedMB}MB)
                          {videoStats.liteKB ? ` • 480p Fast Lite (${videoStats.liteKB}KB)` : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', paddingLeft: 21 }}>
                        Smart Quality Controller: Visitors on WiFi/4G get crystal clear 720p HD. Visitors on slow 2G/3G or mobile data saver get the fast stream with zero stalling.
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                    Video URL (Direct MP4, WebM, CDN, Cloudflare R2, or Stream Link)
                  </label>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="e.g. https://your-cdn.com/product-promo.mp4 or YouTube / Vimeo link"
                      value={form.video_url}
                      onChange={(e) => setForm((f) => ({ ...f, video_url: e.target.value }))}
                    />
                  </div>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: 5, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>💡 Direct .mp4 links guarantee instantaneous clean autoplay without player ads or borders!</span>
                  </div>
                </div>
              )}

              {/* Video Live Preview Player */}
              {form.video_url?.trim() && (
                <div
                  style={{
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--bg-border)',
                    padding: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle size={14} /> Live Video Player Preview
                    </span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      Position: Slot 2 (Cover Image → Video)
                    </span>
                  </div>

                  <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', maxHeight: '320px', background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video
                      src={form.video_url}
                      controls
                      playsInline
                      muted
                      style={{ width: '100%', maxHeight: '300px', objectFit: 'contain' }}
                      onError={() => {}}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Tags */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 22 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 12, color: 'var(--text-primary)' }}>
              Tags & Search Keywords
            </h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '4px 10px',
                    background: 'rgba(17,98,242,0.1)',
                    border: '1px solid rgba(17,98,242,0.25)',
                    borderRadius: 99,
                    fontSize: '0.8rem',
                    color: '#1162F2',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="Add tag (e.g. reels, lightroom, transitions)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button onClick={addTag} type="button" className="btn-ghost" style={{ flexShrink: 0 }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Card: SEO */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 22 }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: 16, color: 'var(--text-primary)' }}>
              Google Search Optimization (SEO)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Meta Title
                </label>
                <input
                  className="input-field"
                  placeholder="Meta Title for search engines (max 70 characters)"
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  maxLength={70}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Meta Description
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Meta Description snippet for search result cards"
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  maxLength={160}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Sidebar Settings) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>
          {/* Pricing Card */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
              Pricing
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Regular Price (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Discounted Sale Price (₹)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.sale_price}
                  onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                  placeholder="e.g. 99 (optional)"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Details & Specs */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
              Specifications & Access
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  className="input-field"
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: parseInt(e.target.value) }))}
                >
                  <option value={0}>Select Category...</option>
                  {cats?.categories.map((c: Category) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  File Type
                </label>
                <select
                  className="input-field"
                  value={form.file_type}
                  onChange={(e) => setForm((f) => ({ ...f, file_type: e.target.value }))}
                >
                  {['image', 'pdf', 'zip', 'template', 'bundle', 'other'].map((t) => (
                    <option key={t} value={t}>{t.toUpperCase()}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Custom Buy Button CTA
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.button_text}
                  onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                  placeholder="e.g. Buy now, Download"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Max Download Limit
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.download_limit}
                  onChange={(e) => setForm((f) => ({ ...f, download_limit: parseInt(e.target.value) }))}
                  min="1"
                  max="50"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Access Duration Window (Hours)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.access_duration_hours}
                  onChange={(e) => setForm((f) => ({ ...f, access_duration_hours: parseInt(e.target.value) }))}
                  min="1"
                  max="720"
                />
              </div>
            </div>
          </div>

          {/* ── Product Deliverables & Google Drive Card (PRESERVED OFFICIAL LOGO & PREVIEWS) ── */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
              Product Deliverables
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Upload Deliverable File (Cloudflare R2)
                </label>
                <input
                  type="file"
                  onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />

                {/* Interactive Deliverable File Live Preview Card */}
                <DeliverableFilePreviewCard
                  file={productFile}
                  onRemove={() => setProductFile(null)}
                />
              </div>

              <div style={{ position: 'relative', textAlign: 'center', margin: '6px 0' }}>
                <div style={{ borderBottom: '1px solid var(--bg-border)', position: 'absolute', top: '50%', left: 0, right: 0 }} />
                <span
                  style={{
                    position: 'relative',
                    background: 'var(--bg-surface)',
                    padding: '0 10px',
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  OR HOST ON GOOGLE DRIVE / MEGA
                </span>
              </div>

              {/* Official Google Drive Attachment Button */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowDriveInput(!showDriveInput)}
                  className="btn-ghost"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: showDriveInput || form.google_drive_link ? '1px solid #1162F2' : '1px solid var(--bg-border)',
                    background: showDriveInput || form.google_drive_link ? 'rgba(17,98,242,0.08)' : 'var(--bg-elevated)',
                    borderRadius: 8,
                    cursor: 'pointer',
                    width: '100%',
                    justifyContent: 'center',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                    color: 'var(--text-primary)',
                  }}
                >
                  <img
                    src="https://www.gstatic.com/images/branding/productlogos/drive_2026/v1/web-48dp/logo_drive_2026_color_2x_web_48dp.png"
                    alt="Google Drive"
                    style={{ width: 22, height: 22, objectFit: 'contain' }}
                  />
                  {form.google_drive_link ? '✓ Google Drive Link Attached' : 'Attach Google Drive / External Link'}
                </button>

                {(showDriveInput || Boolean(form.google_drive_link)) && (
                  <div style={{ marginTop: 10 }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, marginBottom: 4, color: 'var(--text-secondary)' }}>
                      Google Drive / Mega Shareable Download Link
                    </label>
                    <input
                      type="url"
                      className="input-field"
                      placeholder="https://drive.google.com/file/d/... or Mega link"
                      value={form.google_drive_link}
                      onChange={(e) => setForm((f) => ({ ...f, google_drive_link: e.target.value }))}
                    />

                    {/* Google Drive Live Content & Link Preview Card */}
                    <GoogleDrivePreviewCard link={form.google_drive_link} />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Status Options */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: 20 }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 800, marginBottom: 14, color: 'var(--text-primary)' }}>
              Visibility Status
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                />
                Published (Immediately Visible in Store)
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                />
                Featured on Homepage (⭐ Badge)
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* ── Live Upload Progress Bar Toast ── */}
      <UploadProgressToast
        isOpen={uploadToastOpen}
        overallProgress={uploadProgress}
        statusText={uploadStatusText}
        currentItem={uploadCurrentItem}
        steps={uploadSteps}
        isCompleted={uploadCompleted}
        errorMessage={uploadError}
        productSlug={form.slug}
        onClose={() => setUploadToastOpen(false)}
      />

      {/* ── Zero-Storage Media Library & Existing Assets Modal (Images) ── */}
      <MediaLibraryModal
        isOpen={mediaModalOpen}
        onClose={() => setMediaModalOpen(false)}
        onSelectAsset={handleSelectFromLibrary}
        onSelectMultiple={handleSelectMultipleFromLibrary}
        alreadyAttachedKeys={imageFiles.map((f) => f.r2_key).filter(Boolean) as string[]}
      />

      {/* ── Zero-Storage Media Library Modal (Videos Only) ── */}
      <MediaLibraryModal
        isOpen={videoMediaModalOpen}
        onClose={() => setVideoMediaModalOpen(false)}
        mediaType="video"
        title="Video Media Storage (0 KB Reuse)"
        onSelectAsset={handleSelectVideoFromLibrary}
      />

      {/* ── Studio-Grade Cover & Gallery Image Crop & Adjust Modal ── */}
      <ImageCropModal
        isOpen={cropModalOpen}
        onClose={() => {
          setCropModalOpen(false)
          setCropIdx(null)
        }}
        imageSrc={cropIdx !== null && imageFiles[cropIdx] ? imageFiles[cropIdx].preview : ''}
        imageName={cropIdx !== null && imageFiles[cropIdx] ? imageFiles[cropIdx].file.name : 'showcase.webp'}
        initialAspectRatio={cropIdx === primaryImageIdx ? 1 : null}
        isCover={cropIdx === primaryImageIdx}
        title={cropIdx === primaryImageIdx ? 'Main Storefront Cover Crop & Adjust Studio' : 'Gallery Image Crop & Adjust Studio'}
        onApplyCrop={handleApplyCrop}
      />
    </div>
  )
}
