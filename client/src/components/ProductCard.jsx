import { memo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { formatPKR } from '../lib/utils'
import { useWishlist } from '../store/wishlist'
import LazyImage from './LazyImage'
import { prefetch } from '../routes'

const CARD_SIZES = '(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw'

function ProductCard({ product, eager = false }) {
  // Subscribe only to this product's liked flag, so one heart click doesn't re-render every card.
  const liked = useWishlist((s) => s.ids.includes(product.id))
  const toggle = useWishlist((s) => s.toggle)
  const [hovered, setHovered] = useState(false)
  const altImg = product.images?.[1]
  const href = `/product/${product.id}`

  function onEnter(e) {
    prefetch('product')
    if (e.pointerType === 'mouse' && altImg) setHovered(true)
  }

  return (
    <article className="product-card group">
      <div className="relative overflow-hidden">
        <Link to={href} onPointerEnter={onEnter} className="block relative">
          <LazyImage
            src={product.images?.[0]}
            alt={product.name}
            eager={eager}
            sizes={CARD_SIZES}
            className="w-full aspect-[3/4]"
            imgClassName="duration-500 group-hover:scale-[1.03]"
          />
          {/* Second photo is only fetched after the first mouse hover, then stays mounted (cached). */}
          {hovered && (
            <LazyImage
              src={altImg}
              alt=""
              placeholder={false}
              sizes={CARD_SIZES}
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              imgClassName="duration-500 group-hover:scale-[1.03]"
            />
          )}
        </Link>
        <button
          type="button"
          onClick={() => toggle(product.id)}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 border border-[var(--color-line)] grid place-items-center"
          aria-label="Wishlist"
          aria-pressed={liked}
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-[var(--color-accent)]' : ''} />
        </button>
        {product.featured && (
          <span className="absolute left-2 top-2 text-[10px] tracking-widest uppercase bg-white/90 border border-[var(--color-line)] px-2 py-1">New</span>
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col gap-1 flex-1">
        <div className="text-[10px] tracking-[0.14em] uppercase text-[var(--color-mute)]">{product.brand}</div>
        <Link to={href} className="text-sm leading-snug hover:underline">{product.name}</Link>
        <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
          <div>
            <div className="text-sm font-medium">{formatPKR(product.price)}</div>
            <div className="text-[10px] text-[var(--color-mute)]">{product.priceNote || 'Sample price'}</div>
          </div>
          <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider">{product.color}</div>
        </div>
      </div>
    </article>
  )
}

export default memo(ProductCard)
