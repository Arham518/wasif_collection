import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import ProductCard from '../components/ProductCard'
import LazyImage from '../components/LazyImage'
import { useCatalogIndex, useCatalogLoading } from '../store/catalog'
import { ProductGridSkeleton } from '../components/Skeleton'

const TILES = [
  { t: 'Women Lawn', to: '/collection?gender=women&category=Lawn', img: '/products/w01.webp' },
  { t: 'Men Ethnic', to: '/collection?gender=men&category=Ethnic', img: '/products/m01.webp' },
  { t: 'Ready to Wear', to: '/collection?category=Pret', img: '/products/w05.webp' },
  { t: 'Formals', to: '/collection?category=Formal', img: '/products/w09.webp' },
]

export default function Home() {
  const index = useCatalogIndex()
  const loading = useCatalogLoading()
  const { featured, women, men } = useMemo(() => ({
    featured: index.query({ sort: 'newest' }).slice(0, 8),
    women: index.query({ gender: 'women', sort: 'rating' }).slice(0, 8),
    men: index.query({ gender: 'men', sort: 'rating' }).slice(0, 8),
  }), [index])

  return (
    <div>
      <section className="relative border-b border-[var(--color-line)] overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[70vh]">
          <div className="flex flex-col justify-center px-6 md:px-12 py-16 bg-[var(--color-paper)] order-2 md:order-1">
            <p style={{ '--fade-y': '10px' }} className="anim-fade-up text-[11px] tracking-[0.2em] uppercase text-[var(--color-mute)] mb-4">
              Spring / Summer edit
            </p>
            <h1 style={{ '--fade-y': '16px', animationDelay: '50ms' }} className="anim-fade-up font-display text-4xl md:text-6xl leading-[1.05] mb-5">
              Rana Collection<br />curated with care.
            </h1>
            <p style={{ animationDelay: '150ms' }} className="anim-fade-in text-[var(--color-ink-soft)] max-w-md mb-8 leading-relaxed">
              Lawn, pret and ethnic pieces inspired by Khaadi, Gul Ahmed, Bonanza Satrangi and more. Sample catalogue with a style assistant.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/women" className="btn">Shop Women</Link>
              <Link to="/men" className="btn btn-outline">Shop Men</Link>
            </div>
          </div>
          <div className="relative order-1 md:order-2 min-h-[42vh] md:min-h-0">
            <LazyImage src="/products/w02.webp" alt="Navy embroidered Pakistani suit" priority sizes="(min-width: 768px) 50vw, 100vw" className="absolute inset-0 w-full h-full" imgClassName="object-top" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--color-line)] border border-[var(--color-line)]">
          {TILES.map((c) => (
            <Link key={c.t} to={c.to} className="relative aspect-[3/4] overflow-hidden group bg-white">
              <LazyImage src={c.img} alt={c.t} sizes="(min-width: 768px) 25vw, 50vw" className="w-full h-full" imgClassName="object-top duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/25 group-hover:bg-black/35 transition" />
              <span className="absolute bottom-4 left-4 text-white text-[11px] tracking-[0.16em] uppercase">{c.t}</span>
            </Link>
          ))}
        </div>
      </section>

      {loading && <section className="container-x py-10"><div className="h-8 w-48 img-skeleton mb-5" /><ProductGridSkeleton count={4} /></section>}
      <Section title="New arrivals" to="/collection?sort=newest" products={featured} />
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
          <LazyImage src="/products/w08.webp" alt="Teal printed shalwar kameez" sizes="(min-width: 768px) 40vw, 100vw" className="w-full aspect-[3/4] max-h-[420px] border border-[var(--color-line)]" imgClassName="object-top" />
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
