// src/client/lib/image-shield.ts — Ironclad Client-Side Image Theft & Inspect Element Defense
/**
 * Advanced protection engine:
 * 1. Blocks Right-Click context menu on images, galleries, and cards
 * 2. Prevents drag-and-drop extraction of images
 * 3. Disables DevTools / Inspect Element keyboard shortcuts (F12, Ctrl+Shift+I/J/C, Ctrl+U, Ctrl+S)
 * 4. Freezes DevTools element inspector via anti-debugging trap
 * 5. Prevents mobile long-press image saving
 */

export function initImageShield() {
  if (typeof window === 'undefined') return

  // 1. Block Right-Click context menu on images and protected containers
  const blockContextMenu = (e: MouseEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    const isImageOrShield =
      target.tagName === 'IMG' ||
      target.tagName === 'PICTURE' ||
      target.tagName === 'SOURCE' ||
      target.tagName === 'CANVAS' ||
      target.classList.contains('image-guard-shield') ||
      Boolean(target.closest('.image-guard-shield')) ||
      Boolean(target.closest('.opt-image-container')) ||
      Boolean(target.closest('.product-gallery-frame')) ||
      Boolean(target.closest('.product-card-thumb'))

    if (isImageOrShield) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  // 2. Block image drag start
  const blockDragStart = (e: DragEvent) => {
    const target = e.target as HTMLElement | null
    if (!target) return

    if (
      target.tagName === 'IMG' ||
      target.tagName === 'PICTURE' ||
      target.classList.contains('image-guard-shield') ||
      Boolean(target.closest('.opt-image-container'))
    ) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }

  // 3. Block DevTools & Page Source keyboard shortcuts
  const blockShortcuts = (e: KeyboardEvent) => {
    // F12 (Developer Tools)
    if (e.key === 'F12' || e.keyCode === 123) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey

    // Ctrl+Shift+I (Inspect), Ctrl+Shift+J (Console), Ctrl+Shift+C (Element Picker)
    if (isCtrlOrMeta && e.shiftKey) {
      const k = e.key.toUpperCase()
      if (k === 'I' || k === 'J' || k === 'C') {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }

    // Ctrl+U (View Source)
    if (isCtrlOrMeta && (e.key === 'u' || e.key === 'U')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }

    // Ctrl+S (Save Page/Image)
    if (isCtrlOrMeta && (e.key === 's' || e.key === 'S')) {
      // Allow saving in admin editors if needed, but block on storefront
      if (!window.location.pathname.startsWith('/admin')) {
        e.preventDefault()
        e.stopPropagation()
        return false
      }
    }
  }

  // 4. Anti-DevTools Inspection Trap (Halts DevTools if opened)
  const antiDevToolsTrap = () => {
    // Only activate on public customer-facing routes so admin development isn't disrupted
    if (window.location.pathname.startsWith('/admin')) return

    try {
      const start = performance.now()
      // eslint-disable-next-line no-eval
      const check = new Function('debugger')
      check()
      const end = performance.now()
      // If devtools paused execution, time gap will exceed 80ms
      if (end - start > 80) {
        // Obfuscate / clear console
        console.clear()
      }
    } catch {
      // ignore
    }
  }

  // Register capture-phase listeners for maximum priority
  window.addEventListener('contextmenu', blockContextMenu, { capture: true })
  window.addEventListener('dragstart', blockDragStart, { capture: true })
  window.addEventListener('keydown', blockShortcuts, { capture: true })

  // Periodic anti-devtools defense interval (every 800ms)
  const intervalId = setInterval(antiDevToolsTrap, 800)

  return () => {
    window.removeEventListener('contextmenu', blockContextMenu, { capture: true })
    window.removeEventListener('dragstart', blockDragStart, { capture: true })
    window.removeEventListener('keydown', blockShortcuts, { capture: true })
    clearInterval(intervalId)
  }
}
