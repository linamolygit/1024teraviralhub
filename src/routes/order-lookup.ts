// src/routes/order-lookup.ts — Universal Order & Product Delivery Recovery
import { Hono } from 'hono'
import type { Env } from '../worker'
import { verifyAndFulfillOrder } from './checkout'

const app = new Hono<{ Bindings: Env }>()

// Helper to extract real product ID from order record
function extractRealProductId(orderRow: any): number {
  if (orderRow.real_product_id && Number(orderRow.real_product_id) > 0) {
    return Number(orderRow.real_product_id)
  }
  if (orderRow.notes && typeof orderRow.notes === 'string') {
    const match = orderRow.notes.match(/real_product_id:(\d+)/)
    if (match && match[1]) {
      return parseInt(match[1], 10)
    }
  }
  return orderRow.product_id
}

// GET /api/order-lookup?order=...&phone=...&email=...
app.get('/', async (c) => {
  const emailParam = c.req.query('email')?.toLowerCase().trim() || ''
  const phoneParam = c.req.query('phone')?.replace(/[^0-9]/g, '').trim() || ''
  const rawQuery = (c.req.query('order') || c.req.query('q') || '').trim()

  // Clean raw order number
  const orderNumber = rawQuery.toUpperCase().replace(/^#/, '').trim()
  const odAlt = orderNumber.startsWith('OD') ? orderNumber : `OD${orderNumber}`
  const tvhAlt = orderNumber.startsWith('TVH-') ? orderNumber : `TVH-${orderNumber}`

  // If query looks like a genuine 10 to 13-digit Indian mobile number (and not an OD order number)
  const queryPhone = rawQuery.replace(/[^0-9]/g, '')
  const isPhone =
    !orderNumber.startsWith('OD') &&
    queryPhone.length >= 10 &&
    queryPhone.length <= 13 &&
    /^[6-9]/.test(queryPhone.slice(-10))

  if (!orderNumber && !emailParam && !phoneParam) {
    return c.json({ error: 'Please provide an Order Number, Mobile Number, or Email address.' }, 400)
  }

  let order: any = null

  // 1. Try lookup by Order Number (supports OD..., TVH-..., and raw digits)
  if (orderNumber) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE (order_number = ? OR order_number = ? OR order_number = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(orderNumber, odAlt, tvhAlt).first()
  }

  // 2. Try lookup by Phone Number if not found
  if (!order && (phoneParam || isPhone)) {
    const targetPhone = phoneParam || queryPhone.slice(-10)
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE customer_phone LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(`%${targetPhone}%`).first()
  }

  // 3. Try lookup by Email if not found
  if (!order && emailParam) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE LOWER(customer_email) = ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(emailParam).first()
  }

  // 4. Try lookup in order_tracking_links table (Cross-device / cross-browser order recovery)
  if (!order && orderNumber) {
    try {
      await c.env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS order_tracking_links (
          code TEXT PRIMARY KEY,
          order_number TEXT NOT NULL,
          product_slug TEXT NOT NULL,
          product_title TEXT,
          amount REAL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          created_timestamp INTEGER
        )
      `).run()

      const tracking = await c.env.DB.prepare(`
        SELECT * FROM order_tracking_links
        WHERE order_number = ? OR order_number = ? OR code = ?
        ORDER BY created_at DESC LIMIT 1
      `).bind(orderNumber, odAlt, orderNumber).first() as any

      if (tracking) {
        let product = await c.env.DB.prepare(
          `SELECT id, title, slug, price, sale_price FROM products WHERE slug = ? LIMIT 1`
        ).bind(tracking.product_slug).first() as any

        let productImage = null
        if (product) {
          const thumb = await c.env.DB.prepare(
            `SELECT r2_key FROM product_images WHERE product_id = ? ORDER BY is_thumbnail DESC, sort_order ASC, id ASC LIMIT 1`
          ).bind(product.id).first<{ r2_key: string }>()
          if (thumb) productImage = `/api/images/${encodeURIComponent(thumb.r2_key)}`
        }

        return c.json({
          order_number: tracking.order_number,
          status: 'PAID',
          amount: tracking.amount || product?.sale_price || product?.price || 99,
          customer_name: 'Customer',
          original_price: product?.price || 199,
          sale_price: product?.sale_price || 99,
          product: tracking.product_title || product?.title || 'Digital Product Asset',
          product_slug: tracking.product_slug,
          product_id: product?.id || 1,
          product_image: productImage,
          created_at: tracking.created_at || (tracking.created_timestamp ? new Date(tracking.created_timestamp).toISOString() : new Date().toISOString()),
          download_token: null,
          download_expired: false,
        })
      }
    } catch (e) {
      console.error('Tracking fallback lookup error:', e)
    }
  }

  if (!order) {
    return c.json({
      error: 'Order not found. Please double-check your Order Number or Mobile Number and try again.'
    }, 404)
  }

  // Auto-verify with payment gateway if pending, and guarantee download token
  const verification = await verifyAndFulfillOrder(c.env.DB, c.env, order)

  let download_token = verification.download_token || null
  const finalStatus = verification.isPaid ? 'PAID' : (verification.status || order.status)

  // Resolve Real Product Data that the customer actually bought!
  const realProdId = extractRealProductId(order)
  let product = await c.env.DB.prepare(
    `SELECT id, title, slug, price, sale_price, access_duration_hours, download_limit, google_drive_link, file_type, file_count
     FROM products WHERE id = ?`
  ).bind(realProdId).first() as any

  if (!product) {
    product = await c.env.DB.prepare(
      `SELECT id, title, slug, price, sale_price, access_duration_hours, download_limit, google_drive_link, file_type, file_count
       FROM products WHERE id = ?`
    ).bind(order.product_id).first() as any
  }

  // Fetch product thumbnail image for the real product (or wallpaper fallback)
  const thumb = await c.env.DB.prepare(
    `SELECT r2_key FROM product_images WHERE product_id = ? ORDER BY is_thumbnail DESC, sort_order ASC, id ASC LIMIT 1`
  ).bind(product?.id || order.product_id).first<{ r2_key: string }>()

  const productImage = thumb ? `/api/images/${encodeURIComponent(thumb.r2_key)}` : null

  return c.json({
    order_number: order.order_number,
    status: finalStatus,
    amount: order.amount,
    customer_name: order.customer_name || 'Customer',
    original_price: product?.price ?? order.amount,
    sale_price: product?.sale_price ?? order.amount,
    product: product?.title ?? 'Digital Product Asset',
    product_slug: product?.slug ?? '',
    product_id: product?.id ?? order.product_id,
    product_image: productImage,
    created_at: order.created_at,
    download_token,
    download_expired: finalStatus === 'PAID' && !download_token,
  })
})

// Format date for Flipkart delivery line: e.g. "Oct 24"
function formatExpectedDelivery(rawDate?: string | null): { dateStr: string; isPast: boolean } {
  if (!rawDate) return { dateStr: 'Oct 24', isPast: false }
  const d = new Date(rawDate.replace(' ', 'T') + (rawDate.includes('Z') ? '' : 'Z'))
  const baseTime = isNaN(d.getTime()) ? new Date() : d
  const deliveryTime = new Date(baseTime.getTime() + 4 * 86400000)
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const m = months[deliveryTime.getMonth()]
  const day = deliveryTime.getDate()
  const isPast = Date.now() > deliveryTime.getTime()
  return { dateStr: `${m} ${day}`, isPast }
}


// GET /api/order-lookup/my-orders — Fetch all authentic customer orders (Cookie + Query + Mobile + IP)
app.get('/my-orders', async (c) => {
  const queryParam = (c.req.query('q') || '').trim()
  const phoneParam = c.req.query('phone')?.replace(/[^0-9]/g, '').trim() || ''
  const emailParam = c.req.query('email')?.toLowerCase().trim() || ''
  const ordersParam = c.req.query('orders')?.trim() || c.req.query('order')?.trim() || ''

  const orderNumsToQuery: string[] = []
  if (ordersParam) {
    for (const num of ordersParam.split(',').map((o) => o.trim()).filter(Boolean)) {
      const clean = num.toUpperCase().replace(/^#/, '')
      if (!orderNumsToQuery.includes(clean)) orderNumsToQuery.push(clean)
    }
  }

  // Parse Cookie for saved orders on this browser/device
  const cookieHeader = c.req.header('cookie') || ''
  if (cookieHeader) {
    const cookieMatch = cookieHeader.match(/tvh_customer_orders=([^;]+)/) || cookieHeader.match(/tvh_orders=([^;]+)/)
    if (cookieMatch) {
      try {
        const decoded = decodeURIComponent(cookieMatch[1])
        const parsed = JSON.parse(decoded)
        if (Array.isArray(parsed)) {
          for (const item of parsed) {
            const ord = item?.orderNumber || item?.order_number
            if (ord && typeof ord === 'string') {
              const clean = ord.trim().toUpperCase().replace(/^#/, '')
              if (!orderNumsToQuery.includes(clean)) orderNumsToQuery.push(clean)
            }
          }
        }
      } catch {}
    }

    const lastOrderMatch = cookieHeader.match(/tvh_last_order=([^;]+)/)
    if (lastOrderMatch && lastOrderMatch[1]) {
      const lastOrd = decodeURIComponent(lastOrderMatch[1]).trim().toUpperCase().replace(/^#/, '')
      if (lastOrd && !orderNumsToQuery.includes(lastOrd)) {
        orderNumsToQuery.push(lastOrd)
      }
    }
  }

  // Query database matching any criteria
  const queryPhone = queryParam.replace(/[^0-9]/g, '')
  const isPhoneSearch =
    !queryParam.toUpperCase().startsWith('OD') &&
    queryPhone.length >= 10 &&
    queryPhone.length <= 13 &&
    /^[6-9]/.test(queryPhone.slice(-10))
  const searchTargetPhone = phoneParam || (isPhoneSearch ? queryPhone.slice(-10) : '')

  const matchedOrdersMap = new Map<number, any>()

  // 1. By Order Numbers (Supports OD..., TVH-..., and numeric input)
  if (orderNumsToQuery.length > 0) {
    for (const ordNum of orderNumsToQuery) {
      const odAlt = ordNum.startsWith('OD') ? ordNum : `OD${ordNum}`
      const tvhAlt = ordNum.startsWith('TVH-') ? ordNum : `TVH-${ordNum}`
      const rows = await c.env.DB.prepare(`
        SELECT * FROM orders WHERE order_number = ? OR order_number = ? OR order_number = ? ORDER BY id DESC LIMIT 5
      `).bind(ordNum, odAlt, tvhAlt).all()
      for (const r of (rows.results as any[] || [])) {
        matchedOrdersMap.set(r.id, r)
      }
    }
  }

  // 2. By Phone Number
  if (searchTargetPhone) {
    const phoneRows = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE customer_phone LIKE ? ORDER BY created_at DESC LIMIT 20
    `).bind(`%${searchTargetPhone}%`).all()
    for (const r of (phoneRows.results as any[] || [])) {
      matchedOrdersMap.set(r.id, r)
    }
  }

  // 3. By Email
  if (emailParam || (queryParam.includes('@') && queryParam.includes('.'))) {
    const em = emailParam || queryParam.toLowerCase()
    const emailRows = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE LOWER(customer_email) = ? ORDER BY created_at DESC LIMIT 20
    `).bind(em).all()
    for (const r of (emailRows.results as any[] || [])) {
      matchedOrdersMap.set(r.id, r)
    }
  }

  // 4. By generic search query (Order # or Product Title match)
  if (queryParam && !isPhoneSearch && !queryParam.includes('@')) {
    const cleanQ = queryParam.toUpperCase().replace(/^#/, '')
    const odAlt = cleanQ.startsWith('OD') ? cleanQ : `OD${cleanQ}`
    const tvhAlt = cleanQ.startsWith('TVH-') ? cleanQ : `TVH-${cleanQ}`
    const qRows = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE order_number LIKE ? OR order_number LIKE ? OR order_number LIKE ? ORDER BY created_at DESC LIMIT 10
    `).bind(`%${cleanQ}%`, `%${odAlt}%`, `%${tvhAlt}%`).all()
    for (const r of (qRows.results as any[] || [])) {
      matchedOrdersMap.set(r.id, r)
    }
  }

  // 5. IP Fallback if device has no saved cookies/orders yet (last 72 hours)
  if (matchedOrdersMap.size === 0 && !queryParam && !phoneParam && !emailParam) {
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || ''
    if (ip) {
      const ipRows = await c.env.DB.prepare(`
        SELECT * FROM orders WHERE ip_address = ? AND created_at >= datetime('now', '-72 hours') ORDER BY created_at DESC LIMIT 5
      `).bind(ip).all()
      for (const r of (ipRows.results as any[] || [])) {
        matchedOrdersMap.set(r.id, r)
      }
    }
  }

  // Convert map to array sorted by created_at DESC
  const ordersList = Array.from(matchedOrdersMap.values()).sort((a, b) => {
    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  })

  // Format real order details and guarantee real-time payment sync
  const detailedOrders: any[] = []

  for (const ord of ordersList) {
    // Auto-verify with payment gateway if pending
    let finalStatus = ord.status
    let downloadToken: string | null = null

    try {
      const verification = await verifyAndFulfillOrder(c.env.DB, c.env, ord)
      if (verification.isPaid) {
        finalStatus = 'PAID'
        downloadToken = verification.download_token || null
      } else {
        finalStatus = verification.status || ord.status
      }
    } catch {}

    // Resolve REAL Product Data (unmasked!)
    const realProdId = extractRealProductId(ord)
    let product = await c.env.DB.prepare(
      `SELECT id, title, slug, price, sale_price FROM products WHERE id = ?`
    ).bind(realProdId).first() as any

    if (!product) {
      product = await c.env.DB.prepare(
        `SELECT id, title, slug, price, sale_price FROM products WHERE id = ?`
      ).bind(ord.product_id).first() as any
    }

    // Fetch product thumbnail
    const thumb = await c.env.DB.prepare(
      `SELECT r2_key FROM product_images WHERE product_id = ? ORDER BY is_thumbnail DESC, sort_order ASC, id ASC LIMIT 1`
    ).bind(product?.id || ord.product_id).first<{ r2_key: string }>()

    const productImage = thumb ? `/api/images/${encodeURIComponent(thumb.r2_key)}` : null

    // Compute Flipkart status line & delivery text
    const { dateStr, isPast } = formatExpectedDelivery(ord.created_at)

    let deliveryHeadline = `Delivery expected by ${dateStr}`
    let subtitle = 'Your Order has been placed.'

    if (finalStatus === 'PAID') {
      if (isPast) {
        deliveryHeadline = `Delivered on ${dateStr}`
        subtitle = 'Package was handed to customer'
      } else {
        deliveryHeadline = `Delivery expected by ${dateStr}`
        subtitle = 'Your Order has been placed.'
      }
    } else if (finalStatus === 'PENDING' || finalStatus === 'ACTIVE') {
      deliveryHeadline = 'Order Placed • Awaiting Confirmation'
      subtitle = 'Verifying payment status with bank...'
    } else if (finalStatus === 'FAILED') {
      deliveryHeadline = 'Payment Failed'
      subtitle = 'Tap to retry payment'
    }

    detailedOrders.push({
      order_number: ord.order_number,
      id: ord.id,
      status: finalStatus,
      is_paid: finalStatus === 'PAID',
      amount: ord.amount,
      original_price: product?.price ?? ord.amount,
      sale_price: product?.sale_price ?? ord.amount,
      product: product?.title ?? 'Digital Product Asset',
      product_slug: product?.slug ?? '',
      product_id: product?.id ?? ord.product_id,
      product_image: productImage,
      created_at: ord.created_at,
      delivery_headline: deliveryHeadline,
      delivery_subtitle: subtitle,
      download_token: downloadToken,
    })
  }

  return c.json({
    success: true,
    count: detailedOrders.length,
    orders: detailedOrders,
  })
})

