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
  const orderAlt = orderNumber.startsWith('TVH-') ? orderNumber : `TVH-${orderNumber}`

  // If query looks like a 10-digit phone number
  const queryPhone = rawQuery.replace(/[^0-9]/g, '')
  const isPhone = queryPhone.length >= 10

  if (!orderNumber && !emailParam && !phoneParam) {
    return c.json({ error: 'Please provide an Order Number, Mobile Number, or Email address.' }, 400)
  }

  let order: any = null

  // 1. Try lookup by Order Number
  if (orderNumber) {
    order = await c.env.DB.prepare(`
      SELECT * FROM orders
      WHERE (order_number = ? OR order_number = ?)
      ORDER BY created_at DESC LIMIT 1
    `).bind(orderNumber, orderAlt).first()
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
  const isPhoneSearch = queryPhone.length >= 10
  const searchTargetPhone = phoneParam || (isPhoneSearch ? queryPhone.slice(-10) : '')

  const matchedOrdersMap = new Map<number, any>()

  // 1. By Order Numbers
  if (orderNumsToQuery.length > 0) {
    for (const ordNum of orderNumsToQuery) {
      const ordAlt = ordNum.startsWith('TVH-') ? ordNum : `TVH-${ordNum}`
      const rows = await c.env.DB.prepare(`
        SELECT * FROM orders WHERE order_number = ? OR order_number = ? ORDER BY id DESC LIMIT 5
      `).bind(ordNum, ordAlt).all()
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
    const altQ = cleanQ.startsWith('TVH-') ? cleanQ : `TVH-${cleanQ}`
    const qRows = await c.env.DB.prepare(`
      SELECT * FROM orders WHERE order_number LIKE ? OR order_number LIKE ? ORDER BY created_at DESC LIMIT 10
    `).bind(`%${cleanQ}%`, `%${altQ}%`).all()
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

export default app

