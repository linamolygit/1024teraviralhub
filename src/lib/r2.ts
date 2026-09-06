// ============================================
// src/lib/r2.ts — R2 Object Storage Helpers
// Signed URL generation for secure downloads
// ============================================

export type R2Context = { R2: R2Bucket }

// Upload a file to R2
export async function uploadToR2(
  r2: R2Bucket,
  key: string,
  data: ArrayBuffer | ReadableStream,
  options?: { contentType?: string; metadata?: Record<string, string> }
): Promise<void> {
  await r2.put(key, data, {
    httpMetadata: {
      contentType: options?.contentType ?? 'application/octet-stream',
    },
    customMetadata: options?.metadata,
  })
}

// Delete from R2
export async function deleteFromR2(r2: R2Bucket, key: string): Promise<void> {
  await r2.delete(key)
}

// Generate a temporary signed URL for download
// R2 native presigned URL (1-5 minute TTL for security)
export async function getSignedDownloadUrl(
  r2: R2Bucket,
  key: string,
  expiresInSeconds = 60
): Promise<string | null> {
  const object = await r2.get(key)
  if (!object) return null

  // For Cloudflare Workers, we use a temporary URL approach
  // In production, use R2.createSignedUrl() or proxy through Worker
  // For now, we serve through our Worker endpoint with a short-lived token
  return `/api/download/file/${encodeURIComponent(key)}?t=${Date.now()}&exp=${Date.now() + expiresInSeconds * 1000}`
}

// Get file from R2 to stream to client
export async function getR2Object(r2: R2Bucket, key: string): Promise<R2ObjectBody | null> {
  return r2.get(key)
}

// Check if file exists in R2
export async function r2FileExists(r2: R2Bucket, key: string): Promise<boolean> {
  const obj = await r2.head(key)
  return obj !== null
}

// Generate a structured R2 key
export function makeProductFileKey(productId: number, filename: string): string {
  return `products/${productId}/files/${Date.now()}-${sanitizeFilename(filename)}`
}

export function makeProductImageKey(productId: number, filename: string): string {
  return `products/${productId}/images/${Date.now()}-${sanitizeFilename(filename)}`
}

export type ImageVariant = 'thumb' | 'medium' | 'large' | 'original'

// Derive a variant key from an original key, e.g. "products/1/images/file.png" -> "products/1/images/file.thumb.webp"
export function getVariantR2Key(originalKey: string, variant: ImageVariant): string {
  if (variant === 'original') return originalKey
  const lastDot = originalKey.lastIndexOf('.')
  const basePath = lastDot > 0 ? originalKey.substring(0, lastDot) : originalKey
  return `${basePath}.${variant}.webp`
}

export function makeBlogImageKey(filename: string): string {
  return `blog/images/${Date.now()}-${sanitizeFilename(filename)}`
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_').toLowerCase()
}

// Max file sizes
export const MAX_PRODUCT_FILE_SIZE = 500 * 1024 * 1024  // 500 MB
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024           // 10 MB

// Allowed image types
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Allowed product file types
export const ALLOWED_PRODUCT_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
  'application/pdf',
  'application/zip', 'application/x-zip-compressed',
  'application/x-rar-compressed',
  'application/x-7z-compressed',
  'application/octet-stream',
]
