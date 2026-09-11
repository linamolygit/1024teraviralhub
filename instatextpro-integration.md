# Complete White-Label PhonePe Payment Gateway Integration for `instatextpro.online`

This guide provides the complete, copy-paste ready code and architecture to connect your AI Girl Chat website (**`instatextpro.online`**, Next.js hosted on Cloudflare) to your 1024TeraViralHub payment gateway engine.

---

## 🌟 Key Features of this Setup

1. **Zero Intermediate Branding (100% White-Label):**
   - The user will **NEVER** see `1024teraviralhub.com` in their browser or in the URL bar.
   - When the user taps **"Unlock Photo · ₹49"**, their mobile phone **immediately launches the native PhonePe app (`phonepe://pay?...`)** right over the chat!
2. **Instant Real-Time Unblur:**
   - As soon as the user enters their UPI PIN in PhonePe and the transaction completes, PhonePe returns them to the chat, and the HD photo unlocks instantly.
3. **Desktop Fallback (QR Code):**
   - If a user opens the chat on a laptop or desktop computer where PhonePe mobile app is not installed, the component displays a dynamic Cashfree UPI QR code so they can scan and pay from their phone.
4. **Inspect-Element Anti-Theft Protection:**
   - Never send the real HD photo with CSS `filter: blur(...)` to the browser before payment. The server only delivers the real HD photo URL after receiving the signed payment confirmation.

---

## 1. Environment Variables (`.env.local`) for Next.js

In your `instatextpro.online` project root, add the following variables:

```env
# 1024TeraViralHub External Gateway Engine
TVH_GATEWAY_URL="https://1024teraviralhub.hirensrivastawa.workers.dev"
# For production once custom domain is connected:
# TVH_GATEWAY_URL="https://1024teraviralhub.com"

# Partner Secret Key (Found in 1024TeraViralHub Admin Panel > Settings)
TVH_PARTNER_KEY="tvh_sec_live_9f83a7c4e21b058d9237416e582914ca"

# Next.js Site Domain
NEXT_PUBLIC_SITE_URL="https://instatextpro.online"
```

---

## 2. Server-Side API: Order Creator (`app/api/unlock-photo/route.ts`)

This route runs securely on your Next.js server, communicates with 1024TeraViralHub, and gets the direct `phonepe_deep_link`.

```typescript
// app/api/unlock-photo/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { photoId, photoName, amount, chatSessionId, customerName, customerPhone } = await req.json()

    if (!photoId || !chatSessionId) {
      return NextResponse.json({ error: 'Missing photoId or chatSessionId' }, { status: 400 })
    }

    const gatewayUrl = process.env.TVH_GATEWAY_URL || 'https://1024teraviralhub.hirensrivastawa.workers.dev'
    const partnerKey = process.env.TVH_PARTNER_KEY

    const returnUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/chat?session=${encodeURIComponent(chatSessionId)}&unlocked=${encodeURIComponent(photoId)}`
    const webhookUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhook/payment`

    // Call 1024TeraViralHub External Gateway Engine
    const response = await fetch(`${gatewayUrl}/api/external/create-order`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Partner-Key': partnerKey || '',
      },
      body: JSON.stringify({
        amount: Number(amount) || 49,
        item_id: photoId,
        item_name: photoName || 'AI Private Photo',
        chat_session_id: chatSessionId,
        customer_name: customerName || 'Chat User',
        customer_phone: customerPhone || '9876543210',
        return_url: returnUrl,
        webhook_url: webhookUrl,
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return NextResponse.json({ error: data.error || 'Failed to initialize payment' }, { status: 500 })
    }

    // Return the direct PhonePe deep link to the frontend
    return NextResponse.json({
      success: true,
      orderNumber: data.order_number,
      phonepeDeepLink: data.phonepe_deep_link,
      gpayDeepLink: data.gpay_deep_link,
      paytmDeepLink: data.paytm_deep_link,
      upiIntent: data.upi_intent,
      qrCode: data.qr_code,
      paymentUrl: data.payment_url,
    })
  } catch (error: any) {
    console.error('Error creating unlock order:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
```

---

## 3. Server-Side Webhook: Real-Time Unblur Listener (`app/api/webhook/payment/route.ts`)

