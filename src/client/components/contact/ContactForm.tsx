// src/client/components/contact/ContactForm.tsx — Production Contact & Support Inquiry Form
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Send, CheckCircle2, AlertCircle, RefreshCw, HelpCircle, WifiOff, ShieldCheck } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { api } from '../../lib/api'

export default function ContactForm() {
  const [searchParams] = useSearchParams()
  const initialOrder = searchParams.get('order') || ''
  const initialType = searchParams.get('type') || (initialOrder ? 'payment' : 'general')

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [inquiryType, setInquiryType] = useState(initialType)
  const [orderRef, setOrderRef] = useState(initialOrder)
  const [subject, setSubject] = useState(initialOrder ? `Priority Assistance for Order #${initialOrder}` : '')
  const [message, setMessage] = useState(
    initialOrder
      ? `Hi Support Team, I completed payment for Order #${initialOrder}. Please assist me with my digital download access.`
      : ''
  )

  useEffect(() => {
    if (initialOrder) {
      setOrderRef(initialOrder)
      setInquiryType('payment')
      if (!subject) setSubject(`Priority Assistance for Order #${initialOrder}`)
      if (!message) {
        setMessage(`Hi Support Team, I completed payment for Order #${initialOrder}. Please assist me with my digital download access.`)
      }
    }
  }, [initialOrder])

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [isRateLimited, setIsRateLimited] = useState(false)

  // Show order reference input if user selects purchase, download, or payment inquiry
  const showOrderRef = ['purchase', 'download', 'payment', 'refund'].includes(inquiryType)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return

    // Offline check
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setError("You're currently offline. Please check your internet connection and try again.")
      return
    }

    // Client-side validation
    if (name.trim().length < 2) {
      setError('Please provide your full name (minimum 2 characters).')
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.')
      return
    }

    if (subject.trim().length < 3) {
      setError('Please provide a descriptive subject for your inquiry.')
      return
    }

    if (message.trim().length < 10) {
      setError('Your message is too short. Please provide at least 10 characters.')
      return
    }

    setLoading(true)
    setError('')
    setIsRateLimited(false)

    try {
      const res = await api.contact({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        inquiry_type: inquiryType,
        order_reference: orderRef.trim() || undefined,
        subject: subject.trim(),
        message: message.trim(),
      })

      if (res.success) {
        setSuccess(true)
        // Reset form data only on confirmed success
        setName('')
        setEmail('')
        setInquiryType('general')
        setOrderRef('')
        setSubject('')
        setMessage('')
      } else {
        throw new Error(res.message || 'Unable to submit your message.')
      }
    } catch (err: any) {
      console.error('Contact submission error:', err)
      const errorMsg = err instanceof Error ? err.message : String(err)

      if (errorMsg.includes('429') || errorMsg.toLowerCase().includes('rate limit') || errorMsg.toLowerCase().includes('too many')) {
        setIsRateLimited(true)
        setError('Too many requests. Please wait a moment before trying again.')
      } else {
        setError(errorMsg || 'Something went wrong while sending your message. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  // ── Success State Screen ──
  if (success) {
    return (
      <motion.div
        className="glass-card"
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          padding: '48px 24px',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          textAlign: 'center',
          background: 'var(--bg-surface)',
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            color: 'var(--success)',
          }}
        >
          <CheckCircle2 size={36} />
        </div>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
          Message Sent Successfully
        </h3>

        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.65, maxWidth: '440px', margin: '0 auto 28px' }}>
          Thank you for contacting us. We've received your message and will review your request.
        </p>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setSuccess(false)}
            className="btn-ghost"
            style={{ padding: '10px 20px', fontSize: '0.85rem' }}
          >
            Send Another Message
          </button>
          <Link
            to="/faq"
            className="btn-primary"
            style={{ padding: '10px 22px', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <HelpCircle size={15} /> Visit Help & FAQ
          </Link>
        </div>
      </motion.div>
    )
  }

  return (
    <div
      className="glass-card"
      style={{
        padding: '32px 28px',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--bg-border)',
        background: 'var(--bg-surface)',
      }}
    >
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>
        Send Us a Message
      </h2>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '24px', lineHeight: 1.5 }}>
        Fill out the form below and our support team will get in touch with you shortly.
      </p>

      {initialOrder && (
        <div
          style={{
            marginBottom: '20px',
            padding: '12px 16px',
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.85rem',
            color: 'var(--text-primary)',
          }}
        >
          <ShieldCheck size={18} color="var(--success)" style={{ flexShrink: 0 }} />
          <div>
            <strong>Priority Order Resolution:</strong> Order #{initialOrder} is linked to this ticket. Our grievance team will assist you directly.
          </div>
        </div>
      )}

      {error && (
        <div
          className="alert alert-error"
          style={{ marginBottom: '20px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}
          role="alert"
        >
          {isRateLimited ? <AlertCircle size={16} /> : <AlertCircle size={16} />}
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
        {/* Name & Email Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="contact-name" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Full Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="contact-name"
              type="text"
              className="input-field"
              placeholder="e.g. Priya Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div>
            <label htmlFor="contact-email" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              id="contact-email"
              type="email"
              className="input-field"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>
        </div>

        {/* Inquiry Type & Optional Order Reference */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label htmlFor="contact-inquiry-type" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Inquiry Type <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <select
              id="contact-inquiry-type"
              className="input-field"
              value={inquiryType}
              onChange={(e) => setInquiryType(e.target.value)}
              style={{ cursor: 'pointer' }}
            >
              <option value="general">General Question</option>
              <option value="product">Product Details & Specs</option>
              <option value="purchase">Purchase & Order Support</option>
              <option value="download">Download Link Problem</option>
              <option value="payment">Payment Issue</option>
              <option value="refund">Refund Question</option>
              <option value="other">Other Inquiry</option>
            </select>
          </div>

          <div>
            <label htmlFor="contact-order-ref" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Order / Payment Ref {showOrderRef ? <span style={{ color: 'var(--brand-amber)', fontSize: '0.75rem' }}>(Recommended)</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>(Optional)</span>}
            </label>
            <input
              id="contact-order-ref"
              type="text"
              className="input-field"
              placeholder="e.g. ORD-12345678"
              value={orderRef}
              onChange={(e) => setOrderRef(e.target.value)}
            />
          </div>
        </div>

        {/* Subject */}
        <div>
          <label htmlFor="contact-subject" style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Subject <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            id="contact-subject"
            type="text"
            className="input-field"
            placeholder="How can we help?"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
          />
        </div>

        {/* Message Textarea */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
            <label htmlFor="contact-message" style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
              Message <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              {message.length}/5000
            </span>
          </div>
          <textarea
            id="contact-message"
            className="input-field"
            rows={5}
            placeholder="Please describe your question or issue in detail..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={5000}
            required
            style={{ resize: 'vertical' }}
          />
        </div>

        {/* Privacy Note */}
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
          We use the information you provide to respond to your inquiry and provide support. Read our{' '}
          <Link to="/privacy-policy" style={{ color: 'var(--brand-purple-light)', textDecoration: 'underline' }}>
            Privacy Policy
          </Link>.
        </p>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="btn-primary"
          style={{
            padding: '14px 24px',
            fontSize: '0.9375rem',
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginTop: '6px',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}
        >
          {loading ? (
            <>
              <RefreshCw size={16} className="spin" /> Sending...
            </>
          ) : (
            <>
              <Send size={16} /> Send Message
            </>
          )}
        </button>
      </form>
    </div>
  )
}
