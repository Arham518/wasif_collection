import { Link, NavLink, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Heart, Menu, X, User, Phone } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'
import { useUI } from '../store/ui'
import { BRANDS, STORE } from '../data/catalog'

const links = [
  { to: '/women', label: 'Women' },
  { to: '/men', label: 'Men' },
  { to: '/collection?category=Lawn', label: 'Lawn' },
  { to: '/collection?category=Pret', label: 'Pret' },
  { to: '/collection?category=Ethnic', label: 'Ethnic' },
  { to: '/collection?featured=true', label: 'New' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [brandsOpen, setBrandsOpen] = useState(false)
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const count = useCart((s) => s.count())
  const wish = useWishlist((s) => s.ids.length)
  const openCart = useUI((s) => s.openCart)

  function onSearch(e) {
    e.preventDefault()
    if (!q.trim()) return
    navigate(`/collection?q=${encodeURIComponent(q.trim())}`)
    setOpen(false)
  }

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
        <button className="lg:hidden p-1" onClick={() => setOpen(true)} aria-label="Menu"><Menu size={20} /></button>
        <Link to="/" className="font-display text-xl md:text-2xl tracking-tight shrink-0">Wasif Collection</Link>
        <nav className="hidden lg:flex items-center gap-6 ml-6 text-[12px] tracking-[0.12em] uppercase relative">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => (isActive ? 'text-[var(--color-accent)]' : 'text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]')}>{l.label}</NavLink>
          ))}
          <div className="relative" onMouseEnter={() => setBrandsOpen(true)} onMouseLeave={() => setBrandsOpen(false)}>
            <button className="text-[var(--color-ink-soft)] hover:text-[var(--color-ink)]">Brands</button>
            {brandsOpen && (
              <div className="absolute top-full left-0 mt-2 bg-white border border-[var(--color-line)] min-w-[200px] py-2 shadow-lg">
                {BRANDS.map((b) => (
                  <Link key={b} to={`/brand/${encodeURIComponent(b)}`} className="block px-4 py-2 text-[11px] tracking-wider normal-case hover:bg-[var(--color-paper-2)]">{b}</Link>
                ))}
              </div>
            )}
          </div>
        </nav>
        <form onSubmit={onSearch} className="ml-auto hidden md:flex items-center border border-[var(--color-line)] bg-white max-w-xs w-full">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search lawn, kurta, brand…" className="flex-1 px-3 py-2 text-sm outline-none" />
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
          <Link to="/admin" className="p-1 hidden sm:block" aria-label="Admin"><User size={18} /></Link>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-[80%] max-w-xs bg-[var(--color-paper)] p-5 flex flex-col gap-3 border-r border-[var(--color-line)] overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="font-display text-xl">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Close"><X size={20} /></button>
            </div>
            <a href={STORE.whatsapp} target="_blank" rel="noreferrer" className="text-sm py-2 border-b border-[var(--color-line)]">{STORE.phoneDisplay} · WhatsApp</a>
            <p className="text-xs text-[var(--color-mute)]">{STORE.address}</p>
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase py-2 border-b border-[var(--color-line)]">{l.label}</Link>
            ))}
            <Link to="/admin" onClick={() => setOpen(false)} className="text-sm tracking-widest uppercase py-2 mt-2">Admin</Link>
          </aside>
        </div>
      )}
    </header>
  )
}
