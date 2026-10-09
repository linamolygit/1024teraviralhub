// src/client/components/product/FlipkartReviewsSection.tsx
// Exact Flipkart Ratings & Reviews System with 5-Photo Collage & Fullscreen Photo Viewer (Matching Screenshot 1 & 2)

import React, { useState } from 'react'
import {
  Star,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  MoreVertical,
  ChevronLeft,
  X,
  MessageSquare,
  Lock,
} from 'lucide-react'
import { api, type Review, type CustomerReviewPhoto } from '../../lib/api'

interface FlipkartReviewsSectionProps {
  productId: number
  productTitle: string
  reviewsData?: {
    reviews: Review[]
    total: number
    average_rating: number
    rating_label?: string
    customer_photos: CustomerReviewPhoto[]
    product_review_images: string[]
    aspect_ratings: {
      quality: number
      design: number
      look_and_feel: number
      value_for_money: number
      service: number
    }
  }
  onRefetchReviews?: () => void
}

export default function FlipkartReviewsSection({
  productId,
  productTitle,
  reviewsData,
  onRefetchReviews,
}: FlipkartReviewsSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [activePhotoIndex, setActivePhotoIndex] = useState<number | null>(null)
  const [showAllReviewsModal, setShowAllReviewsModal] = useState(false)
  const [showWriteReviewModal, setShowWriteReviewModal] = useState(false)

  // Local vote tracking for live 👍 / 👎 clicks
  const [userVotes, setUserVotes] = useState<Record<number, 'up' | 'down'>>({})
  const [reviewVoteCounts, setReviewVoteCounts] = useState<Record<number, { up: number; down: number }>>({})

  // Review submission state
  const [reviewForm, setReviewForm] = useState({
    name: '',
    email: '',
    rating: 5,
    title: 'Terrific',
    comment: '',
    imageUrl: '',
  })
  const [submittingReview, setSubmittingReview] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const reviews = reviewsData?.reviews || []
  const totalRatings = reviewsData?.total ?? 115
  const avgRating = reviewsData?.average_rating ? Number(reviewsData.average_rating.toFixed(1)) : 4.4
  const ratingLabel = reviewsData?.rating_label || (avgRating >= 4.3 ? 'Very Good' : avgRating >= 4.0 ? 'Good' : 'Satisfactory')

  // Aspect ratings from backend or Flipkart realistic fallbacks
  const aspects = [
    { label: 'Quality', score: reviewsData?.aspect_ratings?.quality ?? 4.2 },
    { label: 'Design & Features', score: reviewsData?.aspect_ratings?.design ?? 4.3 },
    { label: 'Look & Feel', score: reviewsData?.aspect_ratings?.look_and_feel ?? 4.0 },
    { label: 'Value for Money', score: reviewsData?.aspect_ratings?.value_for_money ?? 4.2 },
    { label: 'Service', score: reviewsData?.aspect_ratings?.service ?? 4.1 },
  ]

  // Customer review photos (for the collage and fullscreen viewer)
  const photos = reviewsData?.customer_photos || []

  // Fallback demo photos if product has no photos yet (watches / products theme so UI is never empty)
  const displayPhotos: CustomerReviewPhoto[] = photos.length > 0 ? photos : [
    {
      url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
      customer_name: 'Shiv Mohan',
      rating: 5,
      title: 'Terrific',
      comment: 'Best price product daily wear collection ⌚',
      created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
      helpful_count: 2,
      unhelpful_count: 0,
    },
    {
      url: 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80',
      customer_name: 'Hanuman Singh',
      rating: 5,
      title: 'Perfect',
      comment: 'Looking stunning! Super clear finish.',
      created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
      helpful_count: 3,
      unhelpful_count: 0,
    },
    {
      url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&auto=format&fit=crop&q=80',
      customer_name: 'Rohan Deshmukh',
      rating: 5,
      title: 'Terrific',
      comment: 'Solid build and crisp resolution. Value for money.',
      created_at: new Date(Date.now() - 35 * 86400000).toISOString(),
      helpful_count: 5,
      unhelpful_count: 0,
    },
    {
      url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&auto=format&fit=crop&q=80',
      customer_name: 'Aarav Sharma',
      rating: 5,
      title: 'Wonderful',
      comment: 'Very happy with the prompt digital delivery.',
      created_at: new Date(Date.now() - 25 * 86400000).toISOString(),
      helpful_count: 1,
      unhelpful_count: 0,
    },
    {
      url: 'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=400&auto=format&fit=crop&q=80',
      customer_name: 'Priya Patel',
      rating: 4,
      title: 'Very Good',
      comment: 'Matches the description perfectly.',
      created_at: new Date(Date.now() - 15 * 86400000).toISOString(),
      helpful_count: 4,
      unhelpful_count: 0,
    },
  ]

  // Time format helper (e.g. "2 months ago", "3 weeks ago")
  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime()
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (days <= 0) return 'Today'
      if (days < 7) return `${days} days ago`
      const weeks = Math.floor(days / 7)
      if (weeks < 4) return `${weeks} week${weeks > 1 ? 's' : ''} ago`
      const months = Math.floor(days / 30)
      if (months < 12) return `${months} month${months > 1 ? 's' : ''} ago`
      const years = Math.floor(days / 365)
      return `${years} year${years > 1 ? 's' : ''} ago`
    } catch {
      return '2 months ago'
    }
  }

  // Handle vote (thumbs up/down)
  const handleVote = async (reviewId: number, type: 'up' | 'down') => {
    if (userVotes[reviewId]) return
    setUserVotes((prev) => ({ ...prev, [reviewId]: type }))
    setReviewVoteCounts((prev) => {
      const current = prev[reviewId] || { up: 0, down: 0 }
      return {
        ...prev,
        [reviewId]: {
          up: type === 'up' ? current.up + 1 : current.up,
          down: type === 'down' ? current.down + 1 : current.down,
        },
      }
    })

    try {
      await api.reviews.vote(reviewId, type)
    } catch {
      // ignore
    }
  }

  // Handle new review submission
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reviewForm.name.trim() || !reviewForm.comment.trim()) return

    setSubmittingReview(true)
    try {
      await api.reviews.submit({
        product_id: productId,
        customer_name: reviewForm.name.trim(),
        rating: reviewForm.rating,
        title: reviewForm.title.trim(),
        comment: reviewForm.comment.trim(),
        image_url: reviewForm.imageUrl.trim() || undefined,
      })
      setSubmitSuccess(true)
      setTimeout(() => {
        setSubmitSuccess(false)
        setShowWriteReviewModal(false)
        setReviewForm({ name: '', email: '', rating: 5, title: 'Terrific', comment: '', imageUrl: '' })
        onRefetchReviews?.()
      }, 1500)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmittingReview(false)
    }
  }

  const activePhoto = activePhotoIndex !== null ? displayPhotos[activePhotoIndex] : null

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: '16px',
        border: '1px solid #E5E7EB',
        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        padding: '20px 16px',
        margin: '24px 0',
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
        color: '#111827',
      }}
    >
      {/* ── 1. Header: "Ratings and reviews" + Chevron Toggle (Screenshot 1) ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        <h2
          style={{
            fontSize: '1.28rem',
            fontWeight: 800,
            margin: 0,
            color: '#111827',
            letterSpacing: '-0.01em',
          }}
        >
          Ratings and reviews
        </h2>

        <button
          type="button"
          aria-label="Toggle Reviews"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#F3F4F6',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#374151',
            cursor: 'pointer',
          }}
        >
          {isCollapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!isCollapsed && (
        <div style={{ marginTop: '14px' }}>
          {/* ── 2. Overall Rating & Verified Badge (Screenshot 1: 4.4 ★  Very Good) ── */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span
                style={{
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#111827',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {avgRating} <Star size={18} color="#008444" fill="#008444" />
              </span>

              {/* Very Good Green Pill */}
              <span
                style={{
                  background: '#E8F5E9',
                  color: '#008444',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '3px 10px',
                  borderRadius: '6px',
                  display: 'inline-block',
                }}
              >
                {ratingLabel}
              </span>
            </div>

            <div
              style={{
                fontSize: '0.85rem',
                color: '#6B7280',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>based on {totalRatings} ratings by</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', color: '#4B5563', fontWeight: 600 }}>
                <CheckCircle2 size={14} color="#6B7280" /> Verified Buyers
              </span>
            </div>
          </div>

          {/* ── 3. Customer Photos Collage (Screenshot 1: 1 Tall Left + 2x2 Grid Right) ── */}
          {displayPhotos.length > 0 && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px',
                height: '240px',
                marginBottom: '16px',
                borderRadius: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Left Tall Photo (takes full height) */}
              <div
                style={{
                  height: '100%',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor: '#F3F4F6',
                }}
                onClick={() => setActivePhotoIndex(0)}
              >
                <img
                  src={displayPhotos[0].url}
                  alt="Customer Review 1"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    display: 'block',
                    transition: 'transform 0.2s ease',
                  }}
                  loading="lazy"
                  onError={(e) => {
                    // Fallback watch image if external URL fails
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80'
                  }}
                />
              </div>

              {/* Right Side 2x2 Grid (4 Photos) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gridTemplateRows: '1fr 1fr',
                  gap: '8px',
                  height: '100%',
                }}
              >
                {displayPhotos.slice(1, 5).map((photo, idx) => {
                  const actualIdx = idx + 1
                  const isLastItem = idx === 3 && displayPhotos.length > 5
                  const remainingCount = displayPhotos.length - 5

                  return (
                    <div
                      key={actualIdx}
                      style={{
                        position: 'relative',
                        borderRadius: '10px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        backgroundColor: '#F3F4F6',
                      }}
                      onClick={() => setActivePhotoIndex(actualIdx)}
                    >
                      <img
                        src={photo.url}
                        alt={`Customer Review ${actualIdx + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=400&auto=format&fit=crop&q=80'
                        }}
                      />
                      {isLastItem && remainingCount > 0 && (
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.55)',
                            color: '#FFFFFF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '1rem',
                          }}
                        >
                          +{remainingCount}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── 4. Aspect Rating Pills (Quality 4.2 ★, Look & Feel 4 ★, etc. — Screenshot 1) ── */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '8px',
              marginBottom: '18px',
            }}
          >
            {aspects.map((aspect) => (
              <div
                key={aspect.label}
                style={{
                  background: '#F9FAFB',
                  border: '1px solid #E5E7EB',
                  borderRadius: '20px',
                  padding: '6px 14px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  color: '#1F2937',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                }}
              >
                <span>{aspect.label}</span>
                <span style={{ fontWeight: 800, color: '#111827', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  {aspect.score} <Star size={12} color="#008444" fill="#008444" />
                </span>
              </div>
            ))}
          </div>

          {/* ── 5. Review Cards Carousel / Horizontal Cards (Screenshot 1: Terrific, Perfect) ── */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '18px',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {(reviews.length > 0 ? reviews.slice(0, 8) : displayPhotos).map((rev: any, idx: number) => {
              const reviewId = rev.id || idx + 100
              const rating = rev.rating || 5
              const title = rev.title || (rating === 5 ? 'Terrific' : rating === 4 ? 'Very Good' : 'Value for Money')
              const comment = rev.comment || 'Best price product daily wear watches ⌚'
              const customerName = rev.customer_name || 'Shiv Mohan'
              const timeAgo = formatTimeAgo(rev.created_at || new Date(Date.now() - (idx + 1) * 30 * 86400000).toISOString())
              const baseHelpful = rev.helpful_count ?? (rating === 5 ? 2 + (idx % 3) : 1)
              const userVote = userVotes[reviewId]
              const currentHelpful = baseHelpful + (userVote === 'up' ? 1 : 0)
              const currentUnhelpful = (rev.unhelpful_count || 0) + (userVote === 'down' ? 1 : 0)

              return (
                <div
                  key={reviewId}
                  style={{
                    flex: '0 0 280px',
                    width: '280px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '14px',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
                  }}
                >
                  {/* Card Header: Rating Badge + Title + Time Ago */}
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '8px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* Green Rating Badge */}
                        <span
                          style={{
                            background: rating >= 4 ? '#008444' : '#EAB308',
                            color: '#FFFFFF',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            padding: '2px 7px',
                            borderRadius: '5px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          {rating} <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
                        </span>

                        {/* Title (Terrific / Perfect) */}
                        <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#111827' }}>
                          {title}
                        </span>
                      </div>

                      <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>{timeAgo}</span>
                    </div>

                    {/* Review Body */}
                    <p
                      style={{
                        fontSize: '0.86rem',
                        color: '#374151',
                        lineHeight: 1.45,
                        margin: '0 0 12px 0',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {comment}
                    </p>

                    {/* Optional small image thumbnail if review has image */}
                    {rev.image_url && (
                      <div
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          overflow: 'hidden',
                          marginBottom: '10px',
                          cursor: 'pointer',
                        }}
                        onClick={() => {
                          const pIdx = displayPhotos.findIndex((p) => p.url === rev.image_url)
                          if (pIdx >= 0) setActivePhotoIndex(pIdx)
                        }}
                      >
                        <img
                          src={rev.image_url}
                          alt="Customer preview"
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Verified Buyer + Thumbs Up/Down */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '8px',
                      borderTop: '1px solid #F3F4F6',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.8rem',
                        color: '#6B7280',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 500,
                      }}
                    >
                      <CheckCircle2 size={13} color="#9CA3AF" />
                      <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {customerName}
                      </span>
                    </div>

                    {/* Thumbs up & down */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <button
                        type="button"
                        onClick={() => handleVote(reviewId, 'up')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.78rem',
                          color: userVote === 'up' ? '#008444' : '#6B7280',
                          fontWeight: 600,
                        }}
                        title="Helpful review"
                      >
                        <ThumbsUp size={13} color={userVote === 'up' ? '#008444' : '#6B7280'} />
                        <span>{currentHelpful}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleVote(reviewId, 'down')}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.78rem',
                          color: userVote === 'down' ? '#EF4444' : '#9CA3AF',
                          fontWeight: 600,
                        }}
                        title="Not helpful"
                      >
                        <ThumbsDown size={13} color={userVote === 'down' ? '#EF4444' : '#9CA3AF'} />
                        <span>{currentUnhelpful}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── 6. "Show all reviews >" Button (Screenshot 1) ── */}
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
            <button
              type="button"
              onClick={() => setShowAllReviewsModal(true)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #D1D5DB',
                color: '#111827',
                fontSize: '0.92rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = '#FFFFFF')}
            >
              <span>Show all reviews</span>
              <ChevronRight size={17} color="#4B5563" />
            </button>

            <button
              type="button"
              onClick={() => setShowWriteReviewModal(true)}
              style={{
                width: '100%',
                padding: '10px 16px',
                borderRadius: '8px',
                background: '#F9FAFB',
                border: '1px dashed #D1D5DB',
                color: '#4B5563',
                fontSize: '0.84rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
              }}
            >
              <MessageSquare size={14} /> Write a Customer Review
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          SCREENSHOT 2: FULLSCREEN REVIEW PHOTO VIEWER MODAL
          ══════════════════════════════════════════════════════════════════ */}
      {activePhoto && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            backgroundColor: '#000000',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Top Bar with Back Arrow (Screenshot 2) */}
          <div
            style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 10,
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 100%)',
            }}
          >
            <button
              type="button"
              onClick={() => setActivePhotoIndex(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#FFFFFF',
                padding: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
              aria-label="Back"
            >
              <ArrowLeft size={24} color="#FFFFFF" strokeWidth={2.5} />
            </button>

            <span style={{ color: '#FFFFFF', fontSize: '0.9rem', fontWeight: 600 }}>
              {activePhotoIndex! + 1} / {displayPhotos.length}
            </span>

            <div style={{ width: '24px' }} />
          </div>

          {/* Center Image Display (with left/right arrow navigation) */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              padding: '12px',
              overflow: 'hidden',
            }}
          >
            {activePhotoIndex! > 0 && (
              <button
                type="button"
                onClick={() => setActivePhotoIndex((i) => (i !== null && i > 0 ? i - 1 : 0))}
                style={{
                  position: 'absolute',
                  left: '12px',
                  zIndex: 20,
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <ChevronLeft size={22} color="#FFFFFF" />
              </button>
            )}

            <img
              src={activePhoto.url}
              alt="Customer Review Photo"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                userSelect: 'none',
              }}
            />

            {activePhotoIndex! < displayPhotos.length - 1 && (
              <button
                type="button"
                onClick={() => setActivePhotoIndex((i) => (i !== null && i < displayPhotos.length - 1 ? i + 1 : i))}
                style={{
                  position: 'absolute',
                  right: '12px',
                  zIndex: 20,
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: 'none',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  backdropFilter: 'blur(4px)',
                }}
              >
                <ChevronRight size={22} color="#FFFFFF" />
              </button>
            )}
          </div>

          {/* Bottom Dock Overlay (Exact Screenshot 2) */}
          <div
            style={{
              padding: '18px 20px 24px 20px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.95) 0%, rgba(0,0,0,0.7) 70%, rgba(0,0,0,0) 100%)',
              color: '#FFFFFF',
            }}
          >
            {/* Row 1: Green Rating Badge + Terrific */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span
                style={{
                  background: '#008444',
                  color: '#FFFFFF',
                  fontSize: '0.78rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                {activePhoto.rating} <Star size={10} color="#FFFFFF" fill="#FFFFFF" />
              </span>

              <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#FFFFFF' }}>
                {activePhoto.title}
              </span>
            </div>

            {/* Row 2: Review Comment */}
            <p
              style={{
                fontSize: '0.92rem',
                color: '#F3F4F6',
                lineHeight: 1.4,
                margin: '0 0 10px 0',
              }}
            >
              {activePhoto.comment}
            </p>

            {/* Row 3: Customer Name, Time, Thumbs Up/Down & More Menu */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.82rem',
                color: '#9CA3AF',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#E5E7EB', fontWeight: 600 }}>{activePhoto.customer_name}</span>
                <span>•</span>
                <span>{formatTimeAgo(activePhoto.created_at)}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#E5E7EB' }}>
                  <ThumbsUp size={15} color="#E5E7EB" /> {activePhoto.helpful_count}
                </span>

                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: '#E5E7EB' }}>
                  <ThumbsDown size={15} color="#E5E7EB" /> {activePhoto.unhelpful_count}
                </span>

                <MoreVertical size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── All Reviews Modal ── */}
      {showAllReviewsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
          }}
          onClick={() => setShowAllReviewsModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '85vh',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideUp 0.25s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#111827' }}>
                  All Customer Reviews ({reviews.length})
                </h3>
                <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>{productTitle}</span>
              </div>
              <button
                type="button"
                onClick={() => setShowAllReviewsModal(false)}
                style={{
                  background: '#F3F4F6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} color="#4B5563" />
              </button>
            </div>

            {/* Modal Review List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      paddingBottom: '16px',
                      borderBottom: '1px solid #F3F4F6',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span
                        style={{
                          background: rev.rating >= 4 ? '#008444' : '#EAB308',
                          color: '#FFFFFF',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        {rev.rating} <Star size={9} color="#FFFFFF" fill="#FFFFFF" />
                      </span>
                      <strong style={{ fontSize: '0.9rem', color: '#111827' }}>
                        {rev.title || (rev.rating === 5 ? 'Terrific' : 'Good')}
                      </strong>
                    </div>

                    <p style={{ margin: '0 0 8px 0', fontSize: '0.88rem', color: '#374151', lineHeight: 1.45 }}>
                      "{rev.comment}"
                    </p>

                    {rev.image_url && (
                      <img
                        src={rev.image_url}
                        alt="Customer upload"
                        style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover', marginBottom: '8px', cursor: 'pointer' }}
                        onClick={() => {
                          const pIdx = displayPhotos.findIndex((p) => p.url === rev.image_url)
                          if (pIdx >= 0) setActivePhotoIndex(pIdx)
                        }}
                      />
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#6B7280' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} color="#9CA3AF" /> {rev.customer_name}
                      </span>
                      <span>{formatTimeAgo(rev.created_at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Write Review Modal ── */}
      {showWriteReviewModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowWriteReviewModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxWidth: '480px',
              borderRadius: '16px',
              padding: '24px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#111827' }}>
                Write a Customer Review
              </h3>
              <button
                type="button"
                onClick={() => setShowWriteReviewModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
              >
                <X size={20} color="#6B7280" />
              </button>
            </div>

            {submitSuccess ? (
              <div style={{ textAlign: 'center', padding: '24px 0', color: '#008444' }}>
                <CheckCircle2 size={48} color="#008444" style={{ margin: '0 auto 12px' }} />
                <h4 style={{ margin: 0, fontWeight: 800 }}>Thank you for your feedback!</h4>
                <p style={{ fontSize: '0.85rem', color: '#6B7280', marginTop: 4 }}>Your review is published.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Your Rating
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewForm((f) => ({ ...f, rating: star }))}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: 2,
                        }}
                      >
                        <Star
                          size={28}
                          color="#008444"
                          fill={star <= reviewForm.rating ? '#008444' : 'none'}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Review Headline (e.g. Terrific, Awesome)
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={reviewForm.title}
                    onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Terrific product!"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Your Name
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={reviewForm.name}
                    onChange={(e) => setReviewForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your Name (e.g. Shiv Mohan)"
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Detailed Review
                  </label>
                  <textarea
                    rows={3}
                    className="input-field"
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                    placeholder="Tell us what you liked about this item..."
                    required
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#374151', marginBottom: 4 }}>
                    Customer Photo URL (Optional, paste image link from Google/web)
                  </label>
                  <input
                    type="url"
                    className="input-field"
                    value={reviewForm.imageUrl}
                    onChange={(e) => setReviewForm((f) => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="https://example.com/photo.jpg"
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  style={{
                    background: '#008444',
                    color: '#FFFFFF',
                    fontWeight: 800,
                    fontSize: '0.92rem',
                    padding: '12px',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: submittingReview ? 'not-allowed' : 'pointer',
                    marginTop: '8px',
                  }}
                >
                  {submittingReview ? 'Submitting Review...' : 'Submit Review'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
