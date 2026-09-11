// src/client/pages/admin/products/AdminProductEdit.tsx — Modern Product Editor with AI & Multi-Image Management
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Upload, Plus, X, Trash2, CheckCircle, Sparkles,
  Image as ImageIcon, Star, ExternalLink, Loader2, RefreshCw, FileCheck, Layers, Video, Play, Film, Link as LinkIcon,
  Crop, Sliders, Eye, ZoomIn, ShieldCheck, Check, Info, Maximize2
} from 'lucide-react'
import ImageCropModal from '../../../components/admin/ImageCropModal'
import { optimizeVideo } from '../../../lib/video-optimizer'
import { adminApi, type Category, type ProductImage } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { createImageVariants } from '../../../lib/image-optimizer'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import UploadProgressToast, { type UploadStepItem } from '../../../components/admin/UploadProgressToast'
import DeliverableFilePreviewCard from '../../../components/admin/DeliverableFilePreviewCard'
import GoogleDrivePreviewCard from '../../../components/admin/GoogleDrivePreviewCard'
import { adminToast } from '../../../lib/admin-toast'
import MediaLibraryModal, { type MediaAssetItem } from '../../../components/admin/MediaLibraryModal'

export default function AdminProductEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { getToken } = useAuthStore()

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')
  const [mediaModalOpen, setMediaModalOpen] = useState(false)
  const [videoMediaModalOpen, setVideoMediaModalOpen] = useState(false)

  const [form, setForm] = useState({
    title: '',
    slug: '',
    description: '',
    short_description: '',
    category_id: 0,
    price: 0,
    sale_price: '',
    is_published: false,
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

  // Existing images from backend
  const [existingImages, setExistingImages] = useState<ProductImage[]>([])

  // Newly selected images to upload
  const [newImageFiles, setNewImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [productFile, setProductFile] = useState<File | null>(null)

  // ── Cover & Gallery Image Crop Studio States ──
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [cropTarget, setCropTarget] = useState<{
    type: 'existing' | 'new'
    id?: number
    index?: number
    name?: string
    isCover?: boolean
  } | null>(null)
  const [cropImageSrc, setCropImageSrc] = useState('')

  // Fullscreen Lightbox Preview State
  const [previewModalOpen, setPreviewModalOpen] = useState(false)
  const [previewImageSrc, setPreviewImageSrc] = useState('')
  const [previewImageTitle, setPreviewImageTitle] = useState('')
  const [isDropZoneActive, setIsDropZoneActive] = useState(false)

  const [showDriveInput, setShowDriveInput] = useState(false)
  const [tagInput, setTagInput] = useState('')

  // AI Assistant States
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

  // Fetch product data
  const { data, isLoading } = useQuery({
    queryKey: ['admin-product-edit', id],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.products.get(token!, parseInt(id!))
    },
    enabled: !!id,
  })

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      return res.json() as Promise<{ categories: Category[] }>
    },
  })

  // Sync form when data loads
  useEffect(() => {
    if (data?.product) {
      const p = data.product
      let parsedTags: string[] = []
      if (Array.isArray(p.tags)) {
        parsedTags = p.tags
      } else if (typeof p.tags === 'string') {
        try { parsedTags = JSON.parse(p.tags) } catch { parsedTags = [p.tags] }
      }

      setForm({
        title: p.title || '',
        slug: p.slug || '',
        description: p.description || '',
        short_description: p.short_description ?? '',
        category_id: p.category_id ?? 0,
        price: p.price ?? 0,
        sale_price: p.sale_price !== null && p.sale_price !== undefined ? p.sale_price.toString() : '',
        is_published: p.is_published === 1 || p.is_published === true,
        is_featured: p.is_featured === 1 || p.is_featured === true,
        file_type: p.file_type || 'image',
        license_type: p.license_type || 'personal',
        button_text: p.button_text || 'Buy',
        google_drive_link: p.google_drive_link ?? '',
        video_url: p.video_url ?? '',
        download_limit: p.download_limit ?? 3,
        access_duration_hours: p.access_duration_hours ?? 12,
        meta_title: p.meta_title ?? '',
        meta_description: p.meta_description ?? '',
        tags: parsedTags,
      })

      if (p.google_drive_link) {
        setShowDriveInput(true)
      }
    }

    if (data?.images) {
      setExistingImages(data.images)
    }
  }, [data])

  // Multi-image selection
  const handleNewImagesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const items: { file: File; preview: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const f = files[i]
      items.push({
        file: f,
        preview: URL.createObjectURL(f),
      })
    }
    setNewImageFiles((prev) => [...prev, ...items])
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

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== index))
  }

  // ── Image Crop & Lightbox Handlers ──
  const handleOpenCropForExisting = (img: ProductImage) => {
    const imageUrl = (img as any).url
      ? (img as any).url
      : img.r2_key?.startsWith('http')
      ? img.r2_key
      : img.r2_key
      ? `/api/images/${encodeURIComponent(img.r2_key)}`
      : ''
    setCropTarget({
      type: 'existing',
      id: img.id,
      name: img.alt_text || 'product-cover.webp',
      isCover: Boolean(img.is_thumbnail),
    })
    setCropImageSrc(imageUrl)
    setCropModalOpen(true)
  }

  const handleOpenCropForNew = (item: { file: File; preview: string }, index: number) => {
    const hasExistingCover = existingImages.some((img) => Boolean(img.is_thumbnail))
    setCropTarget({
      type: 'new',
      index,
      name: item.file.name,
      isCover: !hasExistingCover && index === 0,
    })
    setCropImageSrc(item.preview)
    setCropModalOpen(true)
  }

  const handleOpenLightbox = (src: string, title: string) => {
    setPreviewImageSrc(src)
    setPreviewImageTitle(title)
    setPreviewModalOpen(true)
  }

  const handleApplyCrop = async (croppedFile: File, croppedPreviewUrl: string) => {
    if (!cropTarget) return

    if (cropTarget.type === 'new' && cropTarget.index !== undefined) {
      setNewImageFiles((prev) =>
        prev.map((item, idx) =>
          idx === cropTarget.index
            ? { file: croppedFile, preview: croppedPreviewUrl }
            : item
        )
      )
      adminToast.success('Crop Applied', 'Pending image updated with your adjustments')
    } else if (cropTarget.type === 'existing' && cropTarget.id !== undefined) {
      try {
        const token = await getToken()
        if (!token || !id) throw new Error('Not authenticated')

        const productId = parseInt(id)
        adminToast.info('Optimizing Crop', 'Applying perceptual compression & generating WebP variants...')
        const variants = await createImageVariants(croppedFile)

        const res = await adminApi.products.uploadImage(
          token,
          productId,
          croppedFile,
          Boolean(cropTarget.isCover),
          {
            thumb: variants.thumb,
            medium: variants.medium,
            large: variants.large,
            blurDataUrl: variants.blurDataUrl,
          }
        )

        if (res.success) {
          qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
          adminToast.success(
            'Cover Image Updated',
            '✓ Cropped cover image saved and set as primary storefront showcase!'
          )
        }
      } catch (err: any) {
        adminToast.error('Crop Save Failed', err.message || 'Failed to save cropped image')
      }
    }
  }

  // Handle selecting from existing media storage (zero duplicate upload)
  const handleSelectFromLibrary = async (asset: MediaAssetItem) => {
    try {
      const token = await getToken()
      if (!token || !id) return
      const res = await adminApi.products.attachExistingImage(token, parseInt(id), {
        r2_key: asset.r2_key,
        content_hash: asset.content_hash,
        alt_text: asset.original_filename,
      })
      if (res.success) {
        qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
        adminToast.success('Existing Image Reused', `✓ Attached "${asset.original_filename}" (0 KB storage consumed)!`)
      }
    } catch (err: any) {
      adminToast.error('Attach Failed', err.message)
    }
  }

  const handleSelectMultipleFromLibrary = async (chosenAssets: MediaAssetItem[]) => {
    try {
      const token = await getToken()
      if (!token || !id) return
      let count = 0
      for (const asset of chosenAssets) {
        await adminApi.products.attachExistingImage(token, parseInt(id), {
          r2_key: asset.r2_key,
          content_hash: asset.content_hash,
          alt_text: asset.original_filename,
        })
        count++
      }
      qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
      adminToast.success('Media Assets Reused', `✓ Reused ${count} existing image(s) from storage (0 KB duplicate upload)`)
    } catch (err: any) {
      adminToast.error('Attach Failed', err.message)
    }
  }

  // Handle attaching video from existing media storage (zero duplicate upload)
  const handleSelectVideoFromLibrary = (asset: MediaAssetItem) => {
    setForm((f) => ({ ...f, video_url: asset.url }))
    setVideoStats({
      originalMB: (asset.file_size / (1024 * 1024)).toFixed(1),
      optimizedMB: (asset.file_size / (1024 * 1024)).toFixed(1),
      savedPct: 100,
    })
    adminToast.success('Video Reused', `✓ Attached "${asset.original_filename}" (0 KB storage consumed)!`)
  }

  // Delete existing image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const token = await getToken()
      return adminApi.products.deleteImage(token!, parseInt(id!), imageId)
    },
    onSuccess: (_, imageId) => {
      setExistingImages((prev) => prev.filter((img) => img.id !== imageId))
      qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
      setSuccess('Image deleted successfully.')
      adminToast.success('Image Deleted', 'Product gallery updated')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err: any) => {
      setError(`Failed to delete image: ${err.message}`)
      adminToast.error('Delete Image Failed', err.message)
    },
  })

  // Set image as cover thumbnail mutation
  const setCoverMutation = useMutation({
    mutationFn: async (imageId: number) => {
      const token = await getToken()
      return adminApi.products.setThumbnail(token!, parseInt(id!), imageId)
    },
    onSuccess: (_, imageId) => {
      setExistingImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_thumbnail: img.id === imageId ? 1 : 0,
        }))
      )
      qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
      setSuccess('Main cover image updated!')
      adminToast.success('Cover Image Updated', 'Main showcase thumbnail updated')
      setTimeout(() => setSuccess(''), 3000)
    },
    onError: (err: any) => {
      setError(`Failed to set cover image: ${err.message}`)
      adminToast.error('Cover Update Failed', err.message)
    },
  })

  // AI Content Enhancer Handler
  const handleAiEnhance = async (type: 'description' | 'seo') => {
    if (!form.title) {
      setError('Please provide a Product Title first for AI context')
      return
    }

    setAiLoading(true)
    setError('')
    setAiBanner('')

    try {
      const token = await getToken()
      if (type === 'description') {
        const res = await adminApi.ai.enhanceText(
          token!,
          form.description || form.title,
          'description'
        )
        if (res.success && res.text) {
          setForm((f) => ({ ...f, description: res.text }))
          setAiBanner('✨ Description enhanced with professional structure, highlights & specs!')
        }
      } else if (type === 'seo') {
        const res = await adminApi.ai.enhanceText(
          token!,
          form.title,
          'seo'
        )
        if (res.success && res.text) {
          // AI returns meta info or tags
          setForm((f) => ({
            ...f,
            meta_title: f.meta_title || `${f.title} | Instant Download`,
            meta_description: f.meta_description || f.short_description || res.text.slice(0, 155),
          }))
          setAiBanner('✨ SEO Meta Title and Description optimized!')
        }
      }
    } catch (err: any) {
      setError(`AI Assistant Note: ${err.message}`)
    } finally {
      setAiLoading(false)
    }
  }

  // Update Product Mutation
  const updateMutation = useMutation({
    mutationFn: async () => {
      const token = await getToken()
      return adminApi.products.update(token!, parseInt(id!), {
        ...form,
        category_id: form.category_id || undefined,
        sale_price: form.sale_price ? parseFloat(form.sale_price) : null,
        tags: form.tags,
        video_url: form.video_url?.trim() || null,
      })
    },
    onMutate: () => {
      const stepsList: UploadStepItem[] = [
        { id: 'step-data', label: 'Updating Product Details & Specifications', type: 'data', status: 'processing' },
      ]

      newImageFiles.forEach((img, idx) => {
        stepsList.push({
          id: `step-gallery-${idx}`,
          label: `Showcase Gallery Image ${idx + 1} of ${newImageFiles.length}: "${img.file.name}"`,
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
      setUploadCurrentItem({ name: form.title || 'Product Specifications', type: 'data' })
      setUploadStatusText('Saving updated product records to database...')
      setUploadCompleted(false)
      setUploadError('')
      setUploadToastOpen(true)
    },
    onSuccess: async () => {
      // Mark step-data completed
      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-data' ? { ...s, status: 'completed' } : s))
      )

      const token = await getToken()
      const productId = parseInt(id!)
      const totalSteps = newImageFiles.length + (productFile ? 1 : 0) + 1
      let completedCount = 1

      // 1. Upload any new showcase gallery images added
      if (newImageFiles.length > 0) {
        setUploading(true)
        const hasExistingCover = existingImages.some((img) => Boolean(img.is_thumbnail))

        for (let idx = 0; idx < newImageFiles.length; idx++) {
          const item = newImageFiles[idx]
          const isCover = !hasExistingCover && idx === 0

          setUploadSteps((prev) =>
            prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'processing' } : s))
          )

          setUploadCurrentItem({
            name: item.file.name,
            type: 'gallery',
            index: idx + 1,
            total: newImageFiles.length,
            size: item.file.size,
          })

          setUploadStatusText(
            `Meta Perceptual Compression (HVS-Tuned WebP + Sharpened) & Uploading ${idx + 1}/${newImageFiles.length}${isCover ? ' [Primary Cover]' : ''}...`
          )

          try {
            const variants = await createImageVariants(item.file)
            console.log(
              `[Perceptual Compression] #${idx + 1}: ${(item.file.size / 1024).toFixed(1)}KB -> ${(variants.compressedTotalSize / 1024).toFixed(1)}KB (${variants.savingsPercent}% saved)`
            )
            const uploadRes = await adminApi.products.uploadImage(token!, productId, item.file, isCover, {
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
          } catch (e: any) {
            console.error('Image upload failed:', e)
            setUploadSteps((prev) =>
              prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'error', detail: e.message } : s))
            )
          }

          completedCount++
          setUploadProgress(Math.round((completedCount / (totalSteps + 1)) * 90))
        }
        setNewImageFiles([])
      }

      // 2. Upload Direct Deliverable Asset File if provided
      if (productFile) {
        setUploading(true)
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
          const fileRes = await adminApi.products.uploadFile(token!, productId, productFile)
          setUploadSteps((prev) =>
            prev.map((s) =>
              s.id === 'step-deliverable'
                ? { ...s, status: fileRes.deduplicated ? 'deduplicated' : 'completed' }
                : s
            )
          )
          setProductFile(null)
        } catch (e: any) {
          console.error('File upload failed:', e)
          setUploadSteps((prev) =>
            prev.map((s) => (s.id === 'step-deliverable' ? { ...s, status: 'error', detail: e.message } : s))
          )
        }

        completedCount++
        setUploadProgress(90)
      }

      // 3. Finalize & Realtime Cache Invalidation
      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-finalize' ? { ...s, status: 'processing' } : s))
      )
      setUploadStatusText('Invalidating caches for instant live update...')

      setUploading(false)
      setUploadProgressText('')
      await qc.invalidateQueries({ queryKey: ['admin-products'] })
      await qc.invalidateQueries({ queryKey: ['admin-product-edit', id] })
      await qc.invalidateQueries({ queryKey: ['admin-analytics'] })

      setUploadSteps((prev) =>
        prev.map((s) => (s.id === 'step-finalize' ? { ...s, status: 'completed' } : s))
      )

      setUploadProgress(100)
      setUploadCompleted(true)
      setSuccess('Product and assets updated successfully!')
      adminToast.success('Product Updated', `"${form.title}" saved successfully!`)
      setTimeout(() => setSuccess(''), 3500)
    },
    onError: (err: any) => {
      setUploading(false)
      setError(err.message || 'Failed to update product')
      setUploadError(err.message || 'Failed to update product')
      adminToast.error('Product Update Failed', err.message || 'Failed to update product')
    },
  })

  const addTag = () => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((f) => ({ ...f, tags: [...f.tags, tag] }))
      setTagInput('')
    }
  }

  if (isLoading) return <LoadingSpinner />

  const discountPercent =
    form.price > 0 && form.sale_price && parseFloat(form.sale_price) < form.price
      ? Math.round(((form.price - parseFloat(form.sale_price)) / form.price) * 100)
      : null

  return (
    <div style={{ maxWidth: 1280, width: '100%', paddingBottom: 60 }}>
      {/* ── Top Header Navigation Bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => navigate('/admin/products')}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 38,
              height: 38,
              padding: 0,
              borderRadius: 'var(--radius-md)',
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h1 style={{ fontSize: '1.45rem', fontWeight: 800, margin: 0 }}>Edit Product</h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                  background: form.is_published ? 'linear-gradient(135deg, rgba(17, 98, 242, 0.15), rgba(124, 58, 237, 0.15))' : 'rgba(255,160,0,0.15)',
                  color: form.is_published ? '#1162F2' : '#d97706',
                  border: `1px solid ${form.is_published ? 'rgba(17, 98, 242, 0.3)' : 'rgba(255,160,0,0.3)'}`,
                }}
              >
                {form.is_published ? '● Live Published' : '○ Draft'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ID: #{id}</span>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: '3px 0 0 0' }}>
              {form.title || 'Untitled Product'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {form.slug && (
            <a
              href={`/product/${form.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: '0.825rem',
                padding: '9px 14px',
              }}
            >
              <ExternalLink size={15} />
              View on Store
            </a>
          )}

          <button
            onClick={() => updateMutation.mutate()}
            className="btn-primary"
            disabled={updateMutation.isPending || uploading || !form.title || !form.slug || form.price <= 0}
            style={{
              padding: '10px 22px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(17,98,242,0.25)',
            }}
          >
            {updateMutation.isPending || uploading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {uploadProgressText || 'Saving Changes...'}
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Status Alerts ── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: 20 }}>
          {error}
        </div>
      )}
      {success && (
        <div className="alert alert-success" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle size={16} /> {success}
        </div>
      )}

      {/* ── AI Magic Assistant Quick Card ── */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.08) 0%, rgba(124, 58, 237, 0.06) 100%)',
          border: '1px solid rgba(17, 98, 242, 0.25)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 'var(--radius-md)',
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
            <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              Gemini AI Content Optimizer
              <span
                style={{
                  fontSize: '0.7rem',
                  padding: '1px 6px',
                  borderRadius: 4,
                  background: 'rgba(17,98,242,0.15)',
                  color: '#1162f2',
                  fontWeight: 600,
                }}
              >
                Auto Copilot
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              1-click enhance descriptions, formatting, bullet points, and SEO meta tags
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            type="button"
            onClick={() => handleAiEnhance('description')}
            disabled={aiLoading}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              padding: '8px 14px',
              border: '1px solid rgba(17,98,242,0.3)',
              background: 'var(--bg-surface)',
            }}
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} color="#1162f2" />}
            ✨ Enhance Description
          </button>

          <button
            type="button"
            onClick={() => handleAiEnhance('seo')}
            disabled={aiLoading}
            className="btn-ghost"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.8125rem',
              padding: '8px 14px',
              border: '1px solid rgba(17,98,242,0.3)',
              background: 'var(--bg-surface)',
            }}
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} color="#7c3aed" />}
            ✨ Auto Generate SEO
          </button>
        </div>

        {aiBanner && (
          <div
            style={{
              width: '100%',
              padding: '8px 12px',
              background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.1), rgba(124, 58, 237, 0.1))',
              border: '1px solid rgba(17, 98, 242, 0.25)',
              borderRadius: 'var(--radius-sm)',
              color: '#1162F2',
              fontSize: '0.8125rem',
              fontWeight: 600,
            }}
          >
            {aiBanner}
          </div>
        )}
      </div>

      {/* ── Main Form Layout ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
        {/* Left Column: Product Details & Media */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Card 1: Core Information */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 18 }}>Product Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Product Title *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. 1000+ Viral Reels & Shorts Pack"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                  URL Slug *
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span
                    style={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      borderRight: 'none',
                      borderRadius: 'var(--radius-md) 0 0 var(--radius-md)',
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
                    style={{ borderRadius: '0 var(--radius-md) var(--radius-md) 0' }}
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.85rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Short Summary (1-Liner)
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.short_description}
                  onChange={(e) => setForm((f) => ({ ...f, short_description: e.target.value }))}
                  placeholder="Brief 1-liner summary displayed on product cards & checkout"
                  maxLength={300}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Detailed Product Description (Markdown Supported) *
                  </label>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Supports # headings, *bullets*, and bold text
                  </span>
                </div>
                <textarea
                  className="input-field"
                  rows={10}
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  style={{ resize: 'vertical', lineHeight: 1.55 }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Product Gallery & Images */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg, 12px)',
              padding: 24,
            }}
          >
            {/* Header: Title, Description & Action Buttons */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 16,
                flexWrap: 'wrap',
                gap: 10,
              }}
            >
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Product Gallery & Images ({existingImages.length + newImageFiles.length})
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '3px 0 0' }}>
                  Upload multiple product showcase images or reuse storage assets (0 KB). Click the star to set primary cover thumbnail.
                </p>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                {/* Browse Media Storage Button */}
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    color: 'var(--brand-purple, #2874F0)',
                    borderRadius: 8,
                    padding: '7px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Browse already uploaded storage assets without consuming duplicate disk space"
                >
                  <Layers size={14} /> Browse Media Storage (0 KB Reuse)
                </button>

                {/* Quick Add Photos Trigger */}
                <button
                  type="button"
                  onClick={() => document.getElementById('edit-multi-image-input')?.click()}
                  style={{
                    background: 'var(--brand-purple, #2874F0)',
                    border: 'none',
                    color: '#ffffff',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(40, 116, 240, 0.25)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Plus size={14} /> Add Images
                </button>
              </div>
            </div>

            {/* ── Direct Existing Images Grid ── */}
            {existingImages.length > 0 && (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                {existingImages.map((img) => {
                  const isCover = Boolean(img.is_thumbnail)
                  const imageUrl = (img as any).url
                    ? (img as any).url
                    : img.r2_key?.startsWith('http')
                    ? img.r2_key
                    : img.r2_key
                    ? `/api/images/${encodeURIComponent(img.r2_key)}`
                    : ''

                  return (
                    <div
                      key={img.id}
                      style={{
                        position: 'relative',
                        borderRadius: 10,
                        border: isCover ? '2px solid var(--brand-purple, #2874F0)' : '1px solid var(--bg-border)',
                        background: 'var(--bg-surface)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxShadow: isCover ? '0 2px 8px rgba(40, 116, 240, 0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {/* Image Preview Window */}
                      <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: 'var(--bg-elevated)', position: 'relative' }}>
                        <img
                          src={imageUrl}
                          alt={img.alt_text || 'Product image'}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                          onError={(e) => {
                            const target = e.currentTarget
                            if (!target.src.includes('placeholder')) {
                              target.src = `https://placehold.co/400x400/2874f0/white?text=Image`
                            }
                          }}
                        />

                        {/* Signature Yellow Cover Badge */}
                        {isCover && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 6,
                              left: 6,
                              background: 'var(--brand-amber, #FFD200)',
                              color: '#000000',
                              padding: '2px 6px',
                              borderRadius: 4,
                              fontSize: '0.62rem',
                              fontWeight: 800,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                              boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                            }}
                          >
                            <Star size={9} fill="#000000" /> Main Cover
                          </span>
                        )}

                        {/* Quick Inspect Button Overlay */}
                        <button
                          type="button"
                          onClick={() => handleOpenLightbox(imageUrl, img.alt_text || 'Gallery Image')}
                          style={{
                            position: 'absolute',
                            top: 6,
                            right: 6,
                            background: 'rgba(0,0,0,0.55)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 22,
                            height: 22,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Inspect Image"
                        >
                          <Eye size={11} />
                        </button>
                      </div>

                      {/* Card Action Controls Footer */}
                      <div
                        style={{
                          padding: '6px 8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 5,
                          background: 'var(--bg-surface)',
                          borderTop: '1px solid var(--bg-border)',
                        }}
                      >
                        {!isCover && (
                          <button
                            type="button"
                            onClick={() => setCoverMutation.mutate(img.id)}
                            disabled={setCoverMutation.isPending}
                            style={{
                              fontSize: '0.68rem',
                              fontWeight: 700,
                              padding: '3px 5px',
                              width: '100%',
                              textAlign: 'center',
                              borderRadius: 5,
                              background: 'var(--brand-purple-soft, rgba(40, 116, 240, 0.08))',
                              border: '1px solid var(--brand-purple, #2874F0)',
                              color: 'var(--brand-purple, #2874F0)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 3,
                            }}
                            title="Set as Main Storefront Thumbnail"
                          >
                            <Star size={10} /> Make Cover
                          </button>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          {/* ✂️ Crop Button for ANY gallery image */}
                          <button
                            type="button"
                            onClick={() => handleOpenCropForExisting(img)}
                            style={{
                              flex: 1,
                              background: 'var(--bg-surface)',
                              border: '1px solid var(--bg-border)',
                              color: 'var(--text-primary)',
                              borderRadius: 5,
                              fontSize: '0.68rem',
                              fontWeight: 600,
                              padding: '3px 0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 3,
                              cursor: 'pointer',
                            }}
                            title="Crop & Adjust image"
                          >
                            <Crop size={10} /> Crop
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this image?')) {
                                deleteImageMutation.mutate(img.id)
                              }
                            }}
                            disabled={deleteImageMutation.isPending}
                            style={{
                              background: 'rgba(239, 68, 68, 0.08)',
                              border: '1px solid rgba(239, 68, 68, 0.2)',
                              color: 'var(--error, #FF6161)',
                              borderRadius: 5,
                              width: 24,
                              height: 24,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                            title="Delete Image"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* ── Newly Selected Images Queued for Upload ── */}
            {newImageFiles.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  background: 'var(--brand-purple-soft, rgba(40, 116, 240, 0.04))',
                  border: '1px dashed var(--brand-purple, #2874F0)',
                  borderRadius: 10,
                  padding: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--brand-purple, #2874F0)',
                      }}
                    />
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Ready to Upload on Save ({newImageFiles.length})
                    </span>
                  </div>
                  <span style={{ fontSize: '0.68rem', color: 'var(--brand-purple, #2874F0)', fontWeight: 600 }}>
                    ⚡ You can crop/adjust these before saving
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 10,
                  }}
                >
                  {newImageFiles.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 8,
                        border: '1px dashed var(--brand-purple, #2874F0)',
                        background: 'var(--bg-surface)',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                      }}
                    >
                      <div style={{ position: 'relative', aspectRatio: '1/1', background: 'var(--bg-elevated)' }}>
                        <img
                          src={item.preview}
                          alt={`New ${idx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />

                        {/* Remove Button */}
                        <button
                          type="button"
                          onClick={() => removeNewImage(idx)}
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0,0,0,0.65)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Remove from queue"
                        >
                          <X size={11} />
                        </button>
                      </div>

                      {/* Action to Crop Pending File Before Save */}
                      <div
                        style={{
                          padding: '4px 6px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: 'var(--bg-surface)',
                          borderTop: '1px solid var(--bg-border)',
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenCropForNew(item, idx)}
                          style={{
                            flex: 1,
                            background: 'var(--brand-purple-soft, rgba(40, 116, 240, 0.08))',
                            border: '1px solid var(--brand-purple, #2874F0)',
                            color: 'var(--brand-purple, #2874F0)',
                            borderRadius: 4,
                            fontSize: '0.66rem',
                            fontWeight: 700,
                            padding: '3px 0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 3,
                            cursor: 'pointer',
                          }}
                        >
                          <Crop size={10} /> Crop Pre-Save
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Drag & Dropzone for Multi-Image ── */}
            <div
              onDragOver={(e) => {
                e.preventDefault()
                setIsDropZoneActive(true)
              }}
              onDragLeave={() => setIsDropZoneActive(false)}
              onDrop={(e) => {
                e.preventDefault()
                setIsDropZoneActive(false)
                handleNewImagesSelect(e.dataTransfer.files)
              }}
              onClick={() => document.getElementById('edit-multi-image-input')?.click()}
              style={{
                border: isDropZoneActive ? '2px dashed var(--brand-purple, #2874F0)' : '2px dashed var(--bg-border)',
                borderRadius: 10,
                padding: '24px 16px',
                textAlign: 'center',
                background: isDropZoneActive
                  ? 'var(--brand-purple-soft, rgba(40, 116, 240, 0.08))'
                  : 'var(--bg-surface)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <input
                id="edit-multi-image-input"
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleNewImagesSelect(e.target.files)}
                style={{ display: 'none' }}
              />

              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  background: 'var(--brand-purple-soft, rgba(40, 116, 240, 0.08))',
                  color: 'var(--brand-purple, #2874F0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 8px auto',
                }}
              >
                <Upload size={18} />
              </div>

              <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 3, color: 'var(--text-primary)' }}>
                {isDropZoneActive ? 'Release to select images!' : 'Click or Drag & Drop showcase photos here'}
              </div>

              <p style={{ fontSize: '0.74rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
                Multi-selection supported • Automatically compressed to high-speed WebP formats
              </p>

              {/* Format pills */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, flexWrap: 'wrap' }}>
                {['PNG', 'JPG', 'WEBP', 'AVIF'].map((fmt) => (
                  <span
                    key={fmt}
                    style={{
                      fontSize: '0.64rem',
                      fontWeight: 700,
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      color: 'var(--text-secondary)',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    {fmt}
                  </span>
                ))}
                <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginLeft: 4 }}>
                  Up to 15MB each
                </span>
              </div>
            </div>
          </div>

          {/* Card: High-Conversion Product Showcase Video (Auto-Slide 2nd Slot) */}
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 'var(--radius-lg)', padding: 24, position: 'relative', overflow: 'hidden' }}>
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
                    id="edit-video-upload-input"
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
                      onClick={() => document.getElementById('edit-video-upload-input')?.click()}
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

          {/* Card 3: Tags */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: 12 }}>Tags & Categories</h3>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
              {form.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    padding: '5px 12px',
                    background: 'rgba(17,98,242,0.1)',
                    border: '1px solid rgba(17,98,242,0.25)',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '0.8rem',
                    color: '#1162f2',
                    fontWeight: 600,
                  }}
                >
                  {tag}
                  <button
                    onClick={() => setForm((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                    style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', padding: 0 }}
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="input-field"
                placeholder="Add tag (e.g. reels, photoshop, templates)..."
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              />
              <button onClick={addTag} type="button" className="btn-ghost" style={{ flexShrink: 0, padding: '0 16px' }}>
                <Plus size={16} /> Add
              </button>
            </div>
          </div>

          {/* Card 4: SEO Metadata */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>Search Engine Optimization (SEO)</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Live Google SERP preview</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Meta Title
                  </label>
                  <span style={{ fontSize: '0.72rem', color: form.meta_title.length > 60 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {form.meta_title.length} / 70 chars
                  </span>
                </div>
                <input
                  className="input-field"
                  placeholder="Meta Title for Google search"
                  value={form.meta_title}
                  onChange={(e) => setForm((f) => ({ ...f, meta_title: e.target.value }))}
                  maxLength={70}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Meta Description
                  </label>
                  <span style={{ fontSize: '0.72rem', color: form.meta_description.length > 150 ? '#f59e0b' : 'var(--text-muted)' }}>
                    {form.meta_description.length} / 160 chars
                  </span>
                </div>
                <textarea
                  className="input-field"
                  rows={3}
                  placeholder="Meta Description shown in search results"
                  value={form.meta_description}
                  onChange={(e) => setForm((f) => ({ ...f, meta_description: e.target.value }))}
                  maxLength={160}
                  style={{ resize: 'vertical' }}
                />
              </div>

              {/* Live SERP Mockup */}
              <div
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px 16px',
                  marginTop: 4,
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                  https://1024teraviralhub.com/product/{form.slug || 'slug'}
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 600, color: '#1a0dab', marginBottom: 3, cursor: 'pointer' }}>
                  {form.meta_title || form.title || 'Product Title | 1024TeraViralHub'}
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {form.meta_description || form.short_description || form.description?.slice(0, 150) || 'Get instant access to this digital product.'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Pricing & Deliverables (Sidebar) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, position: 'sticky', top: 80 }}>
          {/* Card: Pricing */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ fontWeight: 700, fontSize: '0.95rem', margin: 0 }}>Pricing & Discount</h3>
              {discountPercent && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.15), rgba(124, 58, 237, 0.15))',
                    border: '1px solid rgba(17, 98, 242, 0.25)',
                    color: '#1162F2',
                  }}
                >
                  {discountPercent}% OFF
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Regular Price (₹) *
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  step="1"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Discounted Sale Price (₹)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={form.sale_price}
                  onChange={(e) => setForm((f) => ({ ...f, sale_price: e.target.value }))}
                  min="0"
                  step="1"
                  placeholder="Leave empty if no discount"
                />
              </div>
            </div>
          </div>

          {/* Card: Visibility & Status */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Visibility & Status</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((f) => ({ ...f, is_published: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#1162F2' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Published</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Visible to store visitors</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: '#1162f2' }}
                />
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Featured on Homepage</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shown in top featured grid</div>
                </div>
              </label>
            </div>
          </div>

          {/* Card: Configuration & CTA */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Details & CTA Button</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Buy Button Text
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={form.button_text}
                  onChange={(e) => setForm((f) => ({ ...f, button_text: e.target.value }))}
                  placeholder="e.g. Buy, Pay, Download, Instant Access"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  Category
                </label>
                <select
                  className="input-field"
                  value={form.category_id}
                  onChange={(e) => setForm((f) => ({ ...f, category_id: parseInt(e.target.value) }))}
                >
                  <option value={0}>Select category...</option>
                  {cats?.categories.map((c: Category) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                  File Type
                </label>
                <select
                  className="input-field"
                  value={form.file_type}
                  onChange={(e) => setForm((f) => ({ ...f, file_type: e.target.value }))}
                >
                  {['image', 'pdf', 'zip', 'template', 'bundle', 'other'].map((t) => (
                    <option key={t} value={t}>
                      {t.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                    Download Limit
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
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
                    Access Hours
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={form.access_duration_hours}
                    onChange={(e) => setForm((f) => ({ ...f, access_duration_hours: parseInt(e.target.value) }))}
                    min="1"
                    max="168"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Deliverables & Google Drive (PRESERVED GOOGLE DRIVE LOGO) */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
            }}
          >
            <h3 style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: 14 }}>Product Deliverables</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Upload New Asset to Cloudflare R2
                </label>
                <input
                  type="file"
                  onChange={(e) => setProductFile(e.target.files?.[0] ?? null)}
                  style={{ width: '100%', fontSize: '0.8rem' }}
                />

                {/* Deliverable File Live Preview */}
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

              {/* GOOGLE DRIVE PRESERVED BUTTON & INPUT */}
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
                    border: showDriveInput || form.google_drive_link ? '1px solid #1162f2' : '1px solid var(--bg-border)',
                    background: showDriveInput || form.google_drive_link ? 'rgba(17,98,242,0.08)' : 'var(--bg-elevated)',
                    borderRadius: 'var(--radius-md)',
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
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, marginBottom: 4, color: 'var(--text-secondary)' }}>
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
        alreadyAttachedKeys={existingImages.map((f) => f.r2_key).filter(Boolean) as string[]}
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
          setCropTarget(null)
          setCropImageSrc('')
        }}
        imageSrc={cropImageSrc}
        imageName={cropTarget?.name || 'product-image.webp'}
        initialAspectRatio={cropTarget?.isCover ? 1 : null}
        isCover={Boolean(cropTarget?.isCover)}
        title={cropTarget?.isCover ? 'Main Cover Crop & Adjust Studio' : 'Gallery Image Crop & Adjust Studio'}
        onApplyCrop={handleApplyCrop}
      />

      {/* ── Fullscreen Lightbox Image Inspection Modal ── */}
      {previewModalOpen && (
        <div
          onClick={() => setPreviewModalOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999999,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
            cursor: 'zoom-out',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '88vh',
              borderRadius: 'var(--radius-lg, 14px)',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-lg, 0 20px 50px rgba(0,0,0,0.3))',
              border: '1px solid var(--bg-border)',
              background: 'var(--bg-surface)',
              display: 'flex',
              flexDirection: 'column',
              cursor: 'default',
            }}
          >
            <div
              style={{
                padding: '10px 16px',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid var(--bg-border)',
              }}
            >
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {previewImageTitle}
              </span>
              <button
                type="button"
                onClick={() => setPreviewModalOpen(false)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 6,
                  color: 'var(--text-secondary)',
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
            <div style={{ padding: 12, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={previewImageSrc}
                alt={previewImageTitle}
                style={{
                  maxWidth: '100%',
                  maxHeight: 'calc(88vh - 80px)',
                  objectFit: 'contain',
                  display: 'block',
                  borderRadius: 6,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
