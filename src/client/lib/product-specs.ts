// src/client/lib/product-specs.ts
// Authentic Flipkart-Style Product Specifications, Attributes & Ratings Helper

export interface ProductSpecItem {
  id?: number | string
  title?: string
  slug?: string
  category_name?: string
  average_rating?: number
}

// ── Complete Flipkart-Style Specifications Dataset for Site Products ──────────
export const PRODUCT_FLIPKART_SPECS: Record<string, string> = {
  // Wallpapers & Art
  'shiv-wallpaper': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'durga-mata': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'laxmi-god': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'ram-ji-wallpaper': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'hanuman-ji': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'krishna': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  'shani-dev-wallpaper': 'Ultra HD Glossy Vinyl, Waterproof Self-Adhesive, 90 x 60 cm',
  '3d-wallpaper-3-piece-120m': 'Pack of 3 (120M Total), Self-Adhesive Waterproof PVC, 3D Embossed',

  // Murtis & Devotional Handcrafted Idols
  'hanuman-ji-murti': 'Polyresin Gold Plated, Handcrafted Idol, 6.5 Inch, Orange & Gold',
  'laxmi-mata-murti': 'Marble Dust & Brass Finish, Handcrafted Idol, 7 Inch, Multitone',
  'durga-mata-murti': 'Polyresin Gold Accent, Sherawali Mata Idol, 8 Inch, Multitone',
  'shivling': 'Natural Black Narmadeshwar Stone with Brass Sheshnaag & Trishul, 5 Inch',
  'khatu-shyam-ji': 'Handcrafted Marble Finish, 24K Gold Foil Work, 6 Inch, Multitone',

  // Smartphones
  'iphone-17-pro': '128 GB ROM, Natural Titanium, 5G, 6.3 Inch Super Retina XDR',
  'vivo-y58-5g': '8 GB RAM, 128 GB Storage, 6000 mAh Battery, Sundarban Green',

  // Stoves & Cooking
  'electric-stove': '2000W, Push Button Controls, Induction & All Cookware, Crystal Black',
  'electric-stove-mv3leyir': '2000W, Push Button Controls, Induction & All Cookware, Crystal Black',
  'mini-gas-stove': 'Single Burner, Toughened Glass Top, Manual Ignition, Rust-Free Brass',

  // Diyas, Candles & Torans
  'water-sensor-diya': 'Pack of 12, Water Sensor LED, Smokeless & Flameless, Warm Yellow',
  'led-diya-25-pack': 'Pack of 25, Flameless LED, Battery Operated, Golden Yellow',
  'artificial-candles-pack-of-2': 'Pack of 2, Flickering Flame LED, Smokeless Wax Finish, Amber',
  'kamal-diya-pack-of-2': 'Pack of 2, Lotus Shape, Water Sensor LED, Golden Brass Finish',

  // Inverter Bulbs & Solar Lights
  'solar-rechargeable-led-bulb': '12W, Emergency Inverter B22, Solar & AC Dual Charging, Cool White',
  'rechargeable-led-bulb-18w': '18W, 4 Hours Power Backup, Inverter B22 Base, Cool Day Light',
  'solar-rechargeable-light': 'Dual Charging Solar & USB, High Lumen Emergency Lantern, Blue',
  'garden-solar-light': 'Pack of 4, Solar Spike Lamps, IP65 Waterproof, Warm White LED',
  'solar-grill-light': 'Outdoor Motion Sensor, Waterproof Solar Wall Mount, Black',

  // Decorative Lights & String Lamps
  'jhalar-lights-3-pack': 'Pack of 3, 50M Each, Multicolor LED, 8 Flashing Modes',
  'strip-light-3-pack': 'Pack of 3, 15M (5M Each), Multicolor RGB, Remote Control & Adapter',
  'mini-disco-light': 'RGB Laser Ball, Sound Sensor Activated, USB Powered, 360° Rotation',
  'diwali-mandala-light': '40 cm, Multicolor LED, Floor & Wall Rangoli Decor, Plug-in',
  'star-light-lamp-pack-of-2': 'Pack of 2, 3D Acrylic Star, Warm White LED, Plug-in Table Top',
  'star-fairy-string-light-pact-of-2': 'Pack of 2, 8 Flashing Modes, Warm White, Curtain Fairy String Light',

  // Kitchen & Home Appliances
  'mini-electric-chopper': '250 ml, 3 Stainless Steel Blades, USB Rechargeable, Mint Green',
  'mini-garment-steamer': '1200W, Handheld Portable, 150ml Water Tank, Fast Heat-Up, White',
  'mini-sewing-machine': '2-Speed Double Thread, Foot Pedal & Power Adapter, White & Purple',
  'electric-dough-maker': '3.5L Stainless Steel Bowl, 350W Motor, Automatic Atta Kneader',
  'mini-electric-chakki': 'Stainless Steel Grinding Jar, 300W High Speed, Dry Masala & Coffee',
  'roti-maker': '1000W Non-Stick Coating, Shock-Proof Body, Automatic Thermostat',

  // Storage, Racks & Bathroom
  'rotating-storage-container': '360° Rotating, 6 Compartment, Food Grade Plastic, Transparent White',
  'stainless-steel-storage-rack': '3 Tier, Rust-Proof Stainless Steel, 40 x 30 x 60 cm, Silver',
  'bathroom-corner-cabinet': 'Wall Mount, Waterproof Engineered PVC, 3 Shelves with Mirror Door',

  // Home Decor & Furniture
  'elastic-bedsheet': 'King Size (72x78 in), 100% Glace Cotton, All-Around Elastic, Floral',
  'premium-latex-mattress': 'King Size (78x72 in), 6 Inch, Natural Latex & Orthopedic Memory Foam',
  'rolling-chair': 'Ergonomic Breathable Mesh, 360° Swivel, Adjustable Height, Black',
  'baby-bouncer-swing': 'Adjustable 3-Point Recline, Safety Harness, Breathable Soft Cotton Fabric',

  // Security Cameras & Tap Accessories
  'usb-camera': 'Flexible Gooseneck, 1080P HD, Plug & Play, Night Vision, Black',
  'wifi-cctv-camera-bulb': '1080P Full HD, 360° Panoramic View, E27 Socket, Two-Way Audio',
  'mini-cctv-camera': 'Wireless Magnetic Base, 1080P Full HD, Night Vision, Black',
  'tap-splitter-pack-of-1': '360° Rotatable Aerator, 2 Spray Modes, Solid Brass & Chrome Finish',

  // Bags & Travel
  'portable-bag': 'Foldable Travel Duffle, Water Resistant Oxford Fabric, Multi-Pocket',
}