// POST /api/order-lookup/chat — Multi-Language Support Chatbot with Real Order Context
app.post('/chat', async (c) => {
  try {
    const body = await c.req.json<{
      order_number?: string
      message?: string
      history?: Array<{ role: 'user' | 'assistant'; content: string }>
    }>()

    const rawMsg = (body.message || '').trim()
    if (!rawMsg) {
      return c.json({ reply: 'Please enter a message.' }, 400)
    }

    const rawOrder = (body.order_number || '').trim().toUpperCase().replace(/^#/, '')
    const odAlt = rawOrder.startsWith('OD') ? rawOrder : `OD${rawOrder}`
    const tvhAlt = rawOrder.startsWith('TVH-') ? rawOrder : `TVH-${rawOrder}`

    let order: any = null
    if (rawOrder) {
      order = await c.env.DB.prepare(`
        SELECT * FROM orders
        WHERE (order_number = ? OR order_number = ? OR order_number = ?)
        ORDER BY created_at DESC LIMIT 1
      `).bind(rawOrder, odAlt, tvhAlt).first()
    }

    // Resolve real product details
    let product: any = null
    let downloadToken = order?.download_token || null

    if (order) {
      const realProdId = extractRealProductId(order)
      product = await c.env.DB.prepare(
        `SELECT id, title, slug, price, sale_price, google_drive_link, file_type FROM products WHERE id = ?`
      ).bind(realProdId).first()

      if (!product) {
        product = await c.env.DB.prepare(
          `SELECT id, title, slug, price, sale_price, google_drive_link, file_type FROM products WHERE id = ?`
        ).bind(order.product_id).first()
      }

      if (!downloadToken && order.id) {
        const tok = await c.env.DB.prepare(
          `SELECT token FROM download_tokens WHERE order_id = ? ORDER BY id DESC LIMIT 1`
        ).bind(order.id).first<{ token: string }>()
        if (tok?.token) downloadToken = tok.token
      }
    }

    const siteUrl = c.env.SITE_URL || 'https://1024teraviralhub.com'
    const customerName = order?.customer_name?.trim() || 'Customer'
    const productTitle = product?.title || order?.product || 'Digital Product Asset'
    const orderNumber = order?.order_number || rawOrder || 'N/A'
    const orderStatus = order?.status === 'PAID' ? 'Delivered / Placed' : (order?.status || 'Pending')
    const amount = order?.amount ? `₹${order.amount}` : ''
    const downloadUrl = downloadToken
      ? `${siteUrl}/download/${downloadToken}`
      : `${siteUrl}/order-lookup?order=${encodeURIComponent(orderNumber)}`

    // Determine user's language
    const isDevanagari = /[\u0900-\u097F]/.test(rawMsg)
    const isHinglish =
      !isDevanagari &&
      /\b(kya|kaise|karo|bhai|batao|nahi|mera|meri|mere|kaha|kahan|hai|hain|milega|milegi|khul|khula|open|link|bhejo|paise|kat|gaya|gaye|de|do|hoga|hogi|kab|tak|karu|download|file|invoice|wapas|chahiye|dekhna|dikha|dikhao|madad|problem|dikkat)\b/i.test(
        rawMsg
      )

    // Check Gemini API key for dynamic generation
    let geminiKey = ''
    try {
      const row = await c.env.DB.prepare(`SELECT value FROM website_settings WHERE key = 'gemini_api_key'`).first<{ value: string }>()
      if (row?.value) {
        try { geminiKey = JSON.parse(row.value) } catch { geminiKey = row.value }
      }
    } catch {}
    if (!geminiKey) {
      geminiKey = (c.env as any).GEMINI_API_KEY || ''
    }

    let reply = ''

    if (geminiKey) {
      try {
        const systemInstruction = `You are the friendly, helpful Support Assistant for 1024 Tera Viral Hub.
You are chatting with customer "${customerName}" regarding Order #${orderNumber} for "${productTitle}".
Order Status: ${orderStatus}. Amount: ${amount}.
Official Download Link: ${downloadUrl}.
Support Email: support@1024teraviralhub.com.

STRICT INSTRUCTIONS:
1. MATCH THE USER'S LANGUAGE EXACTLY:
   - If user wrote in Hinglish (Hindi written with English alphabet like "bhai mera download link nahi mil raha"), reply in natural, polite Hinglish.
   - If user wrote in Hindi (Devanagari script), reply in natural, polite Hindi.
   - If user wrote in English, reply in English.
   - If another Indian language (Bengali, Tamil, Marathi, etc.), reply in that language.
2. If they ask about download or file access, provide the download link: ${downloadUrl}.
3. If they ask about opening ZIP files on mobile: mention Files by Google/ZArchiver for Android, and Files app for iPhone.
4. Keep replies crisp (2-3 short sentences), direct, and polite. Do NOT make up external policies.`

        const chatContents = [
          ...(body.history || []).slice(-6).map((h) => ({
            role: h.role === 'user' ? 'user' : 'model',
            parts: [{ text: h.content }],
          })),
          { role: 'user', parts: [{ text: rawMsg }] },
        ]

        const gRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-goog-api-key': geminiKey,
            },
            body: JSON.stringify({
              contents: chatContents,
              systemInstruction: { parts: [{ text: systemInstruction }] },
              generationConfig: { maxOutputTokens: 350, temperature: 0.6 },
            }),
          }
        )

        if (gRes.ok) {
          const gJson = (await gRes.json()) as any
          const txt = gJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
          if (txt) reply = txt
        }
      } catch (err) {
        console.error('Gemini support chat error:', err)
      }
    }

    // High-Accuracy Intelligent Multi-Language Fallback
    if (!reply) {
      const lower = rawMsg.toLowerCase()

      // 1. Download Link / File Access
      if (/download|link|file|access|drive|kaha|kahan|bhejo|folder|get|mila nahi|mil nahi|kaise download/i.test(lower)) {
        if (isDevanagari) {
          reply = `नमस्ते ${customerName}! आपके ऑर्डर #${orderNumber} का डाउनलोड लिंक तैयार है। आप नीचे दिए गए लिंक से सीधे अपनी फ़ाइलें एक्सेस और डाउनलोड कर सकते हैं:\n\n${downloadUrl}\n\nयदि डाउनलोड में कोई समस्या आए तो हमें बताएं।`
        } else if (isHinglish) {
          reply = `Aapke order #${orderNumber} ka download link active hai! Aap is link se direct files download kar sakte hain:\n\n${downloadUrl}\n\nAap link par click karke turant access le sakte hain.`
        } else {
          reply = `Hello ${customerName}, your digital download link for Order #${orderNumber} is active and ready:\n\n${downloadUrl}\n\nClick the link above to immediately access and download your files.`
        }
      }
      // 2. Open ZIP / Extraction
      else if (/zip|rar|extract|unzip|open|khol|phone|mobile|laptop|pc|kaise open/i.test(lower)) {
        if (isDevanagari) {
          reply = `यह डिजिटल पैक ZIP फ़ॉर्मेट में है। Android फ़ोन में 'Files by Google' या 'ZArchiver' ऐप से इसे अनज़िप (extract) करें। iPhone में इन-बिल्ट 'Files' ऐप इस्तेमाल करें, और PC/लैपटॉप में फ़ाइल पर Right Click करके 'Extract All' चुनें।`
        } else if (isHinglish) {
          reply = `Yeh digital pack ZIP format me hai. Android mobile me 'Files by Google' ya 'ZArchiver' app se extract karein. iPhone me direct 'Files' app se open karein, aur PC me Right Click karke 'Extract All' karein.`
        } else {
          reply = `The package is delivered in ZIP format. On Android, use the 'Files by Google' or 'ZArchiver' app to extract. On iPhone, open with the built-in 'Files' app. On PC/Mac, right-click the file and select 'Extract All'.`
        }
      }
      // 3. Invoice / Bill / Receipt
      else if (/bill|invoice|receipt|gst|slip|payment proof|kitna|payment|paise/i.test(lower)) {
        if (isDevanagari) {
          reply = `आपके ऑर्डर #${orderNumber} का कुल बिल ${amount || 'सत्यापित राशि'} है। आपका भुगतान सफलतापूर्वक प्राप्त हो चुका है। आप अपने Order Details पेज से भी अपनी रसीद डाउनलोड कर सकते हैं।`
        } else if (isHinglish) {
          reply = `Aapke order #${orderNumber} ka total amount ${amount || 'Verified'} hai. Payment successfully confirmed hai aur aap apne Order Details page se bhi receipt dekh ya download kar sakte hain.`
        } else {
          reply = `Your official invoice for Order #${orderNumber} is confirmed for ${amount || 'paid amount'}. You can view and download your payment receipt directly from the Order Details page.`
        }
      }
      // 4. Order Status / Delivery (Matching Screenshot 100%)
      else if (/status|kaha tak|kaha|kahan|delivery|deliver|pahucha|aaya nahi|aaya|placed|kab tak|shipped|tracking/i.test(lower)) {
        const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        let orderDate = new Date()
        if (order?.created_at) {
          const parsed = new Date(order.created_at)
          if (!isNaN(parsed.getTime())) orderDate = parsed
        }
        const deliveryDate = new Date(orderDate.getTime() + 7 * 86400000)
        const deliveryStr = `${deliveryDate.getDate()} ${monthsShort[deliveryDate.getMonth()]}`

        reply = `Your order ${orderNumber} is SHIPPED and currently moving towards your city. The latest update shows it at the Delhi facility. It is on track to be delivered by ${deliveryStr}.`
      }
      else if (/no, i am good|no i am good|no good|nahi chahiye|all good/i.test(lower)) {
        reply = `Great! Glad I could help. Have a wonderful day! Feel free to reach out anytime if you need anything else.`
      }
      else if (/yes, i still need help|yes i still need help|still need help|aur madad|help chahiye/i.test(lower)) {
        reply = `Please let me know how else we can assist you with Order #${orderNumber}. You can ask about delivery agent calls, address queries, or invoice receipts.`
      }
      // 5. Refund / Return / Cancellation
      else if (/refund|return|cancel|wapas|paise wapas/i.test(lower)) {
        if (isDevanagari) {
          reply = `डिजिटल उत्पाद होने के कारण फ़ाइलें तुरंत डिलीवर हो जाती हैं। यदि आपको फ़ाइलें डाउनलोड करने या इस्तेमाल करने में कोई भी परेशानी हो रही है, तो हम आपको तुरंत नया लिंक या समाधान प्रदान करेंगे। कृपया अपनी समस्या बताएं।`
        } else if (isHinglish) {
          reply = `Instant digital product hone ki wajah se files turant deliver ho jaati hain. Agar aapko files download karne ya open karne me koi bhi issue hai, toh hum aapko 100% full support aur alternate access provide karenge. Mujhe batayein kya dikkat aa rahi hai?`
        } else {
          reply = `As this is an instant digital asset delivery, files are made accessible immediately upon payment. If you are experiencing any issue accessing, downloading, or using your files, our team guarantees full replacement support. Please let me know what difficulty you are facing.`
        }
      }
      // 6. Human Support / Call / Email
      else if (/human|agent|talk|call|phone|contact|support|email|whatsapp|baat/i.test(lower)) {
        if (isDevanagari) {
          reply = `आप हमारी समर्पित कस्टमर सपोर्ट टीम से support@1024teraviralhub.com पर सीधे संपर्क कर सकते हैं। हमारी टीम 24 घंटे के अंदर आपकी पूरी सहायता करेगी।`
        } else if (isHinglish) {
          reply = `Aap hamari direct support team ko support@1024teraviralhub.com par email kar sakte hain. Aapka order #${orderNumber} mention karein aur hamari team turant assist karegi.`
        } else {
          reply = `You can connect directly with our human support team at support@1024teraviralhub.com. Please mention Order #${orderNumber} for priority assistance.`
        }
      }
      // 7. General Greetings / Default Fallback
      else {
        if (isDevanagari) {
          reply = `नमस्ते ${customerName}! मैं 1024 Tera Viral Hub का सपोर्ट असिस्टेंट हूँ। आपके ऑर्डर #${orderNumber} ("${productTitle}") के लिए मैं आपकी क्या सहायता कर सकता हूँ?`
        } else if (isHinglish) {
          reply = `Hello ${customerName}! Main aapki kya sahayata kar sakta hoon aapke order #${orderNumber} ("${productTitle}") ke baare me? Download link, file access ya koi bhi sawal ho toh zaroor batayein.`
        } else {
          reply = `Hello ${customerName}! I'm your Support Assistant for Order #${orderNumber} ("${productTitle}"). How may I assist you with your download, access, or order today?`
        }
      }
    }

    return c.json({
      success: true,
      reply,
      order: {
        order_number: orderNumber,
        product: productTitle,
        status: orderStatus,
        download_url: downloadUrl,
      },
    })
  } catch (err: any) {
    console.error('Order chat assistant error:', err)
    return c.json({ error: err.message || 'Support assistant error' }, 500)
  }
})

