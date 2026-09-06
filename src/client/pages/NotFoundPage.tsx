// src/client/pages/NotFoundPage.tsx
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '60px 20px', textAlign: 'center',
    }}>
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <div style={{
          fontSize: 'clamp(4rem, 12vw, 8rem)', fontWeight: 900,
          background: 'var(--grad-brand)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          lineHeight: 1, marginBottom: 16,
        }}>
          404
        </div>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 12 }}>Page Not Found</h1>
        <p style={{ color: 'var(--text-muted)', maxWidth: 460, margin: '0 auto 32px', lineHeight: 1.6 }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/" className="btn-primary">
            <Home size={18} /> Back to Home
          </Link>
          <Link to="/products" className="btn-ghost">
            <Search size={18} /> Browse Products
          </Link>
        </div>
      </motion.div>
    </div>
  )
}
