// src/client/components/blog/ArticleShareBar.tsx — Social & Link Sharing Actions
import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  title: string
}

export default function ArticleShareBar({ title }: Props) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        })
        return
      } catch {
        // Fallback to clipboard copy
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // Fallback
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <button
        type="button"
        onClick={handleShare}
        className="btn-ghost"
        style={{
          padding: '6px 14px',
          fontSize: '0.8125rem',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          borderRadius: 'var(--radius-full)',
        }}
        aria-label="Share article"
      >
        {copied ? (
          <>
            <Check size={14} color="var(--success)" />
            <span style={{ color: 'var(--success)', fontWeight: 700 }}>Link Copied!</span>
          </>
        ) : (
          <>
            <Share2 size={14} />
            <span>Share</span>
          </>
        )}
      </button>
    </div>
  )
}
