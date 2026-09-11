// src/client/components/layout/Header.tsx — Pixel-Accurate Header with Dynamic Wishlist & Comprehensive Mobile Navigation
import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  Search, Menu, X, CircleHelp, Heart,
  Home, ShoppingBag, Grid, Flame, Download, Package,
  BookOpen, Info, MessageSquare, Tag, Users, ChevronRight
} from 'lucide-react'
import { useSiteConfig } from '../../lib/site-config'
import { useWishlistStore } from '../../lib/wishlist-store'
import { useSavedOrders } from '../../lib/orderSession'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/products', label: 'Explore' },
  { to: '/products?sort=popular', label: 'Popular' },
  { to: '/blog', label: 'Blog' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQ, setSearchQ] = useState('')
  const { siteName } = useSiteConfig()
  const navigate = useNavigate()
  const location = useLocation()
  const { items: wishlistItems } = useWishlistStore()
  const wishlistCount = wishlistItems.length
  const { count: ordersCount } = useSavedOrders()

  // Accurately determine active navigation link based on path and query parameters
  const isLinkActive = (l: (typeof navLinks)[number]) => {
    if (l.to === '/') {
      return location.pathname === '/'
    }
    if (l.label === 'Popular') {
      return location.pathname === '/products' && location.search.includes('sort=popular')
    }
    if (l.label === 'Explore') {
      return location.pathname === '/products' && !location.search.includes('sort=popular')
    }
    if (l.to.startsWith('/blog')) {
      return location.pathname.startsWith('/blog')
    }
    return location.pathname === l.to
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false)
    setSearchOpen(false)
  }, [location.pathname])

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [menuOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQ.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQ.trim())}`)
      setSearchOpen(false)
      setSearchQ('')
    }
  }

  return (
    <header className="header" style={{ position: 'sticky', top: 0, zIndex: 100, background: '#FFFFFF', borderBottom: '1px solid #E0E0E0', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)' }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px' }}>
        {/* Left: Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: '#FFD200',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 210, 0, 0.35)',
              flexShrink: 0,
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L3 7V17L12 22L21 17V7L12 2Z" stroke="#111827" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 6L7.5 8.5V13.5L12 16L16.5 13.5V8.5L12 6Z" fill="#111827" fillOpacity="0.8"/>
            </svg>
          </div>
          <span style={{ fontFamily: 'Manrope, Inter, sans-serif', fontWeight: 800, fontSize: '1.05rem', color: '#212121', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
            {siteName || '1024 Tera Viral Hub'}
          </span>
        </Link>

        {/* Center: Desktop Navigation Links */}
        <nav className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '30px', height: '100%' }}>
          {navLinks.map((l) => {
            const active = isLinkActive(l)
            return (
              <Link
                key={l.label}
                to={l.to}
                style={{
                  color: active ? 'rgb(17, 98, 242)' : '#212121',
                  fontWeight: active ? 700 : 500,
                  fontSize: '0.925rem',
                  textDecoration: 'none',
                  position: 'relative',
                  padding: '20px 4px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  transition: 'color 0.15s ease',
                }}
              >
                {l.label}
                {active && (
                  <div
                    style={{
                      position: 'absolute',
                      bottom: 0,
                      left: '8px',
                      right: '8px',
                      height: '4px',
                      backgroundColor: 'rgb(17, 98, 242)',
                      borderRadius: '2px',
                    }}
                  />
                )}
              </Link>
            )
          })}
        </nav>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Search Button */}
          <button
            onClick={() => setSearchOpen(!searchOpen)}
            style={{
              background: '#F1F3F6',
              border: 'none',
              color: '#212121',
              padding: 8,
              borderRadius: 8,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
              minWidth: 38,
              transition: 'background 0.2s',
            }}
            aria-label="Search"
          >
            <Search size={18} color="#212121" />
          </button>

          {/* Help Link */}
          <Link
            to="/help"
            className="hide-mobile"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#212121',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 600,
              padding: '6px 10px',
              borderRadius: '8px',
            }}
          >
            <CircleHelp size={16} color="#212121" />
            <span>Help</span>
          </Link>

          {/* Browse Products CTA */}
          <Link
            to="/products"
            className="hide-mobile"
            style={{
              padding: '8px 20px',
              fontSize: '0.875rem',
              fontWeight: 800,
              borderRadius: '9999px',
              background: '#FFD200',
              color: '#000000',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(255, 210, 0, 0.35)',
              minHeight: 38,
              transition: 'transform 0.15s ease',
            }}
          >
            Browse Products
          </Link>

          {/* Desktop My Orders Button */}
          <Link
            to="/my-orders"
            className="hide-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: ordersCount > 0 ? '#1D4ED8' : '#212121',
              background: ordersCount > 0 ? 'rgba(37, 99, 235, 0.08)' : '#F1F3F6',
              border: ordersCount > 0 ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid #E0E0E0',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '9999px',
              position: 'relative',
              minHeight: 38,
              transition: 'all 0.15s ease',
            }}
            title="Your purchased orders and downloads"
          >
            <Package size={17} color={ordersCount > 0 ? '#2563EB' : '#212121'} />
            <span>My Orders</span>
            {ordersCount > 0 && (
              <span
                style={{
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  minWidth: '17px',
                  height: '17px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 1px 3px rgba(37, 99, 235, 0.3)',
                }}
              >
                {ordersCount}
              </span>
            )}
          </Link>

          {/* Desktop Wishlist Button (Right side of Browse Products) */}
          <Link
            to="/wishlist"
            className="hide-mobile"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '9999px',
              background: wishlistCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#F1F3F6',
              border: wishlistCount > 0 ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid #E0E0E0',
              color: wishlistCount > 0 ? '#DC2626' : '#212121',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 700,
              position: 'relative',
              minHeight: 38,
              transition: 'all 0.15s ease',
            }}
            title="Saved Wishlist Products"
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Heart
                size={18}
                fill={wishlistCount > 0 ? '#DC2626' : 'none'}
                color={wishlistCount > 0 ? '#DC2626' : '#212121'}
              />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: -7,
                    right: -10,
                    background: '#DC2626',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 800,
                    borderRadius: '9999px',
                    minWidth: '16px',
                    height: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 4px',
                    boxShadow: '0 2px 4px rgba(220, 38, 38, 0.4)',
                  }}
                >
                  {wishlistCount}
                </span>
              )}
            </div>
            <span>Wishlist</span>
          </Link>

          {/* Mobile Quick Wishlist Icon Button */}
          <Link
            to="/wishlist"
            className="hide-desktop"
            style={{
              background: wishlistCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#F1F3F6',
              border: wishlistCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : 'none',
              color: wishlistCount > 0 ? '#DC2626' : '#212121',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
              minWidth: 38,
              textDecoration: 'none',
              position: 'relative',
            }}
            aria-label={`Wishlist (${wishlistCount})`}
          >
            <Heart
              size={20}
              fill={wishlistCount > 0 ? '#DC2626' : 'none'}
              color={wishlistCount > 0 ? '#DC2626' : '#212121'}
            />
            {wishlistCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: '#DC2626',
                  color: '#FFFFFF',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  minWidth: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {wishlistCount}
              </span>
            )}
          </Link>

          {/* Mobile Quick My Orders Icon Button */}
          <Link
            to="/my-orders"
            className="hide-desktop"
            style={{
              background: ordersCount > 0 ? 'rgba(37, 99, 235, 0.08)' : '#F1F3F6',
              border: ordersCount > 0 ? '1px solid rgba(37, 99, 235, 0.25)' : 'none',
              color: ordersCount > 0 ? '#2563EB' : '#212121',
              padding: 8,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 38,
              minWidth: 38,
              textDecoration: 'none',
              position: 'relative',
            }}
            aria-label={`My Orders (${ordersCount})`}
            title="My Orders"
          >
            <Package size={20} color={ordersCount > 0 ? '#2563EB' : '#212121'} />
            {ordersCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: '#2563EB',
                  color: '#FFFFFF',
                  fontSize: '0.6rem',
                  fontWeight: 800,
                  borderRadius: '9999px',
                  minWidth: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}
              >
                {ordersCount}
              </span>
            )}
          </Link>

          {/* Mobile Hamburger Menu Button */}
          <button
            className="hide-desktop"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: menuOpen ? '#F1F3F6' : 'none',
              border: 'none',
              color: '#212121',
              padding: 8,
              cursor: 'pointer',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
              minWidth: 44,
            }}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          >
            {menuOpen ? <X size={24} color="#212121" /> : <Menu size={24} color="#212121" />}
          </button>
        </div>
      </div>

      {/* Search Input Bar (Dropdown) */}
      {searchOpen && (
        <div style={{ borderTop: '1px solid var(--bg-border)', padding: '14px 20px', background: 'var(--bg-surface)', boxShadow: 'var(--shadow-md)' }}>
          <form onSubmit={handleSearch} style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 10 }}>
            <input
              className="input-field"
              type="search"
              placeholder="Search viral photos, wallpapers, creative packs, templates..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              autoFocus
              style={{ fontSize: '15px' }}
            />
            <button type="submit" className="btn-primary" style={{ padding: '12px 20px', borderRadius: 12, flexShrink: 0, minHeight: 46 }}>
              <Search size={18} /> Search
            </button>
          </form>
        </div>
      )}

      {/* ── Mobile Hamburger Drawer Menu ── */}
      {menuOpen && (
        <nav
          style={{
            position: 'fixed',
            top: '64px',
            left: 0,
            right: 0,
            bottom: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            padding: '16px 18px 56px',
            display: 'flex',
            flexDirection: 'column',
            gap: 16,
            zIndex: 999,
            overflowY: 'auto',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {/* Quick Access Top Bar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 6px',
                borderRadius: '12px',
                background: wishlistCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#F9FAFB',
                border: wishlistCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #E5E7EB',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <Heart size={20} fill={wishlistCount > 0 ? '#DC2626' : 'none'} color={wishlistCount > 0 ? '#DC2626' : '#4B5563'} />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: wishlistCount > 0 ? '#DC2626' : '#212121', marginTop: 4 }}>
                Wishlist
              </span>
              <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                {wishlistCount > 0 ? `${wishlistCount} items` : '0 saved'}
              </span>
            </Link>

            <Link
              to="/my-orders"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 6px',
                borderRadius: '12px',
                background: ordersCount > 0 ? 'rgba(37, 99, 235, 0.08)' : '#F9FAFB',
                border: ordersCount > 0 ? '1px solid rgba(37, 99, 235, 0.25)' : '1px solid #E5E7EB',
                textDecoration: 'none',
                position: 'relative',
              }}
            >
              <Package size={20} color="#2563EB" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: ordersCount > 0 ? '#1D4ED8' : '#212121', marginTop: 4 }}>
                My Orders
              </span>
              <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                {ordersCount > 0 ? `${ordersCount} saved` : 'My Files'}
              </span>
            </Link>

            <Link
              to="/order-lookup"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '12px 6px',
                borderRadius: '12px',
                background: '#F9FAFB',
                border: '1px solid #E5E7EB',
                textDecoration: 'none',
              }}
            >
              <Package size={20} color="#059669" />
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#212121', marginTop: 4 }}>
                Track Order
              </span>
              <span style={{ fontSize: '0.68rem', color: '#6B7280' }}>
                Instant Access
              </span>
            </Link>
          </div>

          {/* Section 1: Discover & Shop */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>
              DISCOVER & SHOP
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { to: '/', label: 'Home Storefront', icon: <Home size={18} /> },
                { to: '/products', label: 'All Products (Catalog)', icon: <ShoppingBag size={18} /> },
                { to: '/categories', label: 'Browse Categories', icon: <Grid size={18} /> },
                { to: '/products?sort=popular', label: 'Trending & Popular Deals', icon: <Flame size={18} color="#EA580C" /> },
                { to: '/wishlist', label: `My Saved Wishlist (${wishlistCount})`, icon: <Heart size={18} color="#DC2626" /> },
                { to: '/pricing-products', label: 'Pricing & Delivery Info', icon: <Tag size={18} /> },
                { to: '/blog', label: 'Blog & Creator Guides', icon: <BookOpen size={18} /> },
              ].map((item) => {
                const active = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to))
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 12px',
                      borderRadius: 10,
                      background: active ? '#EFF6FF' : 'transparent',
                      color: active ? '#1D4ED8' : '#1F2937',
                      fontWeight: active ? 700 : 600,
                      fontSize: '0.925rem',
                      textDecoration: 'none',
                      transition: 'background 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: active ? '#1D4ED8' : '#6B7280', display: 'flex' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={16} color={active ? '#1D4ED8' : '#9CA3AF'} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Section 2: Customer Care & Info */}
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, paddingLeft: 4 }}>
              CUSTOMER CARE & SUPPORT
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {[
                { to: '/my-orders', label: 'My Orders & Downloads', icon: <Package size={18} /> },
                { to: '/order-lookup', label: 'Order Lookup & File Recovery', icon: <Search size={18} /> },
                { to: '/help', label: 'Help Center & How-To', icon: <CircleHelp size={18} /> },
                { to: '/faq', label: 'Frequently Asked Questions', icon: <CircleHelp size={18} /> },
                { to: '/contact', label: 'Contact Support (24/7)', icon: <MessageSquare size={18} /> },
                { to: '/about', label: 'About 1024 Tera Viral Hub', icon: <Info size={18} /> },
                { to: '/affiliate', label: 'Affiliate Program (Earn 25%)', icon: <Users size={18} /> },
              ].map((item) => {
                const active = location.pathname === item.to
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '11px 12px',
                      borderRadius: 10,
                      background: active ? '#EFF6FF' : 'transparent',
                      color: active ? '#1D4ED8' : '#374151',
                      fontWeight: active ? 700 : 500,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ color: active ? '#1D4ED8' : '#9CA3AF', display: 'flex' }}>
                        {item.icon}
                      </span>
                      <span>{item.label}</span>
                    </div>
                    <ChevronRight size={16} color={active ? '#1D4ED8' : '#D1D5DB'} />
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
            <Link
              to="/products"
              className="btn-primary"
              style={{
                justifyContent: 'center',
                padding: '13px',
                fontSize: '0.95rem',
                fontWeight: 800,
                background: '#FFD200',
                color: '#000000',
                borderRadius: '12px',
                boxShadow: '0 2px 8px rgba(255, 210, 0, 0.45)',
              }}
              onClick={() => setMenuOpen(false)}
            >
              <ShoppingBag size={18} /> Browse Products
            </Link>

            <Link
              to="/wishlist"
              onClick={() => setMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '12px',
                fontSize: '0.9rem',
                fontWeight: 700,
                borderRadius: '12px',
                background: wishlistCount > 0 ? 'rgba(239, 68, 68, 0.08)' : '#F3F4F6',
                border: wishlistCount > 0 ? '1px solid rgba(239, 68, 68, 0.25)' : '1px solid #E5E7EB',
                color: wishlistCount > 0 ? '#DC2626' : '#374151',
                textDecoration: 'none',
              }}
            >
              <Heart size={18} fill={wishlistCount > 0 ? '#DC2626' : 'none'} color={wishlistCount > 0 ? '#DC2626' : '#4B5563'} />
              <span>View Saved Wishlist ({wishlistCount})</span>
            </Link>
          </div>

          {/* Trust Banner */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              fontSize: '0.72rem',
              color: '#6B7280',
              lineHeight: 1.4,
              textAlign: 'center',
              marginTop: 4,
            }}
          >
            ⚡ <strong>Instant Delivery via UPI:</strong> PhonePe, Google Pay, Paytm<br />
            🔒 100% Virus-free direct downloads with verified checkout
          </div>
        </nav>
      )}
    </header>
  )
}
