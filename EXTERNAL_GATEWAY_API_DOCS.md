# 📖 1024TeraViralHub External Gateway API Documentation
### Multi-Site White-Label Payment Gateway Engine with 100% Cashfree Stealth Protection

Welcome to the **1024TeraViralHub External Gateway API**. This gateway engine allows your secondary websites (e.g. `instatextpro.online` AI Girl Chat, micro-SaaS apps, viral media sites) to process instant microtransactions (₹49–₹99+) with **Direct 1-Click PhonePe Native Launch** under 1024TeraViralHub's payment infrastructure.

---

## 📑 Table of Contents
1. [High-Level Architecture](#1-high-level-architecture)
2. [100% Cashfree Stealth Protection](#2-100-cashfree-stealth-protection)
3. [Authentication (`X-Partner-Key`)](#3-authentication)
4. [API Endpoints Reference](#4-api-endpoints-reference)
   - [A. Create Order (`POST /api/external/create-order`)](#a-create-order)
   - [B. Verify Order Status (`GET /api/external/verify-order/:orderNumber`)](#b-verify-order-status)
   - [C. Stealth Return Redirect (`GET /api/external/return`)](#c-stealth-return-redirect)
5. [Webhook Integration (Real-Time Unblur)](#5-webhook-integration)
   - [Webhook Signature Verification (HMAC-SHA256)](#webhook-signature-verification)
6. [Guest Mode Microtransaction Setup (No Login Required)](#6-guest-mode-microtransaction-setup)
7. [Ready-to-Use Code Snippets](#7-ready-to-use-code-snippets)

---

## 1. High-Level Architecture

```mermaid
sequenceDiagram
    autonumber
    actor Guest as Guest User on Mobile Phone
    participant Partner as instatextpro.online (Next.js / Cloudflare)
    participant Hub as 1024TeraViralHub Gateway Worker
    participant CF as Cashfree PG / Bank
    participant App as Native PhonePe App

    Guest->>Partner: Clicks "🔥 Unlock Photo · ₹49"
    Partner->>Hub: POST /api/external/create-order (amount: 49, chatSessionId, X-Partner-Key)
    Hub->>CF: Creates Order (Sanitized internal tags, 1024teraviralhub.com return_url)
    CF-->>Hub: Returns UPI Intent & phonepe://pay?... link
    Hub-->>Partner: Returns { phonepe_deep_link: "phonepe://..." }
    Partner->>App: window.location.href = phonepe_deep_link (Direct PhonePe Launch!)
    Note over App: PhonePe opens natively over browser. User enters UPI PIN.
    App->>CF: Payment captured
    CF->>Hub: Webhook POST /api/cashfree/webhook (status: PAID)
    Hub->>Partner: Signed Webhook POST /api/webhook/payment (HMAC-SHA256 verified)
    Partner->>Partner: Marks photo as UNLOCKED in guest session
    App-->>Hub: PhonePe redirects to 1024teraviralhub.com/api/external/return
    Hub-->>Partner: Instant 302 Redirect to instatextpro.online/chat?session=...
    Partner-->>Guest: Photo unblurs seamlessly into Crystal 4K HD!
```

---

## 2. 100% Cashfree Stealth Protection

Cashfree compliance and fraud auditing algorithms strictly monitor transaction sources. To ensure 100% safety of your Cashfree merchant account, the gateway enforces **Stealth Isolation**:

| Checked Attribute | What Cashfree Sees | Reality / Actual Target |
| :--- | :--- | :--- |
| **Merchant Name** | `1024TeraViralHub` | `1024TeraViralHub` |
| **Return URL** | `https://1024teraviralhub.com/api/external/return?order=EXT-XXX` | Redirects to `https://instatextpro.online/chat?...` within 40ms |
| **Order Meta** | `asset_type: 'digital_media_license'`, `bundle_code: 'TVH_VIP_DOWNLOAD'` | Third-party domain names are **never** sent |
| **Customer Email** | `buyer_xxxx@1024teraviralhub.com` (if guest) | Never leaks `@instatextpro.online` |
| **Notify URL** | `https://1024teraviralhub.com/api/cashfree/webhook` | 1024TeraViralHub securely forwards webhook to your site |

---

## 3. Authentication

Every API call from your partner website to 1024TeraViralHub must include your secret API key generated in the Admin Panel (`/admin/gateways`).

Send the key using either:
- **Header:** `X-Partner-Key: tvh_sec_live_xxxxxxxxxxxxxxxxxxxxxxxx`
- **Or Bearer Token:** `Authorization: Bearer tvh_sec_live_xxxxxxxxxxxxxxxxxxxxxxxx`

> [!WARNING]
> Keep your `X-Partner-Key` private on your server (`.env.local`). Never expose it in client-side browser JavaScript!

---

## 4. API Endpoints Reference

### Base URL
- **Production:** `https://1024teraviralhub.hirensrivastawa.workers.dev` (or your custom domain `https://1024teraviralhub.com`)

---

### A. Create Order
Creates a Cashfree payment session and generates a native PhonePe deep link.

- **Method:** `POST`
- **Path:** `/api/external/create-order`
- **Headers:**
  ```http
  Content-Type: application/json
  X-Partner-Key: tvh_sec_live_xxxxxxxxxxxxxxxxxxxxxxxx
  ```

#### Request Body (JSON)
| Field | Type | Required | Description | Example |
| :--- | :--- | :--- | :--- | :--- |
| `amount` | `number` | **Yes** | Amount in INR (min ₹1) | `49` |
| `item_id` | `string` | **Yes** | Unique identifier of photo / media | `"photo_vip_09"` |
| `item_name` | `string` | No | Human-readable item title | `"AI Girl 4K Photo"` |
| `chat_session_id` | `string` | **Yes** | Guest or user session identifier | `"guest_session_8819"` |
| `customer_name` | `string` | No | Customer name (defaults to guest) | `"Rahul"` |
| `customer_phone` | `string` | No | 10-digit mobile number | `"9876543210"` |
| `customer_email` | `string` | No | Customer email (defaults to stealth) | `"user@example.com"` |
| `return_url` | `string` | No | URL to redirect guest after PhonePe | `"https://instatextpro.online/chat?session=..."` |
| `webhook_url` | `string` | No | Custom webhook URL for this order | `"https://instatextpro.online/api/webhook/payment"` |

#### Response (200 OK)
```json
{
  "success": true,
  "order_number": "EXT-MTPWK7JF-5843",
  "amount": 49,
  "currency": "INR",
  "phonepe_deep_link": "phonepe://pay?pa=cashfree@bank&pn=1024TeraViralHub&am=49.00&tr=...",
  "gpay_deep_link": "upi://pay?pa=cashfree@bank...",
  "paytm_deep_link": "paytmmp://pay?pa=cashfree@bank...",
  "upi_intent": "upi://pay?pa=cashfree@bank...",
  "qr_code": "data:image/png;base64,...",
  "payment_url": "https://payments.cashfree.com/links/session_...",
  "return_url": "https://instatextpro.online/chat?session=guest_session_8819&order=EXT-MTPWK7JF-5843"
}
```

---

### B. Verify Order Status
Query real-time payment status directly from Cashfree and database.

- **Method:** `GET`
- **Path:** `/api/external/verify-order/:orderNumber`
- **Headers:**
  ```http
  X-Partner-Key: tvh_sec_live_xxxxxxxxxxxxxxxxxxxxxxxx
  ```

#### Response (200 OK - Paid)
```json
{
  "success": true,
  "order_number": "EXT-MTPWK7JF-5843",
  "status": "PAID",
  "unlocked": true,
  "item_id": "photo_vip_09",
  "chat_session_id": "guest_session_8819",
  "amount": 49
}
```

#### Response (200 OK - Still Pending)
```json
{
  "success": true,
  "order_number": "EXT-MTPWK7JF-5843",
  "status": "ACTIVE",
  "unlocked": false
}
```

---

### C. Stealth Return Redirect
Public browser endpoint where PhonePe returns the user. Cashfree only ever sees this URL.

- **Method:** `GET`
- **Path:** `/api/external/return?order=EXT-XXX`
- **Behavior:** Reads partner return URL from D1 and issues an instant `302 Found` redirect back to `https://instatextpro.online/chat?session=...&order=EXT-XXX`.

---

## 5. Webhook Integration

When Cashfree receives the payment, 1024TeraViralHub sends an **HMAC-SHA256 signed HTTP POST** notification to your partner site (`webhook_url`).

### Webhook Headers
```http
POST /api/webhook/payment
Content-Type: application/json
X-Gateway-Signature: 3a9f8b72c910df48e8945cf45a687f87f2e1a5d61f7b8893d67cf8e104e1c2a1
```

### Webhook Body Payload (JSON)
```json
{
  "event": "PAYMENT_SUCCESS",
  "status": "PAID",
  "order_number": "EXT-MTPWK7JF-5843",
  "item_id": "photo_vip_09",
  "chat_session_id": "guest_session_8819",
  "amount": 49,
  "currency": "INR",
  "timestamp": "2026-09-06T14:35:10.000Z"
}
```

### Webhook Signature Verification

To guarantee security, compute the HMAC-SHA256 hash of the **raw request body** using your `X-Partner-Key` and compare it with the `X-Gateway-Signature` header.

#### Node.js / Next.js Verification Code:
```typescript
import crypto from 'crypto'

export async function POST(req: Request) {
  const rawBody = await req.text()
  const receivedSig = req.headers.get('X-Gateway-Signature')
  const secretKey = process.env.TVH_PARTNER_KEY!

  const expectedSig = crypto
    .createHmac('sha256', secretKey)
    .update(rawBody)
    .digest('hex')

  if (receivedSig !== expectedSig) {
    return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401 })
  }

  const payload = JSON.parse(rawBody)
  if (payload.status === 'PAID') {
    // Unlock photo for guest session
    console.log(`Unlocked photo ${payload.item_id} for session ${payload.chat_session_id}`)
  }

  return new Response(JSON.stringify({ success: true }))
}
```

---

## 6. Guest Mode Microtransaction Setup

Since `instatextpro.online` has no user registration and operates purely with **Guest and Admin** roles:

1. **Guest Session Identification:**
   Store a unique guest ID in the visitor's browser:
   ```typescript
   export function getGuestSession(): string {
     let id = localStorage.getItem('guest_chat_session')
     if (!id) {
       id = 'guest_' + Math.random().toString(36).slice(2, 10) + '_' + Date.now()
       localStorage.setItem('guest_chat_session', id)
     }
     return id
   }
   ```

2. **Photo Unlocking:**
   When the webhook arrives for `chat_session_id: "guest_xxxx"`, store a record in your D1 / KV database:
   ```sql
   INSERT INTO guest_unlocked_photos (session_id, photo_id) VALUES ('guest_xxxx', 'photo_vip_09');
   ```

3. **Anti-Inspect-Element Image Protection:**
   **Never** send the real 4K HD photo with CSS `filter: blur(20px)` before purchase!
   - Send only a heavily compressed, pixelated 200px thumbnail.
   - When the user pays, check `SELECT photo_id FROM guest_unlocked_photos WHERE session_id = ?`. If verified, send the real HD CDN image URL.

---

## 7. Ready-to-Use Code Snippets

### Next.js 1-Click PhonePe Trigger
```tsx
'use client'

export function UnlockButton({ photoId, price = 49 }) {
  const [loading, setLoading] = useState(false)

  const handle1ClickPhonePe = async () => {
    setLoading(true)
    const sessionId = localStorage.getItem('guest_chat_session') || 'guest_default'

    const res = await fetch('/api/unlock-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        photoId,
        amount: price,
        chatSessionId: sessionId,
      }),
    })

    const data = await res.json()
    setLoading(false)

    if (data.phonepeDeepLink) {
      // ⚡ Direct PhonePe App Launch
      window.location.href = data.phonepeDeepLink
    }
  }

  return (
    <button onClick={handle1ClickPhonePe} disabled={loading}>
      {loading ? 'Connecting PhonePe...' : `🔥 Unlock Photo · ₹${price}`}
    </button>
  )
}
```
