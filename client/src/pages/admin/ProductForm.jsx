import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { Trash2, X } from 'lucide-react'
import LazyImage from '../../components/LazyImage'
import { ListSkeleton } from '../../components/Skeleton'
import { errorMessage } from '../../lib/supabase'
import { normalizeImage } from '../../services/catalogService'
import {
  adminFetchProduct, adminFetchProducts, adminFetchCategories, adminCreateProduct, adminUpdateProduct,
  nextProductCode, uploadProductImages, removeStorageImages, storagePathFromUrl,
} from '../../services/adminService'
import { BRANDS, CATEGORIES } from '../../data/catalog'
import { useCatalog } from '../../store/catalog'
import { confirmDeleteProduct } from './Products'

const SIZES = { women: 'XS, S, M, L, XL', men: 'S, M, L, XL, XXL' }
const list = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean)

const EMPTY_FORM = {
  name: '', brand: 'Khaadi', customBrand: '', category: 'Lawn', customCategory: '', subcategory: 'Unstitched 3PC',
  price: '', color: 'Ivory', fabric: 'Lawn', gender: 'women', stock: '10', description: '', featured: false, active: true,
  sizes: SIZES.women, tags: '', priceNote: 'Owner listed price',
}

function formFromRow(r) {
  return {
    name: r.name || '', brand: r.brand || '', customBrand: '', category: r.category || '', customCategory: '',
    subcategory: r.subcategory || '', price: r.price == null ? '' : String(r.price), color: r.color || '', fabric: r.fabric || '',
    gender: r.gender || 'women', stock: r.stock == null ? '' : String(r.stock), description: r.description || '',
    featured: !!r.featured, active: r.active !== false, sizes: (r.sizes || []).join(', '), tags: (r.tags || []).join(', '),
    priceNote: r.price_note || '',
  }
}

/** Add product (/admin/dashboard/products/new) and Edit product (/admin/dashboard/products/:code/edit). */
export default function ProductForm() {
  const { code } = useParams()
  return <ProductFormView key={code || 'new'} code={code} />
}

