// ============================================
// src/App.tsx — Main Router with ErrorBoundary & Persistent Layouts
// ============================================

import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { useEffect, useLayoutEffect, Suspense } from 'react'
import { useAuthStore } from './client/lib/auth-store'
import { saveUtmParams } from './client/lib/utils'
import Header from './client/components/layout/Header'
import Footer from './client/components/layout/Footer'
import LoadingSpinner from './client/components/ui/LoadingSpinner'
import MetaPixel from './client/components/MetaPixel'
import GoogleServicesHead from './client/components/GoogleServicesHead'
import ThemeProvider from './client/components/ThemeProvider'
import ErrorBoundary from './client/components/ErrorBoundary'
import NonBuyerAdTrigger from './client/components/ads/NonBuyerAdTrigger'
import { lazyWithRetry } from './client/lib/lazyWithRetry'
import { initAnalyticsListeners, trackPageView } from './client/lib/analytics-tracker'

// Public Pages (lazy loaded with auto-retry)
const HomePage = lazyWithRetry(() => import('./client/pages/home/HomePage'))
const ProductsPage = lazyWithRetry(() => import('./client/pages/products/ProductsPage'))
const CategoryPage = lazyWithRetry(() => import('./client/pages/products/CategoryPage'))
const ProductPage = lazyWithRetry(() => import('./client/pages/product/ProductPage'))
const CheckoutPage = lazyWithRetry(() => import('./client/pages/checkout/CheckoutPage'))
const PaymentProcessingPage = lazyWithRetry(() => import('./client/pages/payment/PaymentProcessingPage'))
const PaymentSuccessPage = lazyWithRetry(() => import('./client/pages/payment/PaymentSuccessPage'))
const PaymentFailedPage = lazyWithRetry(() => import('./client/pages/payment/PaymentFailedPage'))
const DownloadPage = lazyWithRetry(() => import('./client/pages/download/DownloadPage'))
const DownloadsPage = lazyWithRetry(() => import('./client/pages/downloads/DownloadsPage'))
const MyOrdersPage = lazyWithRetry(() => import('./client/pages/orders/MyOrdersPage'))
const OrderLookupPage = lazyWithRetry(() => import('./client/pages/order-lookup/OrderLookupPage'))
const SearchPage = lazyWithRetry(() => import('./client/pages/search/SearchPage'))
const WishlistPage = lazyWithRetry(() => import('./client/pages/wishlist/WishlistPage'))
const AffiliatePage = lazyWithRetry(() => import('./client/pages/affiliate/AffiliatePage'))
const AboutPage = lazyWithRetry(() => import('./client/pages/static/AboutPage'))
const ContactPage = lazyWithRetry(() => import('./client/pages/static/ContactPage'))
const HelpPage = lazyWithRetry(() => import('./client/pages/static/HelpPage'))
const FaqPage = lazyWithRetry(() => import('./client/pages/static/FaqPage'))
const BlogListPage = lazyWithRetry(() => import('./client/pages/blog/BlogListPage'))
const BlogArticlePage = lazyWithRetry(() => import('./client/pages/blog/BlogArticlePage'))

// Legal Pages
const PrivacyPage = lazyWithRetry(() => import('./client/pages/legal/PrivacyPage'))
const TermsPage = lazyWithRetry(() => import('./client/pages/legal/TermsPage'))
const RefundPage = lazyWithRetry(() => import('./client/pages/legal/RefundPage'))
const DisclaimerPage = lazyWithRetry(() => import('./client/pages/legal/DisclaimerPage'))
const CookiePolicyPage = lazyWithRetry(() => import('./client/pages/legal/CookiePolicyPage'))
const PricingProductsPage = lazyWithRetry(() => import('./client/pages/legal/PricingProductsPage'))
const ShippingPolicyPage = lazyWithRetry(() => import('./client/pages/legal/ShippingPolicyPage'))
const ShareBridgePage = lazyWithRetry(() => import('./client/pages/share/ShareBridgePage'))

// Admin Pages
const AdminLoginPage = lazyWithRetry(() => import('./client/pages/admin/AdminLoginPage'))
const AdminLayout = lazyWithRetry(() => import('./client/pages/admin/AdminLayout'))
const AdminDashboard = lazyWithRetry(() => import('./client/pages/admin/AdminDashboard'))
const AdminProducts = lazyWithRetry(() => import('./client/pages/admin/products/AdminProducts'))
const AdminProductDetail = lazyWithRetry(() => import('./client/pages/admin/products/AdminProductDetail'))
const AdminProductCreate = lazyWithRetry(() => import('./client/pages/admin/products/AdminProductCreate'))
const AdminProductEdit = lazyWithRetry(() => import('./client/pages/admin/products/AdminProductEdit'))
const AdminOrders = lazyWithRetry(() => import('./client/pages/admin/orders/AdminOrders'))
const AdminOrderDetail = lazyWithRetry(() => import('./client/pages/admin/orders/AdminOrderDetail'))
const AdminCustomers = lazyWithRetry(() => import('./client/pages/admin/customers/AdminCustomers'))
const AdminCustomerDetail = lazyWithRetry(() => import('./client/pages/admin/customers/AdminCustomerDetail'))
const AdminCoupons = lazyWithRetry(() => import('./client/pages/admin/coupons/AdminCoupons'))
const AdminReviews = lazyWithRetry(() => import('./client/pages/admin/reviews/AdminReviews'))
const AdminUsers = lazyWithRetry(() => import('./client/pages/admin/users/AdminUsers'))
const AdminAffiliates = lazyWithRetry(() => import('./client/pages/admin/affiliates/AdminAffiliates'))
const AdminBlog = lazyWithRetry(() => import('./client/pages/admin/blog/AdminBlog'))
const AdminMediaPage = lazyWithRetry(() => import('./client/pages/admin/media/AdminMediaPage'))
const AdminAnalytics = lazyWithRetry(() => import('./client/pages/admin/AdminAnalytics'))
const AdminDownloads = lazyWithRetry(() => import('./client/pages/admin/AdminDownloads'))
const AdminSettings = lazyWithRetry(() => import('./client/pages/admin/AdminSettings'))
const AdminAdsManager = lazyWithRetry(() => import('./client/pages/admin/ads/AdminAdsManager'))
const AdminPaymentGateways = lazyWithRetry(() => import('./client/pages/admin/gateways/AdminPaymentGateways'))
const AdminExternalGateways = lazyWithRetry(() => import('./client/pages/admin/gateways/AdminExternalGateways'))
const AdminAuditLogs = lazyWithRetry(() => import('./client/pages/admin/AdminAuditLogs'))

