// src/client/lib/admin-toast.ts — Global Apple Glass Toast Store & Dispatcher
import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number // ms (default: 3800, 0 = persistent)
  action?: {
    label: string
    onClick: () => void
  }
  createdAt: number
}

interface AdminToastStore {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id' | 'createdAt'>) => string
  removeToast: (id: string) => void
  clearAll: () => void
}

export const useAdminToastStore = create<AdminToastStore>((set, get) => ({
  toasts: [],
  addToast: (toast) => {
    const now = Date.now()
    const current = get().toasts
    // Avoid spamming duplicate identical toast within 1.5s
    const isDuplicate = current.some(
      (t) => t.title === toast.title && t.description === toast.description && (now - t.createdAt < 1500)
    )
    if (isDuplicate) {
      return current[0]?.id || ''
    }

    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
    const item: ToastItem = {
      ...toast,
      id,
      duration: toast.duration ?? (toast.type === 'error' ? 4800 : 3800),
      createdAt: now,
    }
    set((state) => {
      // Keep maximum 3 toasts in stack for sleek Apple UI
      const updated = [item, ...state.toasts].slice(0, 3)
      return { toasts: updated }
    })
    return id
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearAll: () => set({ toasts: [] }),
}))

/**
 * Universal Apple Glass Toast Trigger (Callable anywhere in Admin Panel)
 */
export const adminToast = {
  success: (title: string, description?: string, duration?: number) => {
    return useAdminToastStore.getState().addToast({
      type: 'success',
      title,
      description,
      duration,
    })
  },
  error: (title: string, description?: string, duration?: number) => {
    return useAdminToastStore.getState().addToast({
      type: 'error',
      title,
      description,
      duration: duration ?? 5000,
    })
  },
  warning: (title: string, description?: string, duration?: number) => {
    return useAdminToastStore.getState().addToast({
      type: 'warning',
      title,
      description,
      duration,
    })
  },
  info: (title: string, description?: string, duration?: number) => {
    return useAdminToastStore.getState().addToast({
      type: 'info',
      title,
      description,
      duration,
    })
  },
  loading: (title: string, description?: string) => {
    return useAdminToastStore.getState().addToast({
      type: 'loading',
      title,
      description,
      duration: 0,
    })
  },
  dismiss: (id?: string) => {
    if (id) {
      useAdminToastStore.getState().removeToast(id)
    } else {
      useAdminToastStore.getState().clearAll()
    }
  },
}
