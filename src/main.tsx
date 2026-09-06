import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query'
import { adminToast } from './client/lib/admin-toast'
import { initImageShield } from './client/lib/image-shield'
import App from './App'
import './index.css'

// Activate ironclad client-side image theft & inspect protection
initImageShield()

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (error: any, _variables: any, _context: any, mutation: any) => {
      // If the mutation explicitly defines its own onError handler, skip the generic fallback
      if (mutation?.options?.onError) {
        return
      }
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
        const errorMsg = error?.message || 'Operation failed. Please verify your data and try again.'
        adminToast.error('Action Failed', errorMsg)
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000, // 30s freshness prevents continuous refetch thrashing
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false, // Avoid blanking or flashing UI when switching browser tabs
      refetchOnMount: true,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
})

// Handle browser back-forward cache (BFCache) cleanly when user navigates back
window.addEventListener('pageshow', (event) => {
  if (event.persisted) {
    queryClient.invalidateQueries()
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </BrowserRouter>
  </React.StrictMode>
)
