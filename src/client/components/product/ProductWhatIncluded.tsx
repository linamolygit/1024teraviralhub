// src/client/components/product/ProductWhatIncluded.tsx — Production Tabbed Product Information Section
import { useState } from 'react'
import { FileText, Package, ShieldCheck, Download, CheckCircle2 } from 'lucide-react'
import type { ProductDetail } from '../../lib/api'
import { formatFileSize } from '../../lib/utils'

interface Props {
  product: ProductDetail
}

type TabKey = 'overview' | 'included' | 'license' | 'download'

export default function ProductWhatIncluded({ product }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  const tabs: { id: TabKey; label: string; icon: typeof FileText }[] = [
    { id: 'overview', label: 'Overview', icon: FileText },
    { id: 'included', label: "What's Included", icon: Package },
    { id: 'license', label: 'License', icon: ShieldCheck },
    { id: 'download', label: 'Download Information', icon: Download },
  ]

  return (
    <div
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--bg-border)',
        borderRadius: '24px',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-sm)',
        margin: '40px 0px',
      }}
    >
      {/* ── Tabs Navigation Header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--bg-border)',
          padding: '0px 24px',
          overflowX: 'auto',
          scrollbarWidth: 'none',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '18px 16px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid rgb(17, 98, 242)' : '3px solid transparent',
                color: isActive ? 'rgb(17, 98, 242)' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: '0.15s',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* ── Content Grid (Left: Active Tab Content, Right: How Your Download Works) ── */}
      <div
        style={{
          padding: '36px 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '40px',
          alignItems: 'start',
        }}
      >
        {/* Left Column: Tab Specific Content */}
        <div>
          <div style={{ opacity: 1, transform: 'none' }}>
            {activeTab === 'overview' && (
              <div>
                <h3
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  Overview
                </h3>
                <p
                  style={{
                    fontSize: '0.925rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.68,
                    marginBottom: '14px',
                  }}
                >
                  <strong style={{ color: 'var(--text-primary)' }}>{product.title} </strong> is a handpicked collection of stunning, high-resolution images perfect for digital creators, designers, marketers, and content producers.
                </p>
                {product.description && (
                  <p
                    style={{
                      fontSize: '0.925rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.68,
                      marginBottom: '24px',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {product.description}
                  </p>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Curated by professional designers
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      High-resolution and print-ready
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Perfect for personal &amp; commercial projects
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Instant digital access after purchase
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'included' && (
              <div>
                <h3
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  What's Included
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      {product.file_count && product.file_count > 1
                        ? `${product.file_count} High-Quality Digital Visuals (Ultra HD)`
                        : 'High-Quality Digital Visuals (Ultra HD)'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Full Resolution {product.file_type ? product.file_type.toUpperCase() : 'JPEG / PNG'} files {product.total_file_size ? `(~${formatFileSize(product.total_file_size)})` : ''}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Instant direct download link
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={17} color="#111827" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
                      Lifetime personal usage rights
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'license' && (
              <div>
                <h3
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  License &amp; Usage
                </h3>
                <p
                  style={{
                    fontSize: '0.925rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    marginBottom: '16px',
                  }}
                >
                  {product.license_info || 'This purchase grants you a standard royalty-free license for personal and creative commercial projects.'}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Allowed: Social media posts, websites, video backgrounds, wallpapers, ads
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle2 size={16} color="#EF4444" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                      Not Allowed: Reselling or redistributing raw files as standalone stock
                    </span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'download' && (
              <div>
                <h3
                  style={{
                    fontFamily: 'Manrope, Inter, sans-serif',
                    fontWeight: 800,
                    fontSize: '1.25rem',
                    color: 'var(--text-primary)',
                    marginBottom: '16px',
                  }}
                >
                  Download Information
                </h3>
                <p
                  style={{
                    fontSize: '0.925rem',
                    color: 'var(--text-secondary)',
                    lineHeight: 1.65,
                    marginBottom: '16px',
                  }}
                >
                  Files are delivered instantly upon completed payment verification. You will receive a direct 1-click download button and a copy sent to your email.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Delivery Method:</strong> Instant Digital Download
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>Access Duration:</strong> {product.access_duration_hours || 12} Hours from purchase
                  </div>
                  <div>
                    <strong style={{ color: 'var(--text-primary)' }}>File Format:</strong> {product.file_type ? product.file_type.toUpperCase() : 'IMAGE'} / ZIP Archive
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: "How Your Download Works" Card */}
        <div
          style={{
            background: '#F9FAFB',
            border: '1px solid #E5E7EB',
            borderRadius: '20px',
            padding: '28px 24px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '22px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '10px',
                background: 'rgb(255, 255, 255)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'rgba(0, 0, 0, 0.08) 0px 2px 6px',
                border: '1px solid #E5E7EB',
                flexShrink: 0,
              }}
            >
              <Download size={18} color="#111827" />
            </div>
            <h4
              style={{
                fontFamily: 'Manrope, Inter, sans-serif',
                fontWeight: 800,
                fontSize: '1.05rem',
                color: 'rgb(17, 24, 39)',
                margin: '0px',
              }}
            >
              How Your Download Works
            </h4>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgb(255, 255, 255)',
                  color: '#111827',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'rgba(0, 0, 0, 0.06) 0px 2px 5px',
                  border: '1px solid #E5E7EB',
                }}
              >
                01
              </span>
              <p style={{ fontSize: '0.85rem', color: 'rgb(55, 65, 81)', lineHeight: 1.45, margin: '0px', fontWeight: 500, paddingTop: '3px' }}>
                Complete your secure payment.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgb(255, 255, 255)',
                  color: '#111827',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'rgba(0, 0, 0, 0.06) 0px 2px 5px',
                  border: '1px solid #E5E7EB',
                }}
              >
                02
              </span>
              <p style={{ fontSize: '0.85rem', color: 'rgb(55, 65, 81)', lineHeight: 1.45, margin: '0px', fontWeight: 500, paddingTop: '3px' }}>
                Payment is verified.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgb(255, 255, 255)',
                  color: '#111827',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'rgba(0, 0, 0, 0.06) 0px 2px 5px',
                  border: '1px solid #E5E7EB',
                }}
              >
                03
              </span>
              <p style={{ fontSize: '0.85rem', color: 'rgb(55, 65, 81)', lineHeight: 1.45, margin: '0px', fontWeight: 500, paddingTop: '3px' }}>
                Download access is unlocked.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <span
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: 'rgb(255, 255, 255)',
                  color: '#111827',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  boxShadow: 'rgba(0, 0, 0, 0.06) 0px 2px 5px',
                  border: '1px solid #E5E7EB',
                }}
              >
                04
              </span>
              <p style={{ fontSize: '0.85rem', color: 'rgb(55, 65, 81)', lineHeight: 1.45, margin: '0px', fontWeight: 500, paddingTop: '3px' }}>
                Your secure download access remains available for {product.access_duration_hours || 12} hours.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
