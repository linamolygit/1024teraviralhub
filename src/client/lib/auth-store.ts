// ============================================
// src/client/lib/auth-store.ts — Robust Zustand Auth Store
// ============================================

import { create } from 'zustand'
import { auth } from './firebase'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  type User,
} from 'firebase/auth'

const ADMIN_STORAGE_KEY = 'tvh_admin_logged_in'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getToken: (forceRefresh?: boolean) => Promise<string | null>
  initialize: () => void
}

let authListenerAttached = false

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,

  initialize: () => {
    if (authListenerAttached) return
    authListenerAttached = true

    // Always reinforce browserLocalPersistence across tabs
    if (typeof window !== 'undefined') {
      setPersistence(auth, browserLocalPersistence).catch(() => {})
    }

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          if (typeof window !== 'undefined') {
            localStorage.setItem(ADMIN_STORAGE_KEY, '1')
          }
          // Use cached token if valid, avoids blocking network calls
          const token = await user.getIdToken(false)
          set({ user, token, initialized: true })
        } catch {
          try {
            // Force refresh if cached token lookup fails
            const freshToken = await user.getIdToken(true)
            set({ user, token: freshToken, initialized: true })
          } catch {
            set({ user, initialized: true })
          }
        }
      } else {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(ADMIN_STORAGE_KEY)
        }
        set({ user: null, token: null, initialized: true })
      }
    })
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      if (typeof window !== 'undefined') {
        await setPersistence(auth, browserLocalPersistence)
      }
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const token = await cred.user.getIdToken(true)
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_STORAGE_KEY, '1')
      }
      set({ user: cred.user, token, loading: false, initialized: true })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  signOut: async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_STORAGE_KEY)
    }
    await firebaseSignOut(auth)
    set({ user: null, token: null })
  },

  getToken: async (forceRefresh = false) => {
    let user = get().user
    if (!user && auth.currentUser) {
      user = auth.currentUser
      set({ user })
    }
    if (!user) return null
    try {
      // getIdToken(false) uses memory-cached token (instant 0ms), only refreshes when expired.
      // If forceRefresh is requested, contacts Firebase STS directly.
      const token = await user.getIdToken(forceRefresh)
      set({ token })
      return token
    } catch {
      // If regular token lookup fails, attempt force refresh to get a brand new valid token
      try {
        const freshToken = await user.getIdToken(true)
        set({ token: freshToken })
        return freshToken
      } catch {
        return get().token || null
      }
    }
  },
}))

// Auto-initialize immediately in browser environment so session is restored
// in parallel before components evaluate route guards
if (typeof window !== 'undefined') {
  useAuthStore.getState().initialize()
}
