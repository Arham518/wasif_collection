import { Link } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { motion } from 'framer-motion'
import { formatPKR, mediaUrl } from '../lib/utils'
import { useWishlist } from '../store/wishlist'
import { useState } from 'react'

export default function ProductCard({ product }) {
  const wish = useWishlist()
  const liked = wish.has(product.id)
  const [hover, setHover] = useState(false)
  const img = hover && product.images?.[1] ? product.images[1] : product.images?.[0]
  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35 }}
      className="product-card group"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="relative overflow-hidden">
        <Link to={`/product/${product.id}`}>
          <img
            src={mediaUrl(img)}
            alt={product.name}
            loading="lazy"
            className="w-full aspect-[3/4] object-cover transition-transform duration-500 group-hover:scale-[1.03] bg-[var(--color-paper-2)]"
          />
        </Link>
        <button
          onClick={() => wish.toggle(product.id)}
          className="absolute top-2 right-2 w-8 h-8 bg-white/90 border border-[var(--color-line)] grid place-items-center"
          aria-label="Wishlist"
        >
          <Heart size={14} fill={liked ? 'currentColor' : 'none'} className={liked ? 'text-[var(--color-accent)]' : ''} />
        </button>
        {product.featured && (
          <span className="absolute left-2 top-2 text-[10px] tracking-widest uppercase bg-white/90 border border-[var(--color-line)] px-2 py-1">New</span>
        )}
      </div>
      <div className="p-3 md:p-4 flex flex-col gap-1 flex-1">
        <div className="text-[10px] tracking-[0.14em] uppercase text-[var(--color-mute)]">{product.brand}</div>
        <Link to={`/product/${product.id}`} className="text-sm leading-snug hover:underline">{product.name}</Link>
        <div className="mt-auto pt-2 flex items-baseline justify-between gap-2">
          <div>
            <div className="text-sm font-medium">{formatPKR(product.price)}</div>
            <div className="text-[10px] text-[var(--color-mute)]">{product.priceNote || 'Sample price'}</div>
          </div>
          <div className="text-[10px] text-[var(--color-mute)] uppercase tracking-wider">{product.color}</div>
        </div>
      </div>
    </motion.article>
  )
}
