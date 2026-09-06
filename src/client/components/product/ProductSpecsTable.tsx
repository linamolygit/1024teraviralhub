// src/client/components/product/ProductSpecsTable.tsx — Technical Specifications & File Details
import type { ProductDetail } from '../../lib/api'
import { formatFileSize } from '../../lib/utils'

interface Props {
  product: ProductDetail
}

export default function ProductSpecsTable({ product }: Props) {
  const specs = [
    { label: 'Product Type', value: product.file_type ? `${product.file_type.toUpperCase()} Digital Asset` : 'Digital Download' },
    { label: 'File Count', value: `${product.file_count} File${product.file_count > 1 ? 's' : ''}` },
    { label: 'Total File Size', value: product.total_file_size ? formatFileSize(product.total_file_size) : null },
    { label: 'License Type', value: product.license_type === 'commercial' ? 'Commercial & Personal Use' : 'Personal Use Only' },
    { label: 'Delivery Method', value: 'Instant Secure Link (Cloudflare Edge)' },
    { label: 'Access Validity', value: `${product.access_duration_hours} Hours` },
    { label: 'Download Attempts', value: `${product.download_limit} Max Downloads` },
  ].filter((s) => s.value !== null)

  return (
    <div
      className="glass-card"
      style={{
        padding: '24px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        marginBottom: '28px',
      }}
    >
      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Technical Specifications
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '14px',
        }}
      >
        {specs.map((s) => (
          <div
            key={s.label}
            style={{
              padding: '12px 14px',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--bg-border)',
            }}
          >
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {s.label}
            </div>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
              {s.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
