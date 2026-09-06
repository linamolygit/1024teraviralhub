// src/client/pages/admin/products/AdminProductCreate.tsx — Modern Product Creation with AI, Multi-Image Upload & Live Deliverables Previews
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Save, Upload, Plus, X, Sparkles, Image as ImageIcon,
  CheckCircle, Star, FileCheck, Layers, Link as LinkIcon, Loader2
} from 'lucide-react'
import { adminApi, type Category } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { createImageVariants } from '../../../lib/image-optimizer'
import UploadProgressToast, { type UploadStepItem } from '../../../components/admin/UploadProgressToast'
import DeliverableFilePreviewCard from '../../../components/admin/DeliverableFilePreviewCard'
import GoogleDrivePreviewCard from '../../../components/admin/GoogleDrivePreviewCard'
import { adminToast } from '../../../lib/admin-toast'

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
    download_limit: 3,
    access_duration_hours: 12,
    meta_title: '',
    meta_description: '',
    tags: [] as string[],
  })

  // Multiple preview images management
  const [imageFiles, setImageFiles] = useState<{ file: File; preview: string }[]>([])
  const [primaryImageIdx, setPrimaryImageIdx] = useState(0)

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

  const { data: cats } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await fetch('/api/categories')
      return res.json() as Promise<{ categories: Category[] }>
    },
  })

  // Handle Multi-file image select
  const handleImageFilesSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return
    const newItems: { file: File; preview: string }[] = []
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
      })
    }
    setImageFiles((prev) => [...prev, ...newItems])
  }

  const removeImageFile = (index: number) => {
    setImageFiles((prev) => {
      const updated = prev.filter((_, idx) => idx !== index)
      if (primaryImageIdx >= updated.length) {
        setPrimaryImageIdx(Math.max(0, updated.length - 1))
      }
      return updated
    })
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
            name: item.file.name,
            type: 'gallery',
            index: idx + 1,
            total: imageFiles.length,
            size: item.file.size,
          })

          setUploadStatusText(
            `Meta Perceptual Compression (HVS-Tuned WebP + Sharpened) & Uploading ${idx + 1}/${imageFiles.length}${isCover ? ' [Primary Cover]' : ''}...`
          )

          try {
            const variants = await createImageVariants(item.file)
            console.log(
              `[Perceptual Compression] #${idx + 1}: ${(item.file.size / 1024).toFixed(1)}KB -> ${(variants.compressedTotalSize / 1024).toFixed(1)}KB (${variants.savingsPercent}% saved)`
            )
            await adminApi.products.uploadImage(token!, result.id, item.file, isCover, {
              thumb: variants.thumb,
              medium: variants.medium,
              large: variants.large,
              blurDataUrl: variants.blurDataUrl,
            })

            setUploadSteps((prev) =>
              prev.map((s) => (s.id === `step-gallery-${idx}` ? { ...s, status: 'completed' } : s))
            )
          } catch (imgErr: any) {
            console.error(`Failed to upload gallery image #${idx}:`, imgErr)
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
          await adminApi.products.uploadFile(token!, result.id, productFile)
          setUploadSteps((prev) =>
            prev.map((s) => (s.id === 'step-deliverable' ? { ...s, status: 'completed' } : s))
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Product Gallery Showcase ({imageFiles.length} Selected)
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: '3px 0 0' }}>
                  Upload multiple product showcase images. Click the star to set primary cover thumbnail.
                </p>
              </div>
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
                  return (
                    <div
                      key={idx}
                      style={{
                        position: 'relative',
                        borderRadius: 10,
                        border: isPrimary ? '2px solid #1162F2' : '1px solid var(--bg-border)',
                        background: 'var(--bg-elevated)',
                        overflow: 'hidden',
                        boxShadow: isPrimary ? '0 2px 8px rgba(17,98,242,0.25)' : 'none',
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
    </div>
  )
}
