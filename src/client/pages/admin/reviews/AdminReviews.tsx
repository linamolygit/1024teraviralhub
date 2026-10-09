// src/client/pages/admin/reviews/AdminReviews.tsx — Enhanced Admin Reviews & Google Photos Manager
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Star,
  Trash2,
  ShieldCheck,
  Plus,
  Image as ImageIcon,
  Edit2,
  X,
  ExternalLink,
  ThumbsUp,
  Camera,
  CheckCircle,
} from 'lucide-react'
import { adminApi, type Review, type Product } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { adminToast } from '../../../lib/admin-toast'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'

export default function AdminReviews() {
  const { getToken } = useAuthStore()
  const qc = useQueryClient()

  // Modals state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [editingReview, setEditingReview] = useState<Review | null>(null)
  const [showPhotosGalleryModal, setShowPhotosGalleryModal] = useState(false)
  const [galleryProductId, setGalleryProductId] = useState<number | null>(null)
  const [galleryImagesText, setGalleryImagesText] = useState('')
  const [previewImageModal, setPreviewImageModal] = useState<string | null>(null)

  // Review Form state
  const [formProductId, setFormProductId] = useState<number | ''>('')
  const [formCustomerName, setFormCustomerName] = useState('')
  const [formRating, setFormRating] = useState(5)
  const [formTitle, setFormTitle] = useState('Terrific')
  const [formComment, setFormComment] = useState('')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formHelpfulCount, setFormHelpfulCount] = useState(2)
  const [formIsVerified, setFormIsVerified] = useState(1)

  // Fetch all reviews
  const { data, isLoading } = useQuery({
    queryKey: ['admin-reviews'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.reviews.list(token!)
    },
  })

  // Fetch all products for selector dropdowns
  const { data: productsData } = useQuery({
    queryKey: ['admin-products-dropdown'],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.products.list(token!, { limit: 100 })
    },
  })

  const products: Product[] = productsData?.products || []

  // Create review mutation
  const createMutation = useMutation({
    mutationFn: async (reviewData: Partial<Review>) => {
      const token = await getToken()
      return adminApi.reviews.create(token!, reviewData)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Review Created', 'New review with photo added successfully')
      closeReviewModal()
    },
    onError: (err: Error) => {
      adminToast.error('Create Failed', err.message)
    },
  })

  // Update review mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Review> }) => {
      const token = await getToken()
      return adminApi.reviews.update(token!, id, data)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Review Updated', 'Review details and photo updated')
      closeReviewModal()
    },
    onError: (err: Error) => {
      adminToast.error('Update Failed', err.message)
    },
  })

  // Delete review mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = await getToken()
      return adminApi.reviews.delete(token!, id)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Review Deleted', 'The review has been removed')
    },
    onError: (err: Error) => {
      adminToast.error('Delete Failed', err.message)
    },
  })

  // Save Product Review Images (Gallery)
  const updateGalleryMutation = useMutation({
    mutationFn: async ({ productId, images }: { productId: number; images: string[] }) => {
      const token = await getToken()
      return adminApi.reviews.updateProductImages(token!, productId, images)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reviews'] })
      adminToast.success('Gallery Photos Saved', 'Customer review photos updated for product')
      setShowPhotosGalleryModal(false)
    },
    onError: (err: Error) => {
      adminToast.error('Save Failed', err.message)
    },
  })

  const openAddReviewModal = () => {
    setEditingReview(null)
    setFormProductId(products[0]?.id || '')
    setFormCustomerName('Shiv Mohan')
    setFormRating(5)
    setFormTitle('Terrific')
    setFormComment('Best price product daily wear collection ⌚')
    setFormImageUrl('')
    setFormHelpfulCount(2)
    setFormIsVerified(1)
    setShowReviewModal(true)
  }

  const openEditReviewModal = (rev: Review) => {
    setEditingReview(rev)
    setFormProductId(rev.product_id)
    setFormCustomerName(rev.customer_name)
    setFormRating(rev.rating)
    setFormTitle(rev.title || (rev.rating === 5 ? 'Terrific' : 'Very Good'))
    setFormComment(rev.comment)
    setFormImageUrl(rev.image_url || '')
    setFormHelpfulCount(rev.helpful_count || 0)
    setFormIsVerified(rev.is_verified_purchase ? 1 : 0)
    setShowReviewModal(true)
  }

  const closeReviewModal = () => {
    setShowReviewModal(false)
    setEditingReview(null)
  }

  const handleReviewFormSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formProductId || !formCustomerName.trim() || !formComment.trim()) return

    const payload = {
      product_id: Number(formProductId),
      customer_name: formCustomerName.trim(),
      rating: formRating,
      title: formTitle.trim(),
      comment: formComment.trim(),
      image_url: formImageUrl.trim() || null,
      helpful_count: formHelpfulCount,
      is_verified_purchase: formIsVerified,
      is_approved: 1,
    }

    if (editingReview) {
      updateMutation.mutate({ id: editingReview.id, data: payload })
    } else {
      createMutation.mutate(payload)
    }
  }

  // Open Product Photos Gallery Manager
  const openGalleryManager = async (pId?: number) => {
    const targetId = pId || products[0]?.id
    if (!targetId) return
    setGalleryProductId(targetId)

    try {
      const token = await getToken()
      const res = await adminApi.reviews.getProductImages(token!, targetId)
      setGalleryImagesText((res.review_images || []).join('\n'))
    } catch {
      setGalleryImagesText('')
    }

    setShowPhotosGalleryModal(true)
  }

  const handleGalleryProductChange = async (newId: number) => {
    setGalleryProductId(newId)
    try {
      const token = await getToken()
      const res = await adminApi.reviews.getProductImages(token!, newId)
      setGalleryImagesText((res.review_images || []).join('\n'))
    } catch {
      setGalleryImagesText('')
    }
  }

  const handleSaveGalleryPhotos = () => {
    if (!galleryProductId) return
    const urls = galleryImagesText
      .split('\n')
      .map((s) => s.trim())
      .filter((s) => s.startsWith('http://') || s.startsWith('https://'))

    updateGalleryMutation.mutate({ productId: galleryProductId, images: urls })
  }

  const parsedGalleryUrls = galleryImagesText
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.startsWith('http://') || s.startsWith('https://'))

  if (isLoading) return <LoadingSpinner />

  return (
    <div>
      {/* ── Top Header with Action Buttons ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            Customer Reviews & Photos
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            Manage Flipkart-style 5-image collage, customer reviews, and photos from Google
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => openGalleryManager()}
            className="btn-secondary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 16px',
              fontSize: '0.875rem',
              fontWeight: 700,
            }}
          >
            <Camera size={16} /> Product Photo Gallery
          </button>

          <button
            onClick={openAddReviewModal}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '10px 18px',
              fontSize: '0.875rem',
              fontWeight: 800,
              background: '#008444',
            }}
          >
            <Plus size={16} /> Add Review with Photo
          </button>
        </div>
      </div>

      {/* ── Reviews Table ── */}
      <div className="glass-card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--bg-border)', color: 'var(--text-muted)' }}>
              <th style={{ padding: '14px 16px' }}>Product</th>
              <th style={{ padding: '14px 16px' }}>Customer & Rating</th>
              <th style={{ padding: '14px 16px' }}>Photo</th>
              <th style={{ padding: '14px 16px' }}>Headline & Comment</th>
              <th style={{ padding: '14px 16px' }}>Helpful</th>
              <th style={{ padding: '14px 16px' }}>Status</th>
              <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.reviews && data.reviews.length > 0 ? (
              data.reviews.map((rev) => (
                <tr key={rev.id} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                  {/* Product */}
                  <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--text-primary)', maxWidth: 180 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {rev.product_title || `Product #${rev.product_id}`}
                    </div>
                    {rev.product_slug && (
                      <a
                        href={`/products/${rev.product_slug}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ fontSize: '0.75rem', color: '#3B82F6', display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 2 }}
                      >
                        View Storefront <ExternalLink size={10} />
                      </a>
                    )}
                  </td>

                  {/* Customer & Rating */}
                  <td style={{ padding: '14px 16px', minWidth: 140 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{rev.customer_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                      <span
                        style={{
                          background: rev.rating >= 4 ? '#008444' : '#EAB308',
                          color: '#FFFFFF',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '1px 5px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {rev.rating} <Star size={9} color="#FFFFFF" fill="#FFFFFF" />
                      </span>
                      {rev.title && (
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>
                          {rev.title}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Customer Review Photo */}
                  <td style={{ padding: '14px 16px' }}>
                    {rev.image_url ? (
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1.5px solid #10B981',
                          cursor: 'pointer',
                          position: 'relative',
                        }}
                        onClick={() => setPreviewImageModal(rev.image_url || null)}
                        title="Click to preview full image"
                      >
                        <img
                          src={rev.image_url}
                          alt="Customer upload"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error'
                          }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No photo</span>
                    )}
                  </td>

                  {/* Comment */}
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.4 }}>
                    <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      "{rev.comment}"
                    </div>
                  </td>

                  {/* Helpful Thumbs */}
                  <td style={{ padding: '14px 16px', whiteSpace: 'nowrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#008444', fontWeight: 600, fontSize: '0.8rem' }}>
                      <ThumbsUp size={12} /> {rev.helpful_count || 0}
                    </span>
                  </td>

                  {/* Status & Verified */}
                  <td style={{ padding: '14px 16px' }}>
                    {rev.is_verified_purchase ? (
                      <span className="badge badge-purple" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: '0.72rem' }}>
                        <ShieldCheck size={11} /> Verified Buyer
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Public</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEditReviewModal(rev)}
                      className="btn-ghost"
                      style={{ padding: 6, color: '#3B82F6', marginRight: 4 }}
                      title="Edit review"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteMutation.mutate(rev.id)}
                      className="btn-ghost"
                      style={{ padding: 6, color: '#EF4444' }}
                      title="Delete review"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ padding: 36, textAlign: 'center', color: 'var(--text-muted)' }}>
                  No customer reviews yet. Click <strong>"Add Review with Photo"</strong> above to add one!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ══════════════════════════════════════════════════════════════
          MODAL 1: ADD / EDIT REVIEW WITH GOOGLE IMAGE PHOTO
          ══════════════════════════════════════════════════════════════ */}
      {showReviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={closeReviewModal}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              width: '100%',
              maxWidth: '540px',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                {editingReview ? 'Edit Customer Review' : 'Add Review with Photo'}
              </h3>
              <button onClick={closeReviewModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReviewFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Product Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Select Product *
                </label>
                <select
                  className="input-field"
                  value={formProductId}
                  onChange={(e) => setFormProductId(Number(e.target.value))}
                  required
                  style={{ width: '100%' }}
                >
                  <option value="" disabled>Choose Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} (#{p.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & Rating */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Customer Name *
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formCustomerName}
                    onChange={(e) => setFormCustomerName(e.target.value)}
                    placeholder="e.g. Shiv Mohan"
                    required
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Rating *
                  </label>
                  <select
                    className="input-field"
                    value={formRating}
                    onChange={(e) => setFormRating(Number(e.target.value))}
                    style={{ width: '100%' }}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 Stars)</option>
                    <option value={2}>⭐⭐ (2 Stars)</option>
                    <option value={1}>⭐ (1 Star)</option>
                  </select>
                </div>
              </div>

              {/* Review Headline & Helpful count */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Headline / Title (e.g. Terrific, Perfect)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Terrific"
                    style={{ width: '100%' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    Helpful Count 👍
                  </label>
                  <input
                    type="number"
                    className="input-field"
                    value={formHelpfulCount}
                    onChange={(e) => setFormHelpfulCount(Number(e.target.value))}
                    min={0}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {/* Customer Photo URL (From Google / Web) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  📸 Customer Photo URL (Paste image link directly from Google Images or web)
                </label>
                <input
                  type="url"
                  className="input-field"
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  placeholder="https://example.com/customer-photo.jpg"
                  style={{ width: '100%' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                  Tip: Google Images से किसी भी इमेज पर Right Click करके "Copy Image Address" दबाएं और यहाँ पेस्ट करें!
                </span>

                {/* Live Image Preview */}
                {formImageUrl.trim() && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '12px', background: 'var(--bg-elevated)', padding: '10px', borderRadius: '8px' }}>
                    <img
                      src={formImageUrl}
                      alt="Preview"
                      style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '6px' }}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Invalid+URL'
                      }}
                    />
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#10B981' }}>✓ Image Preview Loaded</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Will show in Flipkart collage</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Comment text */}
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  Detailed Review Comment *
                </label>
                <textarea
                  rows={3}
                  className="input-field"
                  value={formComment}
                  onChange={(e) => setFormComment(e.target.value)}
                  placeholder="e.g. Best price product daily wear watches ⌚"
                  required
                  style={{ width: '100%' }}
                />
              </div>

              {/* Verified Buyer toggle */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="verified-toggle"
                  checked={formIsVerified === 1}
                  onChange={(e) => setFormIsVerified(e.target.checked ? 1 : 0)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="verified-toggle" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
                  Mark as Verified Buyer (Shows green shield badge)
                </label>
              </div>

              {/* Submit Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: 12 }}>
                <button type="button" onClick={closeReviewModal} className="btn-secondary" style={{ padding: '9px 18px' }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="btn-primary"
                  style={{ padding: '9px 22px', background: '#008444' }}
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingReview ? 'Save Changes' : 'Create Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════
          MODAL 2: PRODUCT REVIEW PHOTOS GALLERY MANAGER
          ══════════════════════════════════════════════════════════════ */}
      {showPhotosGalleryModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowPhotosGalleryModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              width: '100%',
              maxWidth: '620px',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  Product Review Photo Gallery
                </h3>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Add multiple customer review photos directly from Google Images for the 5-photo collage
                </span>
              </div>
              <button onClick={() => setShowPhotosGalleryModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={20} />
              </button>
            </div>

            {/* Select product */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Select Product
              </label>
              <select
                className="input-field"
                value={galleryProductId || ''}
                onChange={(e) => handleGalleryProductChange(Number(e.target.value))}
                style={{ width: '100%' }}
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} (#{p.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Paste Multiple Image URLs */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                Paste Image URLs (One URL per line — from Google Images / web)
              </label>
              <textarea
                rows={6}
                className="input-field"
                value={galleryImagesText}
                onChange={(e) => setGalleryImagesText(e.target.value)}
                placeholder="https://example.com/customer-photo-1.jpg&#10;https://example.com/customer-photo-2.jpg&#10;https://example.com/customer-photo-3.jpg"
                style={{ width: '100%', fontFamily: 'monospace', fontSize: '0.82rem' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                Tip: Google Images पर जो भी कस्टमर या प्रोडक्ट की रियल फोटोज मिलें, उनका URL यहाँ 1-1 लाइन में पेस्ट करें।
              </span>
            </div>

            {/* Live Collage Previews */}
            {parsedGalleryUrls.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 8 }}>
                  Collage Preview ({parsedGalleryUrls.length} Photos):
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {parsedGalleryUrls.map((url, idx) => (
                    <div
                      key={idx}
                      style={{
                        width: '70px',
                        height: '70px',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        position: 'relative',
                        border: '1px solid var(--bg-border)',
                      }}
                    >
                      <img
                        src={url}
                        alt={`Photo ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Invalid'
                        }}
                      />
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 2,
                          left: 2,
                          background: 'rgba(0,0,0,0.6)',
                          color: '#fff',
                          fontSize: '10px',
                          padding: '1px 4px',
                          borderRadius: '3px',
                        }}
                      >
                        #{idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button type="button" onClick={() => setShowPhotosGalleryModal(false)} className="btn-secondary" style={{ padding: '9px 18px' }}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGalleryPhotos}
                disabled={updateGalleryMutation.isPending}
                className="btn-primary"
                style={{ padding: '9px 22px', background: '#008444' }}
              >
                {updateGalleryMutation.isPending ? 'Saving Photos...' : 'Save Gallery Photos'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Image Preview Zoom Modal ── */}
      {previewImageModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
          onClick={() => setPreviewImageModal(null)}
        >
          <div style={{ position: 'relative', maxWidth: '90vw', maxHeight: '90vh' }}>
            <button
              onClick={() => setPreviewImageModal(null)}
              style={{
                position: 'absolute',
                top: -36,
                right: 0,
                background: 'none',
                border: 'none',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <X size={26} />
            </button>
            <img
              src={previewImageModal}
              alt="Full Preview"
              style={{
                maxWidth: '100%',
                maxHeight: '85vh',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
