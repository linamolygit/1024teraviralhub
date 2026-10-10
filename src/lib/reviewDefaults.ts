// src/lib/reviewDefaults.ts — Generic Flipkart Reviews & Smart Title-Matched Customer Photos
// Matches exact Flipkart reviews style (e.g. "Good product", "Good for...", "Value for money", "Terrific")
// Automatically resolves relevant photos based on product title and uploaded product images.

export interface SeedReviewItem {
  name: string
  rating: number
  title: string
  comment: string
  helpful: number
}

// 20 realistic generic Flipkart-style reviews matching user requirement:
// e.g. "Good product", "good for....", "value for money", "Terrific purchase", "Worth every penny"
export const GENERIC_FLIPKART_REVIEWS: SeedReviewItem[] = [
  {
    name: 'Aarav Sharma',
    rating: 5,
    title: 'Terrific purchase',
    comment: 'Good product. Very useful and totally worth the price. Delivered instantly without any hassle!',
    helpful: 5,
  },
  {
    name: 'Priya Patel',
    rating: 5,
    title: 'Value-for-money',
    comment: 'Value for money! Best purchase in this budget. Everything is well organized and easy to use.',
    helpful: 4,
  },
  {
    name: 'Vikram Malhotra',
    rating: 4,
    title: 'Good product',
    comment: 'Good for daily use, simple and clean. Loved the experience, totally satisfied with the purchase.',
    helpful: 3,
  },
  {
    name: 'Sneha Verma',
    rating: 5,
    title: 'Just wow! Must buy',
    comment: 'Just wow! Exceeded my expectations. The quality is top notch and works like a charm. Very happy!',
    helpful: 6,
  },
  {
    name: 'Rohan Deshmukh',
    rating: 5,
    title: 'Worth every penny',
    comment: 'Worth every penny. The finishing and quality exceeded my expectations. Smooth transaction on PhonePe.',
    helpful: 7,
  },
  {
    name: 'Ananya Sen',
    rating: 4,
    title: 'Good quality',
    comment: 'Good product, good for personal use. Smooth transaction and received everything right away.',
    helpful: 2,
  },
  {
    name: 'Kunal Joshi',
    rating: 5,
    title: 'Mind-blowing purchase',
    comment: 'Mind-blowing purchase! Looks super premium and exactly as shown. 5 stars for the fast delivery!',
    helpful: 8,
  },
  {
    name: 'Pooja Reddy',
    rating: 5,
    title: 'Simply awesome',
    comment: 'Simply awesome product. Download link was provided immediately after payment. Super happy with the service.',
    helpful: 4,
  },
  {
    name: 'Amitabh Gupta',
    rating: 4,
    title: 'Value-for-money',
    comment: 'Value for money product, hassle-free access and genuine quality. Paisa vasool deal!',
    helpful: 3,
  },
  {
    name: 'Meera Iyer',
    rating: 5,
    title: 'Classy product',
    comment: 'Classy product. Received instant access on my phone. 100% genuine and safe experience.',
    helpful: 5,
  },
  {
    name: 'Deepak Nair',
    rating: 5,
    title: 'Super!',
    comment: 'Good for quick needs, no signup needed and direct access. Highly recommended to everyone!',
    helpful: 3,
  },
  {
    name: 'Rajesh Tiwari',
    rating: 4,
    title: 'Good product',
    comment: 'Good product, nice finishing and well organized. Very satisfied with the quick support.',
    helpful: 2,
  },
  {
    name: 'Shreya Ghosh',
    rating: 5,
    title: 'Fabulous!',
    comment: 'Fabulous! Very happy with this purchase. Quality is unbeatable in this price range.',
    helpful: 4,
  },
  {
    name: 'Nikhil Agarwal',
    rating: 5,
    title: 'Terrific purchase',
    comment: 'Terrific purchase! Crystal clear and crisp. Works smoothly on both mobile and laptop.',
    helpful: 5,
  },
  {
    name: 'Kavita Choudhary',
    rating: 4,
    title: 'Good for daily use',
    comment: 'Good for daily use, simple and clean. Good value for money, 4.5/5 from my side.',
    helpful: 2,
  },
  {
    name: 'Manish Bhatt',
    rating: 5,
    title: 'Awesome',
    comment: 'Fast UPI payment via PhonePe and instant delivery. Awesome experience, genuine seller!',
    helpful: 6,
  },
  {
    name: 'Ritu Saxena',
    rating: 5,
    title: 'Must buy!',
    comment: 'Just loved it! Don’t think twice, just go for it. Totally value for money.',
    helpful: 4,
  },
  {
    name: 'Sanjay Kulkarni',
    rating: 4,
    title: 'Decent product',
    comment: 'Decent product, good quality and worth buying at this price point. Smooth transaction.',
    helpful: 2,
  },
  {
    name: 'Tarun Kapoor',
    rating: 5,
    title: 'Brilliant',
    comment: 'Brilliant product, high utility and works flawlessly. Instant access link received.',
    helpful: 3,
  },
  {
    name: 'Sunita Dubey',
    rating: 5,
    title: 'Value-for-money',
    comment: 'Great experience, no hassle at all. Smooth transaction and genuine high quality item.',
    helpful: 4,
  },
]

