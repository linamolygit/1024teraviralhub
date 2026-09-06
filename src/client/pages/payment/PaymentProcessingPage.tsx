// src/client/pages/payment/PaymentProcessingPage.tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'

export default function PaymentProcessingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const orderNumber = searchParams.get('order')
  const [attempts, setAttempts] = useState(0)
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    if (!orderNumber) {
      navigate('/payment/failed')
      return
    }

    let timer: ReturnType<typeof setTimeout>
    let count = 0

    const verify = async () => {
      count++
      setAttempts(count)

      try {
        const result = await api.checkout.verify(orderNumber)

        if (result.status === 'PAID' && result.download_token) {
          navigate(`/payment/success?order=${orderNumber}&token=${result.download_token}`)
          return
        }

        if (result.status === 'FAILED') {
          navigate(`/payment/failed?order=${orderNumber}`)
          return
        }

        // Still pending — retry
        if (count < 10) {
          setMessage(count > 3 ? 'Still verifying... please wait.' : 'Verifying your payment...')
          timer = setTimeout(verify, 2000)
        } else {
          navigate(`/payment/processing/timeout?order=${orderNumber}`)
        }
      } catch {
        if (count < 10) {
          timer = setTimeout(verify, 3000)
        } else {
          navigate(`/payment/failed?order=${orderNumber}`)
        }
      }
    }

    // Initial delay to let Cashfree process
    timer = setTimeout(verify, 1500)
    return () => clearTimeout(timer)
  }, [orderNumber, navigate])

  return (
    <div style={{
      minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-base)', flexDirection: 'column', gap: 24, padding: 20,
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
        style={{
          width: 64, height: 64, borderRadius: '50%',
          border: '4px solid rgba(124,58,237,0.2)',
          borderTop: '4px solid var(--brand-purple)',
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 800, fontSize: '1.25rem', marginBottom: 8 }}>Processing Payment</h2>
        <p style={{ color: 'var(--text-muted)' }}>{message}</p>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 8 }}>
          Do not close this window · Attempt {attempts}/10
        </p>
      </div>
      {orderNumber && (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Order: {orderNumber}</div>
      )}
    </div>
  )
}
