// src/client/lib/wishlist-store.ts — Guest Wishlist & Recently Viewed (localStorage)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Product } from './api'

interface WishlistState {
  items: Product[]
  recentlyViewed: Product[]
  addToWishlist: (product: Product) => void
  removeFromWishlist: (productId: number) => void
  isInWishlist: (productId: number) => boolean
  addRecentlyViewed: (product: Product) => void
  clearWishlist: () => void
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      recentlyViewed: [],

      addToWishlist: (product) => {
        const current = get().items
        if (!current.some((p) => p.id === product.id)) {
          set({ items: [product, ...current] })
        }
      },

      removeFromWishlist: (productId) => {
        set({ items: get().items.filter((p) => p.id !== productId) })
      },

      isInWishlist: (productId) => {
        return get().items.some((p) => p.id === productId)
      },

      addRecentlyViewed: (product) => {
        const current = get().recentlyViewed.filter((p) => p.id !== product.id)
        set({ recentlyViewed: [product, ...current].slice(0, 10) })
      },

      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'tvh_wishlist_storage',
    }
  )
)
