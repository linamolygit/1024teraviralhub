// src/client/pages/order/FlipkartSupportChatPage.tsx — Pixel-Perfect Flipkart Style AI Order Support Chat
import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { X, Send, Image as ImageIcon } from 'lucide-react'
import { api } from '../../lib/api'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  time: string
  isProductCard?: boolean
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

  // Format current time: e.g. "10:20 am"
  const getCurrentTime = () => {
    const now = new Date()
    return now
      .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
      .toLowerCase()
  }

  const [inputMsg, setInputMsg] = useState('')
  const [isTyping, setIsTyping] = useState(false)
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

  // Initialize starting assistant messages when order details load
  useEffect(() => {
    if (!orderData) return

    const initialTime = getCurrentTime()
    const customerName = orderData.customer_name || 'there'
    const isPaid = orderData.status === 'PAID'

    const initialBubbles: ChatMessage[] = [
      {
        id: 'init-1',
        role: 'assistant',
        content: `Hey ${customerName} 👋, I'm your Support Assistant`,
        time: initialTime,
      },
      {
        id: 'init-2',
        role: 'assistant',
        content: orderData.product || 'Digital Product Pack',
        time: initialTime,
        isProductCard: true,
      },
      {
        id: 'init-3',
        role: 'assistant',
        content: isPaid
          ? 'I see that your product is delivered to you'
          : 'I see that your order has been placed and is currently being verified',
        time: initialTime,
      },
    ]

    setMessages(initialBubbles)
  }, [orderData])

  // Send user message and fetch AI reply in matching language
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const text = inputMsg.trim()
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
          order_number: orderData?.order_number || activeOrderNum,
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
        setMessages((prev) => [...prev, botMsgObj])
      } else {
        throw new Error('Failed to get bot reply')
      }
    } catch {
      // Natural fallback if offline or network drops
      const fallbackReply =
        orderData?.status === 'PAID' && orderData.download_token
          ? `Aapke order ka download link active hai: https://1024teraviralhub.com/download/${orderData.download_token}\n\nAap is link se direct files download kar sakte hain. Koi bhi dikkat ho toh support@1024teraviralhub.com par contact karein.`
          : `Aapke order #${orderData?.order_number || activeOrderNum} ke regarding koi bhi sahayata chahiye ho toh hum poori madad karenge. Aap support@1024teraviralhub.com par bhi likh sakte hain.`

      const botMsgObj: ChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: fallbackReply,
        time: getCurrentTime(),
      }
      setMessages((prev) => [...prev, botMsgObj])
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

            // Normal Assistant Message bubble (Left aligned, White with border)
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
                    borderRadius: '16px 16px 16px 4px',
                    padding: '12px 14px',
                    fontSize: '0.93rem',
                    color: '#111827',
                    lineHeight: 1.5,
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-line',
                  }}
                >
                  {renderMessageContent(msg.content)}
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
            onSubmit={handleSendMessage}
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
    </div>
  )
}