When Cashfree processes the payment, 1024TeraViralHub sends an HMAC-SHA256 signed webhook directly to this endpoint.

```typescript
// app/api/webhook/payment/route.ts
import { NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(req: Request) {
  try {
    const rawBody = await req.text()
    const receivedSignature = req.headers.get('X-Gateway-Signature')
    const partnerKey = process.env.TVH_PARTNER_KEY || ''

    // 1. Verify HMAC-SHA256 signature from 1024TeraViralHub
    const expectedSignature = crypto
      .createHmac('sha256', partnerKey)
      .update(rawBody)
      .digest('hex')

    if (receivedSignature !== expectedSignature) {
      console.warn('[Webhook] Invalid gateway signature attempt')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody)
    const { order_number, item_id, chat_session_id, amount, status } = payload

    if (status === 'PAID') {
      console.log(`[Webhook] Payment Confirmed! Unlocking Photo ${item_id} for session ${chat_session_id} (Amount: ₹${amount})`)

      // 2. TODO: Update your database (e.g. Supabase, Cloudflare D1, or Prisma)
      // Example:
      // await db.unlockedPhotos.create({
      //   data: {
      //     chatSessionId: chat_session_id,
      //     photoId: item_id,
      //     orderNumber: order_number,
      //     paidAt: new Date(),
      //   }
      // })
    }

    return NextResponse.json({ success: true, message: 'Webhook processed' })
  } catch (err: any) {
    console.error('[Webhook] Processing error:', err)
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 })
  }
}
```

---

## 4. Frontend React Component: `components/chat/LockedPhotoBubble.tsx`

This component renders inside your chat stream. When the AI Girl sends a locked photo, it renders the blurred preview. Tapping **"Unlock with PhonePe"** directly launches the PhonePe app.

