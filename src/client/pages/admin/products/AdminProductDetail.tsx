// src/client/pages/admin/products/AdminProductDetail.tsx — Dedicated Product Detail & Performance Overview
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Edit, Eye, EyeOff, ExternalLink, Package,
  DollarSign, ShoppingCart, Download, Clock, ShieldCheck, Tag
} from 'lucide-react'
import { adminApi, type ProductFile, type ProductImage } from '../../../lib/api'
import { useAuthStore } from '../../../lib/auth-store'
import { formatPrice, formatDate, formatFileSize } from '../../../lib/utils'
import LoadingSpinner from '../../../components/ui/LoadingSpinner'
import OptimizedImage from '../../../components/ui/OptimizedImage'

export default function AdminProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { getToken } = useAuthStore()
  const queryClient = useQueryClient()

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-product-detail', id],
    queryFn: async () => {
      const token = await getToken()
      return adminApi.products.get(token!, parseInt(id!))
    },
    enabled: Boolean(id),
  })

  const togglePublish = useMutation({
    mutationFn: async (currentPublished: boolean) => {
      const token = await getToken()
      return adminApi.products.update(token!, parseInt(id!), { is_published: !currentPublished })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-product-detail', id] })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })

  if (isLoading) return <LoadingSpinner />
  if (isError || !data?.product) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: 8 }}>Product Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
          The requested product does not exist or has been removed.
        </p>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="btn-primary"
          style={{ padding: '8px 18px', fontSize: '0.85rem' }}
        >
          ← Back to Products
        </button>
      </div>
    )
  }

  const p = data.product
  const images: ProductImage[] = data.images || []
  const files: ProductFile[] = data.files || []

  let parsedTags: string[] = []
  if (Array.isArray(p.tags)) {
    parsedTags = p.tags
  } else if (typeof p.tags === 'string') {
    try {
      parsedTags = JSON.parse(p.tags)
    } catch {
      parsedTags = [p.tags]
    }
  }

  const isPublished = p.is_published === 1 || p.is_published === true

  return (
    <div>
      {/* ── Top Header ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => navigate('/admin/products')}
          className="btn-ghost"
          style={{ padding: '8px 12px', display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.8125rem' }}
        >
          <ArrowLeft size={16} /> Back to Products
        </button>

        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
            {p.title}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', margin: '2px 0 0', fontFamily: 'monospace' }}>
            /{p.slug}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => togglePublish.mutate(isPublished)}
            disabled={togglePublish.isPending}
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '8px 14px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            {isPublished ? (
              <>
                <EyeOff size={14} /> Unpublish
              </>
            ) : (
              <>
                <Eye size={14} /> Publish
              </>
            )}
          </button>

          <Link
            to={`/product/${p.slug}`}
            target="_blank"
            className="btn-ghost"
            style={{ fontSize: '0.8125rem', padding: '8px 14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <ExternalLink size={14} /> View Live
          </Link>

          <Link
            to={`/admin/products/${p.id}/edit`}
            className="btn-primary"
            style={{ fontSize: '0.8125rem', padding: '8px 16px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <Edit size={14} /> Edit Product
          </Link>
        </div>
      </div>

      {/* ── KPI Performance Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14,
          marginBottom: 24,
        }}
      >
        <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Price</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-amber)' }}>
            {formatPrice(p.sale_price ?? p.price)}
          </div>
          {p.sale_price && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
              Original: {formatPrice(p.price)}
            </div>
          )}
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Units Sold</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--text-primary)' }}>
            {p.total_sales ?? 0}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Verified purchases</div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Total Revenue</div>
          <div style={{ fontSize: '1.35rem', fontWeight: 900, color: 'var(--brand-amber)' }}>
            {formatPrice(p.total_revenue ?? (p.total_sales ?? 0) * (p.sale_price ?? p.price))}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Gross product earnings</div>
        </div>

        <div className="glass-card" style={{ padding: '16px 20px', borderRadius: 'var(--radius-lg)' }}>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8125rem', marginBottom: 4 }}>Status</div>
          <div style={{ marginTop: 6 }}>
            <span className={`badge ${isPublished ? 'badge-success' : 'badge-amber'}`} style={{ fontSize: '0.8125rem' }}>
              {isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
      </div>

      {/* ── 2-Column Info Grid ── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 20,
          marginBottom: 24,
        }}
      >
        {/* Left: Product Information */}
        <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Product Information</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {p.short_description && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Short Description</div>
                <div style={{ fontSize: '0.875rem', lineHeight: 1.6 }}>{p.short_description}</div>
              </div>
            )}

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>Full Description</div>
              <div style={{ fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{p.description}</div>
            </div>

            {parsedTags.length > 0 && (
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6 }}>Tags</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {parsedTags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: '4px 10px',
                        background: 'var(--bg-elevated)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Media & Digital Deliverable Files */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Images */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>Preview Media ({images.length})</h3>
            {images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 10 }}>
                {images.map((img) => (
                  <div
                    key={img.id}
                    style={{
                      aspectRatio: '1',
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      border: '1px solid var(--bg-border)',
                      background: 'var(--bg-elevated)',
                    }}
                  >
                    <OptimizedImage
                      src={`/api/images/${encodeURIComponent(img.r2_key)}`}
                      alt={img.alt_text || 'Preview'}
                      variant="thumbnail"
                      aspectRatio="1/1"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No preview images uploaded.</div>
            )}
          </div>

          {/* Protected Product Files */}
          <div className="glass-card" style={{ padding: '24px', borderRadius: 'var(--radius-lg)' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 16 }}>
              Protected Deliverable Files ({files.length})
            </h3>
            {files.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {files.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      padding: '10px 14px',
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.85rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Package size={16} color="var(--brand-purple-light)" />
                      <span style={{ fontWeight: 600 }}>{file.original_filename}</span>
                    </div>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      {file.file_size ? formatFileSize(file.file_size) : 'Deliverable'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No private product files attached yet.
              </div>
            )}

            {/* Google Drive Link if present */}
            {p.google_drive_link && (
              <div
                style={{
                  marginTop: 12,
                  padding: '12px 14px',
                  background: 'rgba(66,133,244,0.08)',
                  border: '1px solid rgba(66,133,244,0.25)',
                  borderRadius: 'var(--radius-md)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <img
                  src="https://www.gstatic.com/images/branding/productlogos/drive_2026/v1/web-48dp/logo_drive_2026_color_2x_web_48dp.png"
                  alt="Google Drive"
                  style={{ width: 22, height: 22, objectFit: 'contain' }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.8125rem' }}>External Google Drive / Cloud Link</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.google_drive_link}
                  </div>
                </div>
                <a
                  href={p.google_drive_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-ghost"
                  style={{ fontSize: '0.75rem', padding: '4px 8px', textDecoration: 'none' }}
                >
                  <ExternalLink size={13} />
                </a>
              </div>
            )}

            <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              🔒 Protected files are stored in private Cloudflare R2 storage / Google Drive and delivered via authenticated 12-hour customer sessions.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
