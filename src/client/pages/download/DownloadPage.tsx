// src/client/pages/download/DownloadPage.tsx — 12-Hour Secure Download
import { useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download, Clock, Shield, FileText, AlertTriangle, CheckCircle, Headphones, ShieldCheck, Package } from 'lucide-react'
import { api, type DownloadFile } from '../../lib/api'
import { formatFileSize, timeRemaining } from '../../lib/utils'
import { saveOrderSession } from '../../lib/orderSession'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function DownloadPage() {
  const { token } = useParams<{ token: string }>()

  const { data, isLoading } = useQuery({
    queryKey: ['download', token],
    queryFn: () => api.download.verify(token!),
    enabled: !!token,
    refetchInterval: false,
    retry: 1,
  })

  // Auto-save verified order to browser cookie and localStorage session
  useEffect(() => {
    if (data?.valid && token) {
      saveOrderSession({
        orderNumber: data.order?.order_number || '',
        token,
        productTitle: data.files?.[0]?.product || undefined,
        amount: data.order?.amount,
        createdAt: Date.now(),
      })
    }
  }, [data, token])

  if (isLoading) return <LoadingSpinner fullPage />

  // Token invalid / expired / already used
  if (!data?.valid) {
    return (
      <div style={{
        minHeight: '100dvh', background: 'var(--bg-base)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ maxWidth: 460, width: '100%', textAlign: 'center' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(245,158,11,0.15)', border: '2px solid rgba(245,158,11,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px',
          }}>
            <AlertTriangle size={36} color="var(--brand-amber)" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 12 }}>
            {data?.reason === 'Download link expired' ? 'Download Link Expired' :
             data?.reason === 'Download limit reached' ? 'Download Limit Reached' :
             'Access Denied'}
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: 28, lineHeight: 1.7 }}>
            {data?.reason ?? 'This download link is no longer valid.'}
            {data?.reason === 'Download link expired' && ' Your 12-hour access window has passed.'}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link to="/order-lookup" className="btn-primary">Look Up My Order</Link>
            <Link to="/contact" className="btn-ghost" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Contact Support</Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const timeLeft = data.expires_at ? timeRemaining(data.expires_at) : null
  const isExpiringSoon = data.expires_at && (new Date(data.expires_at).getTime() - Date.now()) < 60 * 60 * 1000 // < 1 hour

  return (
    <div style={{
      minHeight: '100dvh', background: 'var(--bg-base)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 20px',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ maxWidth: 580, width: '100%' }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%',
            background: '#F1F3F6', border: '2px solid #E0E0E0',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Download size={32} color="#111827" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Your Download is Ready!</h1>
          <p style={{ color: 'var(--text-muted)' }}>
            {data.order ? `Order for ${data.order.customer_name}` : 'Verified Purchase'}
          </p>
        </div>

        {/* Access Timer */}
        <div style={{
          display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap',
        }}>
          <div className={`alert ${isExpiringSoon ? 'alert-warning' : 'alert-info'}`} style={{ flex: 1, justifyContent: 'center' }}>
            <Clock size={14} /> {timeLeft}
          </div>
          <div className="alert alert-success" style={{ flex: 1, justifyContent: 'center' }}>
            <CheckCircle size={14} /> {data.remaining_downloads}/{data.max_downloads} downloads left
          </div>
        </div>

        {/* Files & Google Drive Deliverables */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 32 }}>
          {/* Google Drive Master Link if configured */}
          {data.google_drive_link && (
            <motion.div
              whileHover={{ scale: 1.01 }}
              style={{
                background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.12), rgba(15, 157, 88, 0.12))',
                border: '1px solid rgba(66, 133, 244, 0.35)',
                borderRadius: 'var(--radius-lg)',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 10,
                  background: '#ffffff',
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                }}
              >
                <img
                  src="https://www.gstatic.com/images/branding/productlogos/drive_2026/v1/web-48dp/logo_drive_2026_color_2x_web_48dp.png"
                  alt="Google Drive"
                  style={{ width: 28, height: 28, objectFit: 'contain' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', marginBottom: 4, color: 'var(--text-primary)' }}>
                  Google Drive Digital Master Bundle
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Instant 1-Click Direct Cloud Download
                </div>
              </div>
              <a
                href={data.google_drive_link}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{
                  padding: '10px 18px',
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  flexShrink: 0,
                  background: 'linear-gradient(135deg, #1A73E8, #0F9D58)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Download size={16} /> Open Drive
              </a>
            </motion.div>
          )}

          {data.files?.map((file: DownloadFile) => (
            <motion.div
              key={file.id}
              whileHover={{ scale: 1.01 }}
              style={{
                background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
                borderRadius: 'var(--radius-lg)', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 10,
                background: '#F1F3F6', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <FileText size={22} color="#111827" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9375rem', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {file.filename}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {file.size ? formatFileSize(file.size) : 'Digital file'} · {file.type ?? 'Download'}
                </div>
              </div>
              <a
                href={file.download_url}
                download={file.filename}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.875rem', textDecoration: 'none', flexShrink: 0 }}
              >
                <Download size={16} /> Download
              </a>
            </motion.div>
          ))}
        </div>

        {/* 🛡️ Direct Resolution & 100% Anti-Dispute Support Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.05))',
            border: '1.5px solid rgba(16, 185, 129, 0.35)',
            borderRadius: 'var(--radius-lg)',
            padding: '20px 22px',
            textAlign: 'left',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <ShieldCheck size={20} color="#10B981" />
            <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              100% Direct Resolution & Support Guarantee
            </span>
          </div>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', margin: '0 0 14px', lineHeight: 1.55 }}>
            Having trouble opening your download link or saving files? <strong>No need to file a dispute with your bank or UPI app</strong> — our direct support team will resolve your issue within 2 minutes or provide an immediate 100% full refund!
          </p>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              to={`/contact?order=${encodeURIComponent(data.order?.order_number || '')}&type=download`}
              style={{
                flex: 1,
                minWidth: '200px',
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#111827',
                color: '#FFFFFF',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <Headphones size={16} /> Instant Support / Complaint Desk
            </Link>
            <Link
              to="/my-orders"
              style={{
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: 'var(--brand-purple)',
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              <Package size={16} /> My Orders
            </Link>
            <Link
              to="/order-lookup"
              style={{
                padding: '10px 16px',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                color: 'var(--text-primary)',
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                borderRadius: '8px',
                textDecoration: 'none',
              }}
            >
              Order Lookup
            </Link>
          </div>
        </div>

        {/* Security Notice */}
        <div style={{
          background: 'var(--bg-surface)', border: '1px solid var(--bg-border)',
          borderRadius: 'var(--radius-md)', padding: '16px 20px',
          display: 'flex', gap: 12, alignItems: 'flex-start',
        }}>
          <Shield size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--text-secondary)' }}>Secure Download</strong><br />
            This page is unique to your purchase. Please download your files before the link expires.
            Save your order number <strong style={{ color: 'var(--text-primary)' }}>{data.order?.order_number}</strong> for future reference.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
          <Link to="/products" className="btn-ghost" style={{ fontSize: '0.875rem' }}>Browse More Products</Link>
          <Link to="/help" className="btn-ghost" style={{ fontSize: '0.875rem' }}>Need Help?</Link>
        </div>
      </motion.div>
    </div>
  )
}
