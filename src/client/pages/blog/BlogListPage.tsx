// src/client/pages/blog/BlogListPage.tsx — Production Editorial Blog & Articles Page
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BookOpen, RefreshCw, ArrowRight, Sparkles, Filter, Search, X } from 'lucide-react'
import { api, type BlogPost } from '../../lib/api'
import ArticleCard from '../../components/blog/ArticleCard'
import FeaturedArticleCard from '../../components/blog/FeaturedArticleCard'
import BlogCategoryNav from '../../components/blog/BlogCategoryNav'
import ArticleSearch from '../../components/blog/ArticleSearch'
import BlogCtaSection from '../../components/blog/BlogCtaSection'
import { useSiteConfig } from '../../lib/site-config'

export default function BlogListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { siteName } = useSiteConfig()

  const activeCategory = searchParams.get('category') || ''
  const searchQuery = searchParams.get('q') || ''
  const [limit, setLimit] = useState(12)

  // Dynamic Browser Page Title
  useEffect(() => {
    if (searchQuery) {
      document.title = `Search: "${searchQuery}" — Blog & Articles — ${siteName}`
    } else if (activeCategory) {
      document.title = `${activeCategory.toUpperCase()} Articles — ${siteName}`
    } else {
      document.title = `Blog & Articles — ${siteName}`
    }
  }, [searchQuery, activeCategory, siteName])

  // Fetch Categories
  const { data: categoriesData } = useQuery({
    queryKey: ['blog-categories'],
    queryFn: () => api.blog.categories(),
  })

  // Fetch Articles with search and category support
  const {
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['blog-posts', activeCategory, searchQuery, limit],
    queryFn: () =>
      api.blog.list({
        limit,
        offset: 0,
        category: activeCategory || undefined,
        q: searchQuery || undefined,
      }),
  })

  const posts: BlogPost[] = data?.posts || []
  const totalPosts: number = data?.total || 0
  const hasMore: boolean = posts.length < totalPosts

  // Handle Category Filter Change
  const handleSelectCategory = (slug: string) => {
    setLimit(12)
    const newParams = new URLSearchParams(searchParams)
    if (slug) {
      newParams.set('category', slug)
    } else {
      newParams.delete('category')
    }
    setSearchParams(newParams)
  }

  // Handle Search Change
  const handleSearch = useCallback(
    (query: string) => {
      setLimit(12)
      const newParams = new URLSearchParams(searchParams)
      if (query) {
        newParams.set('q', query)
      } else {
        newParams.delete('q')
      }
      setSearchParams(newParams)
    },
    [searchParams, setSearchParams]
  )

  const clearAllFilters = () => {
    setLimit(12)
    setSearchParams(new URLSearchParams())
  }

  // Find Featured Post (Top featured post, only when not filtering/searching)
  const isFiltering = Boolean(activeCategory || searchQuery)
  const featuredPost = (!isFiltering && posts.find((p) => p.is_featured === 1)) || null

  // Remaining articles excluding featured post to prevent duplication
  const gridArticles = featuredPost ? posts.filter((p) => p.id !== featuredPost.id) : posts

  return (
    <div className="section" style={{ minHeight: '85vh', paddingTop: '36px', paddingBottom: '80px' }}>
      {/* ── JSON-LD Structured Data ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Blog',
            name: `Blog & Articles — ${siteName}`,
            description: 'Explore articles, guides, updates and useful information from 1024 Tera Viral Hub.',
            publisher: {
              '@type': 'Organization',
              name: siteName,
            },
          }),
        }}
      />

      <div className="container" style={{ maxWidth: '1040px' }}>
        {/* ── 1. Blog Hero ── */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(124, 58, 237, 0.12)',
              border: '1px solid rgba(124, 58, 237, 0.28)',
              color: 'var(--brand-purple-light)',
              fontSize: '0.8125rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginBottom: '14px',
            }}
          >
            <BookOpen size={13} /> Digital Knowledge Hub
          </div>

          <h1
            style={{
              fontSize: 'clamp(2rem, 4.5vw, 2.75rem)',
              fontWeight: 900,
              lineHeight: 1.15,
              marginBottom: '10px',
              color: 'var(--text-primary)',
            }}
          >
            Blog & Articles
          </h1>

          <p
            style={{
              color: 'var(--text-secondary)',
              fontSize: '1rem',
              maxWidth: '560px',
              margin: '0 auto 24px',
              lineHeight: 1.6,
            }}
          >
            Explore articles, guides, updates and useful information from {siteName}.
          </p>

          {/* ── 2. Real Article Search Bar ── */}
          <ArticleSearch initialValue={searchQuery} onSearch={handleSearch} />
        </div>

        {/* ── 3. Category Navigation Bar ── */}
        {categoriesData?.categories && categoriesData.categories.length > 0 && (
          <BlogCategoryNav
            categories={categoriesData.categories}
            activeCategory={activeCategory}
            onSelectCategory={handleSelectCategory}
          />
        )}

        {/* Active Filter / Search Banner */}
        {isFiltering && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              borderRadius: 'var(--radius-lg)',
              marginBottom: '28px',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
            }}
          >
            <div>
              Showing {totalPosts} {totalPosts === 1 ? 'article' : 'articles'}
              {searchQuery && (
                <span>
                  {' '}
                  matching <strong>"{searchQuery}"</strong>
                </span>
              )}
              {activeCategory && (
                <span>
                  {' '}
                  in <strong>{activeCategory}</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--brand-purple-light)',
                fontWeight: 700,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <X size={14} /> Clear Filter
            </button>
          </div>
        )}

        {/* ── 4. Initial Loading Skeleton ── */}
        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px', marginBottom: '40px' }}>
            {[1, 2, 3].map((k) => (
              <div
                key={k}
                className="glass-card"
                style={{
                  height: '340px',
                  borderRadius: 'var(--radius-xl)',
                  border: '1px solid var(--bg-border)',
                  background: 'var(--bg-surface)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
                  <RefreshCw size={16} className="spin" /> Loading articles...
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── 5. Error State ── */}
        {isError && !isLoading && (
          <div
            className="glass-card"
            style={{
              padding: '40px 24px',
              borderRadius: 'var(--radius-xl)',
              textAlign: 'center',
              maxWidth: '480px',
              margin: '0 auto 40px',
            }}
          >
            <BookOpen size={40} color="var(--error)" style={{ margin: '0 auto 12px' }} />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '8px' }}>
              Unable to load articles
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '20px' }}>
              Please check your internet connection and try again.
            </p>
            <button type="button" onClick={() => refetch()} className="btn-primary" style={{ padding: '10px 20px', fontSize: '0.85rem' }}>
              <RefreshCw size={14} style={{ marginRight: '6px' }} /> Try Again
            </button>
          </div>
        )}

        {/* ── 6. Main Content Feed ── */}
        {!isLoading && !isError && (
          <>
            {/* Featured Article Hero Card (rendered only when not filtering and featured exists) */}
            {featuredPost && <FeaturedArticleCard post={featuredPost} />}

            {/* Articles Grid */}
            {gridArticles.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px',
                }}
              >
                {gridArticles.map((post) => (
                  <ArticleCard key={post.id} post={post} />
                ))}
              </div>
            ) : !featuredPost ? (
              /* Empty States */
              <div
                className="glass-card"
                style={{
                  padding: '56px 24px',
                  borderRadius: 'var(--radius-xl)',
                  textAlign: 'center',
                  maxWidth: '520px',
                  margin: '0 auto 40px',
                }}
              >
                <BookOpen size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
                  {searchQuery
                    ? 'No articles found'
                    : activeCategory
                    ? 'No articles in this category'
                    : 'No articles available yet'}
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '24px' }}>
                  {searchQuery
                    ? `No articles matched "${searchQuery}". Try a different search term or browse another category.`
                    : activeCategory
                    ? 'There are currently no published articles in this category. Explore another topic or reset the filter.'
                    : 'Please check back later for new guides and articles.'}
                </p>

                {isFiltering ? (
                  <button
                    type="button"
                    onClick={clearAllFilters}
                    className="btn-primary"
                    style={{ padding: '10px 22px', fontSize: '0.85rem' }}
                  >
                    View All Articles
                  </button>
                ) : (
                  <Link to="/products" className="btn-primary" style={{ padding: '10px 22px', fontSize: '0.85rem' }}>
                    Explore Digital Products
                  </Link>
                )}
              </div>
            ) : null}

            {/* ── 7. Pagination / Load More ── */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: '32px' }}>
                <button
                  type="button"
                  onClick={() => setLimit((prev) => prev + 12)}
                  disabled={isFetching}
                  className="btn-ghost"
                  style={{
                    padding: '12px 28px',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: isFetching ? 'not-allowed' : 'pointer',
                  }}
                >
                  {isFetching ? (
                    <>
                      <RefreshCw size={14} className="spin" /> Loading articles...
                    </>
                  ) : (
                    <>
                      Load More Articles ({totalPosts - posts.length} remaining)
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}

        {/* ── 8. Catalog Conversion CTA ── */}
        <BlogCtaSection />
      </div>
    </div>
  )
}
