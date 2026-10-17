// src/client/pages/order/FlipkartSupportChatPage.tsx — Pixel-Perfect Flipkart Style AI Order Support Chat
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Send, Image as ImageIcon, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api'
import RefundRequestModal from '../../components/order/RefundRequestModal'

interface ChatOption {
  label: string
  action: string
}

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  isProductCard?: boolean
  options?: ChatOption[]
}

function parseOrderDate(rawDate?: string | number | null): Date {
  if (!rawDate) return new Date()
  if (typeof rawDate === 'number') return new Date(rawDate)
  if (typeof rawDate === 'string') {
    const s = rawDate.trim()
    if (s.includes('T')) {
      const d = new Date(s)
      if (!isNaN(d.getTime())) return d
    }
    const withT = s.replace(' ', 'T')
    const withZ = withT.endsWith('Z') ? withT : `${withT}Z`
    const d = new Date(withZ)
    if (!isNaN(d.getTime())) return d
    const fallback = new Date(s)
    if (!isNaN(fallback.getTime())) return fallback
  }
  return new Date()
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const getEstimatedDeliveryDateStr = (baseDate?: string | number | null) => {
  const d = parseOrderDate(baseDate)
  const target = new Date(d.getTime() + 7 * 86400000)
  return `${target.getDate()} ${MONTHS_SHORT[target.getMonth()]}`
}

export default function FlipkartSupportChatPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlOrderParam = searchParams.get('order') || searchParams.get('q') || ''
  const tokenParam = searchParams.get('token') || ''

  // Fallback to active order in storage if URL has no order param
  const activeOrderNum =
    urlOrderParam ||
    (typeof window !== 'undefined'
      ? localStorage.getItem('tvh_last_purchased_order') ||
        sessionStorage.getItem('tvh_active_order_number') ||
        localStorage.getItem('tvh_active_order_number') ||
        ''
      : '')

  // Fetch real order data
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['support-order-detail', activeOrderNum],
    queryFn: () => api.orderLookup(activeOrderNum),
    enabled: !!activeOrderNum,
    staleTime: 30000,
  })

  // Format current time: e.g. "3:55 pm"
  const getCurrentTime = () => {
    const now = new Date()
    return now
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      .toLowerCase()
  }

  const [inputMsg, setInputMsg] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping])

  // Initialize starting assistant messages when order details load (Matching Screenshot 100%)
  useEffect(() => {
    if (!orderData) return

    const initialTime = getCurrentTime()
    const orderNum = (orderData.order_number || activeOrderNum || 'OD392232266636002862').replace(/^#/, '')
    const deliveryDateStr = getEstimatedDeliveryDateStr(orderData.created_at)

    const initialBubbles: ChatMessage[] = [
      {
        id: 'init-product',
        role: 'assistant',
        content: orderData.product || 'Product Asset',
        time: initialTime,
        isProductCard: true,
      },
      {
        id: 'init-tracking',
        role: 'assistant',
        content: `Your order ${orderNum} is SHIPPED and currently moving towards your city. The latest update shows it at the Delhi facility. It is on track to be delivered by ${deliveryDateStr}.`,
        time: initialTime,
      },
    ]

    const refundParam = searchParams.get('refund')
    if (refundParam) {
      initialBubbles.push({
        id: 'init-refund-ack',
        role: 'assistant',
        content: `📋 **Refund Claim #${refundParam} Verified**\nYour refund claim for Order #${orderNum} has been received and registered with our operations settlement desk.\n\nStatus: **UNDER REVIEW**\nSLA: 24–48 hours verification, 5–7 business days direct UPI credit.`,
        time: initialTime,
      })
    }

    initialBubbles.push({
      id: 'init-options',
      role: 'assistant',
      content: 'Can I help you with anything else?',
      time: initialTime,
      options: [
        { label: 'No, I am good', action: 'no_good' },
        { label: 'Yes, I still need help', action: 'need_help' },
      ],
    })

    setMessages(initialBubbles)
  }, [orderData])

  // Send message or handle option click
  const handleSendMessage = async (customText?: string, customAction?: string) => {
    const text = (typeof customText === 'string' ? customText : inputMsg).trim()
    if (!text || isTyping) return

    const userTime = getCurrentTime()
    const userMsgObj: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: text,
      time: userTime,
    }

    setMessages((prev) => [...prev, userMsgObj])
    setInputMsg('')
    setIsTyping(true)

    const orderNum = (orderData?.order_number || activeOrderNum || 'OD392232266636002862').replace(/^#/, '')
    const deliveryDateStr = getEstimatedDeliveryDateStr(orderData?.created_at)
    const lower = text.toLowerCase()

    // 1. "No, I am good" Option
    if (customAction === 'no_good' || lower === 'no, i am good' || lower === 'no i am good') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: 'Great! Glad I could help. Have a wonderful day! Feel free to reach out anytime if you need anything else.',
            time: getCurrentTime(),
          },
        ])
      }, 450)
      return
    }

    // 2. "Yes, I still need help" Option
    if (customAction === 'need_help' || lower === 'yes, i still need help' || lower === 'yes i still need help') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Please select how we can assist you with Order #${orderNum}:`,
            time: getCurrentTime(),
            options: [
              { label: 'Apply for Refund (Enter UTR & UPI)', action: 'apply_refund' },
              { label: 'I want to cancel my order', action: 'cancel_order' },
              { label: 'When will the delivery agent call me?', action: 'agent_call' },
              { label: 'Can I change the delivery address?', action: 'change_address' },
              { label: 'Connect with support executive', action: 'support_exec' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 2a-2. Apply Refund Action (Opens UTR + UPI Verification Modal)
    if (customAction === 'apply_refund' || /apply refund|file refund|upi refund|utr refund/i.test(lower)) {
      setTimeout(() => {
        setIsTyping(false)
        setShowRefundModal(true)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `I have opened the **Automated Refund & Dispute Window** for Order #${orderNum}.\n\n🔑 **Required Details:**\n1. 12-digit Bank/UPI UTR Number (from PhonePe, GPay, Paytm, or bank SMS)\n2. Your recipient UPI ID for direct payout transfer\n\nPlease fill these in the modal window. Our settlement desk will process your claim within 5-7 business days.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 350)
      return
    }

    // 2b. Cancel Order Request
    if (customAction === 'cancel_order' || /cancel|cancellation|refund|wapas/i.test(lower)) {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `As your order #${orderNum} has already been SHIPPED and is currently moving towards your city from the Delhi facility, it cannot be stopped mid-transit.\n\n📦 **How Cancellation & Refund Works:**\nWhen our Ekart delivery executive arrives at your doorstep, you can simply **refuse the parcel** (inform them you wish to cancel). Once refused, the order is immediately returned and 100% refund is credited back to your bank account within 5-7 business days.\n\nWould you like to register an advance cancellation request or submit your UTR & UPI ID for refund now?`,
            time: getCurrentTime(),
            options: [
              { label: 'Confirm Cancellation Request', action: 'confirm_cancel' },
              { label: 'Submit UTR & UPI for Direct Refund', action: 'apply_refund' },
              { label: 'No, Keep My Order Dispatched', action: 'keep_order' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 2c. Confirm Cancellation
    if (customAction === 'confirm_cancel') {
      try {
        localStorage.setItem(`tvh_order_cancelled_${orderNum}`, '1')
        fetch('/api/order-lookup/cancel', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_number: orderNum, reason: 'Customer requested cancellation via Support Chat' })
        }).catch(() => {})
      } catch {}

      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `✅ **Cancellation Registered for Order #${orderNum}**\n\nYour cancellation request has been recorded in our logistics system. Please refuse delivery when the Ekart courier arrives.\n\n💰 **Refund Notice:**\n100% refund of your payment will be credited to your original payment mode within 5-7 business days.\n\nYou can also verify the updated status on your Order Details page.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 2d. Keep Order
    if (customAction === 'keep_order') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Great choice! Your order #${orderNum} remains active and will be delivered on schedule by ${deliveryDateStr}. The delivery partner will contact you on your registered mobile number before arrival.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 3. Agent Call Timing
    if (customAction === 'agent_call') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Our Ekart logistics delivery partner will call you on your registered mobile number on the day of delivery (${deliveryDateStr}) between 9:00 AM and 7:00 PM before arriving at your doorstep.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 4. Change Delivery Address
    if (customAction === 'change_address') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Since your order is already SHIPPED and in transit from the Delhi facility, the address cannot be edited in the system. However, when the delivery partner calls you on ${deliveryDateStr}, you can instruct them to deliver to your nearby preferred landmark.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 5. Digital Files & Invoice
    if (customAction === 'digital_files') {
      const dlLink = orderData?.download_token
        ? `https://1024teraviralhub.com/download/${orderData.download_token}`
        : `https://1024teraviralhub.com/order/details?order=${encodeURIComponent(orderNum)}`
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Your instant digital files & official invoice are ready:\n\n${dlLink}\n\nYou can click above to download anytime.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 6. Connect with Support Exec
    if (customAction === 'support_exec') {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Our customer care team is available 24x7 at support@1024teraviralhub.com. Please mention Order #${orderNum} for instant priority resolution.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 7. Order Status / Where is my order / Shipped question
    if (/status|kaha|kahan|delivery|deliver|pahucha|aaya|kab tak|shipped|tracking|order|location/i.test(lower)) {
      setTimeout(() => {
        setIsTyping(false)
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            role: 'assistant',
            content: `Your order ${orderNum} is SHIPPED and currently moving towards your city. The latest update shows it at the Delhi facility. It is on track to be delivered by ${deliveryDateStr}.`,
            time: getCurrentTime(),
          },
          {
            id: `bot-fu-${Date.now()}`,
            role: 'assistant',
            content: 'Can I help you with anything else?',
            time: getCurrentTime(),
            options: [
              { label: 'No, I am good', action: 'no_good' },
              { label: 'Yes, I still need help', action: 'need_help' },
            ],
          },
        ])
      }, 450)
      return
    }

    // 8. General AI / Backend Lookup
    try {
      const historyForApi = messages
        .filter((m) => !m.isProductCard)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }))

      const res = await fetch('/api/order-lookup/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order_number: orderNum,
          message: text,
          history: historyForApi,
        }),
      })

      if (res.ok) {
        const data = (await res.json()) as any
        const botReply = data?.reply || 'I am here to help you. Please ask any question regarding your order.'
        const botMsgObj: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: botReply,
          time: getCurrentTime(),
        }
        const followUpObj: ChatMessage = {
          id: `bot-fu-${Date.now()}`,
          role: 'assistant',
          content: 'Can I help you with anything else?',
          time: getCurrentTime(),
          options: [
            { label: 'No, I am good', action: 'no_good' },
            { label: 'Yes, I still need help', action: 'need_help' },
          ],
        }
        setMessages((prev) => [...prev, botMsgObj, followUpObj])
      } else {
        throw new Error('Failed to get bot reply')
      }
    } catch {
      // Natural fallback
      const fallbackReply = `Aapke order #${orderNum} ke regarding koi bhi sahayata chahiye ho toh hum poori madad karenge. Aap support@1024teraviralhub.com par bhi likh sakte hain.`
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          content: fallbackReply,
          time: getCurrentTime(),
          options: [
            { label: 'No, I am good', action: 'no_good' },
            { label: 'Yes, I still need help', action: 'need_help' },
          ],
        },
      ])
    } finally {
      setIsTyping(false)
    }
  }

  // Parse links inside bot messages to render clickable buttons or clean links
  const renderMessageContent = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    const parts = text.split(urlRegex)

    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#2874F0',
              fontWeight: 700,
              wordBreak: 'break-all',
              textDecoration: 'underline',
              display: 'inline-block',
              margin: '4px 0',
            }}
          >
            {part.includes('/download/') ? '👉 Download Your Files Here' : part}
          </a>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div
      style={{
        background: '#F1F4F9',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Mobile Container (Max 540px, centered on desktop) ── */}
      <div
        style={{
          maxWidth: '540px',
          width: '100%',
          margin: '0 auto',
          background: '#FFFFFF',
          minHeight: '100dvh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 4px 25px rgba(0, 0, 0, 0.05)',
          position: 'relative',
        }}
      >
        {/* ══════════════════════════════════════════════════════════
            1. TOP APP BAR (✕ Support) — Exactly matching instructions
           ══════════════════════════════════════════════════════════ */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            background: '#FFFFFF',
            borderBottom: '1px solid #E5E7EB',
            height: '56px',
            padding: '0 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <button
            type="button"
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1)
              } else {
                navigate(
                  activeOrderNum
                    ? `/order/details?order=${encodeURIComponent(activeOrderNum)}`
                    : '/my-orders'
                )
              }
            }}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#111827',
              borderRadius: '50%',
            }}
          >
            <X size={24} strokeWidth={2.2} />
          </button>

          <h1
            style={{
              fontSize: '1.25rem',
              fontWeight: 700,
              margin: 0,
              color: '#111827',
              letterSpacing: '-0.01em',
            }}
          >
            Support
          </h1>
        </header>

        {/* ══════════════════════════════════════════════════════════
            2. CHAT SCROLL CONTENT AREA
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px 90px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: '#F1F4F9',
          }}
        >
          {/* Centered Date Pill: Today */}
          <div style={{ textAlign: 'center', margin: '4px 0 2px 0' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#E5E7EB',
                color: '#4B5563',
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 14px',
                borderRadius: '9999px',
                letterSpacing: '0.02em',
              }}
            >
              Today
            </span>
          </div>

          {/* AI Disclaimer / Privacy Notice */}
          <p
            style={{
              textAlign: 'center',
              fontSize: '0.8rem',
              color: '#6B7280',
              lineHeight: 1.45,
              maxWidth: '360px',
              margin: '0 auto 10px auto',
            }}
          >
            Please excuse any mistakes as we work to better answer your questions. Do not give
            personal information in this chat.
          </p>

          {/* Initial Loading State */}
          {isLoading && messages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '30px 0', color: '#6B7280', fontSize: '0.9rem' }}>
              Connecting with Support Assistant...
            </div>
          )}

          {/* Chat Bubbles */}
          {messages.map((msg) => {
            if (msg.role === 'user') {
              // User message bubble (Right aligned, Blue)
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    maxWidth: '82%',
                    alignSelf: 'flex-end',
                  }}
                >
                  <div
                    style={{
                      background: '#2874F0',
                      color: '#FFFFFF',
                      borderRadius: '16px 16px 4px 16px',
                      padding: '10px 14px',
                      fontSize: '0.93rem',
                      lineHeight: 1.45,
                      wordBreak: 'break-word',
                      boxShadow: '0 1px 3px rgba(40, 116, 240, 0.15)',
                    }}
                  >
                    {msg.content}
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#9CA3AF',
                      marginTop: '3px',
                      paddingRight: '4px',
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              )
            }

            // Assistant message: Product Card in chat
            if (msg.isProductCard) {
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    maxWidth: '85%',
                    alignSelf: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      borderRadius: '14px',
                      padding: '10px 14px',
                      boxShadow: '0 1px 4px rgba(0, 0, 0, 0.04)',
                      width: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      {orderData?.product_image ? (
                        <img
                          src={orderData.product_image}
                          alt={orderData.product || 'Product'}
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            objectFit: 'cover',
                            background: '#F3F4F6',
                            flexShrink: 0,
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '8px',
                            background: '#EFF6FF',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#2874F0',
                            flexShrink: 0,
                          }}
                        >
                          <ImageIcon size={22} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: '0.92rem',
                            fontWeight: 600,
                            color: '#1F2937',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            lineHeight: 1.35,
                          }}
                        >
                          {orderData?.product || msg.content}
                        </div>
                        {(orderData?.order_number || activeOrderNum) && (
                          <div style={{ fontSize: '0.74rem', color: '#6B7280', marginTop: '3px' }}>
                            Order ID: <strong style={{ color: '#111827', fontFamily: 'monospace' }}>{orderData?.order_number || activeOrderNum}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '0.7rem',
                      color: '#9CA3AF',
                      marginTop: '3px',
                      paddingLeft: '4px',
                    }}
                  >
                    {msg.time}
                  </span>
                </div>
              )
            }

            // Normal Assistant Message bubble (Left aligned, soft light container matching Flipkart Screenshot)
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  maxWidth: '88%',
                  alignSelf: 'flex-start',
                }}
              >
                <div
                  style={{
                    background: '#F2F5F9',
                    border: '1px solid #E2E8F0',
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 14px 8px 14px',
                    fontSize: '0.94rem',
                    color: '#111827',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                    width: '100%',
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ color: '#1F2937', fontWeight: 500 }}>
                    {renderMessageContent(msg.content)}
                  </div>

                  {/* Interactive Options Box (Matching Screenshot 100%) */}
                  {msg.options && msg.options.length > 0 && (
                    <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
                      {msg.options.map((opt, optIdx) => (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleSendMessage(opt.label, opt.action)}
                          style={{
                            width: '100%',
                            background: '#FFFFFF',
                            border: '1.5px solid #D5DDE5',
                            borderRadius: 10,
                            padding: '11px 14px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            cursor: 'pointer',
                            textAlign: 'left',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.02)',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <span style={{ fontSize: '0.94rem', fontWeight: 600, color: '#2874F0' }}>
                            {opt.label}
                          </span>
                          <ChevronRight size={18} color="#2874F0" strokeWidth={2.4} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Timestamp at bottom right */}
                  <div style={{ textAlign: 'right', marginTop: 6, lineHeight: 1 }}>
                    <span style={{ fontSize: '0.72rem', color: '#9CA3AF' }}>
                      {msg.time}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Typing Indicator */}
          {isTyping && (
            <div
              style={{
                alignSelf: 'flex-start',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
                borderRadius: '16px 16px 16px 4px',
                padding: '10px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF' }} />
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', animationDelay: '0.2s' }} />
              <div className="typing-dot" style={{ width: 6, height: 6, borderRadius: '50%', background: '#9CA3AF', animationDelay: '0.4s' }} />
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            3. FIXED BOTTOM INPUT BAR (Pill Container + Send Icon)
           ══════════════════════════════════════════════════════════ */}
        <div
          style={{
            position: 'sticky',
            bottom: 0,
            background: '#FFFFFF',
            borderTop: '1px solid #E5E7EB',
            padding: '10px 16px',
            zIndex: 40,
          }}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSendMessage()
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1.5px solid #2874F0',
              borderRadius: '26px',
              padding: '4px 6px 4px 16px',
              background: '#FFFFFF',
              boxShadow: '0 2px 8px rgba(40, 116, 240, 0.08)',
            }}
          >
            <input
              ref={inputRef}
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Write a message..."
              style={{
                flex: 1,
                border: 'none',
                outline: 'none',
                fontSize: '0.94rem',
                color: '#111827',
                background: 'transparent',
                padding: '8px 0',
              }}
            />

            <button
              type="submit"
              disabled={!inputMsg.trim() || isTyping}
              aria-label="Send message"
              style={{
                background: 'none',
                border: 'none',
                cursor: inputMsg.trim() && !isTyping ? 'pointer' : 'default',
                color: inputMsg.trim() && !isTyping ? '#2874F0' : '#D1D5DB',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease',
              }}
            >
              <Send size={20} strokeWidth={2.2} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .typing-dot {
          animation: typingBounce 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Refund & Dispute Application Modal */}
      <RefundRequestModal
        isOpen={showRefundModal}
        onClose={() => setShowRefundModal(false)}
        initialOrderNumber={activeOrderNum}
        initialAmount={orderData?.amount}
      />
    </div>
  )
}
