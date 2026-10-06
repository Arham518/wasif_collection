export default function FilterSidebar({ meta, filters, setFilters, className = '' }) {
  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value || undefined, page: 1 }))

  return (
    <aside className={`space-y-6 text-sm ${className}`}>
      <div>
        <div className="text-[11px] tracking-[0.16em] uppercase mb-3">Brand</div>
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${!filters.brand ? 'active' : ''}`} onClick={() => set('brand', '')}>All</button>
          {(meta.brands || []).map((b) => (
            <button key={b} className={`chip ${filters.brand === b ? 'active' : ''}`} onClick={() => set('brand', b)}>{b}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.16em] uppercase mb-3">Category</div>
        <div className="flex flex-wrap gap-2">
          <button className={`chip ${!filters.category ? 'active' : ''}`} onClick={() => set('category', '')}>All</button>
          {(meta.categories || []).map((c) => (
            <button key={c} className={`chip ${filters.category === c ? 'active' : ''}`} onClick={() => set('category', c)}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.16em] uppercase mb-3">Color</div>
        <div className="flex flex-wrap gap-2">
          {(meta.colors || []).map((c) => (
            <button key={c} className={`chip ${filters.color === c ? 'active' : ''}`} onClick={() => set('color', filters.color === c ? '' : c)}>{c}</button>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.16em] uppercase mb-3">Price (PKR)</div>
        <div className="grid grid-cols-2 gap-2">
          <input className="input" type="number" placeholder="Min" value={filters.minPrice || ''} onChange={(e) => set('minPrice', e.target.value)} />
          <input className="input" type="number" placeholder="Max" value={filters.maxPrice || ''} onChange={(e) => set('maxPrice', e.target.value)} />
        </div>
      </div>
      <div>
        <div className="text-[11px] tracking-[0.16em] uppercase mb-3">Sort</div>
        <select className="input" value={filters.sort || ''} onChange={(e) => set('sort', e.target.value)}>
          <option value="">Featured</option>
          <option value="newest">Newest</option>
          <option value="price-asc">Price ↑</option>
          <option value="price-desc">Price ↓</option>
          <option value="rating">Top rated</option>
        </select>
      </div>
    </aside>
  )
}
