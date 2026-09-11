// src/client/pages/payment/PaymentProcessingPage.tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { saveOrderSession } from '../../lib/orderSession'

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
          saveOrderSession({ orderNumber, token: result.download_token, createdAt: Date.now() })
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
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#F4F5F9',
      flexDirection: 'column',
      padding: 24,
      fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
    }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        style={{
          width: 34,
          height: 34,
          borderRadius: '50%',
          border: '3.5px solid #E2E8F0',
          borderTop: '3.5px solid #1E50D8',
          marginBottom: 20,
        }}
      />
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ fontWeight: 600, fontSize: '1.25rem', color: '#2D3748', marginBottom: 8, letterSpacing: '-0.01em' }}>
          Redirecting..
        </h2>
        <p style={{ color: '#A0AEC0', fontSize: '0.875rem', margin: 0 }}>
          Please do not press back or home button
        </p>
      </div>
    </div>
  )
}
