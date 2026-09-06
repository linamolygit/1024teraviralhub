// src/client/components/ErrorBoundary.tsx — Production Error Boundary with Auto-Chunk Recovery
import React, { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    error: null,
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)

    // Check if error is due to stale Vite chunks after a new deployment
    const isChunkError =
      error.message.includes('dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Importing a module script failed') ||
      error.message.includes('Failed to fetch')

    if (isChunkError) {
      const hasReloaded = sessionStorage.getItem('chunk_reload_attempted')
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload_attempted', 'true')
        window.location.reload()
      }
    }
  }

  handleReset = () => {
    sessionStorage.removeItem('chunk_reload_attempted')
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div
          style={{
            minHeight: '70vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            textAlign: 'center',
            background: 'var(--bg-base)',
          }}
        >
          <div
            style={{
              maxWidth: 480,
              width: '100%',
              padding: '36px 28px',
              borderRadius: '16px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '12px',
                background: 'rgba(239, 68, 68, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={26} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#111827', marginBottom: 8 }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#6B7280', lineHeight: 1.5, marginBottom: 24 }}>
              An unexpected navigation or rendering error occurred. Refreshing the page usually resolves this immediately.
            </p>

            <div style={{ display: 'flex', gap: 12, width: '100%', justifyContent: 'center' }}>
              <button
                onClick={this.handleReset}
                className="btn-primary"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <RefreshCw size={16} /> Reload Page
              </button>
              <a
                href="/"
                className="btn-ghost"
                style={{
                  padding: '10px 20px',
                  fontSize: '0.875rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  textDecoration: 'none',
                }}
              >
                <Home size={16} /> Go Home
              </a>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
