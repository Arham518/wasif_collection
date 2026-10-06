import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import { SlidersHorizontal, X } from 'lucide-react'
import { useProducts, useMeta, filterProducts } from '../store/catalog'

export default function Collection({ gender: genderProp, brand: brandProp }) {
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const all = useProducts()
  const meta = useMeta()

  const filters = useMemo(() => ({
    gender: genderProp || params.get('gender') || '',
    brand: brandProp || params.get('brand') || '',
    category: params.get('category') || '',
    color: params.get('color') || '',
    q: params.get('q') || '',
    minPrice: params.get('minPrice') || '',
    maxPrice: params.get('maxPrice') || '',
    sort: params.get('sort') || '',
    featured: params.get('featured') || '',
    page: Number(params.get('page') || 1),
  }), [params, genderProp, brandProp])

  function setFilters(updater) {
    const next = typeof updater === 'function' ? updater(filters) : updater
    const sp = new URLSearchParams()
    Object.entries(next).forEach(([k, v]) => {
      if (v != null && v !== '' && k !== 'gender' && k !== 'brand') sp.set(k, String(v))
    })
    if (!genderProp && next.gender) sp.set('gender', next.gender)
    if (!brandProp && next.brand) sp.set('brand', next.brand)
    setParams(sp)
  }

  const filtered = filterProducts(all, filters)
  const page = filters.page || 1
  const limit = 24
  const pageItems = filtered.slice((page - 1) * limit, page * limit)
  const title = brandProp || (genderProp === 'women' ? 'Women' : genderProp === 'men' ? 'Men' : filters.q ? `Search: ${filters.q}` : 'Collection')

  return (
    <div className="container-x py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-mute)] mb-1">Shop</p>
          <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
          <p className="text-sm text-[var(--color-mute)] mt-1">{filtered.length} pieces · sample prices</p>
        </div>
        <button className="lg:hidden btn btn-outline" onClick={() => setDrawer(true)}>
          <SlidersHorizontal size={14} /> Filters
        </button>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <FilterSidebar meta={meta} filters={filters} setFilters={setFilters} className="hidden lg:block sticky top-24 self-start" />
        <div>
          {!pageItems.length ? (
            <div className="border border-[var(--color-line)] bg-white p-12 text-center text-[var(--color-mute)]">No products match these filters.</div>
          ) : (
            <div className="product-grid">
              {pageItems.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
          {filtered.length > limit && (
            <div className="flex justify-center gap-2 mt-8">
              <button className="btn btn-outline" disabled={page <= 1} onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}>Prev</button>
              <span className="px-3 py-2 text-sm">Page {page}</span>
              <button className="btn btn-outline" disabled={page * limit >= filtered.length} onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}>Next</button>
            </div>
          )}
        </div>
      </div>
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[var(--color-paper)] p-5 overflow-y-auto border-l border-[var(--color-line)]">
            <div className="flex justify-between mb-4">
              <span className="font-display text-xl">Filters</span>
              <button onClick={() => setDrawer(false)}><X size={18} /></button>
            </div>
            <FilterSidebar meta={meta} filters={filters} setFilters={setFilters} />
            <button className="btn w-full mt-6" onClick={() => setDrawer(false)}>Show results</button>
          </div>
        </div>
      )}
    </div>
  )
}
