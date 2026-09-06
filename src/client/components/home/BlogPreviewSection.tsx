// src/client/components/home/BlogPreviewSection.tsx — Real Database Blog Articles Section
import { Link } from 'react-router-dom'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { api, type BlogPost } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import OptimizedImage from '../ui/OptimizedImage'

export default function BlogPreviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ['home-blog-posts'],
    queryFn: () => api.blog.list({ limit: 3 }),
  })

  const articles: BlogPost[] = data?.posts || []

  // If not loading and no published articles exist, don't show fake articles
  if (!isLoading && articles.length === 0) {
    return null
  }

  const getArticleImage = (thumbnailKey?: string | null) => {
    if (!thumbnailKey) {
      return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80'
    }
    return thumbnailKey.startsWith('http')
      ? thumbnailKey
      : `/api/images/${encodeURIComponent(thumbnailKey)}`
  }

  return (
    <section style={{ padding: '32px 0 64px' }}>
      <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '32px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: 'Manrope, Inter, sans-serif',
                fontSize: 'clamp(1.65rem, 3.5vw, 2.15rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
                letterSpacing: '-0.025em',
                marginBottom: '6px',
              }}
            >
              From the Hub
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Tips, trends and inspiration for creators.
            </p>
          </div>

          <Link
            to="/blog"
            className="btn-ghost"
            style={{
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '8px 18px',
              borderRadius: 'var(--radius-full)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--bg-surface)',
            }}
          >
            <span>View All Articles</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {/* 3 Article Cards Grid */}
        {isLoading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                style={{
                  height: '340px',
                  borderRadius: '20px',
                  background: 'var(--bg-elevated)',
                  animation: 'pulse 1.5s infinite ease-in-out',
                }}
              />
            ))}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '24px',
            }}
          >
            {articles.map((article) => {
              const imageUrl = getArticleImage(article.thumbnail_key)

              return (
                <Link
                  key={article.id}
                  to={`/blog/${article.slug}`}
                  style={{
                    textDecoration: 'none',
                    color: 'inherit',
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--bg-border)',
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: 'var(--shadow-sm)',
                    transition: 'transform 0.25s ease, box-shadow 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)'
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.boxShadow = 'var(--shadow-sm)'
                  }}
                >
                  {/* Featured Image */}
                  <div
                    style={{
                      aspectRatio: '16/9',
                      width: '100%',
                      overflow: 'hidden',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <OptimizedImage
                      src={imageUrl}
                      alt={article.title}
                      variant="thumbnail"
                      aspectRatio="16/9"
                    />
                  </div>

                  {/* Body */}
                  <div style={{ padding: '20px 20px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    {/* Meta Row: Badge + Date */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '12px',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: 'var(--brand-purple)',
                          background: 'rgba(124, 58, 237, 0.12)',
                          padding: '3px 10px',
                          borderRadius: 'var(--radius-full)',
                        }}
                      >
                        {article.category_name || 'Guides'}
                      </span>

                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatDate(article.published_at || article.created_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3
                      style={{
                        fontFamily: 'Manrope, Inter, sans-serif',
                        fontWeight: 800,
                        fontSize: '1.08rem',
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        marginBottom: '12px',
                        flex: 1,
                      }}
                    >
                      {article.title}
                    </h3>

                    {/* Excerpt */}
                    {article.excerpt && (
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '0.85rem',
                          lineHeight: 1.5,
                          marginBottom: '18px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {article.excerpt}
                      </p>
                    )}

                    {/* Read More Link */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.825rem',
                        fontWeight: 700,
                        color: 'var(--brand-purple)',
                        marginTop: 'auto',
                      }}
                    >
                      <span>Read More</span>
                      <ArrowRight size={14} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
