// ============================================
// src/routes/admin/middleware.ts
// Firebase Auth & RBAC Middleware for Admin routes
// ============================================

import { createMiddleware } from 'hono/factory'
import { verifyFirebaseIdToken, extractBearerToken } from '../../lib/firebase-admin'
import type { Env } from '../../worker'

export type AdminVars = {
  adminUid: string
  adminEmail: string
  adminName?: string
  adminRole?: string
}

export const adminAuthMiddleware = createMiddleware<{
  Bindings: Env
  Variables: AdminVars
}>(async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const token = extractBearerToken(authHeader)

  if (!token) {
    return c.json({ error: 'Unauthorized — No token provided' }, 401)
  }

  try {
    const decoded = await verifyFirebaseIdToken(token, c.env.FIREBASE_PROJECT_ID)

    // Check if this Firebase user is in our admins table
    let admin = await c.env.DB.prepare(
      `SELECT * FROM admins WHERE firebase_uid = ? AND is_active = 1`
    ).bind(decoded.uid).first() as { firebase_uid: string; email: string; name?: string; role?: string } | null

    if (!admin) {
      // Check total admin count — if 0 admins exist, auto-provision first Firebase login as super_admin
      const countRes = await c.env.DB.prepare(`SELECT COUNT(*) as c FROM admins`).first() as { c: number } | null
      if (!countRes || countRes.c === 0) {
        await c.env.DB.prepare(
          `INSERT INTO admins (firebase_uid, email, name, role, is_active) VALUES (?, ?, ?, 'super_admin', 1)`
        ).bind(decoded.uid, decoded.email || 'admin@1024teraviralhub.com', decoded.name || 'Master Admin').run()

        admin = {
          firebase_uid: decoded.uid,
          email: decoded.email || 'admin@1024teraviralhub.com',
          name: decoded.name || 'Master Admin',
          role: 'super_admin',
        }
      } else {
        return c.json({ error: 'Unauthorized — Account is not registered as an active admin' }, 403)
      }
    }

    c.set('adminUid', decoded.uid)
    c.set('adminEmail', decoded.email ?? admin.email)
    c.set('adminName', decoded.name ?? admin.name)
    c.set('adminRole', admin.role ?? 'super_admin')

    // Update last login
    await c.env.DB.prepare(
      `UPDATE admins SET last_login = datetime('now') WHERE firebase_uid = ?`
    ).bind(decoded.uid).run()

    await next()
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Token verification failed'
    return c.json({ error: `Unauthorized — ${message}` }, 401)
  }
})

export function requireRole(allowedRoles: string[]) {
  return createMiddleware<{
    Bindings: Env
    Variables: AdminVars
  }>(async (c, next) => {
    const role = c.get('adminRole') || 'admin'
    if (role === 'super_admin' || allowedRoles.includes(role)) {
      return await next()
    }
    return c.json({ error: `Forbidden — Requires one of: ${allowedRoles.join(', ')}` }, 403)
  })
}
