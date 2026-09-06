// src/client/components/ui/OptimizedImage.tsx — Meta-Grade Responsive Image Component
import React, { useState, useEffect } from 'react'
import { buildOptimizedImageUrl, buildSrcSet, type VariantType } from '../../lib/image-optimizer'

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
  variant?: VariantType
  sizes?: string
  aspectRatio?: string | number
  priority?: boolean
  blurDataUrl?: string
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  containerStyle?: React.CSSProperties
  containerClassName?: string
}

export default function OptimizedImage({
  src,
  alt,
  variant = 'thumbnail',
  sizes,
  aspectRatio,
  priority = false,
  blurDataUrl,
  objectFit = 'cover',
  className = '',
  style = {},
  containerStyle = {},
  containerClassName = '',
  onLoad,
  ...rest
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Determine standard source URL and responsive srcset
  const optimizedSrc = buildOptimizedImageUrl(src, { variant })
  const srcSet = buildSrcSet(src)

  // Default sizes query tailored for responsive grids
  const defaultSizes =
    sizes ||
    (variant === 'thumbnail' || variant === 'thumb'
      ? '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 380px'
      : variant === 'medium'
      ? '(max-width: 768px) 100vw, (max-width: 1280px) 600px, 800px'
      : '100vw')

  // Inject LCP preload link for critical priority images (e.g. Hero banner)
  useEffect(() => {
    if (!priority || !optimizedSrc) return
    const linkId = `preload-${encodeURIComponent(optimizedSrc)}`
    if (document.getElementById(linkId)) return

    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'preload'
    link.as = 'image'
    link.href = optimizedSrc
    if (srcSet) {
      link.imageSrcset = srcSet
      link.imageSizes = defaultSizes
    }
    document.head.appendChild(link)

    return () => {
      const el = document.getElementById(linkId)
      if (el) el.remove()
    }
  }, [priority, optimizedSrc, srcSet, defaultSizes])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setIsLoaded(true)
    if (onLoad) {
      onLoad(e as unknown as React.SyntheticEvent<HTMLImageElement, Event>)
    }
  }

  // Wrapper style to enforce layout stability and aspect ratio
  const wrapperStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    display: 'block',
    width: '100%',
    height: '100%',
    ...(aspectRatio ? { aspectRatio: String(aspectRatio) } : {}),
    ...containerStyle,
  }

  return (
    <div className={`opt-image-container ${containerClassName}`} style={wrapperStyle}>
      {/* ── Blur-up placeholder (LQIP) ── */}
      {blurDataUrl && !isLoaded && (
        <img
          src={blurDataUrl}
          alt=""
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit,
            filter: 'blur(16px)',
            transform: 'scale(1.08)', // avoid blur edge artifacts
            opacity: 0.9,
            transition: 'opacity 0.3s ease-out',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}

      {/* ── Picture with WebP/AVIF srcset variants ── */}
      <picture style={{ display: 'block', width: '100%', height: '100%', pointerEvents: 'none' }}>
        {srcSet && (
          <source
            type="image/webp"
            srcSet={srcSet}
            sizes={defaultSizes}
          />
        )}
        <img
          src={optimizedSrc}
          alt={alt}
          srcSet={srcSet || undefined}
          sizes={srcSet ? defaultSizes : undefined}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          draggable={false}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          // @ts-expect-error fetchpriority is standard in modern HTML
          fetchpriority={priority ? 'high' : 'auto'}
          onLoad={handleImageLoad}
          className={className}
          style={{
            width: '100%',
            height: '100%',
            objectFit,
            display: 'block',
            opacity: isLoaded || !blurDataUrl ? 1 : 0,
            transition: 'opacity 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            WebkitTouchCallout: 'none',
            ...style,
          }}
          {...rest}
        />
      </picture>

      {/* ── Transparent Anti-Download Security Shield Overlay ── */}
      <div
        className="image-guard-shield"
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
        onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 3,
          background: 'transparent',
          pointerEvents: 'none', // allows parent button/card click through while blocking direct image right-clicks
        }}
      />
    </div>
  )
}
