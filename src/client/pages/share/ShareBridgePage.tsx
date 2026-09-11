// src/client/pages/share/ShareBridgePage.tsx — Instant Millisecond Direct Redirect
import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '../../lib/api'

export default function ShareBridgePage() {
  const { uid } = useParams<{ uid: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    if (!uid) {
      navigate('/products', { replace: true })
      return
    }

    try {
      sessionStorage.setItem('tvh_unmute_video', 'true')
      sessionStorage.setItem('tvh_from_share', 'true')
      sessionStorage.setItem('tvh_share_uid', uid)
    } catch { }

    let isMounted = true
    api.share.getByUid(uid)
      .then((res) => {
        if (!isMounted) return
        if (res?.success && res.product?.slug) {
          const targetUrl = `/product/${encodeURIComponent(res.product.slug)}?ref=share&uid=${encodeURIComponent(uid)}&play=1`
          window.location.replace(targetUrl)
        } else {
          navigate('/products', { replace: true })
        }
      })
      .catch(() => {
        if (isMounted) {
          navigate('/products', { replace: true })
        }
      })

    return () => {
      isMounted = false
    }
  }, [uid, navigate])

  // Seamless zero-latency dark canvas — no intermediate cards or countdowns shown
  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        backgroundColor: '#090D16',
      }}
    />
  )
}