/**
 * Smart Title-Based Image Engine
 * Returns 5 high-resolution thematic image URLs tailored to the product title keywords.
 */
export function getThematicImagesForTitle(title: string = ''): string[] {
  const t = title.toLowerCase()

  // 1. Mobile / Smartphones (iPhone, Vivo, etc.)
  if (t.includes('iphone') || t.includes('vivo') || t.includes('phone') || t.includes('mobile') || t.includes('smartphone')) {
    return [
      'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1580910051074-3eb694886505?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 2. Kitchen / Chopper / Stove / Cooker / Appliances
  if (t.includes('chopper') || t.includes('stove') || t.includes('cooker') || t.includes('kitchen') || t.includes('rack') || t.includes('container') || t.includes('storage')) {
    return [
      'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1588854337236-6889d631faa8?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 3. Bedsheets / Home Bedding / Textiles
  if (t.includes('bedsheet') || t.includes('bed') || t.includes('cotton') || t.includes('pillow')) {
    return [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582582621959-48d27397dc69?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4550?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 4. Lights / Solar / Diya / LED / Festive / Mandala
  if (t.includes('diya') || t.includes('light') || t.includes('solar') || t.includes('bulb') || t.includes('jhalar') || t.includes('mandala') || t.includes('disco')) {
    return [
      'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1514517521153-1be72277b32f?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1543807535-eceef0bc6599?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1576016770956-deacc59d9f5d?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 5. Cameras / CCTV / Security / USB
  if (t.includes('camera') || t.includes('cctv') || t.includes('usb camera') || t.includes('webcam')) {
    return [
      'https://images.unsplash.com/photo-1557597774-9d273605dfa9?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 6. Steamer / Sewing / Household Gadgets
  if (t.includes('steamer') || t.includes('sewing') || t.includes('iron') || t.includes('machine')) {
    return [
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 7. Baby / Swing / Bouncer
  if (t.includes('baby') || t.includes('bouncer') || t.includes('swing')) {
    return [
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544126592-807ade215a0b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596464716127-f2a829822301?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 8. 3D Wallpaper / Wall Decal / Sticker
  if (t.includes('3d wallpaper') || (t.includes('wallpaper') && (t.includes('piece') || t.includes('decor') || t.includes('home')))) {
    return [
      'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1618219908412-a29a1bb7b86e?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 9. Lord Shiva / Mahadev / Shivling
  if (t.includes('shiv') || t.includes('mahadev') || t.includes('bhole') || t.includes('shivling')) {
    return [
      'https://images.unsplash.com/photo-1609342122563-a43ac8917a3a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1620336655055-088d06e36bf0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 10. Maa Durga / Laxmi / Goddess Wallpapers & Murtis
  if (t.includes('durga') || t.includes('laxmi') || t.includes('lakshmi') || t.includes('mata') || t.includes('goddess')) {
    return [
      'https://images.unsplash.com/photo-1602498456745-e9503b30470b?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1605379399642-870262d3d051?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1600180758890-6b94519a8ba6?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 11. Lord Ram / Hanuman / Krishna / Shyam / Shani
  if (t.includes('ram') || t.includes('hanuman') || t.includes('krishna') || t.includes('shyam') || t.includes('shani') || t.includes('murti')) {
    return [
      'https://images.unsplash.com/photo-1567157577867-05ccb1388e66?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544717302-de2939b7ef71?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1598899134739-24c46f58b8c0?w=600&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1614741118887-7a4ee193a5fa?w=600&auto=format&fit=crop&q=80',
    ]
  }

  // 12. Default high-definition aesthetic images
  return [
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?w=600&auto=format&fit=crop&q=80',
  ]
}

/**
 * Combines:
 * 1. Admin custom review images
 * 2. Uploaded product images (/api/images/...)
 * 3. Title-matched thematic photos
 * To guarantee 5 authentic review photos for the Flipkart collage & viewer.
 */
export function getProductReviewPhotos(
  productTitle: string,
  uploadedUrls: string[] = [],
  adminExtraImages: string[] = []
): string[] {
  const result: string[] = []

  // 1. Admin extra images first
  for (const url of adminExtraImages) {
    if (url && !result.includes(url)) result.push(url)
  }

  // 2. Real product uploaded photos second
  for (const url of uploadedUrls) {
    if (url && !result.includes(url)) result.push(url)
  }

  // 3. Complete up to 5 with title-matched photos
  if (result.length < 5) {
    const thematic = getThematicImagesForTitle(productTitle)
    for (const url of thematic) {
      if (!result.includes(url)) {
        result.push(url)
        if (result.length >= 5) break
      }
    }
  }

  return result
}