function ProductFormView({ code }) {
  const editing = !!code
  const navigate = useNavigate()
  const [row, setRow] = useState(null)
  const [loading, setLoading] = useState(editing)
  const [form, setForm] = useState(EMPTY_FORM)
  const [images, setImages] = useState([])
  const [images360, setImages360] = useState([])
  const [files, setFiles] = useState([])
  const [files360, setFiles360] = useState([])
  const [removed, setRemoved] = useState([])
  const [busy, setBusy] = useState(false)
  const [nextCode, setNextCode] = useState('')
  const [categories, setCategories] = useState([])
  const [brands, setBrands] = useState(BRANDS)

  useEffect(() => {
    let alive = true
    adminFetchCategories()
      .then((cats) => { if (alive) setCategories(cats.map((c) => c.name)) })
      .catch(() => { if (alive) setCategories(CATEGORIES) })
    adminFetchProducts()
      .then((rows) => { if (alive) setBrands([...new Set([...BRANDS, ...rows.map((r) => r.brand).filter(Boolean)])].sort()) })
      .catch(() => {})
    if (editing) {
      adminFetchProduct(code)
        .then((r) => {
          if (!alive) return
          setRow(r)
          if (r) {
            setForm(formFromRow(r))
            setImages(r.images || [])
            setImages360(r.images360 || [])
          }
        })
        .catch((err) => toast.error(errorMessage(err, 'Could not load product')))
        .finally(() => { if (alive) setLoading(false) })
    } else {
      nextProductCode().then((c) => { if (alive) setNextCode(c) }).catch(() => {})
    }
    return () => { alive = false }
  }, [code, editing])

  const categoryOptions = useMemo(() => {
    const all = new Set(categories.length ? categories : CATEGORIES)
    if (form.category && form.category !== '__custom') all.add(form.category)
    return [...all]
  }, [categories, form.category])
  const brandOptions = useMemo(() => {
    const all = new Set(brands)
    if (form.brand && form.brand !== '__custom') all.add(form.brand)
    return [...all].sort()
  }, [brands, form.brand])

  const set = (k) => (e) => {
    const v = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => {
      const next = { ...f, [k]: v }
      if (k === 'gender' && (!f.sizes || f.sizes === SIZES[f.gender])) next.sizes = SIZES[v] || f.sizes
      return next
    })
  }

  function dropImage(url, which) {
    if (which === '360') setImages360((l) => l.filter((u) => u !== url))
    else setImages((l) => l.filter((u) => u !== url))
    if (storagePathFromUrl(url)) setRemoved((r) => [...r, url])
  }

  function makeMain(url) {
    setImages((l) => [url, ...l.filter((u) => u !== url)])
  }

  async function save(e) {
    e.preventDefault()
    const brand = form.brand === '__custom' ? form.customBrand.trim() : form.brand
    const category = form.category === '__custom' ? form.customCategory.trim() : form.category
    if (!form.name.trim()) return toast.error('Name required')
    if (!(Number(form.price) > 0)) return toast.error('Valid price required')
    if (!brand) return toast.error('Brand required')
    if (!category) return toast.error('Category required')
    if (!images.length && !files.length) return toast.error('Add at least one product photo')
    setBusy(true)
    try {
      const folder = row?.code || nextCode || 'new'
      const uploaded = files.length ? await uploadProductImages(files, folder) : []
      const uploaded360 = files360.length ? await uploadProductImages(files360, `${folder}-360`) : []
      const payload = {
        name: form.name.trim(),
        brand,
        category,
        subcategory: form.subcategory.trim() || null,
        price: Number(form.price),
        color: form.color.trim() || null,
        fabric: form.fabric.trim() || null,
        gender: form.gender,
        stock: form.stock === '' ? null : Math.max(0, Math.round(Number(form.stock) || 0)),
        description: form.description.trim() || null,
        featured: !!form.featured,
        active: !!form.active,
        sizes: list(form.sizes).length ? list(form.sizes) : list(SIZES[form.gender]),
        tags: list(form.tags).length ? list(form.tags).map((t) => t.toLowerCase()) : [category.toLowerCase(), brand.toLowerCase()],
        images: [...images, ...uploaded],
        images360: [...images360, ...uploaded360],
        price_note: form.priceNote.trim() || null,
      }
      let saved
      if (editing && row) {
        saved = await adminUpdateProduct(row.id, payload)
      } else {
        saved = await adminCreateProduct({ ...payload, rating: 5, reviews: 0 })
      }
      if (removed.length) removeStorageImages(removed).catch(() => {})
      useCatalog.getState().load({ force: true })
      toast.success(editing ? 'Product updated' : `Product added (${saved.code})`)
      navigate('/admin/dashboard/products')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save product'))
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (row && await confirmDeleteProduct(row)) navigate('/admin/dashboard/products')
  }

  if (loading) return <ListSkeleton rows={3} />
  if (editing && !row) {
    return (
      <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">
        <p className="mb-4">Product not found.</p>
        <Link to="/admin/dashboard/products" className="btn inline-flex">Back to products</Link>
      </div>
    )
  }

  return (
    <form onSubmit={save} className="border border-[var(--color-line)] bg-white p-5 grid md:grid-cols-2 gap-3 mb-8">
      <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] tracking-[0.16em] uppercase">{editing ? `Edit product \u00b7 ${row.code || `#${row.id}`}` : `Add product \u00b7 code ${nextCode || 'auto'}`}</h2>
        {editing && row.code && <Link to={`/product/${row.code}`} className="text-xs underline" target="_blank" rel="noreferrer">View on site</Link>}
      </div>
      <input className="input" placeholder="name" value={form.name} onChange={set('name')} required />
      <select className="input" value={form.brand} onChange={set('brand')} aria-label="Brand">
        {brandOptions.map((b) => <option key={b}>{b}</option>)}
        <option value="__custom">Custom&hellip;</option>
      </select>
      {form.brand === '__custom' && <input className="input" placeholder="new brand name" value={form.customBrand} onChange={set('customBrand')} />}
      <select className="input" value={form.category} onChange={set('category')} aria-label="Category">
        {categoryOptions.map((c) => <option key={c}>{c}</option>)}
        <option value="__custom">Other&hellip;</option>
      </select>
      {form.category === '__custom' && <input className="input" placeholder="new category (add it in Categories too)" value={form.customCategory} onChange={set('customCategory')} />}
      <input className="input" placeholder="subcategory" value={form.subcategory} onChange={set('subcategory')} />
      <input className="input" type="number" min="0" placeholder="price PKR" value={form.price} onChange={set('price')} required />
      <input className="input" placeholder="color" value={form.color} onChange={set('color')} />
      <input className="input" placeholder="fabric" value={form.fabric} onChange={set('fabric')} />
      <input className="input" type="number" min="0" placeholder="stock" value={form.stock} onChange={set('stock')} />
      <select className="input" value={form.gender} onChange={set('gender')} aria-label="Gender">
        <option value="women">Women</option>
        <option value="men">Men</option>
      </select>
      <input className="input" placeholder="sizes (comma separated)" value={form.sizes} onChange={set('sizes')} />
      <input className="input" placeholder="tags (comma separated, optional)" value={form.tags} onChange={set('tags')} />
      <input className="input" placeholder="price note (optional)" value={form.priceNote} onChange={set('priceNote')} />
      <div className="flex items-center gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.featured} onChange={set('featured')} /> Featured</label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={set('active')} /> Visible on site</label>
      </div>
      <textarea className="input md:col-span-2 min-h-[80px]" placeholder="Description" value={form.description} onChange={set('description')} />

      <div className="md:col-span-2 text-sm">
        <label className="block mb-1">Product photos {images.length > 0 && <span className="text-[var(--color-mute)]">(first = main photo)</span>}</label>
        {images.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images.map((url, i) => (
              <div key={url} className="relative">
                <button type="button" onClick={() => makeMain(url)} title="Make main photo" className={`block w-16 h-20 border ${i === 0 ? 'border-[var(--color-ink)]' : 'border-[var(--color-line)]'}`}>
                  <LazyImage src={normalizeImage(url)} alt="" responsive={false} className="w-full h-full" />
                </button>
                <button type="button" onClick={() => dropImage(url)} aria-label="Remove photo" className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-[var(--color-line)] grid place-items-center"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
        {files.length > 0 && <p className="text-xs text-[var(--color-mute)] mt-1">{files.length} new photo(s) will upload to Supabase Storage on save.</p>}
      </div>
      <div className="md:col-span-2 text-sm">
        <label className="block mb-1">360&deg; angle photos (optional)</label>
        {images360.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-2">
            {images360.map((url) => (
              <div key={url} className="relative">
                <LazyImage src={normalizeImage(url)} alt="" responsive={false} className="w-12 h-16 border border-[var(--color-line)]" />
                <button type="button" onClick={() => dropImage(url, '360')} aria-label="Remove photo" className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-[var(--color-line)] grid place-items-center"><X size={10} /></button>
              </div>
            ))}
          </div>
        )}
        <input type="file" accept="image/*" multiple onChange={(e) => setFiles360([...e.target.files])} />
      </div>
      <button className="btn md:col-span-2" type="submit" disabled={busy}>{busy ? 'Saving\u2026' : editing ? 'Update product' : 'Publish product'}</button>
      {editing && (
        <button type="button" className="btn btn-outline md:col-span-2" onClick={remove} disabled={busy}><Trash2 size={14} /> Delete product</button>
      )}
    </form>
  )
}