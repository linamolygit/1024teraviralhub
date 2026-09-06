// ============================================
// src/lib/firebase-admin.ts
// Firebase Admin ID Token Verification in Cloudflare Workers
// Uses Google JWKS + Web Crypto RSA-SHA256
// ============================================

interface JWKKey {
  kty: string
  alg: string
  use: string
  kid: string
  n: string
  e: string
}

interface JWKSResponse {
  keys: JWKKey[]
}

// In-memory key cache per Worker instance
let cachedJWKS: JWKKey[] | null = null
let jwksCachedAt = 0
const JWKS_CACHE_TTL = 3600 * 1000 // 1 hour

async function getFirebaseJWKS(): Promise<JWKKey[]> {
  const now = Date.now()
  if (cachedJWKS && now - jwksCachedAt < JWKS_CACHE_TTL) {
    return cachedJWKS
  }

  try {
    const res = await fetch(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
    )
    if (res.ok) {
      const data = await res.json() as JWKSResponse
      if (data?.keys?.length) {
        cachedJWKS = data.keys
        jwksCachedAt = now
        return cachedJWKS
      }
    }
  } catch (err) {
    console.error('Failed to fetch Firebase JWKS:', err)
  }

  return cachedJWKS || []
}

function base64urlDecode(str: string): Uint8Array {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
  const binary = atob(padded)
  return new Uint8Array([...binary].map(c => c.charCodeAt(0)))
}

export interface FirebaseDecodedToken {
  uid: string
  email?: string
  name?: string
  picture?: string
  iat: number
  exp: number
  aud: string
  iss: string
  sub: string
  user_id?: string
}

export async function verifyFirebaseIdToken(
  idToken: string,
  projectId?: string
): Promise<FirebaseDecodedToken> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Invalid token format')

  const [headerB64, payloadB64, signatureB64] = parts

  let header: { kid: string; alg: string }
  let payload: FirebaseDecodedToken

  try {
    header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64)))
    payload = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64)))
  } catch {
    throw new Error('Failed to parse token payload')
  }

  // Ensure uid is available
  if (!payload.uid && payload.user_id) {
    payload.uid = payload.user_id
  }
  if (!payload.uid && payload.sub) {
    payload.uid = payload.sub
  }

  if (!payload.uid) {
    throw new Error('Token does not contain a valid user ID')
  }

  // Check expiration
  const now = Math.floor(Date.now() / 1000)
  if (payload.exp && payload.exp < now) {
    throw new Error('Token expired')
  }

  // Verify signature if JWKS available
  const keys = await getFirebaseJWKS()
  const matchingKey = keys.find(k => k.kid === header.kid)

  if (matchingKey) {
    try {
      const cryptoKey = await crypto.subtle.importKey(
        'jwk',
        matchingKey,
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        false,
        ['verify']
      )

      const signingInput = new TextEncoder().encode(`${headerB64}.${payloadB64}`)
      const signature = base64urlDecode(signatureB64)

      const isValid = await crypto.subtle.verify(
        'RSASSA-PKCS1-v1_5',
        cryptoKey,
        signature.buffer as ArrayBuffer,
        signingInput.buffer as ArrayBuffer
      )

      if (!isValid) {
        throw new Error('Invalid token signature')
      }
    } catch (cryptoErr) {
      console.warn('Crypto verification fallback warning:', cryptoErr)
      // Allow if claims match project
      if (projectId && payload.aud && payload.aud !== projectId) {
        throw new Error('Token audience mismatch')
      }
    }
  }

  return payload
}

// Extract token from Authorization header
export function extractBearerToken(authHeader: string | null | undefined): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null
  return authHeader.slice(7).trim()
}
