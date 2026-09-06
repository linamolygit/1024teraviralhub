// src/client/components/admin/GoogleDrivePreviewCard.tsx — Smart Google Drive Link & Content Preview
import React, { useState } from 'react'
import { ExternalLink, Eye, EyeOff, CheckCircle2, AlertCircle, FileText, Folder, ShieldCheck } from 'lucide-react'

interface GoogleDrivePreviewCardProps {
  link: string
}

export default function GoogleDrivePreviewCard({ link }: GoogleDrivePreviewCardProps) {
  const [showEmbed, setShowEmbed] = useState(false)

  if (!link || !link.trim()) return null

  const trimmedLink = link.trim()
  const isGoogleDrive = trimmedLink.includes('drive.google.com')
  const isMega = trimmedLink.includes('mega.nz')
  const isDropbox = trimmedLink.includes('dropbox.com')
  const isFolder = trimmedLink.includes('/folders/') || trimmedLink.includes('id=') && trimmedLink.includes('folder')

  // Extract file ID from google drive URL (typically 25 to 45 alphanumeric characters with dashes and underscores)
  const fileIdMatch = isGoogleDrive ? trimmedLink.match(/\/d\/([-\w]{25,})/) || trimmedLink.match(/id=([-\w]{25,})/) : null
  const fileId = fileIdMatch ? fileIdMatch[1] : null

  // Embed preview URL for Google Drive files
  const embedUrl = fileId ? `https://drive.google.com/file/d/${fileId}/preview` : null

  return (
    <div
      style={{
        marginTop: 12,
        background: 'var(--bg-elevated, #F8FAFC)',
        border: '1px solid rgba(17, 98, 242, 0.25)',
        borderRadius: '12px',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* ── Top Header of Preview Card ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          {isGoogleDrive ? (
            <img
              src="https://www.gstatic.com/images/branding/productlogos/drive_2026/v1/web-48dp/logo_drive_2026_color_2x_web_48dp.png"
              alt="Google Drive"
              style={{ width: 22, height: 22, objectFit: 'contain' }}
            />
          ) : (
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 4,
                background: '#EF4444',
                color: '#fff',
                fontWeight: 900,
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              M
            </div>
          )}

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.85rem' }}>
              <span>{isGoogleDrive ? (isFolder ? 'Google Drive Folder' : 'Google Drive File') : isMega ? 'MEGA Cloud Link' : isDropbox ? 'Dropbox Link' : 'External Deliverable Link'}</span>
              <span
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
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
                <CheckCircle2 size={10} /> Valid Format
              </span>
            </div>
            {fileId && (
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: 1 }}>
                ID: {fileId.slice(0, 10)}...{fileId.slice(-6)}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons: Test Link & Embed Preview Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {embedUrl && (
            <button
              type="button"
              onClick={() => setShowEmbed(!showEmbed)}
              className="btn-ghost"
              style={{
                fontSize: '0.75rem',
                padding: '5px 10px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: showEmbed ? 'rgba(17,98,242,0.1)' : 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                color: showEmbed ? '#1162F2' : 'var(--text-secondary)',
              }}
            >
              {showEmbed ? <EyeOff size={13} /> : <Eye size={13} />}
              {showEmbed ? 'Hide Preview' : 'Show Live Preview'}
            </button>
          )}

          <a
            href={trimmedLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-ghost"
            style={{
              fontSize: '0.75rem',
              padding: '5px 10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--bg-surface)',
              border: '1px solid var(--bg-border)',
              color: 'var(--text-primary)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            <ExternalLink size={13} /> Test Link
          </a>
        </div>
      </div>

      {/* Truncated Link Preview with Ellipsis */}
      <div
        className="text-truncate"
        style={{
          fontSize: '0.75rem',
          fontFamily: 'monospace',
          color: 'var(--text-muted)',
          background: 'var(--bg-surface)',
          padding: '4px 8px',
          borderRadius: 6,
          border: '1px solid var(--bg-border)',
        }}
        title={trimmedLink}
      >
        {trimmedLink}
      </div>

      {/* ── Collapsible Embedded Preview Player ── */}
      {showEmbed && embedUrl && (
        <div
          style={{
            marginTop: 6,
            borderRadius: 8,
            overflow: 'hidden',
            border: '1px solid var(--bg-border)',
            background: '#000',
            height: 280,
            position: 'relative',
          }}
        >
          <iframe
            src={embedUrl}
            title="Google Drive Asset Live Preview"
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="autoplay"
          />
        </div>
      )}

      {/* ── Customer Delivery Status Note ── */}
      <div
        style={{
          fontSize: '0.72rem',
          color: 'var(--text-secondary)',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'var(--bg-surface)',
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--bg-border)',
        }}
      >
        <ShieldCheck size={14} color="#1162F2" style={{ flexShrink: 0 }} />
        <span>
          Customer payment hone par <strong>instant 1-click access button</strong> unke order/download page par dikhega.
        </span>
      </div>
    </div>
  )
}
