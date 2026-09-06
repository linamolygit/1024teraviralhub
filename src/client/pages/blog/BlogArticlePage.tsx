// src/client/pages/blog/BlogArticlePage.tsx — Production Individual Blog Article Page
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, User, Eye, BookOpen, AlertCircle, RefreshCw, Sparkles, Package } from 'lucide-react'
import { api, type BlogPost } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import ArticleBreadcrumb from '../../components/blog/ArticleBreadcrumb'
import ArticleShareBar from '../../components/blog/ArticleShareBar'
import ArticleCard from '../../components/blog/ArticleCard'
import { useSiteConfig } from '../../lib/site-config'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import OptimizedImage from '../../components/ui/OptimizedImage'

export default function BlogArticlePage() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const { siteName } = useSiteConfig()

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['blog-article', slug],
    queryFn: () => api.blog.get(slug!),
    enabled: Boolean(slug),
  })

  const post: BlogPost | undefined = data?.post
  const relatedPosts: BlogPost[] = data?.related_posts || []

  // Dynamic Browser Page Title
  useEffect(() => {
    if (post?.title) {
      document.title = `${post.title} — ${siteName}`
    }
  }, [post?.title, siteName])

  // ── Loading Skeleton ──
  if (isLoading) {
    return (
      <div className="section" style={{ minHeight: '80vh', paddingTop: '32px' }}>
        <div className="container" style={{ maxWidth: '820px' }}>
          <div style={{ height: '20px', width: '220px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '24px' }} />
          <div style={{ height: '24px', width: '100px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '14px' }} />
          <div style={{ height: '44px', width: '90%', background: 'var(--bg-elevated)', borderRadius: '8px', marginBottom: '16px' }} />
          <div style={{ height: '20px', width: '260px', background: 'var(--bg-elevated)', borderRadius: '6px', marginBottom: '28px' }} />
          <div style={{ aspectRatio: '16/9', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-xl)', marginBottom: '32px' }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ height: '18px', width: '100%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '95%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
            <div style={{ height: '18px', width: '80%', background: 'var(--bg-elevated)', borderRadius: '4px' }} />
          </div>
        </div>
      </div>
    )
  }

  // ── 404 / Error State ──
  if (isError || !post) {
    return (
      <div className="section" style={{ minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
        <div className="container" style={{ maxWidth: '500px', textAlign: 'center' }}>
          <div className="glass-card" style={{ padding: '48px 24px', borderRadius: 'var(--radius-xl)' }}>
            <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Article Not Found
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '24px', lineHeight: 1.6 }}>
              The article you are looking for may have been moved, deleted, or is no longer published.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link to="/blog" className="btn-primary" style={{ padding: '12px 24px', fontSize: '0.875rem' }}>
                Browse All Articles
              </Link>
              <Link to="/" className="btn-ghost" style={{ padding: '12px 20px', fontSize: '0.875rem' }}>
                Go Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const imageUrl = post.thumbnail_key
    ? post.thumbnail_key.startsWith('http')
      ? post.thumbnail_key
      : `/api/images/${encodeURIComponent(post.thumbnail_key)}`
    : null

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '28px', paddingBottom: '80px' }}>
      {/* ── JSON-LD Structured Data Schema (BlogPosting) ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.title,
            description: post.excerpt || post.title,
            image: imageUrl || undefined,
            datePublished: post.published_at || post.created_at,
            dateModified: post.created_at,
            author: {
              '@type': 'Person',
              name: post.author_name || siteName,
            },
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
          }),
        }}
      />

      <div className="container" style={{ maxWidth: '820px' }}>
        {/* ── 1. Semantic Breadcrumb ── */}
        <ArticleBreadcrumb
          categoryName={post.category_name}
          categorySlug={post.category_slug}
          articleTitle={post.title}
        />

        {/* ── 2. Article Header ── */}
        <header style={{ marginBottom: '32px' }}>
          {post.category_name && (
            <div style={{ marginBottom: '14px' }}>
              <Link
                to={`/blog?category=${post.category_slug || ''}`}
                className="badge badge-purple"
                style={{ textDecoration: 'none', cursor: 'pointer' }}
              >
                {post.category_name}
              </Link>
            </div>
          )}

          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.2,
              marginBottom: '16px',
              color: 'var(--text-primary)',
              letterSpacing: '-0.01em',
            }}
          >
            {post.title}
          </h1>

          {/* Excerpt / Lead Description */}
          {post.excerpt && (
            <p
              style={{
                fontSize: '1.1rem',
                color: 'var(--text-secondary)',
                lineHeight: 1.7,
                marginBottom: '20px',
              }}
            >
              {post.excerpt}
            </p>
          )}

          {/* Metadata & Share Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              paddingTop: '16px',
              borderTop: '1px solid var(--bg-border)',
              flexWrap: 'wrap',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                fontSize: '0.8125rem',
                color: 'var(--text-muted)',
                flexWrap: 'wrap',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={13} /> {post.author_name || 'Editorial Team'}
              </span>
              <span>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Calendar size={13} /> {formatDate(post.published_at ?? post.created_at)}
              </span>
              {post.view_count !== undefined && post.view_count > 0 && (
                <>
                  <span>•</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Eye size={13} /> {post.view_count} views
                  </span>
                </>
              )}
            </div>

            <ArticleShareBar title={post.title} />
          </div>
        </header>

        {/* ── 3. Featured Image ── */}
        {imageUrl && (
          <div
            style={{
              aspectRatio: '16/9',
              borderRadius: 'var(--radius-xl)',
              overflow: 'hidden',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--bg-border)',
              marginBottom: '36px',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <OptimizedImage
              src={imageUrl}
              alt={post.title}
              variant="large"
              priority={true}
              aspectRatio="16/9"
            />
          </div>
        )}

        {/* ── 4. Main Article Content ── */}
        <div
          className="article-content"
          style={{
            color: 'var(--text-primary)',
            lineHeight: 1.85,
            fontSize: '1.05rem',
            whiteSpace: 'pre-wrap',
            marginBottom: '48px',
          }}
        >
          {post.content}
        </div>

        {/* ── 5. Contextual Catalog CTA ── */}
        <div
          className="glass-card"
          style={{
            padding: '36px 28px',
            borderRadius: 'var(--radius-2xl)',
            textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.12) 0%, rgba(245, 158, 11, 0.08) 100%)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            marginBottom: '56px',
          }}
        >
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--grad-cta)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)',
            }}
          >
            <Package size={24} color="white" />
          </div>

          <h3 style={{ fontSize: '1.35rem', fontWeight: 900, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Explore Our Digital Marketplace
          </h3>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', maxWidth: '480px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            Discover the high-resolution wallpapers, template packages, and asset bundles mentioned in this guide.
          </p>

          <Link
            to="/products"
            className="btn-cta"
            style={{
              padding: '12px 28px',
              fontSize: '0.9rem',
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              borderRadius: 'var(--radius-xl)',
            }}
          >
            Browse Products
          </Link>
        </div>

        {/* ── 6. Related Articles Section ── */}
        {relatedPosts.length > 0 && (
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: '40px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '24px', color: 'var(--text-primary)' }}>
              Related Articles
            </h3>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '20px',
              }}
            >
              {relatedPosts.map((rPost) => (
                <ArticleCard key={rPost.id} post={rPost} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
