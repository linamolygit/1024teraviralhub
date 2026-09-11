import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Mail, Eye, EyeOff, Package } from 'lucide-react'
import { useAuthStore } from '../../lib/auth-store'
import { useSiteConfig } from '../../lib/site-config'
import { adminToast } from '../../lib/admin-toast'
import AppleGlassToastContainer from '../../components/admin/AppleGlassToast'

export default function AdminLoginPage() {
  const { siteName } = useSiteConfig()
  const navigate = useNavigate()
  const { user, initialized, signIn } = useAuthStore()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // If already logged in, redirect straight to admin dashboard
  useEffect(() => {
    if (initialized && user) {
      navigate('/admin', { replace: true })
    }
  }, [initialized, user, navigate])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      await signIn(email, password)
      adminToast.success('Welcome Back', 'Logged in as administrator')
      navigate('/admin', { replace: true })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      const friendlyMsg =
        msg.includes('invalid-credential') || msg.includes('wrong-password')
          ? 'Invalid email or password'
          : msg.includes('too-many-requests')
          ? 'Too many attempts. Please try again later.'
          : 'Login failed. Please try again.'
      setError(friendlyMsg)
      adminToast.error('Authentication Failed', friendlyMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%), var(--bg-base)',
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 14, background: 'var(--grad-cta)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
          }}>
            <Package size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: 4 }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>{siteName}</p>
        </div>

        <div className="glass-card" style={{ padding: 32 }}>
          <h2 style={{ fontWeight: 700, marginBottom: 24, fontSize: '1.0625rem' }}>
            <Lock size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} />
            Sign In
          </h2>

          {error && <div className="alert alert-error" style={{ marginBottom: 20, fontSize: '0.875rem' }}>{error}</div>}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="admin-email"
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: 40 }}
                  placeholder="admin@yourdomain.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', marginBottom: 6, color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  id="admin-password"
                  type={showPwd ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingLeft: 40, paddingRight: 40 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '14px', marginTop: 8, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in...' : 'Sign In to Dashboard'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
          Authorized personnel only
        </p>
      </motion.div>

      {/* Modern Apple Glass Toast Container */}
      <AppleGlassToastContainer />
    </div>
  )
}
