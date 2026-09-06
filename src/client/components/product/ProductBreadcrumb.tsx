// src/client/components/product/ProductBreadcrumb.tsx — Semantic Accessible Breadcrumb Navigation
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'

interface Props {
  categoryName?: string | null
  categorySlug?: string | null
  productTitle: string
}

export default function ProductBreadcrumb({ categoryName, categorySlug, productTitle }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        flexWrap: 'wrap',
        marginBottom: '20px',
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
        <Home size={14} /> Home
      </Link>

      <ChevronRight size={12} style={{ opacity: 0.5 }} />

      <Link
        to="/products"
        style={{
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
      >
        Products
      </Link>

      {categoryName && categorySlug && (
        <>
          <ChevronRight size={12} style={{ opacity: 0.5 }} />
          <Link
            to={`/products?category=${categorySlug}`}
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
          maxWidth: '280px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {productTitle}
      </span>
    </nav>
  )
}
