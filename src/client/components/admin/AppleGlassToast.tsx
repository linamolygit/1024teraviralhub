// src/client/components/admin/AppleGlassToast.tsx — Ultra-Realistic Apple VisionOS Liquid Glass Pill UI
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, AlertCircle, AlertTriangle, Info, Loader2, X } from 'lucide-react'
import { useAdminToastStore, type ToastItem, type ToastType } from '../../lib/admin-toast'

export default function AppleGlassToastContainer() {
  const { toasts, removeToast } = useAdminToastStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 28,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'none',
        width: 'auto',
        maxWidth: '92vw',
      }}
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 30, scale: 0.90, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 15, scale: 0.94, filter: 'blur(4px)' }}
            transition={{ type: 'spring', stiffness: 450, damping: 28 }}
            style={{ pointerEvents: 'auto', display: 'flex', justifyContent: 'center' }}
          >
            <LiquidGlassToastCard toast={toast} onDismiss={() => removeToast(toast.id)} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

function LiquidGlassToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [isPaused, setIsPaused] = useState(false)

  // Auto-dismiss timer
  useEffect(() => {
    if (!toast.duration || toast.duration <= 0 || isPaused) return

    const timer = setTimeout(() => {
      onDismiss()
    }, toast.duration)

    return () => clearTimeout(timer)
  }, [toast.duration, isPaused, onDismiss])

  // Gel orb status configuration
  const getConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <Check size={13} color="#FFFFFF" strokeWidth={3.2} />,
          orbGradient: 'linear-gradient(180deg, #34D399 0%, #10B981 50%, #059669 100%)',
          orbShadow: 'rgba(16, 185, 129, 0.45)',
          causticGlow: 'rgba(16, 185, 129, 0.25)',
          progressColor: '#10B981',
        }
      case 'error':
        return {
          icon: <AlertCircle size={13} color="#FFFFFF" strokeWidth={3} />,
          orbGradient: 'linear-gradient(180deg, #F87171 0%, #EF4444 50%, #DC2626 100%)',
          orbShadow: 'rgba(239, 68, 68, 0.45)',
          causticGlow: 'rgba(239, 68, 68, 0.3)',
          progressColor: '#EF4444',
        }
      case 'warning':
        return {
          icon: <AlertTriangle size={13} color="#FFFFFF" strokeWidth={3} />,
          orbGradient: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
          orbShadow: 'rgba(245, 158, 11, 0.45)',
          causticGlow: 'rgba(245, 158, 11, 0.25)',
          progressColor: '#F59E0B',
        }
      case 'loading':
        return {
          icon: <Loader2 size={13} color="#FFFFFF" className="animate-spin" strokeWidth={3} />,
          orbGradient: 'linear-gradient(180deg, #C084FC 0%, #A855F7 50%, #7E22CE 100%)',
          orbShadow: 'rgba(168, 85, 247, 0.45)',
          causticGlow: 'rgba(168, 85, 247, 0.25)',
          progressColor: '#A855F7',
        }
      case 'info':
      default:
        return {
          icon: <Info size={13} color="#FFFFFF" strokeWidth={3} />,
          orbGradient: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 50%, #0369A1 100%)',
          orbShadow: 'rgba(2, 132, 199, 0.45)',
          causticGlow: 'rgba(2, 132, 199, 0.25)',
          progressColor: '#0284C7',
        }
    }
  }

  const config = getConfig(toast.type)
  const isSingleLine = !toast.description && !toast.action

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: isSingleLine ? '8px 16px 8px 10px' : '10px 18px 10px 12px',
        borderRadius: 9999, // True Apple VisionOS Capsule Stadium Pill
        /* Liquid Glass Crystal Body (Refractive Water/Gel Specular Translucency) */
        background:
          'linear-gradient(180deg, rgba(255, 255, 255, 0.72) 0%, rgba(255, 255, 255, 0.32) 42%, rgba(255, 255, 255, 0.52) 100%)',
        backdropFilter: 'blur(28px) saturate(200%) contrast(104%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%) contrast(104%)',
        /* Outer Refractive Glass Edge */
        border: '1.5px solid rgba(255, 255, 255, 0.85)',
        boxShadow: `
          /* Direct light white specular rim reflection */
          inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.98),
          /* Bottom inner liquid reflection */
          inset 0 -1.5px 2px 0 rgba(255, 255, 255, 0.45),
          /* Lateral curved glass optical bounce */
          inset 2px 0 3px 0 rgba(255, 255, 255, 0.65),
          inset -2px 0 3px 0 rgba(255, 255, 255, 0.65),
          /* Soft ambient liquid drop shadows matching reference photo */
          0 20px 42px -8px rgba(0, 0, 0, 0.22),
          0 8px 18px -4px rgba(0, 0, 0, 0.12),
          0 2px 6px 0 rgba(0, 0, 0, 0.06),
          0 0 20px -2px ${config.causticGlow}
        `,
        userSelect: 'none',
        maxWidth: 520,
        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Signature Concentric Inner Liquid Ridge (Exact optical detail from user reference) ── */}
      <div
        style={{
          position: 'absolute',
          inset: 3,
          borderRadius: 9999,
          border: '1px solid rgba(255, 255, 255, 0.5)',
          boxShadow: `
            inset 0 1.5px 2px 0 rgba(255, 255, 255, 0.85),
            inset 0 -1px 2px 0 rgba(0, 0, 0, 0.04),
            0 1px 2px 0 rgba(0, 0, 0, 0.03)
          `,
          pointerEvents: 'none',
        }}
      />

      {/* ── Upper Meniscus Specular Highlight (Curved surface glare) ── */}
      <div
        style={{
          position: 'absolute',
          top: 1,
          left: 18,
          right: 18,
          height: '46%',
          borderRadius: '9999px 9999px 50px 50px',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.18) 60%, transparent 100%)',
          pointerEvents: 'none',
          opacity: 0.95,
        }}
      />

      {/* ── Sleek 3D Liquid Gel Orb ── */}
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background: config.orbGradient,
          border: '1px solid rgba(255, 255, 255, 0.85)',
          boxShadow: `
            inset 0 1.5px 1.5px 0 rgba(255, 255, 255, 0.95),
            inset 0 -1.5px 2px 0 rgba(0, 0, 0, 0.3),
            0 3px 8px -1px ${config.orbShadow}
          `,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Orb Crescent Glint */}
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: 2,
            right: 2,
            height: '42%',
            borderRadius: '50%',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
        {config.icon}
      </div>

      {/* ── Typography (Crisp Apple Obsidian Font matching "Style Rules" in reference) ── */}
      <div
        style={{
          display: 'flex',
          flexDirection: isSingleLine ? 'row' : 'column',
          alignItems: isSingleLine ? 'center' : 'flex-start',
          gap: isSingleLine ? 6 : 1,
          position: 'relative',
          zIndex: 1,
          paddingRight: 4,
        }}
      >
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 700,
            color: '#0F172A', // Apple deep graphite
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "Inter", -system-ui, sans-serif',
            letterSpacing: '-0.015em',
            lineHeight: 1.25,
            whiteSpace: isSingleLine ? 'nowrap' : 'normal',
          }}
        >
          {toast.title}
        </div>

        {toast.description && (
          <div
            style={{
              fontSize: '0.76rem',
              color: '#334155', // Apple soft slate
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", -system-ui, sans-serif',
              fontWeight: 500,
              lineHeight: 1.35,
            }}
          >
            {toast.description}
          </div>
        )}

        {/* Action Button if provided */}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            style={{
              marginTop: 4,
              padding: '2px 10px',
              fontSize: '0.72rem',
              fontWeight: 700,
              borderRadius: 9999,
              background:
                'linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.7))',
              border: '1px solid rgba(255, 255, 255, 0.95)',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08), inset 0 1px 1px #fff',
              color: '#0F172A',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* ── Circular Glass Ring Dismiss Button ── */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close notification"
        style={{
          width: 20,
          height: 20,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.4) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.9)',
          boxShadow: 'inset 0 1px 1.5px rgba(255, 255, 255, 0.9), 0 1px 3px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#475569',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
          transition: 'all 0.15s ease',
          padding: 0,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.color = '#0F172A'
          e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.color = '#475569'
          e.currentTarget.style.background =
            'linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.4) 100%)'
        }}
      >
        <X size={11} strokeWidth={3} />
      </button>

      {/* ── Subtle Liquid Progress Ring / Bar ── */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: 2,
            left: 20,
            right: 20,
            height: 2,
            borderRadius: 9999,
            background: config.progressColor,
            transformOrigin: 'left',
            opacity: 0.7,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

