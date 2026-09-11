// src/client/pages/payment/PaymentProcessingPage.tsx
import { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { api } from '../../lib/api'
import { saveOrderSession } from '../../lib/orderSession'

export default function PaymentProcessingPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Extract order number from URL params or local active session
  const orderNumber =
    searchParams.get('order') ||
    searchParams.get('razorpay_payment_link_reference_id') ||
    searchParams.get('reference_id') ||
    searchParams.get('order_id') ||
    (typeof window !== 'undefined'
      ? sessionStorage.getItem('tvh_active_order_number') || localStorage.getItem('tvh_active_order_number')
      : null)

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
          try {
            localStorage.removeItem('tvh_active_order')
            sessionStorage.removeItem('tvh_active_order')
            localStorage.removeItem('tvh_active_order_number')
            sessionStorage.removeItem('tvh_active_order_number')
          } catch { }

          saveOrderSession({ orderNumber, token: result.download_token, createdAt: Date.now() })
          navigate(`/payment/success?order=${encodeURIComponent(orderNumber)}&token=${encodeURIComponent(result.download_token)}`, { replace: true })
          return
        }

        if (result.status === 'FAILED') {
          navigate(`/payment/failed?order=${encodeURIComponent(orderNumber)}`, { replace: true })
          return
        }

        // Still pending — retry up to 15 times (30 seconds total)
        if (count < 15) {
          setMessage(count > 3 ? 'Confirming payment with bank... please wait.' : 'Verifying your payment...')
          timer = setTimeout(verify, 2000)
        } else {
          navigate(`/payment/processing/timeout?order=${encodeURIComponent(orderNumber)}`, { replace: true })
        }
      } catch {
        if (count < 15) {
          timer = setTimeout(verify, 2500)
        } else {
          navigate(`/payment/failed?order=${encodeURIComponent(orderNumber)}`, { replace: true })
        }
      }
    }

    // Initial delay to let Razorpay/bank process
    timer = setTimeout(verify, 1000)
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
