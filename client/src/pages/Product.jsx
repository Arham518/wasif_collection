import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Product360 from '../components/Product360'
import ProductCard from '../components/ProductCard'
import ProductReviews from '../components/ProductReviews'
import LazyImage from '../components/LazyImage'
import { formatPKR } from '../lib/utils'
import { warmMedia } from '../lib/imageCache'
import { useCart } from '../store/cart'
import { useWishlist } from '../store/wishlist'
import { useUI } from '../store/ui'
import { useProduct, useCatalogIndex, useCatalogLoading } from '../store/catalog'
import { PageLoader } from '../components/Skeleton'
import { toast } from 'sonner'
import { Heart, ZoomOut } from 'lucide-react'

// Keyed by id so size / photo / tab state resets when moving to another product.
export default function Product() {
  const { id } = useParams()
  return <ProductView key={id} id={id} />
}

function ProductView({ id }) {
  const product = useProduct(id)
  const index = useCatalogIndex()
  const loading = useCatalogLoading()
  const has360 = !!(product?.images360?.length)
  const [size, setSize] = useState(product?.sizes?.[1] || product?.sizes?.[0] || 'M')
  const [tab, setTab] = useState('photos')
  const [img, setImg] = useState(0)
  const [zoom, setZoom] = useState({ on: false, x: 50, y: 50 })
  const add = useCart((s) => s.add)
  const openCart = useUI((s) => s.openCart)
  const liked = useWishlist((s) => !!product && s.ids.includes(product.id))
  const toggleWish = useWishlist((s) => s.toggle)

  // Esc returns a zoomed photo to its original size.
  useEffect(() => {
    if (!zoom.on) return
    const onKey = (e) => { if (e.key === 'Escape') setZoom((z) => ({ ...z, on: false })) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoom.on])

  // Warm every photo of this product so switching thumbnails is instant.
  useEffect(() => {
    for (const src of product?.images || []) warmMedia(src)
  }, [product])

  const related = useMemo(() => {
    if (!product) return []
    return index.query({ gender: product.gender })
      .filter((p) => p.id !== product.id && (p.brand === product.brand || p.category === product.category))
      .slice(0, 8)
  }, [index, product])

  if (!product && loading) return <PageLoader />
  if (!product) {
    return (
      <div className="container-x py-20 text-center">
        <h1 className="font-display text-3xl mb-4">Product not found</h1>
        <Link to="/collection" className="btn inline-flex">Browse</Link>
      </div>
    )
  }

  const mainSrc = product.images?.[img] || product.images?.[0]

  return (
    <div className="container-x py-8">
      <nav className="text-[11px] tracking-wider uppercase text-[var(--color-mute)] mb-6">
        <Link to="/">Home</Link> / <Link to={`/${product.gender}`}>{product.gender}</Link> / {product.name}
      </nav>
      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div>
          {has360 && (
            <div className="flex gap-2 mb-3">
              <button className={`chip ${tab === 'photos' ? 'active' : ''}`} onClick={() => setTab('photos')}>Photos</button>
              <button className={`chip ${tab === '360' ? 'active' : ''}`} onClick={() => setTab('360')}>360°</button>
            </div>
          )}
          {tab === '360' && has360 ? (
            <Product360 product={product} />
          ) : (
            <div>
              <div
                className={`relative w-full aspect-[3/4] border border-[var(--color-line)] bg-white overflow-hidden ${zoom.on ? 'cursor-zoom-out touch-none' : 'cursor-zoom-in'}`}
                role="button"
                tabIndex={0}
                aria-label={zoom.on ? 'Zoom out' : 'Zoom in'}
                aria-pressed={zoom.on}
                // Click / tap toggles zoom at that point; while zoomed, moving the mouse or finger pans.
                onClick={(e) => {
                  const r = e.currentTarget.getBoundingClientRect()
                  const x = ((e.clientX - r.left) / r.width) * 100
                  const y = ((e.clientY - r.top) / r.height) * 100
                  setZoom((z) => (z.on ? { ...z, on: false } : { on: true, x, y }))
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setZoom((z) => ({ on: !z.on, x: 50, y: 50 })) }
                }}
                onPointerMove={(e) => {
                  if (!zoom.on) return
                  const r = e.currentTarget.getBoundingClientRect()
                  const clamp = (v) => Math.min(100, Math.max(0, v))
                  setZoom({ on: true, x: clamp(((e.clientX - r.left) / r.width) * 100), y: clamp(((e.clientY - r.top) / r.height) * 100) })
                }}
                onMouseLeave={() => setZoom((z) => (z.on ? { ...z, on: false } : z))}
              >
                <LazyImage
                  src={mainSrc}
                  alt={product.name}
                  priority
                  responsive={false}
                  className="w-full h-full"
                  imgClassName="duration-150"
                  imgStyle={zoom.on ? { transform: 'scale(2)', transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
                />
                {zoom.on && (
                  <button
                    type="button"
                    aria-label="Reset zoom"
                    title="Back to original size (Esc)"
                    className="absolute top-2 right-2 z-10 w-9 h-9 rounded-full bg-white/90 border border-[var(--color-line)] grid place-items-center shadow"
                    onClick={(e) => { e.stopPropagation(); setZoom((z) => ({ ...z, on: false })) }}
                  >
                    <ZoomOut size={16} />
                  </button>
                )}
              </div>
              <div className="flex gap-2 mt-2 overflow-x-auto">
                {(product.images || []).map((src, i) => (
                  <button type="button" key={i} onClick={() => { setImg(i); setZoom((z) => ({ ...z, on: false })) }} aria-label={`Photo ${i + 1}`} className={`shrink-0 w-16 h-20 border ${i === img ? 'border-[var(--color-ink)]' : 'border-[var(--color-line)]'}`}>
                    <LazyImage src={src} alt="" responsive={false} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-mute)] mb-2">{product.brand}</p>
          <h1 className="font-display text-3xl md:text-4xl mb-3">{product.name}</h1>
          <div className="flex items-baseline gap-3 mb-2">
            <span className="text-xl font-medium">{formatPKR(product.price)}</span>
            <span className="text-[11px] text-[var(--color-mute)]">{product.priceNote || 'Sample price'}</span>
          </div>
          <p className="text-sm text-[var(--color-ink-soft)] leading-relaxed mb-6">{product.description}</p>
          <dl className="grid grid-cols-2 gap-3 text-sm border border-[var(--color-line)] bg-white p-4 mb-6">
            <div><dt className="text-[10px] uppercase tracking-wider text-[var(--color-mute)]">Fabric</dt><dd>{product.fabric || '—'}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-[var(--color-mute)]">Color</dt><dd>{product.color}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-[var(--color-mute)]">Category</dt><dd>{product.category}</dd></div>
            <div><dt className="text-[10px] uppercase tracking-wider text-[var(--color-mute)]">Type</dt><dd>{product.subcategory}</dd></div>
          </dl>
          <div className="mb-5">
            <div className="text-[11px] tracking-[0.14em] uppercase mb-2">Size</div>
            <div className="flex flex-wrap gap-2">
              {(product.sizes || []).map((s) => (
                <button key={s} className={`chip ${size === s ? 'active' : ''}`} onClick={() => setSize(s)}>{s}</button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button className="btn flex-1" onClick={() => { add(product, { size }); openCart(); toast.success('Added to bag') }}>Add to bag</button>
            <button className="btn btn-outline" onClick={() => toggleWish(product.id)} aria-label="Wishlist" aria-pressed={liked}>
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
      </div>
      <ProductReviews product={product.id} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-2xl mb-5">You may also like</h2>
          <div className="product-grid">{related.map((p) => <ProductCard key={p.id} product={p} />)}</div>
        </section>
      )}
    </div>
  )
}
