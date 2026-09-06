// src/client/pages/wishlist/WishlistPage.tsx
import { Link, useNavigate } from 'react-router-dom'
import { Heart, Trash2, ArrowLeft, ShoppingBag } from 'lucide-react'
import { useWishlistStore } from '../../lib/wishlist-store'
import ProductCard from '../../components/product/ProductCard'
import { motion } from 'framer-motion'

export default function WishlistPage() {
  const { items, clearWishlist, recentlyViewed } = useWishlistStore()
  const navigate = useNavigate()

  return (
    <div className="section" style={{ minHeight: '80dvh' }}>
      <div className="container">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: 'rgba(239, 68, 68, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444',
            }}>
              <Heart size={24} fill="currentColor" />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>My Saved Wishlist</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{items.length} item(s) saved</p>
            </div>
          </div>

          {items.length > 0 && (
            <button onClick={clearWishlist} className="btn-ghost" style={{ fontSize: '0.85rem', color: '#EF4444' }}>
              <Trash2 size={16} /> Clear All
            </button>
          )}
        </div>

        {/* Wishlist Items */}
        {items.length === 0 ? (
          <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', maxWidth: 500, margin: '0 auto 48px' }}>
            <Heart size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: 8 }}>Your wishlist is empty</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
              Explore our digital catalog and tap the heart icon to save products for later.
            </p>
            <button onClick={() => navigate('/products')} className="btn-primary" style={{ padding: '12px 24px' }}>
              <ShoppingBag size={18} /> Browse Products
            </button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="products-grid"
            style={{ marginBottom: 48 }}
          >
            {items.map((product) => (
              <ProductCard key={product.id} product={product} onBuyNow={() => navigate(`/product/${product.slug}`)} />
            ))}
          </motion.div>
        )}

        {/* Recently Viewed Section */}
        {recentlyViewed.length > 0 && (
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 40 }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 20 }}>Recently Viewed Products</h2>
            <div className="products-grid">
              {recentlyViewed.map((product) => (
                <ProductCard key={product.id} product={product} onBuyNow={() => navigate(`/product/${product.slug}`)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
