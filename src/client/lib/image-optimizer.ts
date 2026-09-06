// src/client/lib/image-optimizer.ts — Meta-Grade Client-Side Image Compression & Sizing Engine

export interface ImageVariantsResult {
  original: File | Blob
  thumb: Blob
  medium: Blob
  large: Blob
  blurDataUrl: string
  width: number
  height: number
  originalSize: number
  compressedTotalSize: number
  savingsPercent?: number
  thumbSize?: number
  mediumSize?: number
  largeSize?: number
}

export type VariantType = 'thumbnail' | 'thumb' | 'medium' | 'large' | 'original'

/**
 * Meta/Instagram-Grade Perceptual Sharpening Kernel (Unsharp Masking).
 * Compensates for the micro-blur caused by bicubic/bilinear downsampling by
 * elevating edge-boundary micro-contrast. Produces razor-sharp product details
 * even after strong perceptual compression.
 */
function applyPerceptualSharpening(
  ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D,
  width: number,
  height: number,
  strength: number = 0.12
): void {
  // Only apply to actionable dimensions; skip micro-thumbnails or excessively huge canvases
  if (width < 32 || height < 32 || width * height > 4000000 || strength <= 0) return

  try {
    const imgData = ctx.getImageData(0, 0, width, height)
    const src = imgData.data
    const len = src.length
    // Fast copy buffer to reference unmutated neighbor pixels
    const output = new Uint8ClampedArray(len)
    output.set(src)

    const w4 = width * 4
    const centerWeight = 1 + 4 * strength

    // High-performance 1-pass convolution kernel over RGB channels (skip 1px boundary)
    for (let y = 1; y < height - 1; y++) {
      const rowOffset = y * w4
      const rowAbove = rowOffset - w4
      const rowBelow = rowOffset + w4

      for (let x = 1; x < width - 1; x++) {
        const i = rowOffset + (x * 4)

        // Process Red (i), Green (i+1), Blue (i+2)
        for (let c = 0; c < 3; c++) {
          const idx = i + c
          output[idx] =
            src[idx] * centerWeight -
            (src[idx - 4] + src[idx + 4] + src[rowAbove + (x * 4) + c] + src[rowBelow + (x * 4) + c]) * strength
        }
      }
    }

    // Write back sharpened pixels
    imgData.data.set(output)
    ctx.putImageData(imgData, 0, 0)
  } catch (err) {
    // In case of any context security restrictions, gracefully fallback without error
    console.warn('[PerceptualOptimizer] Micro-sharpening bypassed:', err)
  }
}

/**
 * Resizes an image bitmap or HTMLImageElement to target max dimensions while preserving aspect ratio
 */
function calculateDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight }
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight)
  return {
    width: Math.round(srcWidth * ratio),
    height: Math.round(srcHeight * ratio),
  }
}

/**
 * Renders an image source to a canvas at target dimensions with optional
 * perceptual micro-sharpening, then exports as a highly-compressed WebP Blob.
 */
async function exportResizedBlob(
  img: CanvasImageSource,
  width: number,
  height: number,
  quality: number,
  sharpenStrength: number = 0.12,
  mimeType = 'image/webp'
): Promise<Blob> {
  if (typeof OffscreenCanvas !== 'undefined') {
    const canvas = new OffscreenCanvas(width, height)
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('OffscreenCanvas 2D context unavailable')
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, width, height)

    if (sharpenStrength > 0) {
      applyPerceptualSharpening(ctx, width, height, sharpenStrength)
    }

    return canvas.convertToBlob({ type: mimeType, quality })
  }

  // Fallback to standard DOM canvas
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('HTMLCanvasElement 2D context unavailable')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, width, height)

  if (sharpenStrength > 0) {
    applyPerceptualSharpening(ctx, width, height, sharpenStrength)
  }

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob)
        else reject(new Error('Canvas toBlob conversion failed'))
      },
      mimeType,
      quality
    )
  })
}

/**
 * Generates an ultra-low-resolution base64 data-URL for zero-CLS blur placeholders (LQIP)
 */
async function generateBlurDataUrl(img: CanvasImageSource): Promise<string> {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 24
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'low'
  ctx.drawImage(img, 0, 0, 24, 24)
  return canvas.toDataURL('image/webp', 0.22)
}

/**
 * Creates high-performance WebP variants (thumbnail, medium, large) + micro-blur placeholder
 * using Meta-Grade Perceptual Compression (HVS-tuned quality matrix + post-downscale micro-sharpening).
 */
