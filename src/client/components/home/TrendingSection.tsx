// src/client/components/home/TrendingSection.tsx — Compact Featured Digital Products Section
import { Link } from 'react-router-dom'
import { Sparkles, ChevronRight } from 'lucide-react'
import { type Product } from '../../lib/api'
import ProductCard from '../product/ProductCard'

interface TrendingSectionProps {
  products?: Product[]
  isLoading?: boolean
}

export default function TrendingSection({ products = [], isLoading }: TrendingSectionProps) {
  return (
    <section style={{ padding: '40px 0 60px' }}>
      <div className="container">
        {/* Section Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            <span
              className="badge badge-purple"
              style={{
                marginBottom: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={12} /> Curated Picks
            </span>
            <h2
              style={{
                fontSize: 'clamp(1.4rem, 3vw, 1.85rem)',
                fontWeight: 800,
                color: 'var(--text-primary)',
              }}
            >
              Featured Digital Products
            </h2>
          </div>

          <Link
            to="/products?featured=true"
            className="btn-ghost"
            style={{ fontSize: '0.85rem' }}
          >
            View All Featured <ChevronRight size={15} />
          </Link>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="products-grid">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="product-card"
                style={{
                  height: 320,
                  opacity: 0.5,
                  animation: 'pulse 1.5s infinite ease-in-out',
                  background: 'var(--bg-elevated)',
                }}
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              background: 'var(--bg-surface)',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--bg-border)',
            }}
          >
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              No products published yet.
            </p>
          </div>
        ) : (
          <div className="products-grid">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