const NotFoundPage = lazyWithRetry(() => import('./client/pages/NotFoundPage'))

// Admin Route Guard
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, initialized } = useAuthStore()
  if (!initialized) return <LoadingSpinner fullPage />
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

// Persistent Layouts via <Outlet /> — prevents unmounting/remounting on back navigation
function PublicLayout() {
  return (
    <>
      <Header />
      <NonBuyerAdTrigger />
      <main>
        <Outlet />
      </main>
      <Footer />
    </>
  )
}

function MinimalLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}

// Global ScrollToTop: Instantly resets scroll position on route change without any sliding animation
function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])

  useEffect(() => {
    if (!pathname.startsWith('/admin')) {
      trackPageView(pathname)
    }
  }, [pathname])

  return null
}

export default function App() {
  const initialize = useAuthStore(s => s.initialize)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
    initialize()
    saveUtmParams()
    initAnalyticsListeners()
  }, [initialize])

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <MetaPixel />
        <GoogleServicesHead />
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner fullPage />}>
          <Routes>
            {/* ─── Public Routes (Shared PublicLayout keeps Header/Footer persistent across navigations) ─── */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/categories" element={<CategoryPage />} />
              <Route path="/category/:slug" element={<CategoryPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/affiliate" element={<AffiliatePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/help" element={<HelpPage />} />
              <Route path="/faq" element={<FaqPage />} />
              <Route path="/blog" element={<BlogListPage />} />
              <Route path="/blog/:slug" element={<BlogArticlePage />} />
              <Route path="/order-lookup" element={<OrderLookupPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/orders" element={<MyOrdersPage />} />
              <Route path="/downloads" element={<DownloadsPage />} />
              <Route path="/my-downloads" element={<MyOrdersPage />} />

              {/* ─── Legal Routes ─── */}
              <Route path="/privacy-policy" element={<PrivacyPage />} />
              <Route path="/terms-and-conditions" element={<TermsPage />} />
              <Route path="/refund-policy" element={<RefundPage />} />
              <Route path="/shipping-policy" element={<ShippingPolicyPage />} />
              <Route path="/shipping-and-delivery-policy" element={<ShippingPolicyPage />} />
              <Route path="/disclaimer" element={<DisclaimerPage />} />
              <Route path="/cookie-policy" element={<CookiePolicyPage />} />
              <Route path="/pricing-products" element={<PricingProductsPage />} />
              <Route path="/pricing" element={<PricingProductsPage />} />
              <Route path="/pricing-policy" element={<PricingProductsPage />} />

              {/* ─── 404 ─── */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>

            {/* ─── Checkout / Payment (Minimal layout - no header/footer distraction) ─── */}
            <Route element={<MinimalLayout />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/checkout/:id" element={<CheckoutPage />} />
              <Route path="/payment/processing" element={<PaymentProcessingPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/payment/failed" element={<PaymentFailedPage />} />
              <Route path="/download/:token" element={<DownloadPage />} />
              <Route path="/share/:uid" element={<ShareBridgePage />} />
            </Route>

            {/* ─── Admin Routes ─── */}
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin"
              element={<AdminRoute><AdminLayout /></AdminRoute>}
            >
              <Route index element={<AdminDashboard />} />
              <Route path="products" element={<AdminProducts />} />
              <Route path="products/new" element={<AdminProductCreate />} />
              <Route path="products/:id" element={<AdminProductDetail />} />
              <Route path="products/:id/edit" element={<AdminProductEdit />} />
              <Route path="orders" element={<AdminOrders />} />
              <Route path="orders/:id" element={<AdminOrderDetail />} />
              <Route path="customers" element={<AdminCustomers />} />
              <Route path="customers/:id" element={<AdminCustomerDetail />} />
              <Route path="coupons" element={<AdminCoupons />} />
              <Route path="reviews" element={<AdminReviews />} />
              <Route path="users" element={<AdminUsers />} />
              <Route path="affiliates" element={<AdminAffiliates />} />
              <Route path="media" element={<AdminMediaPage />} />
              <Route path="blog" element={<AdminBlog />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="downloads" element={<AdminDownloads />} />
              <Route path="settings" element={<AdminSettings />} />
              <Route path="adsmanager" element={<AdminAdsManager />} />
              <Route path="payment-gateways" element={<AdminPaymentGateways />} />
              <Route path="gateways" element={<AdminExternalGateways />} />
              <Route path="audit-logs" element={<AdminAuditLogs />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </ThemeProvider>
  )
}
