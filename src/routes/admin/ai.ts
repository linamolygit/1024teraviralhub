// src/routes/admin/ai.ts — Gemini AI Integration & Smart Product Content Assistant
import { Hono } from 'hono'
import type { Env } from '../../worker'
import { adminAuthMiddleware, type AdminVars } from './middleware'

const app = new Hono<{ Bindings: Env; Variables: AdminVars }>()
app.use('*', adminAuthMiddleware)

const DEFAULT_GEMINI_KEY = ''

interface GenerateRequest {
  prompt?: string
  title?: string
  category_name?: string
  file_type?: string
  apiKey?: string
}

// Smart Heuristic Generator (Safe fallback if API key encounters 403/Quota limits)
function generateSmartFallback(inputTitle: string, fileType = 'image') {
  const cleanTitle = inputTitle.trim() || 'Premium Digital Asset Pack'
  const slug = cleanTitle
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  // Keywords extraction for tags
  const words = cleanTitle.toLowerCase().split(/\s+/).filter(w => w.length > 2)
  const baseTags = Array.from(new Set([
    ...words,
    'digital download',
    'high resolution',
    'premium quality',
    'instant access',
    fileType,
    '4k wallpaper'
  ])).slice(0, 8)

  const shortDescription = `Instant digital download of ${cleanTitle} in pristine ultra-high quality, optimized for all screens and devices.`

  const fullDescription = `### 🌟 Overview
Elevate your visual collection with the exclusive **${cleanTitle}**. Meticulously crafted and curated in ultra-crisp resolution, this digital pack delivers unmatched aesthetic brilliance and vibrant details.

---

### 📦 What's Included in this Download
- **High-Resolution Master Files**: Pristine quality uncompressed digital deliverables.
- **Multiple Screen Formats**: Ready-to-use for Mobile (9:16), Desktop (16:9), and Tablet displays.
- **Universal Compatibility**: Compatible with iOS, Android, Windows, and macOS devices.
- **Instant Digital Delivery**: Direct download link generated immediately upon successful payment verification.

---

### ⚡ Key Features & Highlights
- **Vibrant Colors & Crisp Detailing**: Handcrafted rendering with rich textures and dynamic range.
- **No Watermarks**: Clean, 100% full-resolution preview files ready for personal enjoyment.
- **12-Hour Secure Access**: Re-download anytime during your active validity window.
- **Zero Account Required**: Fast 1-click checkout with secure instant access.

---

### 📜 Licensing & Usage
- **License Type**: Personal & Non-Commercial Use.
- You may use these files across all personal smartphones, tablets, and computers. Redistribution or resale is strictly prohibited.`

  return {
    title: cleanTitle,
    slug,
    short_description: shortDescription,
    description: fullDescription,
    suggested_price: 199,
    suggested_sale_price: 49,
    tags: baseTags,
    meta_title: `${cleanTitle} — Instant 4K Digital Download`,
    meta_description: `Download ${cleanTitle} instantly in ultra high definition. 100% verified digital asset with instant 1-click delivery.`,
    is_fallback: true
  }
}

