// ============================================
// src/client/lib/auth-store.ts — Robust Zustand Auth Store
// ============================================

import { create } from 'zustand'
import { auth } from './firebase'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User,
} from 'firebase/auth'

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  initialized: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  getToken: () => Promise<string | null>
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

    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Use cached token if valid, avoids blocking network calls
          const token = await user.getIdToken(false)
          set({ user, token, initialized: true })
        } catch {
          set({ user, initialized: true })
        }
      } else {
        set({ user: null, token: null, initialized: true })
      }
    })
  },

  signIn: async (email: string, password: string) => {
    set({ loading: true })
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      const token = await cred.user.getIdToken(false)
      set({ user: cred.user, token, loading: false })
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  signOut: async () => {
    await firebaseSignOut(auth)
    set({ user: null, token: null })
  },

  getToken: async () => {
    const user = get().user
    if (!user) return null
    try {
      // getIdToken(false) uses memory-cached token (instant 0ms), only refreshes when expired.
      // This prevents rate-limiting and 401 errors when switching tabs or navigating back.
      const token = await user.getIdToken(false)
      set({ token })
      return token
    } catch {
      // If token refresh fails temporarily, return existing token if available
      return get().token || null
    }
  },
}))