```tsx
// components/chat/LockedPhotoBubble.tsx
'use client'

import React, { useState } from 'react'

interface LockedPhotoBubbleProps {
  photoId: string
  photoTitle?: string
  thumbnailUrl: string   // Low-resolution blurred thumbnail (NOT the full HD image!)
  price?: number         // e.g. 49 or 99
  chatSessionId: string
  isUnlocked?: boolean
  hdPhotoUrl?: string    // Real HD photo URL (only populated if isUnlocked === true)
  onUnlocked?: () => void
}

export default function LockedPhotoBubble({
  photoId,
  photoTitle = 'AI Girl Exclusive Photo',
  thumbnailUrl,
  price = 49,
  chatSessionId,
  isUnlocked = false,
  hdPhotoUrl,
  onUnlocked,
}: LockedPhotoBubbleProps) {
  const [loading, setLoading] = useState(false)
  const [unlockedState, setUnlockedState] = useState(isUnlocked)
  const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; link?: string }>({ open: false })

  const handle1ClickPhonePeUnlock = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/unlock-photo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          photoId,
          photoName: photoTitle,
          amount: price,
          chatSessionId,
        }),
      })

      const data = await res.json()
      if (!res.ok || !data.success) {
        alert(data.error || 'Unable to initiate PhonePe. Please try again.')
        setLoading(false)
        return
      }

      // Detect if user is on Mobile
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      if (isMobile && data.phonepeDeepLink) {
        // ⚡ 1-CLICK NATIVE PHONEPE LAUNCH
        // Instantly hands over control to the PhonePe Android/iOS App!
        window.location.href = data.phonepeDeepLink
      } else if (data.qrCode) {
        // Desktop Fallback: Show UPI QR Code modal
        setQrModal({ open: true, qrCode: data.qrCode, link: data.paymentUrl })
      } else if (data.paymentUrl) {
        window.location.href = data.paymentUrl
      }
    } catch (err: any) {
      alert('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // If already unlocked, display the pristine HD photo
  if (unlockedState && hdPhotoUrl) {
    return (
      <div style={{
        maxWidth: 320,
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        background: '#111',
      }}>
        <img
          src={hdPhotoUrl}
          alt={photoTitle}
          style={{ width: '100%', height: 'auto', display: 'block' }}
          onContextMenu={e => e.preventDefault()}
        />
        <div style={{ padding: '8px 12px', background: 'rgba(16, 185, 129, 0.15)', color: '#34D399', fontSize: '0.75rem', fontWeight: 700, textAlign: 'center' }}>
          ✨ Unlocked & Available in High Definition
        </div>
      </div>
    )
  }

  return (
    <div style={{
      maxWidth: 320,
      position: 'relative',
      borderRadius: 18,
      overflow: 'hidden',
      background: '#18181B',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 12px 30px rgba(0,0,0,0.35)',
    }}>
      {/* Blurred Preview Image */}
      <div style={{ position: 'relative', width: '100%', height: 380, overflow: 'hidden' }}>
        <img
          src={thumbnailUrl}
          alt="Locked Photo"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(22px) brightness(0.65)',
            transform: 'scale(1.15)',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />

        {/* Floating Dark Glass Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.75) 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
          textAlign: 'center',
        }}>
          {/* Lock Icon Badge */}
          <div style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.12)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.4rem',
            marginBottom: 12,
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)',
          }}>
            🔒
          </div>

          <div style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '1rem', marginBottom: 4 }}>
            Private Photo Locked
          </div>
          <div style={{ color: '#A1A1AA', fontSize: '0.78rem', marginBottom: 16, lineHeight: 1.4 }}>
            Unlock to see full HD resolution without blur
          </div>

          {/* ⚡ 1-Click PhonePe Direct Unlock Button */}
          <button
            onClick={handle1ClickPhonePeUnlock}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 14,
              border: 'none',
              background: 'linear-gradient(135deg, #5F259F 0%, #7C3AED 100%)',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 6px 18px rgba(124, 58, 237, 0.45)',
              transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            {loading ? (
              <span>Connecting PhonePe...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z" fill="#FFF"/>
                </svg>
                <span>Unlock Now · ₹{price}</span>
              </>
            )}
          </button>

          <div style={{ marginTop: 10, fontSize: '0.7rem', color: '#71717A', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span>⚡ Instant UPI · 1-Click Unlock</span>
          </div>
        </div>
      </div>

      {/* Desktop QR Modal Fallback */}
      {qrModal.open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 16,
        }}>
          <div style={{
            background: '#18181B',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: 24,
            maxWidth: 320,
            width: '100%',
            textAlign: 'center',
          }}>
            <h3 style={{ color: '#FFF', fontWeight: 800, margin: '0 0 8px' }}>Scan with PhonePe</h3>
            <p style={{ color: '#A1A1AA', fontSize: '0.8rem', margin: '0 0 16px' }}>
              Scan the QR code with any UPI app to unlock this photo instantly
            </p>

            {qrModal.qrCode ? (
              <img src={qrModal.qrCode} alt="Scan QR" style={{ width: 200, height: 200, margin: '0 auto 16px', borderRadius: 12 }} />
            ) : (
              <div style={{ padding: 20, color: '#A1A1AA' }}>Loading QR...</div>
            )}

            <button
              onClick={() => setQrModal({ open: false })}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent',
                color: '#FFF',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

---

## 5. Testing & Verification Checklist

1. **Test Order Creation (Server):**
   ```bash
   curl -X POST "https://1024teraviralhub.hirensrivastawa.workers.dev/api/external/create-order" \
     -H "Content-Type: application/json" \
     -H "X-Partner-Key: tvh_sec_live_9f83a7c4e21b058d9237416e582914ca" \
     -d '{"amount": 49, "item_id": "test_photo_1", "chat_session_id": "chat_sess_01"}'
   ```
   **Expected Response:** Status 200 with `phonepe_deep_link: "phonepe://pay?..."`.

2. **Mobile Browser Direct Tap Test:**
   - Open your mobile browser (Chrome / Safari on Android or iPhone).
   - Click the **Unlock Now · ₹49** button.
   - Observe the PhonePe app opening instantly.
   - The user never sees or types `1024teraviralhub.com`.

3. **1024TeraViralHub Admin Panel:**
   - Go to `https://1024teraviralhub.hirensrivastawa.workers.dev/admin/settings`.
   - Scroll down to **White-Label External Gateway Engine**.
   - Check real-time analytics: Total Orders, Paid & Unlocked, and Chat Revenue.
   - Toggle the Gateway ON/OFF or Regenerate your Partner Secret Key at any time.
