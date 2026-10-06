import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useEffect } from 'react'
import Lenis from 'lenis'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Assistant from './components/Assistant'
import CartDrawer from './components/CartDrawer'
import WhatsAppButton from './components/WhatsAppButton'
import Home from './pages/Home'
import Collection from './pages/Collection'
import Brand from './pages/Brand'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import Wishlist from './pages/Wishlist'
import Admin from './pages/Admin'
import NotFound from './pages/NotFound'

export default function App() {
  useEffect(() => {
    const lenis = new Lenis({ smoothWheel: true, duration: 1.1 })
    let raf
    function frame(t) {
      lenis.raf(t)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => { cancelAnimationFrame(raf); lenis.destroy() }
  }, [])

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">
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
