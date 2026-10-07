import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Heart, Menu, User, Phone, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'
import { useUI } from '../store/ui'
import { BRANDS, STORE } from '../data/catalog'
import { useMeta } from '../store/catalog'
import { useAuth } from '../store/auth'
import Drawer from './Drawer'
import { prefetch } from '../routes'

const links = [
  { to: '/women', label: 'Women' },
  { to: '/men', label: 'Men' },
  { to: '/collection?category=Lawn', label: 'Lawn' },
  { to: '/collection?category=Pret', label: 'Pret' },
  { to: '/collection?category=Ethnic', label: 'Ethnic' },
  { to: '/collection?featured=true', label: 'New' },
]

// NavLink ignores the query string, so every /collection?… link looked "active" at once.
// Compare pathname AND the link's own query params instead.
function isActive(to, location) {
  const url = new URL(to, 'http://x')
  if (url.pathname !== location.pathname) return false
  const current = new URLSearchParams(location.search)
  for (const [k, v] of url.searchParams) if (current.get(k) !== v) return false
  return true
}

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [mobileBrands, setMobileBrands] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const location = useLocation()
  const count = useCart((s) => s.items.reduce((n, x) => n + x.qty, 0))
  const wish = useWishlist((s) => s.ids.length)
  const openCart = useUI((s) => s.openCart)
  const liveBrands = useMeta().brands
  const brands = liveBrands.length ? liveBrands : BRANDS
  const user = useAuth((s) => s.user)
  const isAdmin = useAuth((s) => s.profile?.role === 'admin')
  const accountTo = isAdmin ? '/admin/dashboard' : user ? '/account' : '/login'

  // Close menus whenever the route changes (back/forward, search, any link).
  const routeKey = location.pathname + location.search
  const [lastRoute, setLastRoute] = useState(routeKey)
  if (routeKey !== lastRoute) {
    setLastRoute(routeKey)
    setOpen(false)
    setBrandsOpen(false)
  }

  function onSearch(e) {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/collection?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }

  const linkClass = (to) => (isActive(to, location) ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]')
  const warm = () => prefetch('collection')

  return (
    <header className="sticky top-0 z-50 bg-[var(--color-paper)]/95 backdrop-blur border-b border-[var(--color-line)]">
      <div className="bg-[var(--color-ink)] text-white text-[11px] tracking-[0.12em] uppercase text-center py-2 px-3 flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
        <span>Free shipping over Rs 5,000 · COD</span>
        <span className="opacity-40 hidden sm:inline">|</span>
        <span>{STORE.address}</span>
        <a href={STORE.whatsapp} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:underline normal-case tracking-normal">
          <Phone size={11} /> {STORE.phoneDisplay}
        </a>
      </div>
      <div className="container-x flex items-center gap-4 h-14 md:h-16">
        <button type="button" className="lg:hidden p-1" onClick={() => setOpen(true)} aria-label="Menu" aria-expanded={open} aria-controls="mobile-menu"><Menu size={20} /></button>
        <Link to="/" className="font-display text-xl md:text-2xl tracking-tight shrink-0">Rana Collection</Link>
        <nav className="hidden lg:flex items-center gap-6 ml-6 text-[12px] tracking-[0.12em] uppercase relative">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onMouseEnter={warm} className={linkClass(l.to)}>{l.label}</Link>
          ))}
          <div className="relative" onMouseEnter={() => setBrandsOpen(true)} onMouseLeave={() => setBrandsOpen(false)}>
            <button type="button" onClick={() => setBrandsOpen((v) => !v)} aria-expanded={brandsOpen} className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)] inline-flex items-center gap-1">
              Brands <ChevronDown size={12} />
            </button>
            {brandsOpen && (
              <div className="absolute top-full left-0 pt-2 z-10">
                <div className="bg-white border border-[var(--color-line)] min-w-[200px] py-2 shadow-lg">
                  {brands.map((b) => (
                    <Link key={b} to={`/brand/${encodeURIComponent(b)}`} className="block px-4 py-2 text-[11px] tracking-wider normal-case hover:bg-[var(--color-paper-2)]">{b}</Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </nav>
        <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center border border-[var(--color-line)] bg-white max-w-xs w-full">
          <input value={q} onChange={(e) => setQ(e.target.value)} onFocus={warm} placeholder="Search lawn, kurta, brand…" className="flex-1 px-3 py-2 text-sm outline-none" />
          <button type="submit" className="px-3 text-[var(--color-mute)]" aria-label="Search"><Search size={16} /></button>
        </form>
        <div className="flex items-center gap-3 ml-auto md:ml-3">
          <Link to="/wishlist" className="relative p-1" aria-label="Wishlist">
            <Heart size={18} />
            {wish > 0 && <span className="absolute -top-1 -right-1 text-[10px] bg-[var(--color-accent)] text-white w-4 h-4 rounded-full grid place-items-center">{wish}</span>}
          </Link>
          <button type="button" onClick={openCart} className="relative p-1" aria-label="Cart">
            <ShoppingBag size={18} />
            {count > 0 && <span className="absolute -top-1 -right-1 text-[10px] bg-[var(--color-ink)] text-white w-4 h-4 rounded-full grid place-items-center">{count}</span>}
          </button>
          <Link to={accountTo} className="p-1 hidden sm:block" aria-label={user ? 'Account' : 'Log in'}><User size={18} /></Link>
        </div>
      </div>

      {/* Mobile menu: rendered through a portal so the blurred sticky header can't clip it. */}
      <Drawer open={open} onClose={() => setOpen(false)} side="left" title="Menu" id="mobile-menu" closeAbove={1024} widthClass="w-[80%] max-w-xs">
        <form onSubmit={onSearch} className="md:hidden flex items-center border border-[var(--color-line)] bg-white mb-4">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lawn, kurta, brand…" className="flex-1 min-w-0 px-3 py-2 text-sm outline-none" />
          <button type="submit" className="px-3 text-[var(--color-mute)]" aria-label="Search"><Search size={16} /></button>
        </form>
        <nav className="flex flex-col">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className={`text-sm tracking-widest uppercase py-3 border-b border-[var(--color-line)] ${isActive(l.to, location) ? 'text-[var(--color-accent)]' : ''}`}>{l.label}</Link>
          ))}
          <button type="button" onClick={() => setMobileBrands((v) => !v)} aria-expanded={mobileBrands} className="flex items-center justify-between text-sm tracking-widest uppercase py-3 border-b border-[var(--color-line)] text-left">
            Brands <ChevronDown size={16} className={`transition-transform ${mobileBrands ? 'rotate-180' : ''}`} />
          </button>
          {mobileBrands && (
            <div className="flex flex-col py-1 border-b border-[var(--color-line)]">
              {brands.map((b) => (
                <Link key={b} to={`/brand/${encodeURIComponent(b)}`} onClick={() => setOpen(false)} className="text-sm py-2 pl-3 text-[var(--color-ink-soft)]">{b}</Link>
              ))}
            </div>
          )}
          <Link to="/wishlist" onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase py-3 border-b border-[var(--color-line)]">Wishlist{wish > 0 ? ` (${wish})` : ''}</Link>
          <Link to={user ? '/account' : '/login'} onClick={() => setOpen(false)} className={`text-sm tracking-widest uppercase py-3 ${isAdmin ? 'border-b border-[var(--color-line)]' : ''}`}>{user ? 'My account' : 'Log in'}</Link>
          {isAdmin && <Link to="/admin/dashboard" onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase py-3">Admin</Link>}
        </nav>
        <div className="mt-6 pt-4 border-t border-[var(--color-line)] space-y-1">
          <a href={STORE.whatsapp} target="_blank" rel="noreferrer" className="block text-sm py-1">{STORE.phoneDisplay} · WhatsApp</a>
          <p className="text-xs text-[var(--color-mute)]">{STORE.address}</p>
        </div>
      </Drawer>
    </header>
  )
}
