// src/client/lib/hash-utils.ts — High-Performance Client-Side Crypto Hashing for Deduplication

/**
 * Computes the SHA-256 cryptographic hash of a File or Blob in the browser
 * using the native Web Crypto API (fast, hardware-accelerated).
 */
export async function computeFileHash(file: File | Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  return computeBufferHash(buffer)
}

/**
 * Computes the SHA-256 cryptographic hash of an ArrayBuffer.
 */
export async function computeBufferHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Human-readable byte size formatter (e.g. "1.24 MB", "350 KB")
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes <= 0) return '0 B'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
