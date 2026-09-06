// src/client/pages/search/SearchPage.tsx
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Search, Package, FileText } from 'lucide-react'
import { api, type Product, type BlogPost } from '../../lib/api'
import ProductCard from '../../components/product/ProductCard'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const initialQuery = searchParams.get('q') || ''
  const [inputVal, setInputVal] = useState(initialQuery)

  const { data, isLoading } = useQuery({
    queryKey: ['search', initialQuery],
    queryFn: () => api.search(initialQuery),
    enabled: initialQuery.length >= 2,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputVal.trim()) {
      setSearchParams({ q: inputVal.trim() })
    }
  }

  return (
    <div className="section">
      <div className="container">
        <div style={{ maxWidth: 640, margin: '0 auto 48px', textAlign: 'center' }}>
          <h1 className="section-title" style={{ marginBottom: 16 }}>Search Products & Articles</h1>
          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={18} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="search"
                className="input-field"
                style={{ paddingLeft: 42 }}
                placeholder="Search wallpapers, templates, guides..."
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                autoFocus
              />
            </div>
            <button type="submit" className="btn-primary" style={{ padding: '12px 24px' }}>
              Search
            </button>
          </form>
        </div>

        {isLoading ? <LoadingSpinner /> : (
          <div>
            {initialQuery && (
              <p style={{ color: 'var(--text-muted)', marginBottom: 24 }}>
                Showing results for <strong style={{ color: 'var(--text-primary)' }}>"{initialQuery}"</strong>
              </p>
            )}

            {/* Products Section */}
            {data?.products && data.products.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Package size={20} color="#111827" /> Products ({data.products.length})
                </h2>
                <div className="products-grid">
                  {data.products.map((p: Product) => (
                    <ProductCard key={p.id} product={p} onBuyNow={() => navigate(`/product/${p.slug}`)} />
                  ))}
                </div>
              </div>
            )}

            {/* Blog Posts Section */}
            {data?.posts && data.posts.length > 0 && (
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={20} color="var(--brand-amber)" /> Blog Articles ({data.posts.length})
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                  {data.posts.map((post: BlogPost) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="glass-card"
                      style={{ padding: 20, textDecoration: 'none', transition: 'border-color 0.2s' }}
                    >
                      <h3 style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', marginBottom: 8 }}>{post.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6 }}>{post.excerpt}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {initialQuery && (!data?.products.length && !data?.posts.length) && (
              <div className="empty-state">
                <div className="empty-state-icon">🔍</div>
                <h2>No results found</h2>
                <p style={{ color: 'var(--text-muted)' }}>Try different keywords or browse our categories.</p>
                <Link to="/products" className="btn-primary" style={{ marginTop: 20 }}>Browse All Products</Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
