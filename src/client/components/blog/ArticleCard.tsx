// src/client/components/blog/ArticleCard.tsx — Reusable Editorial Blog Post Card
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Calendar, User, ArrowRight, BookOpen } from 'lucide-react'
import type { BlogPost } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import OptimizedImage from '../ui/OptimizedImage'

interface Props {
  post: BlogPost
}

export default function ArticleCard({ post }: Props) {
  const imageUrl = post.thumbnail_key
    ? post.thumbnail_key.startsWith('http')
      ? post.thumbnail_key
      : `/api/images/${encodeURIComponent(post.thumbnail_key)}`
    : null

  return (
    <motion.article
      className="glass-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      style={{
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        background: 'var(--bg-surface)',
      }}
    >
      {/* Article Image / Fallback Thumbnail */}
      <Link to={`/blog/${post.slug}`} style={{ display: 'block', textDecoration: 'none' }}>
        <div
          style={{
            aspectRatio: '16/10',
            width: '100%',
            overflow: 'hidden',
            background: 'var(--bg-elevated)',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {imageUrl ? (
            <OptimizedImage
              src={imageUrl}
              alt={post.title}
              variant="thumbnail"
              aspectRatio="16/10"
            />
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
              <BookOpen size={36} style={{ margin: '0 auto 6px', opacity: 0.6 }} />
              <div style={{ fontSize: '0.75rem', fontWeight: 600 }}>Editorial Guide</div>
            </div>
          )}

          {/* Category Badge overlay */}
          {post.category_name && (
            <div
              className="text-truncate"
              style={{
                position: 'absolute',
                top: '12px',
                left: '12px',
                background: 'var(--glass-bg)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(124, 58, 237, 0.35)',
                color: 'var(--brand-purple-light)',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.75rem',
                fontWeight: 700,
                maxWidth: '180px',
              }}
              title={post.category_name}
            >
              {post.category_name}
            </div>
          )}
        </div>
      </Link>

      {/* Card Content Area */}
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* Meta Line */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.75rem',
            color: 'var(--text-muted)',
            marginBottom: '10px',
            flexWrap: 'wrap',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={12} /> {formatDate(post.published_at ?? post.created_at)}
          </span>
          <span>•</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} /> {post.author_name || 'Editorial Team'}
          </span>
        </div>

        {/* Article Title */}
        <h3
          title={post.title}
          style={{
            fontSize: '1.05rem',
            fontWeight: 800,
            lineHeight: 1.35,
            height: '2.7em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            marginBottom: '10px',
            color: 'var(--text-primary)',
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
        </h3>

        {/* Excerpt */}
        <p
          style={{
            color: 'var(--text-secondary)',
            fontSize: '0.875rem',
            lineHeight: 1.5,
            height: '4.5em',
            marginBottom: '16px',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {post.excerpt ?? post.content?.slice(0, 140) + '...'}
        </p>

        {/* Read Article Link */}
        <Link
          to={`/blog/${post.slug}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: 'var(--brand-purple-light)',
            fontWeight: 700,
            fontSize: '0.85rem',
            marginTop: 'auto',
            textDecoration: 'none',
          }}
        >
          Read Article <ArrowRight size={14} />
        </Link>
      </div>
    </motion.article>
  )
}
