// src/client/components/admin/DeliverableFilePreviewCard.tsx — Live Preview for Product Deliverable File
import React, { useMemo } from 'react'
import { FileArchive, FileText, Video, Layers, Package, X, CheckCircle2, FileCode } from 'lucide-react'

interface DeliverableFilePreviewCardProps {
  file: File | null
  onRemove: () => void
}

export default function DeliverableFilePreviewCard({ file, onRemove }: DeliverableFilePreviewCardProps) {
  if (!file) return null

  const isImage = file.type.startsWith('image/')
  const previewUrl = useMemo(() => (isImage ? URL.createObjectURL(file) : null), [file, isImage])

  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
    return `${(bytes / 1024).toFixed(1)} KB`
  }

  const getFileExtension = (name: string) => {
    const parts = name.split('.')
    return parts.length > 1 ? parts.pop()?.toUpperCase() : 'FILE'
  }

  const ext = getFileExtension(file.name)

  const renderFileIcon = () => {
    if (ext === 'ZIP' || ext === 'RAR' || ext === '7Z' || ext === 'TAR') {
      return (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(124,58,237,0.12)', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileArchive size={24} />
        </div>
      )
    }
    if (ext === 'PDF') {
      return (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <FileText size={24} />
        </div>
      )
    }
    if (ext === 'MP4' || ext === 'MOV' || ext === 'AVI') {
      return (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'rgba(17,98,242,0.12)', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Video size={24} />
        </div>
      )
    }
    if (ext === 'PSD' || ext === 'AI' || ext === 'FIG') {
      return (
        <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, rgba(17,98,242,0.12), rgba(124,58,237,0.12))', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Layers size={24} />
        </div>
      )
    }
    return (
      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, rgba(17,98,242,0.12), rgba(124,58,237,0.12))', color: '#1162F2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Package size={24} />
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: 10,
        background: 'var(--bg-elevated, #F8FAFC)',
        border: '1px solid rgba(17, 98, 242, 0.3)',
        borderRadius: '10px',
        padding: '12px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
        {isImage && previewUrl ? (
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 8,
              overflow: 'hidden',
              flexShrink: 0,
              border: '1px solid var(--bg-border)',
              background: '#000',
            }}
          >
            <img
              src={previewUrl}
              alt={file.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ) : (
          renderFileIcon()
        )}

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <span
              style={{
                fontSize: '0.68rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                padding: '1px 6px',
                borderRadius: 4,
                background: 'linear-gradient(135deg, rgba(17, 98, 242, 0.12), rgba(124, 58, 237, 0.12))',
                border: '1px solid rgba(17, 98, 242, 0.25)',
                color: '#1162F2',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 3,
              }}
            >
              <CheckCircle2 size={10} /> Ready to Upload ({ext})
            </span>
          </div>

          <div
            className="text-truncate"
            style={{
              fontWeight: 700,
              fontSize: '0.825rem',
              color: 'var(--text-primary)',
              maxWidth: 240,
            }}
            title={file.name}
          >
            {file.name}
          </div>

          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            File Size: <strong>{formatFileSize(file.size)}</strong>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onRemove}
        className="btn-ghost"
        style={{
          color: '#EF4444',
          padding: '6px 8px',
          fontSize: '0.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          flexShrink: 0,
        }}
        title="Remove this deliverable file"
      >
        <X size={14} /> Remove
      </button>
    </div>
  )
}
