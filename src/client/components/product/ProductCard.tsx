import { Link, useNavigate } from 'react-router-dom'
import { Star, Image, Heart } from 'lucide-react'
import { formatPrice, discountPercent } from '../../lib/utils'
import type { Product } from '../../lib/api'
import { useWishlistStore } from '../../lib/wishlist-store'
import OptimizedImage from '../ui/OptimizedImage'

interface Props {
  product: Product
  onBuyNow?: (product: Product) => void
}

export default function ProductCard({ product, onBuyNow }: Props) {
  const navigate = useNavigate()
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlistStore()
  const inWishlist = isInWishlist(product.id)
  const hasDiscount = product.sale_price && product.sale_price < product.price
  const effectivePrice = product.sale_price ?? product.price

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.slug}`)}
      style={{ cursor: 'pointer' }}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') navigate(`/product/${product.slug}`)
      }}
    >
      {/* Image */}
      <div className="product-card-image">
        {product.thumbnail_url ? (
          <OptimizedImage
            src={product.thumbnail_url}
            alt={product.title}
            variant="thumbnail"
            aspectRatio="4/3"
          />
        ) : (
          <div style={{
            width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg, var(--bg-elevated), var(--bg-border))',
          }}>
            <Image size={40} color="var(--text-muted)" />
          </div>
        )}
        {hasDiscount && (
          <div style={{
            position: 'absolute', bottom: 10, left: 10,
            background: '#008444', color: 'white',
            padding: '3px 8px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 800,
            boxShadow: '0 2px 6px rgba(0, 132, 68, 0.35)',
            zIndex: 2,
            display: 'flex', alignItems: 'center',
          }}>
            ↓{discountPercent(product.price, product.sale_price!)}% off
          </div>
        )}
        {product.is_featured ? (
          <div
            title="Featured"
            style={{
              position: 'absolute', top: 10, right: 10,
              width: 28, height: 28, borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              zIndex: 2,
            }}
          >
            <Star size={14} fill="#F59E0B" color="#F59E0B" />
          </div>
        ) : null}

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (inWishlist) {
              removeFromWishlist(product.id)
            } else {
              addToWishlist(product)
            }
          }}
          aria-label="Wishlist"
          style={{
            position: 'absolute', bottom: 10, right: 10,
            width: 32, height: 32, borderRadius: '9px',
            background: '#FFFFFF',
            border: '1px solid rgba(0, 0, 0, 0.06)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            transition: 'transform 0.15s ease',
          }}
        >
          {inWishlist ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M12 21.3667C12 21.3667 2.25 16.1167 2.25 9.9292C2.25 8.58654 2.78337 7.29887 3.73277 6.34947C4.68217 5.40007 5.96984 4.8667 7.3125 4.8667C9.43031 4.8667 11.2444 6.02076 12 7.8667C12.7556 6.02076 14.5697 4.8667 16.6875 4.8667C18.0302 4.8667 19.3178 5.40007 20.2672 6.34947C21.2166 7.29887 21.75 8.58654 21.75 9.9292C21.75 16.1167 12 21.3667 12 21.3667Z"
                fill="#e3122e"
              />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M21.196 11.4057C21.3096 11.1653 22.4159 8.76955 21.1429 6.31952C21.0141 6.06366 19.7866 3.7842 17.271 3.49733C15.2327 3.26473 13.1489 4.46649 11.9896 6.56762C10.5727 4.2649 8.16313 3.11742 6.02635 3.62138C4.3139 4.03231 3.0485 5.43565 2.54083 6.84674C1.22239 10.483 4.73822 14.5612 6.06424 16.0964C8.0722 18.4224 10.3226 19.7559 11.9821 20.5312C12.467 20.3064 12.9898 20.0273 13.5278 19.6784C13.846 19.4768 14.134 19.2675 14.4068 19.0659"
                stroke="#212121"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M18.0938 12V19.3125"
                stroke="#212121"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M14.4375 15.6562H21.75"
                stroke="#212121"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>

      {/* Body */}
      <div className="product-card-body">
        <div style={{ height: 24, marginBottom: 8, display: 'flex', alignItems: 'center' }}>
          {product.category_name ? (
            <div className="marquee-hover-wrap" style={{ maxWidth: 170 }}>
              <span
                className="badge badge-purple marquee-hover-text"
                title={product.category_name}
              >
                {product.category_name}
              </span>
            </div>
          ) : (
            <span
              className="badge"
              style={{
                background: 'var(--bg-elevated)',
                color: 'var(--text-muted)',
                fontSize: '0.72rem',
                border: '1px solid var(--bg-border)',
              }}
            >
              Digital Asset
            </span>
          )}
        </div>

        <h3
          className="card-title-clamp"
          title={product.title}
        >
          <Link to={`/product/${product.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
            {product.title}
          </Link>
        </h3>

        {/* Rating & Reviews */}
        {product.average_rating !== null && product.average_rating !== undefined && (product.reviews_count ?? 0) > 0 ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                padding: '1px 6px',
                borderRadius: 4,
              }}
            >
              <Star size={11} fill="#F59E0B" color="#F59E0B" />
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#B45309' }}>
                {Number(product.average_rating).toFixed(1)}
              </span>
            </div>
            <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 600 }}>
              ({product.reviews_count} {product.reviews_count === 1 ? 'review' : 'reviews'})
            </span>
          </div>
        ) : null}

        <p
          className="card-desc-clamp"
          title={product.short_description || `${product.file_count ?? 1} files · ${product.file_type ?? 'digital'}`}
        >
          {product.short_description?.slice(0, 100) || `${product.file_count ?? 1} files · ${product.file_type ?? 'digital'} · Instant access`}
        </p>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            marginTop: 'auto',
            paddingTop: 10,
            borderTop: '1px solid var(--bg-border)',
          }}
        >
          <div className="price-display">
            <span className="price-current" style={{ fontWeight: 800, color: '#212121', fontSize: '1.05rem' }}>{formatPrice(effectivePrice)}</span>
            {hasDiscount && <span className="price-original" style={{ color: '#878787', textDecoration: 'line-through', fontSize: '0.85rem' }}>{formatPrice(product.price)}</span>}
          </div>
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              if (onBuyNow) {
                onBuyNow(product)
              } else {
                navigate(`/product/${product.slug}`)
              }
            }}
            style={{
              padding: '8px 18px',
              fontSize: '0.8125rem',
              fontWeight: 800,
              borderRadius: 8,
              background: '#FFD200',
              color: '#000000',
              border: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 8px rgba(255, 210, 0, 0.45)',
              transition: 'transform 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            {product.button_text || 'Buy'}
          </button>
        </div>
      </div>
    </div>
  )
}
