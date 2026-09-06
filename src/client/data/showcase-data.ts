// src/client/data/showcase-data.ts — Visual Showcase Assets & Mock Data
// Matches the reference screenshot specifications for 1024 Tera Viral Hub

export interface ShowcaseProduct {
  id: string
  title: string
  category: string
  categorySlug: string
  description: string
  price: number
  currency: string
  image: string
  badge?: string
}

export interface ShowcaseCategory {
  id: string
  name: string
  slug: string
  icon: string
  image: string
  count?: number
}

export interface ShowcaseArticle {
  id: string
  slug: string
  title: string
  category: string
  date: string
  image: string
}

// ─── 1. Hero Layered Collage Assets ───────────
export const HERO_COLLAGE_ASSETS = {
  mountainLandscape: {
    title: 'Viral Photography',
    badge: 'Viral Photography',
    image: '/assets/hero/hero-mountain-landscape.webp',
  },
  creativeDigitalArt: {
    title: 'Creative Digital Art',
    badge: 'Creative Digital Art',
    image: '/assets/hero/hero-creative-digital-art.webp',
  },
  neonCity: {
    title: 'Social Media Pack',
    badge: 'Social Media Pack',
    image: '/assets/hero/hero-neon-city.webp',
  },
  premiumWallpaper: {
    title: 'Premium Wallpaper',
    badge: 'Premium Wallpaper',
    image: '/assets/hero/hero-premium-wallpaper.webp',
  },
}

// ─── 2. Trending Products (4 Cards) ───────────
export const SHOWCASE_PRODUCTS: ShowcaseProduct[] = [
  {
    id: 'prod-viral-pack-01',
    title: 'Viral Visual Pack Vol. 01',
    category: 'Viral Images',
    categorySlug: 'viral-images',
    description: 'High-impact viral images for maximum engagement.',
    price: 7.99,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'prod-aesthetic-collection',
    title: 'Premium Aesthetic Collection',
    category: 'Premium Photos',
    categorySlug: 'premium-photos',
    description: 'Curated high-quality aesthetic photos for creators.',
    price: 9.99,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'prod-creative-bundle',
    title: 'Creative Image Bundle',
    category: 'Creative Packs',
    categorySlug: 'creative-packs',
    description: 'A bundle of creative & modern images for any project.',
    price: 8.99,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'prod-social-pack',
    title: 'Social Media Image Pack',
    category: 'Social Media',
    categorySlug: 'social-media',
    description: 'Perfectly sized images for all social platforms.',
    price: 6.99,
    currency: '$',
    image: 'https://images.unsplash.com/photo-1433838552652-f9a46b332c40?auto=format&fit=crop&w=1000&q=85',
  },
]

// ─── 3. Browse Categories (5 Cards) ───────────
export const SHOWCASE_CATEGORIES: ShowcaseCategory[] = [
  {
    id: 'cat-viral',
    name: 'Viral Images',
    slug: 'viral-images',
    icon: 'bag',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'cat-photos',
    name: 'Premium Photos',
    slug: 'premium-photos',
    icon: 'camera',
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'cat-wallpapers',
    name: 'Wallpapers',
    slug: 'wallpapers',
    icon: 'monitor',
    image: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'cat-creative',
    name: 'Creative Packs',
    slug: 'creative-packs',
    icon: 'layers',
    image: 'https://images.unsplash.com/photo-1541701494587-cb58502866ab?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'cat-trending',
    name: 'Trending Collections',
    slug: 'trending-collections',
    icon: 'flame',
    image: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=85',
  },
]

// ─── 4. Featured Collection Images ────────────
export const FEATURED_COLLECTION_ASSETS = {
  city: 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=85',
  mountain: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=85',
  goldenLandscape: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1000&q=85',
  neonCity: '/assets/collection-section-image.png',
}

// ─── 5. From the Hub (Blog Articles) ──────────
export const SHOWCASE_BLOG_ARTICLES: ShowcaseArticle[] = [
  {
    id: 'article-1',
    slug: '10-tips-to-create-viral-images-that-get-noticed',
    title: '10 Tips to Create Viral Images That Get Noticed',
    category: 'Tips & Guides',
    date: 'May 10, 2026',
    image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'article-2',
    slug: 'best-digital-art-styles-trending-in-2026',
    title: 'Best Digital Art Styles Trending in 2026',
    category: 'Inspiration',
    date: 'May 12, 2026',
    image: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=1000&q=85',
  },
  {
    id: 'article-3',
    slug: 'where-to-find-high-quality-images-for-your-projects',
    title: 'Where to Find High-Quality Images for Your Projects',
    category: 'Resources',
    date: 'May 20, 2026',
    image: 'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1000&q=85',
  },
]
