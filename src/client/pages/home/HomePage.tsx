// src/client/pages/home/HomePage.tsx — Pixel-Accurate Production Homepage
import { useQuery } from '@tanstack/react-query'
import { api } from '../../lib/api'
import HeroSection from '../../components/home/HeroSection'
import TrustBar from '../../components/home/TrustBar'
import TrendingSection from '../../components/home/TrendingSection'
import CategorySection from '../../components/home/CategorySection'
import FeaturedCollectionSection from '../../components/home/FeaturedCollectionSection'
import HowItWorksSection from '../../components/home/HowItWorksSection'
import WhyChooseUsSection from '../../components/home/WhyChooseUsSection'
import BlogPreviewSection from '../../components/home/BlogPreviewSection'
import FinalCtaSection from '../../components/home/FinalCtaSection'
import AdPlacement from '../../components/ads/AdPlacement'

export default function HomePage() {
  // Query 1: Actual Products from Database (Featured first, then latest)
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: ['products', 'trending-home'],
    queryFn: () => api.products.list({ limit: 12 }),
  })

  // Query 2: Categories from Database
  const { data: categoriesData, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ['categories-home'],
    queryFn: () => api.categories.list(),
  })

  // Prioritize featured products, followed by latest published products
  const products = (productsData?.products || []).slice().sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return 0
  })
  const categories = categoriesData?.categories || []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-base)' }}>
      {/* 1. Hero Section (Headline & Layered Floating Collage) */}
      <HeroSection />

      {/* 2. Trust Indicators Strip */}
      <TrustBar />

      {/* 3. Trending Right Now (Product Cards Grid) */}
      <TrendingSection products={products} isLoading={isProductsLoading} />

      {/* 4. Browse Categories (5 Card Image Discovery) */}
      <CategorySection categories={categories} isLoading={isCategoriesLoading} />

      {/* Ad Placement: Mid-Homepage Banner */}
      <AdPlacement placementKey="home_banner_mid" />

      {/* 5. Featured Collection (Lavender Banner & Fanned-Out Cards) */}
      <FeaturedCollectionSection />

      {/* 6. How It Works (3 Connected Step Cards) */}
      <HowItWorksSection />

      {/* 7. Why Choose 1024 Tera Viral Hub? (4 Feature Cards) */}
      <WhyChooseUsSection />

      {/* 8. From the Hub (3 Editorial Blog Cards) */}
      <BlogPreviewSection />

      {/* 9. Final CTA (Find Something Worth Downloading) */}
      <FinalCtaSection />
    </div>
  )
}