// ── Smart Dynamic Specification Extractor (Fallback for new/dynamic products) ─
export function getProductSpecifications(product?: ProductSpecItem | string | null): string {
  if (!product) return 'Pack of 1, Premium Quality, Standard Size'

  const title = typeof product === 'string' ? product : (product.title || '')
  const slug = typeof product === 'object' && product?.slug ? product.slug : ''

  // 1. Check exact slug dictionary match
  if (slug && PRODUCT_FLIPKART_SPECS[slug]) {
    return PRODUCT_FLIPKART_SPECS[slug]
  }

  // 2. Check title-based slug approximation
  const normalizedSlug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-')
  if (PRODUCT_FLIPKART_SPECS[normalizedSlug]) {
    return PRODUCT_FLIPKART_SPECS[normalizedSlug]
  }

  // Also check if any known key matches title
  const lower = title.toLowerCase()

  if (PRODUCT_FLIPKART_SPECS[lower]) {
    return PRODUCT_FLIPKART_SPECS[lower]
  }

  // 3. Keyword-based intelligent specification constructor
  // Extracts pack count if present in title (e.g., "Pack of 3", "25 Pack", "3 pack", "3 piece")
  const packMatch = title.match(/(?:pack\s*of\s*(\d+)|(\d+)\s*pack|(\d+)\s*piece)/i)
  const packCount = packMatch ? (packMatch[1] || packMatch[2] || packMatch[3]) : null
  const packPrefix = packCount ? `Pack of ${packCount}, ` : ''

  // Meter / Length matching (e.g., "50M", "120M", "152 cm")
  const lengthMatch = title.match(/(\d+\s*(?:m|meter|cm|inch|in)\b)/i)
  const lengthStr = lengthMatch ? `${lengthMatch[1].toUpperCase()}, ` : ''

  if (lower.includes('jhalar') || (lower.includes('light') && lower.includes('string'))) {
    return `${packPrefix || 'Pack of 2, '}${lengthStr || '50M, '}Multicolor LED`
  }

  if (lower.includes('strip light')) {
    return `${packPrefix || 'Pack of 3, '}${lengthStr || '5M Each, '}Multicolor RGB, Remote Control`
  }

  if (lower.includes('diya') || lower.includes('candle')) {
    return `${packPrefix || 'Pack of 12, '}Water Sensor LED, Smokeless, Warm Yellow`
  }

  if (lower.includes('krishna') && lower.includes('lotus')) {
    return 'Pearl Strings, Fabric, Plastic Beads, MDF'
  }

  if (lower.includes('garland') || lower.includes('toran')) {
    return `${lengthStr || '152 cm, '}${packPrefix || 'Pack of 5, '}Garlands`
  }

  if (lower.includes('thread') || lower.includes('fitness')) {
    return 'cotton thread'
  }

  if (lower.includes('bedsheet')) {
    return 'King Size (72x78 in), 100% Glace Cotton, All-Around Elastic'
  }

  if (lower.includes('mattress')) {
    return 'Natural Latex & Orthopedic Memory Foam, King Size (78x72 in)'
  }

  if (lower.includes('stove')) {
    return '2000W, Push Button Controls, Induction & Gas Compatible, Black'
  }

  if (lower.includes('bulb')) {
    return '12W, Emergency Inverter B22 Base, Cool Day Light'
  }

  if (lower.includes('chopper')) {
    return '250 ml, 3 Stainless Steel Blades, USB Rechargeable, Mint Green'
  }

  if (lower.includes('steamer')) {
    return '1200W, Handheld Portable, 150ml Water Tank, Fast Heat-Up'
  }

  if (lower.includes('dough') || lower.includes('atta')) {
    return '3.5L Stainless Steel Bowl, 350W Motor, Automatic Atta Kneader'
  }

  if (lower.includes('chakki') || lower.includes('grinder')) {
    return 'Stainless Steel Grinding Jar, 300W High Speed, Dry Masala & Coffee'
  }

  if (lower.includes('roti')) {
    return '1000W Non-Stick Coating, Shock-Proof Body, Automatic Thermostat'
  }

  if (lower.includes('bag')) {
    return 'Foldable Travel Duffle, Water Resistant Oxford Fabric, Multi-Pocket'
  }

  if (lower.includes('chair')) {
    return 'Ergonomic Breathable Mesh, 360° Swivel, Adjustable Height, Black'
  }

  if (lower.includes('swing') || lower.includes('bouncer')) {
    return 'Adjustable 3-Point Recline, Safety Harness, Breathable Soft Cotton Fabric'
  }

  if (lower.includes('cabinet') || lower.includes('bathroom')) {
    return 'Wall Mount, Waterproof Engineered PVC, 3 Shelves with Mirror Door'
  }

  if (lower.includes('rack') || lower.includes('container') || lower.includes('storage')) {
    return '360° Rotating, Rust-Proof Stainless Steel & Food Grade Plastic'
  }

  if (lower.includes('tap') || lower.includes('splitter') || lower.includes('aerator')) {
    return '360° Rotatable Aerator, 2 Spray Modes, Solid Brass & Chrome Finish'
  }

  if (lower.includes('camera') || lower.includes('cctv')) {
    return '1080P Full HD, 360° Panoramic View, Night Vision, Wireless'
  }

  if (lower.includes('disco') || lower.includes('mandala')) {
    return 'RGB Laser Ball, Sound Sensor Activated, USB Powered, 360° Rotation'
  }

  if (lower.includes('murti') || lower.includes('idol') || lower.includes('statue')) {
    return 'Polyresin Gold Plated, Handcrafted Idol, 6.5 Inch, Multitone'
  }

  if (lower.includes('wallpaper')) {
    return `${lengthStr || '90 x 60 cm, '}Ultra HD Glossy Vinyl, Waterproof Self-Adhesive`
  }

  if (lower.includes('iphone') || lower.includes('vivo') || lower.includes('phone')) {
    return '8 GB RAM, 128 GB Storage, 5G, Pristine Condition'
  }

  // Clean fallback based on pack/length if found
  if (packPrefix || lengthStr) {
    return `${lengthStr}${packPrefix}Premium Material, High Durability`.replace(/,\s*$/, '')
  }

  return 'Pack of 1, High Grade Material, Standard Size'
}

// ── Realistic Product Rating & Review Count Helper ────────────────────────────
// Matches exactly what ProductGallery calculates on the product page
export function getProductRatingData(product?: { id?: number | string; average_rating?: number | null } | null): {
  rating: string
  reviewCount: string
} {
  const numId = typeof product?.id === 'number' ? product.id : (parseInt(String(product?.id || '1'), 10) || 1)
  
  // Rating: Use product average_rating if provided, or clean default 4.4
  const ratingVal = product?.average_rating && Number(product.average_rating) > 0
    ? Number(product.average_rating).toFixed(1)
    : '4.4'

  // Review Count: Exact formula used in ProductGallery: (5.1 + (((id * 37 + 13) % 28) * 0.1))
  // Range is 5.1K to 7.8K (realistic thousands, NOT 5.1 Lakhs!)
  const countNum = (5.1 + (((numId * 37 + 13) % 28) * 0.1)).toFixed(1)
  const reviewCount = `${countNum}K+`

  return {
    rating: ratingVal,
    reviewCount
  }
}
