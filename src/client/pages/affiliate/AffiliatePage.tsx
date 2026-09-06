// src/client/pages/affiliate/AffiliatePage.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import { DollarSign, Share2, TrendingUp, CheckCircle, Copy, Sparkles, Shield } from 'lucide-react'

export default function AffiliatePage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [upiId, setUpiId] = useState('')
  const [loading, setLoading] = useState(false)
  const [affiliateData, setAffiliateData] = useState<{ code: string; referral_link: string; commission_percent: number } | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/affiliates/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, upi_id: upiId }),
      })
      const data = (await res.json()) as any
      if (data.success) {
        setAffiliateData(data)
      } else {
        setError(data.error || 'Failed to register')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyLink = () => {
    if (affiliateData?.referral_link) {
      navigator.clipboard.writeText(affiliateData.referral_link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  return (
    <div className="section">
      <div className="container" style={{ maxWidth: 880 }}>
        {/* Hero */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <span className="badge badge-purple" style={{ marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Sparkles size={14} /> Creator Affiliate Program
          </span>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 2.75rem)', fontWeight: 900, marginBottom: 16 }}>
            Earn <span className="gradient-text">20% Commission</span> on Every Sale
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.0625rem', maxWidth: 600, margin: '0 auto', lineHeight: 1.6 }}>
            Promote premium viral reels, photo packs, templates, and digital assets. Get paid directly via instant UPI.
          </p>
        </div>

        {/* Benefits Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 48 }}>
          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand-purple-light)' }}>
              <TrendingUp size={24} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>High Conversion Rate</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Optimized 1-Click PhonePe/UPI landing pages convert impulse buyers easily.</p>
          </div>

          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--brand-amber)' }}>
              <DollarSign size={24} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Instant UPI Payouts</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Direct earnings transfer to your Google Pay, PhonePe, or Paytm UPI ID.</p>
          </div>

          <div className="glass-card" style={{ padding: 24, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--success)' }}>
              <Share2 size={24} />
            </div>
            <h3 style={{ fontWeight: 700, marginBottom: 8 }}>Real-Time Tracking</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Track clicks, conversions, and commissions through your partner dashboard.</p>
          </div>
        </div>

        {/* Registration Box / Referral Link Display */}
        <div className="glass-card" style={{ padding: 36, maxWidth: 580, margin: '0 auto' }}>
          {affiliateData ? (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(16,185,129,0.2)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <CheckCircle size={32} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Welcome Partner!</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 24 }}>
                Your unique affiliate partner code is <strong>{affiliateData.code}</strong>
              </p>

              <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--bg-border)', borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <input
                  readOnly
                  value={affiliateData.referral_link}
                  style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '0.875rem', width: '100%', outline: 'none' }}
                />
                <button onClick={copyLink} className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', flexShrink: 0 }}>
                  {copied ? <><CheckCircle size={14} /> Copied</> : <><Copy size={14} /> Copy Link</>}
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <span>💰 Commission: 20%</span>
                <span>⚡ Payout: Direct UPI</span>
                <span>📊 Auto Tracking</span>
              </div>
            </motion.div>
          ) : (
            <div>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: 8 }}>Join the Affiliate Program</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: 24 }}>
                Takes less than 30 seconds. Enter your name and UPI ID below.
              </p>

              {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Your Full Name</label>
                  <input className="input-field" placeholder="e.g. Aman Gupta" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Email Address</label>
                  <input type="email" className="input-field" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, marginBottom: 4 }}>Your UPI ID for Payouts</label>
                  <input className="input-field" placeholder="e.g. aman@okhdfcbank or 9876543210@ybl" value={upiId} onChange={e => setUpiId(e.target.value)} required />
                </div>

                <button type="submit" disabled={loading} className="btn-primary" style={{ padding: '14px', marginTop: 8 }}>
                  {loading ? 'Creating Partner Link...' : 'Generate My Affiliate Link (Free)'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
