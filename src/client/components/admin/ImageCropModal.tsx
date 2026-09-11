// src/client/components/admin/ImageCropModal.tsx — Compact, Theme-Adaptive Image Crop & Adjustment Modal
import { useState, useRef, useEffect, useCallback } from 'react'
import {
  X,
  RotateCcw,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  Crop,
  Check,
  Grid,
  RefreshCw,
  Sparkles,
  Move,
  Sun,
  Contrast as ContrastIcon,
} from 'lucide-react'

export interface ImageCropModalProps {
  isOpen: boolean
  onClose: () => void
  imageSrc: string
  imageName?: string
  initialAspectRatio?: number | null // null = Freeform, 1 = 1:1, 4/3 = 4:3, etc.
  onApplyCrop: (croppedFile: File, croppedPreviewUrl: string) => void | Promise<void>
  title?: string
  isCover?: boolean
}

type AspectRatioPreset = {
  label: string
  value: number | null
}

const ASPECT_PRESETS: AspectRatioPreset[] = [
  { label: '1:1 Square', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: 'Free', value: null },
]

export default function ImageCropModal({
  isOpen,
  onClose,
  imageSrc,
  imageName = 'product-cover.webp',
  initialAspectRatio = 1,
  onApplyCrop,
  title = 'Crop & Adjust Image',
  isCover = true,
}: ImageCropModalProps) {
  // Resolved image source (converted to blob URL if remote to guarantee 0 CORS/taint issues)
  const [resolvedSrc, setResolvedSrc] = useState<string>('')

  // Crop & Transform state
  const [aspectRatio, setAspectRatio] = useState<number | null>(initialAspectRatio)
  const [zoom, setZoom] = useState(1.0)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)

  // Color adjustments
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)

  // UI state
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [initialPan, setInitialPan] = useState({ x: 0, y: 0 })
  const [isExporting, setIsExporting] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)
  const [imgError, setImgError] = useState('')
  const [naturalDim, setNaturalDim] = useState({ width: 0, height: 0 })

  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Fetch or resolve image to blob URL when opened to avoid canvas taint
  useEffect(() => {
    if (!isOpen || !imageSrc) {
      setResolvedSrc('')
      setImgLoaded(false)
      return
    }

    setAspectRatio(initialAspectRatio ?? 1)
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setBrightness(100)
    setContrast(100)
    setIsExporting(false)
    setImgLoaded(false)
    setImgError('')

    let isMounted = true
    let blobUrlToRevoke: string | null = null

    async function resolveSource() {
      if (imageSrc.startsWith('blob:') || imageSrc.startsWith('data:')) {
        if (isMounted) {
          setResolvedSrc(imageSrc)
        }
        return
      }

      try {
        const res = await fetch(imageSrc)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const blob = await res.blob()
        const objUrl = URL.createObjectURL(blob)
        blobUrlToRevoke = objUrl
        if (isMounted) {
          setResolvedSrc(objUrl)
        }
      } catch {
        // Fallback to direct URL if fetch fails
        if (isMounted) {
          setResolvedSrc(imageSrc)
        }
      }
    }

    resolveSource()

    return () => {
      isMounted = false
      if (blobUrlToRevoke) {
        URL.revokeObjectURL(blobUrlToRevoke)
      }
    }
  }, [isOpen, initialAspectRatio, imageSrc])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    setNaturalDim({ width: img.naturalWidth, height: img.naturalHeight })
    setImgLoaded(true)
    setImgError('')
  }

  // Handle Drag / Pan
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!imgLoaded) return
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setInitialPan({ x: pan.x, y: pan.y })
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    setPan({
      x: initialPan.x + dx,
      y: initialPan.y + dy,
    })
  }

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false)
      try {
        e.currentTarget.releasePointerCapture(e.pointerId)
      } catch {
        // safe ignore
      }
    }
  }

  // Handle Wheel Zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault()
    const zoomDelta = -e.deltaY * 0.0015
    setZoom((prev) => Math.min(3.5, Math.max(0.4, Number((prev + zoomDelta).toFixed(2)))))
  }

  const handleReset = () => {
    setZoom(1.0)
    setPan({ x: 0, y: 0 })
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setBrightness(100)
    setContrast(100)
  }

  // Calculate compact crop window dimensions (max 180x160 so it fits with 0 scrolling)
  const getCropBoxDimensions = useCallback(() => {
    const maxW = 180
    const maxH = 160

    if (!aspectRatio) {
      const ratio = naturalDim.width && naturalDim.height ? naturalDim.width / naturalDim.height : 1
      if (ratio >= maxW / maxH) {
        return { width: maxW, height: Math.max(90, Math.round(maxW / ratio)) }
      }
      return { width: Math.max(90, Math.round(maxH * ratio)), height: maxH }
    }

    if (aspectRatio >= maxW / maxH) {
      const w = maxW
      const h = Math.round(maxW / aspectRatio)
      return { width: w, height: h }
    } else {
      const h = maxH
      const w = Math.round(maxH * aspectRatio)
      return { width: w, height: h }
    }
  }, [aspectRatio, naturalDim])

  const cropBox = getCropBoxDimensions()

  // Apply & Export Cropped High-Res Canvas
  const handleApply = async () => {
    if (!imageRef.current || !imgLoaded) return
    setIsExporting(true)

    try {
      let targetW = 1200
      let targetH = 1200

      if (aspectRatio) {
        if (aspectRatio >= 1) {
          targetW = 1200
          targetH = Math.round(1200 / aspectRatio)
        } else {
          targetH = 1200
          targetW = Math.round(1200 * aspectRatio)
        }
      } else if (naturalDim.width && naturalDim.height) {
        const r = naturalDim.width / naturalDim.height
        targetW = r >= 1 ? 1200 : Math.round(1200 * r)
        targetH = r >= 1 ? Math.round(1200 / r) : 1200
      }

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH
      const ctx = canvas.getContext('2d', { alpha: true })

      if (!ctx) throw new Error('Canvas 2D context unavailable')

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`

      const totalAngle = rotation * (Math.PI / 180)

      ctx.save()
      ctx.translate(targetW / 2, targetH / 2)

      const scaleToCanvas = targetW / cropBox.width
      ctx.translate(pan.x * scaleToCanvas, pan.y * scaleToCanvas)
      ctx.rotate(totalAngle)
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)

      const drawnW = cropBox.width * zoom * scaleToCanvas
      const drawnH = (cropBox.width * zoom * scaleToCanvas * naturalDim.height) / (naturalDim.width || 1)

      ctx.drawImage(
        imageRef.current,
        -drawnW / 2,
        -drawnH / 2,
        drawnW,
        drawnH
      )

      ctx.restore()

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/webp', 0.92)
      })

      if (!blob) throw new Error('Failed to encode cropped image')

      const cleanFileName = imageName.replace(/\.[^/.]+$/, '') + '-cropped.webp'
      const croppedFile = new File([blob], cleanFileName, { type: 'image/webp' })
      const croppedPreviewUrl = URL.createObjectURL(blob)

      await onApplyCrop(croppedFile, croppedPreviewUrl)
      onClose()
    } catch (err: any) {
      console.error('Cropping error:', err)
      setImgError(err.message || 'Failed to apply crop')
    } finally {
      setIsExporting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '12px',
        animation: 'fadeInModal 0.18s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          maxHeight: 'min(94vh, 460px)',
          background: 'var(--bg-surface, #ffffff)',
          border: '1px solid var(--bg-border, #e0e0e0)',
          borderRadius: 'var(--radius-lg, 12px)',
          boxShadow: '0 16px 48px rgba(0, 0, 0, 0.18)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--text-primary, #212121)',
        }}
      >
        {/* ── Modal Header (Compact & Crisp) ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '10px 16px',
            borderBottom: '1px solid var(--bg-border, #e0e0e0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 6,
                background: 'var(--brand-purple, #2874F0)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
              }}
            >
              <Crop size={14} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary, #212121)' }}>
                  {title}
                </span>
                {isCover && (
                  <span
                    style={{
                      background: 'var(--brand-amber, #FFD200)',
                      color: '#000000',
                      fontSize: '0.62rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Sparkles size={8} /> COVER
                  </span>
                )}
              </div>
              <p style={{ margin: 0, fontSize: '0.68rem', color: 'var(--text-muted, #878787)' }}>
                Drag preview to position • Wheel to zoom
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'var(--bg-surface, #ffffff)',
              border: '1px solid var(--bg-border, #e0e0e0)',
              borderRadius: 6,
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary, #878787)',
              cursor: 'pointer',
            }}
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        {/* ── Modal Body (Compact 2-Column Layout) ── */}
        <div
          style={{
            flex: '1 1 auto',
            minHeight: 0,
            overflowY: 'auto',
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: '190px 1fr',
            gap: 14,
            alignItems: 'start',
            background: 'var(--bg-surface, #ffffff)',
          }}
        >
          {/* Left Column: Canvas Preview Studio */}
          <div
            style={{
              background: 'var(--bg-elevated, #f8f9fa)',
              border: '1px solid var(--bg-border, #e0e0e0)',
              borderRadius: 8,
              padding: '8px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              overflow: 'hidden',
              userSelect: 'none',
              touchAction: 'none',
            }}
            onWheel={handleWheel}
          >
            {/* The Crop Viewport Window */}
            <div
              ref={containerRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                position: 'relative',
                width: cropBox.width,
                height: cropBox.height,
                border: '2px solid var(--brand-purple, #2874F0)',
                borderRadius: aspectRatio === 1 ? 6 : 4,
                overflow: 'hidden',
                cursor: isDragging ? 'grabbing' : 'grab',
                background: 'var(--bg-surface, #ffffff)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(40, 116, 240, 0.12)',
              }}
            >
              {resolvedSrc && (
                <img
                  ref={imageRef}
                  src={resolvedSrc}
                  alt="Crop preview"
                  onLoad={handleImageLoad}
                  onError={() => setImgError('Image load error. Check format.')}
                  style={{
                    maxWidth: 'none',
                    position: 'absolute',
                    transformOrigin: 'center center',
                    transform: `
                      translate(${pan.x}px, ${pan.y}px)
                      scale(${zoom})
                      rotate(${rotation}deg)
                      scaleX(${flipH ? -1 : 1})
                      scaleY(${flipV ? -1 : 1})
                    `,
                    filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                    pointerEvents: 'none',
                    width: `${cropBox.width}px`,
                    height: naturalDim.height ? `${(cropBox.width * naturalDim.height) / (naturalDim.width || 1)}px` : 'auto',
                  }}
                />
              )}

              {/* Rule of Thirds Grid Overlay */}
              {showGrid && (
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    pointerEvents: 'none',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gridTemplateRows: '1fr 1fr 1fr',
                  }}
                >
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)', borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)', borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)', borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)', borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderBottom: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div style={{ borderRight: '1px dashed rgba(40,116,240,0.35)' }} />
                  <div />
                </div>
              )}

              {/* Drag Hint */}
              {pan.x === 0 && pan.y === 0 && zoom === 1 && !isDragging && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 4,
                    background: 'var(--brand-purple, #2874F0)',
                    color: '#ffffff',
                    fontSize: '0.58rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                    pointerEvents: 'none',
                  }}
                >
                  <Move size={8} /> Drag to adjust
                </div>
              )}
            </div>

            {/* Viewport Floating Quick Actions */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                marginTop: 6,
                zIndex: 2,
              }}
            >
              <button
                type="button"
                onClick={() => setShowGrid(!showGrid)}
                style={{
                  background: showGrid ? 'var(--brand-purple-soft, rgba(40, 116, 240, 0.1))' : 'var(--bg-surface, #ffffff)',
                  border: showGrid ? '1px solid var(--brand-purple, #2874F0)' : '1px solid var(--bg-border, #e0e0e0)',
                  color: showGrid ? 'var(--brand-purple, #2874F0)' : 'var(--text-secondary, #878787)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                }}
                title="Toggle Grid"
              >
                <Grid size={9} /> Grid
              </button>

              <button
                type="button"
                onClick={handleReset}
                style={{
                  background: 'var(--bg-surface, #ffffff)',
                  border: '1px solid var(--bg-border, #e0e0e0)',
                  color: 'var(--text-secondary, #878787)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: '0.64rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                  cursor: 'pointer',
                }}
                title="Reset Adjustments"
              >
                <RefreshCw size={9} /> Reset
              </button>
            </div>

            {imgError && (
              <div
                style={{
                  position: 'absolute',
                  inset: 6,
                  background: 'var(--bg-surface, #ffffff)',
                  borderRadius: 6,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--error, #FF6161)',
                  padding: 8,
                  textAlign: 'center',
                }}
              >
                <p style={{ fontWeight: 700, margin: '0 0 2px', fontSize: '0.72rem' }}>Load Issue</p>
                <p style={{ fontSize: '0.64rem', color: 'var(--text-muted)', margin: 0 }}>{imgError}</p>
              </div>
            )}
          </div>

          {/* Right Column: Controls Panel */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {/* 1. Aspect Ratio Presets */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary, #878787)', marginBottom: 4 }}>
                Aspect Ratio:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4 }}>
                {ASPECT_PRESETS.map((preset) => {
                  const isActive = aspectRatio === preset.value
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setAspectRatio(preset.value)}
                      style={{
                        background: isActive ? 'var(--brand-purple, #2874F0)' : 'var(--bg-surface, #ffffff)',
                        border: isActive ? '1px solid var(--brand-purple, #2874F0)' : '1px solid var(--bg-border, #e0e0e0)',
                        color: isActive ? '#ffffff' : 'var(--text-primary, #212121)',
                        borderRadius: 5,
                        padding: '4px 2px',
                        fontSize: '0.66rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* 2. Zoom Controls */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary, #878787)', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ZoomIn size={11} /> Zoom
                </span>
                <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--brand-purple, #2874F0)' }}>
                  {Math.round(zoom * 100)}%
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                  style={{
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--bg-border, #e0e0e0)',
                    color: 'var(--text-primary, #212121)',
                    borderRadius: 4,
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomOut size={10} />
                </button>
                <input
                  type="range"
                  min="0.4"
                  max="3.5"
                  step="0.05"
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--brand-purple, #2874F0)', cursor: 'pointer', height: '3px' }}
                />
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.1).toFixed(2))))}
                  style={{
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--bg-border, #e0e0e0)',
                    color: 'var(--text-primary, #212121)',
                    borderRadius: 4,
                    width: 22,
                    height: 22,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <ZoomIn size={10} />
                </button>
              </div>
            </div>

            {/* 3. Orientation (Rotate & Flip) */}
            <div>
              <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-secondary, #878787)', marginBottom: 4 }}>
                Transform:
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <button
                  type="button"
                  onClick={() => setRotation((r) => (r - 90) % 360)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--bg-border, #e0e0e0)',
                    color: 'var(--text-primary, #212121)',
                    borderRadius: 5,
                    padding: '3px 2px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCcw size={9} /> -90°
                </button>

                <button
                  type="button"
                  onClick={() => setRotation((r) => (r + 90) % 360)}
                  style={{
                    flex: 1,
                    background: 'var(--bg-surface, #ffffff)',
                    border: '1px solid var(--bg-border, #e0e0e0)',
                    color: 'var(--text-primary, #212121)',
                    borderRadius: 5,
                    padding: '3px 2px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <RotateCw size={9} /> +90°
                </button>

                <button
                  type="button"
                  onClick={() => setFlipH(!flipH)}
                  style={{
                    flex: 1,
                    background: flipH ? 'var(--brand-purple-soft, rgba(40, 116, 240, 0.1))' : 'var(--bg-surface, #ffffff)',
                    border: flipH ? '1px solid var(--brand-purple, #2874F0)' : '1px solid var(--bg-border, #e0e0e0)',
                    color: flipH ? 'var(--brand-purple, #2874F0)' : 'var(--text-primary, #212121)',
                    borderRadius: 5,
                    padding: '3px 2px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <FlipHorizontal size={9} /> Flip H
                </button>

                <button
                  type="button"
                  onClick={() => setFlipV(!flipV)}
                  style={{
                    flex: 1,
                    background: flipV ? 'var(--brand-purple-soft, rgba(40, 116, 240, 0.1))' : 'var(--bg-surface, #ffffff)',
                    border: flipV ? '1px solid var(--brand-purple, #2874F0)' : '1px solid var(--bg-border, #e0e0e0)',
                    color: flipV ? 'var(--brand-purple, #2874F0)' : 'var(--text-primary, #212121)',
                    borderRadius: 5,
                    padding: '3px 2px',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 2,
                    cursor: 'pointer',
                  }}
                >
                  <FlipVertical size={9} /> Flip V
                </button>
              </div>
            </div>

            {/* 4. Fine Color Tuning */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {/* Brightness */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #878787)', width: '56px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Sun size={9} /> Light
                </span>
                <input
                  type="range"
                  min="70"
                  max="130"
                  value={brightness}
                  onChange={(e) => setBrightness(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--brand-purple, #2874F0)', cursor: 'pointer', height: '3px' }}
                />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, width: '26px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {brightness}%
                </span>
              </div>

              {/* Contrast */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary, #878787)', width: '56px', display: 'flex', alignItems: 'center', gap: 2 }}>
                  <ContrastIcon size={9} /> Contrast
                </span>
                <input
                  type="range"
                  min="70"
                  max="130"
                  value={contrast}
                  onChange={(e) => setContrast(parseInt(e.target.value))}
                  style={{ flex: 1, accentColor: 'var(--brand-purple, #2874F0)', cursor: 'pointer', height: '3px' }}
                />
                <span style={{ fontSize: '0.62rem', fontWeight: 700, width: '26px', textAlign: 'right', color: 'var(--text-secondary)' }}>
                  {contrast}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Modal Footer (Always Visible at Bottom) ── */}
        <div
          style={{
            flexShrink: 0,
            padding: '8px 16px',
            borderTop: '1px solid var(--bg-border, #e0e0e0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface, #ffffff)',
            gap: 8,
          }}
        >
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted, #878787)' }}>
            Output: <strong>{aspectRatio === 1 ? '1:1 Square WebP' : 'WebP Optimized'}</strong>
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isExporting}
              style={{
                background: 'var(--bg-surface, #ffffff)',
                border: '1px solid var(--bg-border, #e0e0e0)',
                color: 'var(--text-primary, #212121)',
                borderRadius: 6,
                padding: '5px 12px',
                fontSize: '0.76rem',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleApply}
              disabled={isExporting || !imgLoaded}
              style={{
                background: 'var(--brand-purple, #2874F0)',
                border: 'none',
                color: '#ffffff',
                borderRadius: 6,
                padding: '5px 14px',
                fontSize: '0.76rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                cursor: isExporting || !imgLoaded ? 'not-allowed' : 'pointer',
                opacity: isExporting || !imgLoaded ? 0.6 : 1,
                boxShadow: '0 2px 6px rgba(40, 116, 240, 0.25)',
              }}
            >
              {isExporting ? (
                <>
                  <RefreshCw size={11} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={12} />
                  Apply & Save Crop
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
