// scripts/optimize-existing-r2.cjs — Batch Image Optimization Script for Existing R2 Images
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')
const sharp = require('sharp')

const DOMAIN = 'https://1024teraviralhub.hirensrivastawa.workers.dev'
const BUCKET = 'tvh-digital-assets'

const EXISTING_IMAGES = [
  'products/1/images/1788147078873-annotation_2024-05-21_130226.png',
  'products/2/images/1788175351494-screenshot_2024-07-30-06-44-22-568_com.facebook.katana.jpg',
  'products/2/images/1788175352956-annotation_2024-05-21_130307.png',
]

function getVariantKey(originalKey, variant) {
  const lastDot = originalKey.lastIndexOf('.')
  const basePath = lastDot > 0 ? originalKey.substring(0, lastDot) : originalKey
  return `${basePath}.${variant}.webp`
}

async function run() {
  const tempDir = path.join(__dirname, '..', '.temp_variants')
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true })

  console.log('🚀 Starting Meta-Grade Optimization for Existing R2 Images...\n')

  for (const key of EXISTING_IMAGES) {
    console.log(`\n========================================`)
    console.log(`Processing: ${key}`)

    const url = `${DOMAIN}/api/images/${encodeURIComponent(key)}`
    console.log(`Fetching original from: ${url}`)
    const res = await fetch(url)
    if (!res.ok) {
      console.error(`❌ Failed to fetch ${key}: status ${res.status}`)
      continue
    }

    const arrayBuf = await res.arrayBuffer()
    const inputBuf = Buffer.from(arrayBuf)
    const originalSizeKb = (inputBuf.length / 1024).toFixed(1)
    console.log(`Original size: ${originalSizeKb} KB`)

    const variants = [
      { name: 'thumb', width: 400, quality: 80 },
      { name: 'medium', width: 800, quality: 82 },
      { name: 'large', width: 1400, quality: 85 },
    ]

    for (const v of variants) {
      const variantKey = getVariantKey(key, v.name)
      const localFilename = path.basename(variantKey)
      const localPath = path.join(tempDir, localFilename)

      const webpBuf = await sharp(inputBuf)
        .resize({ width: v.width, withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: v.quality, effort: 5 })
        .toBuffer()

      fs.writeFileSync(localPath, webpBuf)
      const variantSizeKb = (webpBuf.length / 1024).toFixed(1)
      const reduction = (100 - (webpBuf.length / inputBuf.length) * 100).toFixed(1)
      console.log(`  ✓ Generated ${v.name} (${v.width}px): ${variantSizeKb} KB (-${reduction}%)`)

      // Upload to R2 via wrangler
      console.log(`    Uploading to R2: ${variantKey}...`)
      try {
        execSync(
          `npx wrangler r2 object put "${BUCKET}/${variantKey}" --file="${localPath}" --content-type="image/webp" --remote`,
          { stdio: 'pipe' }
        )
        console.log(`    ✨ Uploaded successfully to R2!`)
      } catch (err) {
        console.error(`    ❌ Upload failed: ${err.message}`)
      }
    }
  }

  // Cleanup temp files
  try {
    fs.rmSync(tempDir, { recursive: true, force: true })
  } catch {}

  console.log('\n🎉 All existing images have been compressed and uploaded to R2!')
}

run().catch((err) => {
  console.error('Fatal error in optimization script:', err)
  process.exit(1)
})
