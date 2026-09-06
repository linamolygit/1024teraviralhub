// src/client/components/admin/AppleGlassToast.tsx — Liquid Glass UI (Xcode 26 + iOS 26 Spec)
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
        bottom: 26,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 999999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 12,
        pointerEvents: 'none',
        width: '100%',
        maxWidth: 480,
        padding: '0 16px',
      }}
    >
      <AnimatePresence mode="sync">
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.94 }}
            transition={{ type: 'spring', stiffness: 420, damping: 26 }}
            style={{ pointerEvents: 'auto', width: '100%' }}
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

  // Color & 3D Gel Orb configuration based on reference images
  const getConfig = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          icon: <Check size={18} color="#FFFFFF" strokeWidth={3} />,
          gelGradient: 'linear-gradient(180deg, #34D399 0%, #10B981 50%, #059669 100%)',
          gelShadow: 'rgba(16, 185, 129, 0.55)',
          causticInner: 'rgba(16, 185, 129, 0.08)',
          causticGlow: 'rgba(16, 185, 129, 0.3)',
          progressBar: 'linear-gradient(90deg, #10B981, #34D399)',
        }
      case 'error':
        return {
          icon: <AlertCircle size={18} color="#FFFFFF" strokeWidth={2.8} />,
          gelGradient: 'linear-gradient(180deg, #F87171 0%, #EF4444 50%, #B91C1C 100%)',
          gelShadow: 'rgba(239, 68, 68, 0.55)',
          causticInner: 'rgba(239, 68, 68, 0.08)',
          causticGlow: 'rgba(239, 68, 68, 0.35)',
          progressBar: 'linear-gradient(90deg, #EF4444, #F87171)',
        }
      case 'warning':
        return {
          icon: <AlertTriangle size={18} color="#FFFFFF" strokeWidth={2.8} />,
          gelGradient: 'linear-gradient(180deg, #FBBF24 0%, #F59E0B 50%, #D97706 100%)',
          gelShadow: 'rgba(245, 158, 11, 0.55)',
          causticInner: 'rgba(245, 158, 11, 0.08)',
          causticGlow: 'rgba(245, 158, 11, 0.3)',
          progressBar: 'linear-gradient(90deg, #F59E0B, #FCD34D)',
        }
      case 'loading':
        return {
          icon: <Loader2 size={18} color="#FFFFFF" className="animate-spin" strokeWidth={2.8} />,
          gelGradient: 'linear-gradient(180deg, #C084FC 0%, #A855F7 50%, #7E22CE 100%)',
          gelShadow: 'rgba(168, 85, 247, 0.55)',
          causticInner: 'rgba(168, 85, 247, 0.08)',
          causticGlow: 'rgba(168, 85, 247, 0.3)',
          progressBar: 'linear-gradient(90deg, #A855F7, #C084FC)',
        }
      case 'info':
      default:
        return {
          icon: <Info size={18} color="#FFFFFF" strokeWidth={2.8} />,
          gelGradient: 'linear-gradient(180deg, #38BDF8 0%, #0284C7 50%, #0369A1 100%)',
          gelShadow: 'rgba(2, 132, 199, 0.55)',
          causticInner: 'rgba(2, 132, 199, 0.08)',
          causticGlow: 'rgba(2, 132, 199, 0.3)',
          progressBar: 'linear-gradient(90deg, #0284C7, #38BDF8)',
        }
    }
  }

  const config = getConfig(toast.type)

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        padding: '12px 18px',
        borderRadius: 24,
        /* Liquid Glass Crystal Body (Refractive Water/Gel Translucency) */
        background:
          'linear-gradient(135deg, rgba(255, 255, 255, 0.82) 0%, rgba(255, 255, 255, 0.42) 45%, rgba(255, 255, 255, 0.68) 100%)',
        backdropFilter: 'blur(30px) saturate(210%) contrast(102%)',
        WebkitBackdropFilter: 'blur(30px) saturate(210%) contrast(102%)',
        border: '1.5px solid rgba(255, 255, 255, 0.85)',
        boxShadow: `
          /* Direct light white specular rim reflection */
          inset 0 2px 2px 0 rgba(255, 255, 255, 0.95),
          /* Bottom inner liquid curve highlight */
          inset 0 -2px 3px 0 rgba(255, 255, 255, 0.5),
          /* Lateral curved glass optical reflections */
          inset 2.5px 0 3.5px 0 rgba(255, 255, 255, 0.6),
          inset -2.5px 0 3.5px 0 rgba(255, 255, 255, 0.6),
          /* Status ambient inner caustic */
          inset 0 0 20px 0 ${config.causticInner},
          /* Soft liquid drop shadow */
          0 16px 36px -6px rgba(0, 0, 0, 0.16),
          0 4px 12px 0 rgba(0, 0, 0, 0.06),
          0 0 24px -2px ${config.causticGlow}
        `,
      }}
    >
      {/* ── Convex Lens Specular Highlight (Optical Curved Glare from Reference Playbook) ── */}
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: 14,
          right: 14,
          height: '42%',
          borderRadius: '18px 18px 80px 80px / 12px 12px 22px 22px',
          background:
            'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.2) 55%, transparent 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── 3D Liquid Jelly Badge (Like "Design Guide" & "Component Library" in Reference) ── */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 12,
          background: config.gelGradient,
          border: '1px solid rgba(255, 255, 255, 0.75)',
          boxShadow: `
            inset 0 2px 2px 0 rgba(255, 255, 255, 0.9),
            inset 0 -2px 3px 0 rgba(0, 0, 0, 0.25),
            0 6px 14px -2px ${config.gelShadow}
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
        {/* Gel Glint */}
        <div
          style={{
            position: 'absolute',
            top: 1,
            left: 3,
            right: 3,
            height: '40%',
            borderRadius: '8px 8px 14px 14px / 4px 4px 8px 8px',
            background:
              'linear-gradient(180deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.1) 100%)',
            pointerEvents: 'none',
          }}
        />
        {config.icon}
      </div>

      {/* ── Content & Typography ── */}
      <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 1 }}>
        <div
          style={{
            fontSize: '0.875rem',
            fontWeight: 800,
            color: '#0F172A', // Crisp Apple Slate
            letterSpacing: '-0.02em',
            lineHeight: 1.35,
          }}
        >
          {toast.title}
        </div>

        {toast.description && (
          <div
            style={{
              fontSize: '0.78rem',
              color: '#334155', // Refined slate subtext
              fontWeight: 500,
              marginTop: 2,
              lineHeight: 1.4,
              wordBreak: 'break-word',
            }}
          >
            {toast.description}
          </div>
        )}

        {/* Action Button if present */}
        {toast.action && (
          <button
            type="button"
            onClick={toast.action.onClick}
            style={{
              marginTop: 6,
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontWeight: 700,
              borderRadius: 9999,
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.6))',
              border: '1px solid rgba(255, 255, 255, 0.9)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.08), inset 0 1px 1px #fff',
              color: '#0F172A',
              cursor: 'pointer',
              transition: 'transform 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.04)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            {toast.action.label}
          </button>
        )}
      </div>

      {/* ── Circular Glass Ring Dismiss Button (Matching Glass Ring in Playbook) ── */}
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Close notification"
        style={{
          width: 26,
          height: 26,
          borderRadius: '50%',
          background:
            'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.45) 100%)',
          border: '1.5px solid rgba(255, 255, 255, 0.95)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.95), 0 2px 6px rgba(0, 0, 0, 0.06)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#334155',
          flexShrink: 0,
          position: 'relative',
          zIndex: 1,
          transition: 'transform 0.15s, background 0.15s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.color = '#0F172A'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.color = '#334155'
        }}
      >
        <X size={13} strokeWidth={2.8} />
      </button>

      {/* ── Liquid Glass Progress Line ── */}
      {toast.duration && toast.duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: toast.duration / 1000, ease: 'linear' }}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 16,
            right: 16,
            height: 3,
            borderRadius: 9999,
            background: config.progressBar,
            boxShadow: `0 0 8px ${config.progressBar}`,
            transformOrigin: 'left',
            opacity: 0.85,
          }}
        />
      )}
    </div>
  )
}
