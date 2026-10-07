import { useCallback, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import FilterSidebar from '../components/FilterSidebar'
import Drawer from '../components/Drawer'
import { SlidersHorizontal } from 'lucide-react'
import { useMeta, useFilteredProducts, useCatalogLoading } from '../store/catalog'
import { ProductGridSkeleton } from '../components/Skeleton'
import { scrollToTop } from '../lib/scroll'
import Pagination from '../components/Pagination'

const LIMIT = 12
const COUNTED = ['brand', 'category', 'color', 'q', 'minPrice', 'maxPrice', 'sort', 'featured']

export default function Collection({ gender: genderProp, brand: brandProp }) {
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const meta = useMeta()
  const loading = useCatalogLoading()

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
    page: Math.max(1, Number(params.get('page')) || 1),
  }), [params, genderProp, brandProp])

  // Stable callback so the memoised sidebar doesn't re-render on every parent render.
  const setFilters = useCallback((updater) => {
    setParams((prev) => {
      const current = {
        gender: genderProp || prev.get('gender') || '',
        brand: brandProp || prev.get('brand') || '',
        page: Number(prev.get('page')) || 1,
      }
      for (const k of COUNTED) current[k] = prev.get(k) || ''
      const next = typeof updater === 'function' ? updater(current) : updater
      const sp = new URLSearchParams()
      Object.entries(next).forEach(([k, v]) => {
        if (v == null || v === '' || k === 'gender' || k === 'brand') return
        if (k === 'page' && Number(v) <= 1) return
        sp.set(k, String(v))
      })
      if (!genderProp && next.gender) sp.set('gender', next.gender)
      if (!brandProp && next.brand) sp.set('brand', next.brand)
      return sp
    }, { replace: true, preventScrollReset: true })
  }, [setParams, genderProp, brandProp])

  const filtered = useFilteredProducts(filters)
  const page = Math.min(filters.page, Math.max(1, Math.ceil(filtered.length / LIMIT)))
  const pageItems = useMemo(() => filtered.slice((page - 1) * LIMIT, page * LIMIT), [filtered, page])
  const activeCount = COUNTED.filter((k) => !(brandProp && k === 'brand') && filters[k]).length
  const title = brandProp || (genderProp === 'women' ? 'Women' : genderProp === 'men' ? 'Men' : filters.q ? `Search: ${filters.q}` : filters.sort === 'newest' ? 'New arrivals' : 'Collection')

  function goPage(p) {
    setFilters((f) => ({ ...f, page: p }))
    scrollToTop()
  }

  return (
    <div className="container-x py-8">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <p className="text-[11px] tracking-[0.16em] uppercase text-[var(--color-mute)] mb-1">Shop</p>
          <h1 className="font-display text-3xl md:text-4xl">{title}</h1>
          <p className="text-sm text-[var(--color-mute)] mt-1">{filtered.length} pieces · sample prices</p>
        </div>
        <button type="button" className="lg:hidden btn btn-outline" onClick={() => setDrawer(true)} aria-expanded={drawer} aria-controls="filters-drawer">
          <SlidersHorizontal size={14} /> Filters{activeCount > 0 ? ` (${activeCount})` : ''}
        </button>
      </div>
      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <FilterSidebar meta={meta} filters={filters} setFilters={setFilters} hideBrand={!!brandProp} className="hidden lg:block sticky top-28 self-start" />
        <div>
          {loading ? (
            <ProductGridSkeleton />
          ) : !pageItems.length ? (
            <div className="border border-[var(--color-line)] bg-white p-12 text-center text-[var(--color-mute)]">No products match these filters.</div>
          ) : (
            <div className="product-grid">
              {pageItems.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
            </div>
          )}
          <Pagination page={page} total={filtered.length} perPage={LIMIT} onChange={goPage} />
        </div>
      </div>
      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        side="right"
        title="Filters"
        id="filters-drawer"
        closeAbove={1024}
        widthClass="w-[85%] max-w-sm"
        footer={<button type="button" className="btn w-full" onClick={() => setDrawer(false)}>Show {filtered.length} results</button>}
      >
        <FilterSidebar meta={meta} filters={filters} setFilters={setFilters} hideBrand={!!brandProp} />
      </Drawer>
    </div>
  )
}
