import { memo } from 'react'
import { Search } from 'lucide-react'
import DebouncedInput from './DebouncedInput'

function Group({ title, children }) {
  return (
    <div>
      <div className="text-[11px] tracking-[0.16em] uppercase mb-3">{title}</div>
      {children}
    </div>
  )
}

function FilterSidebar({ meta, filters, setFilters, className = '', hideBrand = false }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }))
  const hasFilters = ['brand', 'category', 'color', 'q', 'minPrice', 'maxPrice', 'sort', 'featured'].some((k) => !(hideBrand && k === 'brand') && filters[k])

  return (
    <aside className={`space-y-6 text-sm ${className}`}>
      <Group title="Search">
        <label className="flex items-center border border-[var(--color-line)] bg-white">
          <Search size={14} className="ml-3 text-[var(--color-mute)] shrink-0" />
          <DebouncedInput
            className="flex-1 min-w-0 px-2 py-2 text-sm outline-none bg-transparent"
            type="search"
            placeholder="Kurta, lawn, navy…"
            value={filters.q || ''}
            delay={100}
            onCommit={(v) => set('q', v.trim())}
            aria-label="Search products"
          />
        </label>
      </Group>
      {!hideBrand && (
        <Group title="Brand">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={`chip ${!filters.brand ? 'active' : ''}`} onClick={() => set('brand', '')}>All</button>
            {(meta.brands || []).map((b) => (
              <button type="button" key={b} className={`chip ${filters.brand === b ? 'active' : ''}`} onClick={() => set('brand', b)}>{b}</button>
            ))}
          </div>
        </Group>
      )}
      <Group title="Category">
        <div className="flex flex-wrap gap-2">
          <button type="button" className={`chip ${!filters.category ? 'active' : ''}`} onClick={() => set('category', '')}>All</button>
          {(meta.categories || []).map((c) => (
            <button type="button" key={c} className={`chip ${filters.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
          ))}
        </div>
      </Group>
      <Group title="Color">
        <div className="flex flex-wrap gap-2">
          {(meta.colors || []).map((c) => (
            <button type="button" key={c} className={`chip ${filters.color === c ? 'active' : ''}`} onClick={() => set('color', filters.color === c ? '' : c)}>{c}</button>
          ))}
        </div>
      </Group>
      <Group title="Price (PKR)">
        <div className="grid grid-cols-2 gap-2">
          <DebouncedInput className="input" type="number" inputMode="numeric" min="0" placeholder="Min" value={filters.minPrice || ''} onCommit={(v) => set('minPrice', v)} aria-label="Minimum price" />
          <DebouncedInput className="input" type="number" inputMode="numeric" min="0" placeholder="Max" value={filters.maxPrice || ''} onCommit={(v) => set('maxPrice', v)} aria-label="Maximum price" />
        </div>
      </Group>
      <Group title="Sort">
        <select className="input" value={filters.sort || ''} onChange={(e) => set('sort', e.target.value)} aria-label="Sort">
          <option value="">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="rating">Top rated</option>
        </select>
      </Group>
      {hasFilters && (
        <button
          type="button"
          className="text-[11px] tracking-[0.14em] uppercase underline text-[var(--color-mute)] hover:text-[var(--color-ink)]"
          onClick={() => setFilters((f) => ({ gender: f.gender, brand: hideBrand ? f.brand : undefined, page: 1 }))}
        >
          Clear filters
        </button>
      )}
    </aside>
  )
}

export default memo(FilterSidebar)
