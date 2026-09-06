import { lazy, type ComponentType } from 'react'

/**
 * Robust lazy import wrapper with auto-retry on stale Vite/Cloudflare chunks.
 * Prevents blank page crashes when navigating back or after new production deployments.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    try {
      const component = await componentImport()
      return component
    } catch (error: any) {
      console.error('[lazyWithRetry] Module failed to load:', error)
      const isChunkError =
        error?.message?.includes('dynamically imported module') ||
        error?.message?.includes('Loading chunk') ||
        error?.message?.includes('Importing a module script failed') ||
        error?.message?.includes('Failed to fetch')

      const reloadKey = 'chunk_reload_attempted_' + window.location.pathname
      const hasReloaded = sessionStorage.getItem(reloadKey)

      if (isChunkError && !hasReloaded) {
        sessionStorage.setItem(reloadKey, 'true')
        window.location.reload()
        return new Promise<{ default: T }>(() => {}) // Hold suspense while reloading
      }

      throw error
    }
  })
}