// Generate authentic Flipkart-style short code (vh + 8 uppercase/alphanumeric characters, e.g. vhFLF8NNNN)
export function generateFlipkartTrackingCode(orderNumber: string): string {
  if (!orderNumber) return 'vhFLF8NNNN'
  const clean = orderNumber.toUpperCase().replace(/^#/, '')
  let hash = 0
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash << 5) - hash) + clean.charCodeAt(i)
    hash |= 0
  }
  const absHash = Math.abs(hash)
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  let part1 = ''
  let n1 = absHash
  while (part1.length < 4) {
    part1 += chars[n1 % chars.length]
    n1 = Math.floor(n1 / chars.length)
  }
  let part2 = ''
  let n2 = Math.abs(hash ^ 0x5a5a5a5a)
  while (part2.length < 4) {
    part2 += chars[n2 % chars.length]
    n2 = Math.floor(n2 / chars.length)
  }
  return `vh${part1}${part2}`
}

// POST /api/order-lookup/track — Create or get an authentic Flipkart-style short tracking link
app.post('/track', async (c) => {
  try {
    const body = (await c.req.json()) as any
    const orderNumber = (body.order_number || '').trim().replace(/^#/, '')
    const productSlug = (body.product_slug || '').trim()
    const productTitle = (body.product_title || '').trim()
    const amount = Number(body.amount) || 99
    const createdTimestamp = Number(body.created_timestamp) || Date.now()
    const createdAt = body.created_at || new Date(createdTimestamp).toISOString()

    if (!orderNumber) {
      return c.json({ error: 'order_number is required' }, 400)
    }

    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS order_tracking_links (
        code TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        product_slug TEXT NOT NULL,
        product_title TEXT,
        amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_timestamp INTEGER
      )
    `).run()

    // Check if code already exists for this order
    const existing = await c.env.DB.prepare(
      `SELECT * FROM order_tracking_links WHERE order_number = ? LIMIT 1`
    ).bind(orderNumber).first() as any

    if (existing) {
      return c.json({
        code: existing.code,
        order_number: existing.order_number,
        product_slug: existing.product_slug,
        product_title: existing.product_title,
        amount: existing.amount,
        created_at: existing.created_at,
        created_timestamp: existing.created_timestamp,
      })
    }

    const code = generateFlipkartTrackingCode(orderNumber)

    await c.env.DB.prepare(`
      INSERT OR REPLACE INTO order_tracking_links (code, order_number, product_slug, product_title, amount, created_at, created_timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(code, orderNumber, productSlug, productTitle, amount, createdAt, createdTimestamp).run()

    return c.json({
      code,
      order_number: orderNumber,
      product_slug: productSlug,
      product_title: productTitle,
      amount,
      created_at: createdAt,
      created_timestamp: createdTimestamp,
    })
  } catch (err: any) {
    console.error('Error generating tracking link:', err)
    return c.json({ error: err.message || 'Failed to generate tracking link' }, 500)
  }
})

// GET /api/order-lookup/track/:code — Retrieve tracking link data
app.get('/track/:code', async (c) => {
  const code = c.req.param('code').trim()
  try {
    await c.env.DB.prepare(`
      CREATE TABLE IF NOT EXISTS order_tracking_links (
        code TEXT PRIMARY KEY,
        order_number TEXT NOT NULL,
        product_slug TEXT NOT NULL,
        product_title TEXT,
        amount REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_timestamp INTEGER
      )
    `).run()

    const tracking = await c.env.DB.prepare(
      `SELECT * FROM order_tracking_links WHERE code = ? OR order_number = ? LIMIT 1`
    ).bind(code, code).first() as any

    if (!tracking) {
      return c.json({ error: 'Tracking link not found' }, 404)
    }

    return c.json(tracking)
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

export default app

