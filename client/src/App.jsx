import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Suspense, useEffect } from 'react'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Assistant from './components/Assistant'
import CartDrawer from './components/CartDrawer'
import WhatsAppButton from './components/WhatsAppButton'
import { RequireAuth, RequireAdmin } from './components/RequireAuth'
import { PageLoader } from './components/Skeleton'
import Home from './pages/Home'
import { Pages, prefetch } from './routes'
import { setLenis, scrollToTop } from './lib/scroll'
import { useAuth } from './store/auth'
import { useCatalog } from './store/catalog'

const {
  Collection, Brand, Product, Cart, Checkout, Wishlist, Login, Account, NotFound,
  AdminLogin, AdminLayout, AdminStatistics, AdminProducts, AdminProductForm, AdminCategories, AdminOrders, AdminCustomers,
} = Pages

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { scrollToTop() }, [pathname])
  return null
}

// Shopper widgets (style assistant, WhatsApp bubble) are hidden inside the admin area.
function ShopWidgets() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/admin')) return null
  return (
    <>
      <Assistant />
      <WhatsAppButton />
    </>
  )
}

export default function App() {
  useEffect(() => {
    useAuth.getState().init()
    useCatalog.getState().load()
  }, [])

  useEffect(() => {
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const lenis = new Lenis({ smoothWheel: true, duration: 1.1 })
    setLenis(lenis)
    let raf
    function frame(t) {
      lenis.raf(t)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); setLenis(null); lenis.destroy() }
  }, [])

  // Warm up the most visited pages once the browser is idle.
  useEffect(() => {
    const idle = window.requestIdleCallback || ((cb) => setTimeout(cb, 1500))
    const cancel = window.cancelIdleCallback || clearTimeout
    const id = idle(() => { prefetch('collection'); prefetch('product') })
    return () => cancel(id)
  }, [])

  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/women" element={<Collection gender="women" />} />
              <Route path="/men" element={<Collection gender="men" />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/brand/:brand" element={<Brand />} />
              <Route path="/product/:id" element={<Product />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/wishlist" element={<Wishlist />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Login mode="register" />} />
              <Route path="/account" element={<RequireAuth><Account /></RequireAuth>} />
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminStatistics />} />
                <Route path="statistics" element={<AdminStatistics />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="products/new" element={<AdminProductForm />} />
                <Route path="products/:code/edit" element={<AdminProductForm />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="customers" element={<AdminCustomers />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <ShopWidgets />
        <CartDrawer />
        <Toaster position="bottom-left" richColors closeButton />
      </div>
    </BrowserRouter>
  )
}