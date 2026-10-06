import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import { Suspense, useEffect } from 'react'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Assistant from './components/Assistant'
import CartDrawer from './components/CartDrawer'
import WhatsAppButton from './components/WhatsAppButton'
import Home from './pages/Home'
import { Pages, prefetch } from './routes'
import { setLenis, scrollToTop } from './lib/scroll'

const { Collection, Brand, Product, Cart, Checkout, Wishlist, Admin, NotFound } = Pages

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => { scrollToTop() }, [pathname])
  return null
}

function PageFallback() {
  return (
    <div className="container-x py-8 min-h-[60vh]" aria-busy="true">
      <div className="h-3 w-16 img-skeleton mb-3" />
      <div className="h-8 w-48 img-skeleton mb-8" />
      <div className="product-grid">
        {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-[3/4] bg-white img-skeleton" />)}
      </div>
    </div>
  )
}

export default function App() {
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
          <Suspense fallback={<PageFallback />}>
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
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
        <Assistant />
        <WhatsAppButton />
        <CartDrawer />
        <Toaster position="bottom-left" richColors closeButton />
      </div>
    </BrowserRouter>
  )
}
