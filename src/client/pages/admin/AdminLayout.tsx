// src/client/pages/admin/AdminLayout.tsx — Modern SaaS Command Center Layout
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom'
import { useState, Suspense } from 'react'
import ErrorBoundary from '../../components/ErrorBoundary'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import {
  LayoutDashboard, Package, ShoppingCart, BarChart3,
  FileText, Settings, Download, Shield, LogOut,
  Menu, X, Package2, Tag, Star, Users, Share2, Layers,
  ExternalLink, Plus, Sparkles, ChevronRight, CheckCircle2
} from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { useSiteConfig } from '../../lib/site-config'
import AppleGlassToastContainer from '../../components/admin/AppleGlassToast'

interface NavGroup {
  title: string
  items: {
    to: string
    label: string
    icon: React.ReactNode
    end?: boolean
    badge?: string
  }[]
}

const navGroups: NavGroup[] = [
  {
    title: 'CORE COMMERCE',
    items: [
      { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} />, end: true },
      { to: '/admin/products', label: 'Products', icon: <Package size={18} /> },
      { to: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
      { to: '/admin/customers', label: 'Customers', icon: <Users size={18} /> },
    ],
  },
  {
    title: 'GROWTH & MARKETING',
    items: [
      { to: '/admin/coupons', label: 'Coupons & Discounts', icon: <Tag size={18} /> },
      { to: '/admin/reviews', label: 'Customer Reviews', icon: <Star size={18} /> },
      { to: '/admin/affiliates', label: 'Affiliate Program', icon: <Share2 size={18} /> },
      { to: '/admin/adsmanager', label: 'Ads Manager', icon: <Layers size={18} /> },
    ],
  },
  {
    title: 'CONTENT & ASSETS',
    items: [
      { to: '/admin/blog', label: 'Blog & Articles', icon: <FileText size={18} /> },
      { to: '/admin/downloads', label: 'Download Deliveries', icon: <Download size={18} /> },
      { to: '/admin/analytics', label: 'Business Analytics', icon: <BarChart3 size={18} /> },
    ],
  },
  {
    title: 'CONFIGURATION',
    items: [
      { to: '/admin/settings', label: 'Settings & AI', icon: <Settings size={18} />, badge: 'AI' },
      { to: '/admin/users', label: 'Staff & Roles', icon: <Shield size={18} /> },
      { to: '/admin/audit-logs', label: 'Security Audit Logs', icon: <Shield size={18} /> },
    ],
  },
]

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, signOut } = useAuthStore()
  const { siteName } = useSiteConfig()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/admin/login')
  }

  const navStyle = (isActive: boolean) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '9px 14px',
    borderRadius: 8,
    cursor: 'pointer',
    color: isActive ? '#000000' : 'var(--text-secondary)',
    background: isActive ? '#FFD200' : 'transparent',
    fontWeight: isActive ? 700 : 500,
    fontSize: '0.85rem',
    transition: 'all 0.15s ease',
    textDecoration: 'none',
    boxShadow: isActive ? '0 2px 6px rgba(255, 210, 0, 0.3)' : 'none',
  })

  const sidebar = (
    <aside
      className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 260,
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--bg-border)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          padding: '18px 16px',
          borderBottom: '1px solid var(--bg-border)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: 'linear-gradient(180deg, rgba(255,210,0,0.08) 0%, transparent 100%)',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#FFD200',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(255,210,0,0.4)',
            color: '#000000',
            fontWeight: 800,
          }}
        >
          <Package2 size={20} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: '0.92rem', letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
            Admin Center
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {siteName}
          </div>
        </div>
        <button
          onClick={() => setSidebarOpen(false)}
          className="hide-desktop"
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 4 }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Groups */}
      <div
        style={{
          padding: '14px 10px',
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {navGroups.map((group) => (
          <div key={group.title}>
            <div
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                color: 'var(--text-muted)',
                letterSpacing: '0.08em',
                padding: '0 12px 6px',
                textTransform: 'uppercase',
              }}
            >
              {group.title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  style={({ isActive }) => navStyle(isActive)}
                  onClick={() => setSidebarOpen(false)}
                >
                  <span style={{ display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.label}
                  </span>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '0.65rem',
                        fontWeight: 800,
                        padding: '1px 6px',
                        borderRadius: 999,
                        background: 'linear-gradient(135deg, #1162f2, #7c3aed)',
                        color: '#FFFFFF',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div
        style={{
          padding: '14px 16px',
          borderTop: '1px solid var(--bg-border)',
          background: 'var(--bg-elevated)',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: '50%',
              background: '#111827',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 800,
            }}
          >
            {user?.email?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email || 'Admin'}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#1162F2', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'linear-gradient(135deg, #1162f2, #7c3aed)', display: 'inline-block' }} />
              Super Admin
            </div>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: 'none',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            color: '#EF4444',
            cursor: 'pointer',
            fontSize: '0.78rem',
            fontWeight: 700,
            padding: '7px 10px',
            borderRadius: 6,
            width: '100%',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
        >
          <LogOut size={14} /> Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <div className="admin-layout-root" style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg-primary)' }}>
      {sidebar}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="hide-desktop"
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 49 }}
        />
      )}

      {/* Main Content Area */}
      <div className="admin-main" style={{ flex: 1, minWidth: 0, marginLeft: 0, display: 'flex', flexDirection: 'column' }}>
        {/* Top Header Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--bg-border)',
            padding: '0 24px',
            height: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              className="hide-desktop"
              onClick={() => setSidebarOpen(true)}
              style={{
                background: '#F1F3F6',
                border: 'none',
                color: '#212121',
                borderRadius: 8,
                padding: 8,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              aria-label="Open navigation menu"
            >
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.12), rgba(124, 58, 237, 0.12))',
                  border: '1px solid rgba(17, 98, 242, 0.28)',
                  color: '#1162F2',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <CheckCircle2 size={12} /> System Online
              </span>
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Live Store */}
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                background: 'var(--bg-surface)',
                textDecoration: 'none',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#111827'
                e.currentTarget.style.borderColor = '#CBD5E1'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'var(--text-secondary)'
                e.currentTarget.style.borderColor = 'var(--bg-border)'
              }}
            >
              <ExternalLink size={14} />
              <span className="hide-mobile">View Live Store</span>
            </a>

            {/* Quick Add Product */}
            <Link
              to="/admin/products/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                fontSize: '0.8125rem',
                fontWeight: 800,
                color: '#000000',
                background: '#FFD200',
                borderRadius: 8,
                textDecoration: 'none',
                boxShadow: '0 2px 6px rgba(255, 210, 0, 0.4)',
                transition: 'transform 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
            >
              <Plus size={15} />
              <span>Add Product</span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main style={{ padding: '28px 24px 60px', flex: 1 }}>
          <ErrorBoundary>
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '50vh',
                    gap: 14,
                  }}
                >
                  <LoadingSpinner />
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Loading section...
                  </span>
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>

      {/* Global Apple Frosted Glass Toast Container (Bottom Center) */}
      <AppleGlassToastContainer />
    </div>
  )
}