export async function createImageVariants(file: File | Blob): Promise<ImageVariantsResult> {
  let sourceImage: HTMLImageElement | ImageBitmap

  if (typeof createImageBitmap !== 'undefined') {
    sourceImage = await createImageBitmap(file)
  } else {
    sourceImage = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const naturalWidth = sourceImage.width
  const naturalHeight = sourceImage.height

  // 1. Thumbnail: max 400px (ideal for product cards, homepage grids)
  // Perceptual tuning: 0.72 quality + 0.16 micro-sharpening (compensates for small pixel area)
  const thumbDim = calculateDimensions(naturalWidth, naturalHeight, 400, 400)
  const thumbBlob = await exportResizedBlob(sourceImage, thumbDim.width, thumbDim.height, 0.72, 0.16)

  // 2. Medium: max 800px (ideal for category catalogs, tablets, modals)
  // Perceptual tuning: 0.75 quality + 0.12 micro-sharpening
  const medDim = calculateDimensions(naturalWidth, naturalHeight, 800, 800)
  const mediumBlob = await exportResizedBlob(sourceImage, medDim.width, medDim.height, 0.75, 0.12)

  // 3. Large: max 1440px (ideal for hero zoom, detail lightbox)
  // Perceptual tuning: 0.78 quality + 0.08 micro-sharpening (retains crisp vector/font details)
  const largeDim = calculateDimensions(naturalWidth, naturalHeight, 1440, 1440)
  const largeBlob = await exportResizedBlob(sourceImage, largeDim.width, largeDim.height, 0.78, 0.08)

  // 4. Blur placeholder (24px micro-image, ~400 bytes)
  const blurDataUrl = await generateBlurDataUrl(sourceImage)

  // Cleanup object URL if allocated
  if ('close' in sourceImage && typeof sourceImage.close === 'function') {
    sourceImage.close()
  }

  const originalSize = file.size
  const compressedTotalSize = thumbBlob.size + mediumBlob.size + largeBlob.size
  const savingsPercent = originalSize > 0 ? Math.max(0, Math.round(((originalSize - compressedTotalSize) / originalSize) * 100)) : 0

  return {
    original: file,
    thumb: thumbBlob,
    medium: mediumBlob,
    large: largeBlob,
    blurDataUrl,
    width: naturalWidth,
    height: naturalHeight,
    originalSize,
    compressedTotalSize,
    savingsPercent,
    thumbSize: thumbBlob.size,
    mediumSize: mediumBlob.size,
    largeSize: largeBlob.size,
  }
}

/**
 * Builds an edge-optimized URL for any image source (R2 internal API or Unsplash/CDN)
 */
export function buildOptimizedImageUrl(
  src: string,
  options?: {
    variant?: VariantType
    width?: number
    quality?: number
    format?: 'avif' | 'webp' | 'auto'
  }
): string {
  if (!src) return ''

  const variant = options?.variant || 'thumbnail'
  const width = options?.width
  const quality = options?.quality || 82

  // Handle Unsplash imagery
  if (src.includes('images.unsplash.com')) {
    const url = new URL(src)
    url.searchParams.set('auto', 'format')
    url.searchParams.set('fit', 'crop')
    url.searchParams.set('q', quality.toString())
    if (width) {
      url.searchParams.set('w', width.toString())
    } else {
      const defaultW = variant === 'thumbnail' || variant === 'thumb' ? 400 : variant === 'medium' ? 800 : 1400
      url.searchParams.set('w', defaultW.toString())
    }
    return url.toString()
  }

  // Handle internal R2 /api/images/ route
  if (src.startsWith('/api/images/')) {
    const [base, existingQuery] = src.split('?')
    const params = new URLSearchParams(existingQuery || '')
    if (variant && variant !== 'original') {
      params.set('variant', variant === 'thumbnail' ? 'thumb' : variant)
    }
    if (width) {
      params.set('w', width.toString())
    }
    const qs = params.toString()
    return qs ? `${base}?${qs}` : base
  }

  // Other static or local assets
  return src
}

/**
 * Builds a responsive srcset string with thumbnail (400w), medium (800w), and large (1400w)
 */
export function buildSrcSet(src: string): string {
  if (!src) return ''

  // For Unsplash or R2 images, build multi-density srcset
  if (src.includes('images.unsplash.com') || src.startsWith('/api/images/')) {
    return [
      `${buildOptimizedImageUrl(src, { variant: 'thumb', width: 400 })} 400w`,
      `${buildOptimizedImageUrl(src, { variant: 'medium', width: 800 })} 800w`,
      `${buildOptimizedImageUrl(src, { variant: 'large', width: 1400 })} 1400w`,
    ].join(', ')
  }

  return ''
}
