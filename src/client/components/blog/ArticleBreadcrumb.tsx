// src/client/components/blog/ArticleBreadcrumb.tsx — Semantic Breadcrumb for Blog Articles
import { Link } from 'react-router-dom'
import { ChevronRight, Home, BookOpen } from 'lucide-react'

interface Props {
  categoryName?: string | null
  categorySlug?: string | null
  articleTitle: string
}

export default function ArticleBreadcrumb({ categoryName, categorySlug, articleTitle }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '24px',
        fontSize: '0.8125rem',
        color: 'var(--text-muted)',
      }}
    >
      <Link
        to="/"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <Home size={13} /> Home
      </Link>

      <ChevronRight size={12} style={{ opacity: 0.5 }} />

      <Link
        to="/blog"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        <BookOpen size={13} /> Blog & Articles
      </Link>

      {categoryName && categorySlug && (
        <>
          <ChevronRight size={12} style={{ opacity: 0.5 }} />
          <Link
            to={`/blog?category=${categorySlug}`}
            style={{
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
          >
            {categoryName}
          </Link>
        </>
      )}

      <ChevronRight size={12} style={{ opacity: 0.5 }} />

      <span
        aria-current="page"
        style={{
          color: 'var(--text-primary)',
          fontWeight: 600,
          maxWidth: '260px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {articleTitle}
      </span>
    </nav>
  )
}
