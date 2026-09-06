// src/client/components/blog/FeaturedArticleCard.tsx — Large Featured Article Hero Card
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowRight, Sparkles, BookOpen } from 'lucide-react'
import type { BlogPost } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import OptimizedImage from '../ui/OptimizedImage'

interface Props {
  post: BlogPost | null
}

export default function FeaturedArticleCard({ post }: Props) {
  if (!post) return null

  const imageUrl = post.thumbnail_key
    ? post.thumbnail_key.startsWith('http')
      ? post.thumbnail_key
      : `/api/images/${encodeURIComponent(post.thumbnail_key)}`
    : null

  return (
    <motion.div
      className="glass-card"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 'var(--radius-2xl)',
        border: '1px solid var(--bg-border)',
        overflow: 'hidden',
        background: 'var(--grad-surface)',
        marginBottom: '48px',
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          alignItems: 'center',
        }}
      >
        {/* Left: Featured Image */}
        <Link to={`/blog/${post.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
          <div
            style={{
              aspectRatio: '16/10',
              width: '100%',
              minHeight: '260px',
              background: 'var(--bg-elevated)',
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {imageUrl ? (
              <OptimizedImage
                src={imageUrl}
                alt={post.title}
                variant="medium"
                aspectRatio="16/10"
              />
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                <BookOpen size={48} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>Featured Guide</div>
              </div>
            )}

            {/* Featured Badge */}
            <div
              style={{
                position: 'absolute',
                top: '16px',
                left: '16px',
                background: 'var(--brand-amber)',
                color: '#000000',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <Sparkles size={12} /> FEATURED GUIDE
            </div>
          </div>
        </Link>

        {/* Right: Featured Content */}
        <div style={{ padding: '36px 32px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {post.category_name && (
            <span
              style={{
                fontSize: '0.8125rem',
                fontWeight: 700,
                color: 'var(--brand-purple-light)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {post.category_name}
            </span>
          )}

          <h2
            style={{
              fontSize: 'clamp(1.35rem, 3vw, 1.85rem)',
              fontWeight: 900,
              lineHeight: 1.25,
              color: 'var(--text-primary)',
              margin: 0,
            }}
          >
            <Link
              to={`/blog/${post.slug}`}
              style={{
                color: 'var(--text-primary)',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-purple-light)')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            >
              {post.title}
            </Link>
          </h2>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '0.95rem',
              lineHeight: 1.7,
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {post.excerpt ?? post.content?.slice(0, 180) + '...'}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              fontSize: '0.8125rem',
              color: 'var(--text-muted)',
              marginTop: '4px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Calendar size={13} /> {formatDate(post.published_at ?? post.created_at)}
            </span>
            <span>•</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <User size={13} /> {post.author_name || 'Editorial Staff'}
            </span>
          </div>

          <div style={{ marginTop: '12px' }}>
            <Link
              to={`/blog/${post.slug}`}
              className="btn-primary"
              style={{
                padding: '12px 24px',
                fontSize: '0.875rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              Read Full Article <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
