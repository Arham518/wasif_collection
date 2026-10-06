import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import { useProducts, filterProducts } from '../store/catalog'

export default function Home() {
  const all = useProducts()
  const featured = filterProducts(all, { featured: true }).slice(0, 8)
  const women = filterProducts(all, { gender: 'women', sort: 'rating' }).slice(0, 8)
  const men = filterProducts(all, { gender: 'men', sort: 'rating' }).slice(0, 8)

  return (
    <div>
      <section className="relative border-b border-[var(--color-line)] overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-6 md:px-12 py-16 bg-[var(--color-paper)] order-2 md:order-1">
            <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)] mb-4">
              Spring / Summer edit
            </motion.p>
            <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="font-display text-4xl md:text-6xl leading-[1.05] mb-5">
              Wasif Collection<br />curated with care.
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="text-[var(--color-ink-soft)] max-w-md mb-8 leading-relaxed">
              Lawn, pret and ethnic pieces inspired by Khaadi, Gul Ahmed, Bonanza Satrangi and more. Sample catalogue with a style assistant.
            </motion.p>
            <div className="flex flex-wrap gap-3">
              <Link to="/women" className="btn">Shop Women</Link>
              <Link to="/men" className="btn btn-outline">Shop Men</Link>
            </div>
          </div>
          <div className="relative order-1 md:order-2 min-h-[42vh] md:min-h-0">
            <img src="/products/w02.jpg" alt="Navy embroidered Pakistani suit" className="absolute inset-0 w-full h-full object-cover object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-line)] border border-[var(--color-line)]">
          {[
            { t: 'Women Lawn', to: '/collection?gender=women&category=Lawn', img: '/products/w01.jpg' },
            { t: 'Men Ethnic', to: '/collection?gender=men&category=Ethnic', img: '/products/m01.jpg' },
            { t: 'Ready to Wear', to: '/collection?category=Pret', img: '/products/w05.jpg' },
            { t: 'Formals', to: '/collection?category=Formal', img: '/products/w09.jpg' },
          ].map((c) => (
            <Link key={c.t} to={c.to} className="relative aspect-[3/4] overflow-hidden group bg-white">
              <img src={c.img} alt={c.t} className="w-full h-full object-cover object-top transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition" />
              <span className="absolute bottom-4 left-4 text-white text-[11px] tracking-[0.16em] uppercase">{c.t}</span>
            </Link>
          ))}
        </div>
      </section>

      <Section title="New arrivals" to="/collection?featured=true" products={featured} />
      <Section title="Women" to="/women" products={women} />
      <Section title="Men" to="/men" products={men} />

      <section className="container-x py-12">
        <div className="border border-[var(--color-line)] bg-white p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="font-display text-3xl md:text-4xl mb-3">Ask the style assistant.</h2>
            <p className="text-[var(--color-ink-soft)] leading-relaxed mb-6">
              Ask the chat bubble for “women lawn under 5000” — it filters live from the catalogue. Browse photos on every product page.
            </p>
            <Link to="/collection" className="btn">Browse all</Link>
          </div>
          <img src="/products/w08.jpg" alt="Teal printed shalwar kameez" className="w-full aspect-[3/4] max-h-[420px] object-cover object-top border border-[var(--color-line)]" />
        </div>
      </section>
    </div>
  )
}

function Section({ title, to, products }) {
  if (!products?.length) return null
  return (
    <section className="container-x py-10">
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-display text-2xl md:text-3xl">{title}</h2>
        <Link to={to} className="text-[11px] tracking-[0.14em] uppercase flex items-center gap-1 text-[var(--color-mute)] hover:text-[var(--color-ink)]">
          View all <ArrowRight size={14} />
        </Link>
      </div>
      <div className="product-grid">
        {products.slice(0, 8).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  )
}
