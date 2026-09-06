// src/client/lib/theme-store.ts
// Admin-controlled site theme (dark/light) via Zustand
import { create } from 'zustand'

type Theme = 'dark' | 'light'

interface ThemeState {
  theme: Theme
  setTheme: (theme: Theme) => void
  applyTheme: (theme: Theme) => void
}

function applyThemeToDOM(theme: Theme) {
  const root = document.documentElement
  root.setAttribute('data-theme', theme)
  // Also store in localStorage as user fallback
  try { localStorage.setItem('tvh-theme', theme) } catch { /* ignore */ }
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  setTheme: (theme) => {
    applyThemeToDOM(theme)
    set({ theme })
  },
  applyTheme: (theme) => {
    applyThemeToDOM(theme)
    set({ theme })
  },
}))
