// src/client/components/ThemeProvider.tsx
// Reads admin-controlled theme from public settings and applies it on mount
import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import { useThemeStore } from '../lib/theme-store'

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { applyTheme } = useThemeStore()

  const { data: publicSettings } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => api.settings.getPublic(),
    staleTime: 1000 * 60 * 10,
  })

  useEffect(() => {
    // Priority: 1) Admin DB setting  2) localStorage  3) default light (Flipkart theme)
    const adminTheme = (publicSettings as any)?.site_theme as 'dark' | 'light' | undefined
    const localTheme = (() => {
      try { return localStorage.getItem('tvh-theme') as 'dark' | 'light' | null } catch { return null }
    })()
    const resolved = adminTheme || localTheme || 'light'
    applyTheme(resolved)
  }, [publicSettings, applyTheme])

  // Apply immediately from localStorage while waiting for settings fetch
  useEffect(() => {
    try {
      const saved = localStorage.getItem('tvh-theme') as 'dark' | 'light' | null
      if (saved) applyTheme(saved)
    } catch { /* ignore */ }
  }, [applyTheme])

  return <>{children}</>
}
