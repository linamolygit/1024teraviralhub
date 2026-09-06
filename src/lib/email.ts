// src/lib/email.ts — Transactional Email Notification Service
// Supports Resend API and Cloudflare MailChannels with graceful fallback

export interface SendEmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

export async function sendEmail(apiKey: string | undefined, options: SendEmailOptions): Promise<boolean> {
  const fromEmail = options.from || '1024TeraViralHub <noreply@1024teraviralhub.com>'

  // If Resend API key is provided
  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [options.to],
          subject: options.subject,
          html: options.html,
        }),
      })
      return res.ok
    } catch (err) {
      console.error('Resend email error:', err)
    }
  }

  // Cloudflare Workers MailChannels Fallback (Direct SMTP on edge)
  try {
    const res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: options.to }] }],
        from: { email: 'noreply@1024teraviralhub.com', name: '1024TeraViralHub' },
        subject: options.subject,
        content: [{ type: 'text/html', value: options.html }],
      }),
    })
    return res.ok
  } catch (err) {
    console.warn('MailChannels fallback skipped:', err)
    return false
  }
}

// ── Email Templates ──

export function getOrderSuccessEmailHtml(data: {
  customerName: string
  productTitle: string
  orderNumber: string
  amount: number
  downloadUrl: string
  expiryHours: number
  siteName?: string
  supportEmail?: string
}) {
  const storeName = data.siteName || 'Digital Store'
  const support = data.supportEmail || 'support@example.com'

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Your Digital Download Access</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #0d0d12; color: #ffffff; padding: 40px 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #13131a; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #2874F0; font-size: 24px; margin: 0;">${storeName}</h1>
        <p style="color: #a1a1aa; font-size: 14px; margin: 4px 0 0;">Payment Verified · Instant Download</p>
      </div>

      <div style="background-color: #1a1a24; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
        <h2 style="color: #10B981; font-size: 18px; margin: 0 0 12px;">✅ Payment Successful</h2>
        <p style="margin: 0 0 8px; font-size: 14px; color: #d4d4d8;">Hi ${data.customerName || 'Customer'},</p>
        <p style="margin: 0; font-size: 14px; color: #a1a1aa; line-height: 1.5;">Thank you for your purchase of <strong>${data.productTitle}</strong>. Your secure 12-hour download access is now ready below.</p>
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="${data.downloadUrl}" style="background: linear-gradient(135deg, #2874F0 0%, #1A5DC8 100%); color: #ffffff; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 16px; display: inline-block; box-shadow: 0 8px 20px rgba(40,116,240,0.4);">
          ⚡ Access & Download Files Now
        </a>
        <p style="color: #f59e0b; font-size: 12px; margin-top: 12px;">⏳ Link expires in ${data.expiryHours} hours</p>
      </div>

      <div style="border-top: 1px solid rgba(255,255,255,0.08); padding-top: 16px; font-size: 12px; color: #71717a; text-align: center;">
        <p style="margin: 0 0 4px;">Order Number: ${data.orderNumber} · Amount Paid: ₹${data.amount}</p>
        <p style="margin: 0;">Need help? Reply directly or email ${support}</p>
      </div>
    </div>
  </body>
  </html>
  `
}
