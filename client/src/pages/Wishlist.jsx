import { Link } from 'react-router-dom'
import { useWishlist } from '../store/wishlist'
import { useProducts } from '../store/catalog'
import ProductCard from '../components/ProductCard'

export default function Wishlist() {
  const ids = useWishlist((s) => s.ids)
  const all = useProducts()
  const products = all.filter((p) => ids.includes(p.id))

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl mb-6">Wishlist</h1>
      {!ids.length ? (
        <div className="text-center py-16 border border-[var(--color-line)] bg-white">
          <p className="mb-4 text-[var(--color-mute)]">No saved pieces yet.</p>
          <Link to="/collection" className="btn inline-flex">Browse</Link>
        </div>
      ) : (
        <div className="product-grid">{products.map((p) => <ProductCard key={p.id} product={p} />)}</div>
      )}
    </div>
  )
}
