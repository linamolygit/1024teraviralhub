// src/client/components/blog/ArticleSearch.tsx — Real Blog & Article Search Input
import { useState, useEffect } from 'react'
import { Search, X } from 'lucide-react'

interface Props {
  initialValue: string
  onSearch: (query: string) => void
}

export default function ArticleSearch({ initialValue, onSearch }: Props) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== initialValue) {
        onSearch(value.trim())
      }
    }, 400)

    return () => clearTimeout(timer)
  }, [value, initialValue, onSearch])

  const handleClear = () => {
    setValue('')
    onSearch('')
  }

  return (
    <div
      style={{
        position: 'relative',
        maxWidth: '460px',
        margin: '0 auto 28px',
        width: '100%',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: '14px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Search size={16} />
      </div>

      <input
        type="text"
        className="input-field"
        placeholder="Search articles..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        style={{
          paddingLeft: '40px',
          paddingRight: value ? '38px' : '14px',
          borderRadius: 'var(--radius-full)',
          background: 'var(--bg-surface)',
          border: '1px solid var(--bg-border)',
          fontSize: '0.875rem',
        }}
        aria-label="Search articles"
      />

      {value && (
        <button
          type="button"
          onClick={handleClear}
          style={{
            position: 'absolute',
            right: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
    </div>
  )
}
