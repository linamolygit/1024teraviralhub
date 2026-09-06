// src/client/pages/admin/products/AdminProductEdit.tsx — Modern Product Editor with AI & Multi-Image Management
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Upload, Plus, X, Trash2, CheckCircle, Sparkles,
  Image as ImageIcon, Star, ExternalLink, Loader2, RefreshCw, FileCheck, Layers
} from 'lucide-react'
import { adminApi, type Category, type ProductImage } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { createImageVariants } from '../../../lib/image-optimizer'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import UploadProgressToast, { type UploadStepItem } from '../../../components/admin/UploadProgressToast'
import DeliverableFilePreviewCard from '../../../components/admin/DeliverableFilePreviewCard'
import GoogleDrivePreviewCard from '../../../components/admin/GoogleDrivePreviewCard'
import { adminToast } from '../../../lib/admin-toast'

export default function AdminProductEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { getToken } = useAuthStore()

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgressText, setUploadProgressText] = useState('')

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

  const removeNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== index))
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
            await adminApi.products.uploadImage(token!, productId, item.file, isCover, {
              thumb: variants.thumb,
              medium: variants.medium,
              large: variants.large,
              blurDataUrl: variants.blurDataUrl,
            })

            setUploadSteps((prev) =>
              prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'completed' } : s))
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
          await adminApi.products.uploadFile(token!, productId, productFile)
          setUploadSteps((prev) =>
            prev.map((s) => (s.id === 'step-deliverable' ? { ...s, status: 'completed' } : s))
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

          {/* Card 2: Media & Multi-Image Gallery */}
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div>
                <h3 style={{ fontWeight: 700, fontSize: '1.05rem', margin: 0 }}>
                  Product Gallery & Images ({existingImages.length + newImageFiles.length})
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '4px 0 0 0' }}>
                  Manage multiple gallery images. Customer can swipe through them on product page.
                </p>
              </div>
            </div>

            {/* Existing Uploaded Images Grid */}
            {existingImages.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  Active Uploaded Images:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                    gap: 14,
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
                          borderRadius: 'var(--radius-md)',
                          border: isCover ? '2px solid #1162f2' : '1px solid var(--bg-border)',
                          background: 'var(--bg-elevated)',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column',
                        }}
                      >
                        <div style={{ aspectRatio: '1/1', overflow: 'hidden', background: '#000', position: 'relative' }}>
                          <img
                            src={imageUrl}
                            alt={img.alt_text || 'Product image'}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            onError={(e) => {
                              const target = e.currentTarget
                              if (!target.src.includes('placeholder')) {
                                target.src = `https://placehold.co/400x400/1e293b/white?text=Preview+Image`
                              }
                            }}
                          />
                          {isCover && (
                            <span
                              style={{
                                position: 'absolute',
                                top: 6,
                                left: 6,
                                background: '#1162f2',
                                color: '#fff',
                                padding: '2px 7px',
                                borderRadius: 4,
                                fontSize: '0.68rem',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 4,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                              }}
                            >
                              <Star size={10} fill="#fff" /> Main Cover
                            </span>
                          )}
                        </div>

                        <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, background: 'var(--bg-surface)' }}>
                          {!isCover && (
                            <button
                              type="button"
                              onClick={() => setCoverMutation.mutate(img.id)}
                              disabled={setCoverMutation.isPending}
                              className="btn-ghost"
                              style={{
                                fontSize: '0.72rem',
                                padding: '4px 6px',
                                width: '100%',
                                textAlign: 'center',
                                border: '1px solid var(--bg-border)',
                                color: 'var(--text-secondary)',
                              }}
                            >
                              Set as Cover
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this image?')) {
                                deleteImageMutation.mutate(img.id)
                              }
                            }}
                            disabled={deleteImageMutation.isPending}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '0.72rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 4,
                              padding: '3px 0',
                            }}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Newly Selected Images Queued for Upload */}
            {newImageFiles.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 10 }}>
                  New Images to be Uploaded on Save:
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 12,
                  }}
                >
                  {newImageFiles.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 'var(--radius-md)',
                        border: '1px dashed #1162f2',
                        background: 'var(--bg-elevated)',
                        overflow: 'hidden',
                      }}
                    >
                      <img
                        src={item.preview}
                        alt={`New ${idx + 1}`}
                        style={{ width: '100%', aspectRatio: '1/1', objectFit: 'cover', display: 'block' }}
                      />
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
                          width: 22,
                          height: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                        }}
                      >
                        <X size={12} />
                      </button>
                      <div
                        style={{
                          fontSize: '0.68rem',
                          color: '#1162f2',
                          textAlign: 'center',
                          padding: '3px 0',
                          fontWeight: 600,
                        }}
                      >
                        Pending Upload
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Multi-Image File Input Dropzone */}
            <div
              style={{
                border: '2px dashed var(--bg-border)',
                borderRadius: 'var(--radius-lg)',
                padding: '24px 16px',
                textAlign: 'center',
                background: 'var(--bg-elevated)',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
              }}
              onClick={() => document.getElementById('edit-multi-image-input')?.click()}
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
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: 'rgba(17,98,242,0.1)',
                  color: '#1162f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px auto',
                }}
              >
                <ImageIcon size={22} />
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 4 }}>
                Click to add more product images (Multi-Select)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Supports PNG, JPG, WEBP • Automatically optimized into multiple WebP resolutions
              </div>
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
    </div>
  )
}