// POST /api/admin/ai/generate-product
app.post('/generate-product', async (c) => {
  try {
    const body = await c.req.json<GenerateRequest>()
    const topic = (body.prompt || body.title || '').trim()

    if (!topic) {
      return c.json({ error: 'Please provide a product title or topic prompt' }, 400)
    }

    // Determine API key: check request body -> DB site_settings -> env -> default
    let apiKey = body.apiKey?.trim()
    if (!apiKey) {
      try {
        const row = await c.env.DB.prepare(`SELECT value FROM website_settings WHERE key = 'gemini_api_key'`).first<{ value: string }>()
        if (row?.value) {
          try {
            apiKey = JSON.parse(row.value)
          } catch {
            apiKey = row.value
          }
        }
      } catch {}
    }
    if (!apiKey) {
      apiKey = (c.env as any).GEMINI_API_KEY || DEFAULT_GEMINI_KEY
    }

    // Call Gemini Generative Language API
    const systemInstruction = `You are an expert e-commerce copywriter for 1024TeraViralHub, a premium digital product marketplace.
Generate a high-converting digital product package details from the user's prompt.
Respond ONLY with a valid JSON object without markdown fences, with these exact keys:
{
  "title": "Clear, compelling, SEO-friendly title (max 80 chars)",
  "slug": "url-friendly-slug-in-lowercase",
  "short_description": "Catchy 1-2 sentence hook (max 200 chars)",
  "description": "Full structured markdown description including Overview, What is Included, Key Features, and License Information",
  "suggested_price": 199,
  "suggested_sale_price": 49,
  "tags": ["tag1", "tag2", "tag3", "tag4", "tag5", "tag6"],
  "meta_title": "SEO Title (max 65 chars)",
  "meta_description": "SEO Meta Description (max 155 chars)"
}`

    const promptText = `Generate digital product content for: "${topic}". Category context: ${body.category_name || 'Wallpapers & Digital Art'}, File type: ${body.file_type || 'image'}.`

    const candidateModels = ['gemini-flash-latest', 'gemini-3.6-flash']
    let aiResponseText = ''
    let lastError: string | null = null

    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-goog-api-key': apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [{ text: `${systemInstruction}\n\nTask:\n${promptText}` }]
              }
            ],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 1500,
            }
          })
        })

        if (res.ok) {
          const json = await res.json() as any
          const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text || ''
          if (rawText) {
            aiResponseText = rawText
            break
          }
        } else {
          const errBody = await res.text()
          lastError = `Status ${res.status}: ${errBody}`
        }
      } catch (err: any) {
        lastError = err.message
      }
    }

    if (aiResponseText) {
      // Clean possible markdown code fences
      const cleanJson = aiResponseText.replace(/```json/gi, '').replace(/```/g, '').trim()
      try {
        const parsed = JSON.parse(cleanJson)
        return c.json({
          success: true,
          data: {
            ...parsed,
            slug: parsed.slug || topic.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            is_fallback: false,
          },
          source: 'gemini-ai'
        })
      } catch (parseErr) {
        console.warn('Failed to parse Gemini JSON, falling back:', parseErr)
      }
    }

    // Fallback: Smart Heuristic generation
    console.info('Using smart heuristic generator due to Gemini API response:', lastError)
    const fallbackData = generateSmartFallback(topic, body.file_type)

    return c.json({
      success: true,
      data: fallbackData,
      source: 'smart-fallback',
      note: lastError ? `AI generated via smart assistant. (Gemini Note: ${lastError.slice(0, 120)}...)` : undefined
    })

  } catch (err: any) {
    console.error('AI Generate Error:', err)
    return c.json({ error: 'Internal AI generation error', details: err.message }, 500)
  }
})

// POST /api/admin/ai/enhance-text
app.post('/enhance-text', async (c) => {
  try {
    const { text, type = 'description' } = await c.req.json<{ text: string; type?: string }>()
    if (!text || text.length < 5) {
      return c.json({ error: 'Please provide at least 5 characters of text to enhance' }, 400)
    }

    const enhanced = `### ✨ Premium Quality Guarantee\n${text}\n\n- **100% High-Definition Deliverables**\n- **Instant 1-Click Secure Download**\n- **Lifetime Personal Usage Rights**`

    return c.json({ success: true, text: enhanced })
  } catch (err: any) {
    return c.json({ error: err.message }, 500)
  }
})

// POST /api/admin/ai/test-key
app.post('/test-key', async (c) => {
  try {
    const { apiKey } = await c.req.json<{ apiKey: string }>()
    if (!apiKey) return c.json({ error: 'No API key provided' }, 400)

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent`
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': apiKey.trim(),
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Respond with OK' }] }]
      })
    })

    const bodyText = await res.text()
    if (res.ok) {
      return c.json({ success: true, message: 'Gemini API Key verified and working successfully!' })
    }

    return c.json({
      success: false,
      status: res.status,
      message: `Google API returned status ${res.status}.`,
      details: bodyText
    })
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500)
  }
})

export default app
