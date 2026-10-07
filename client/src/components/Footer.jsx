import { Link } from 'react-router-dom'
import { STORE } from '../data/catalog'

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[var(--color-line)] bg-[var(--color-ink)] text-[#e8e2d8]">
      <div className="container-x py-12 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="font-display text-2xl text-white mb-3">Rana Collection</div>
          <p className="text-[#b9b1a4] leading-relaxed text-[13px] mb-3">
            Pakistani lawn, pret and ethnic wear. Visit us at {STORE.address}.
          </p>
          <a href={STORE.whatsapp} target="_blank" rel="noreferrer" className="text-white hover:underline text-[13px]">
            WhatsApp / Call: {STORE.phoneDisplay}
          </a>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-white mb-3">Shop</div>
          <ul className="space-y-2 text-[#b9b1a4]">
            <li><Link to="/women">Women</Link></li>
            <li><Link to="/men">Men</Link></li>
            <li><Link to="/collection?category=Lawn">Lawn</Link></li>
            <li><Link to="/collection?category=Ethnic">Ethnic</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-white mb-3">Visit</div>
          <ul className="space-y-2 text-[#b9b1a4]">
            <li>{STORE.address}</li>
            <li><a href={STORE.whatsapp} target="_blank" rel="noreferrer">{STORE.phoneDisplay}</a></li>
            <li><Link to="/account">My account</Link></li>
            <li><Link to="/admin/login">Owner login</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-[11px] tracking-[0.16em] uppercase text-white mb-3">Credits</div>
          <p className="text-[#b9b1a4] text-[12px] leading-relaxed">
            Sample catalogue. Photos: Pexels (free license). See CREDITS.md.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 text-[11px] tracking-wider uppercase text-center py-4 text-[#8f877a]">
        © {new Date().getFullYear()} Rana Collection · {STORE.address}
      </div>
    </footer>
  )
}
