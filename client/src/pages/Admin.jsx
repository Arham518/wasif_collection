import { useMemo, useState } from 'react'
import LazyImage from '../components/LazyImage'
import { formatPKR, uid } from '../lib/utils'
import { useCatalog, useProducts } from '../store/catalog'
import { saveImageBlob, compressImage, blobToDataUrl } from '../services/imageStore'
import { ADMIN_PASSWORD, BRANDS, CATEGORIES } from '../data/catalog'
import { toast } from 'sonner'
import { Trash2, Plus, LogOut, Package, ShoppingBag } from 'lucide-react'

const TOKEN_KEY = 'pkf-admin-ok'

// Uploaded photos are shrunk (max 1200px, WebP) and stored in IndexedDB; the product
// only keeps a short "idb:<key>" reference. Storing full base64 photos in localStorage
// (as before) hit the ~5 MB browser limit after a few uploads and broke saving/images.
async function filesToImageRefs(files) {
  const refs = []
  for (const file of files) {
    const blob = await compressImage(file)
    const id = uid('img')
    try {
      await saveImageBlob(id, blob)
      refs.push(`idb:${id}`)
    } catch {
      refs.push(await blobToDataUrl(blob))
    }
  }
  return refs
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(TOKEN_KEY) === '1')
  const [password, setPassword] = useState('')
  const [tab, setTab] = useState('products')
  const products = useProducts()
  const orders = useCatalog((s) => s.orders)
  const upsertProduct = useCatalog((s) => s.upsertProduct)
  const removeProduct = useCatalog((s) => s.removeProduct)
  const sorted = useMemo(() => [...products].reverse(), [products])

  const [form, setForm] = useState({
    name: '', brand: 'Khaadi', category: 'Lawn', subcategory: 'Unstitched 3PC',
    price: '', color: 'Ivory', fabric: 'Lawn', gender: 'women', stock: '10',
    description: '', featured: false,
  })
  const [files, setFiles] = useState([])
  const [files360, setFiles360] = useState([])
  const [editId, setEditId] = useState(null)

  function login(e) {
    e.preventDefault()
    if (password !== ADMIN_PASSWORD) return toast.error('Wrong password')
    sessionStorage.setItem(TOKEN_KEY, '1')
    setAuthed(true)
    toast.success('Logged in')
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY)
    setAuthed(false)
  }

  async function saveProduct(e) {
    e.preventDefault()
    if (!form.name || !form.price) return toast.error('Name and price required')
    const images = files.length ? await filesToImageRefs(files) : (editId ? products.find((p) => p.id === editId)?.images || [] : ['/products/w01.webp'])
    const images360 = files360.length ? await filesToImageRefs(files360) : (editId ? products.find((p) => p.id === editId)?.images360 || [] : [])
    const product = {
      id: editId || uid('own'),
      name: form.name,
      brand: form.brand,
      category: form.category,
      subcategory: form.subcategory,
      price: Number(form.price),
      priceNote: 'Owner listed price',
      color: form.color,
      fabric: form.fabric,
      gender: form.gender,
      sizes: form.gender === 'men' ? ['S', 'M', 'L', 'XL', 'XXL'] : ['XS', 'S', 'M', 'L', 'XL'],
      tags: [form.category.toLowerCase(), form.brand.toLowerCase()],
      description: form.description || 'Owner-added product.',
      images,
      images360,
      stock: Number(form.stock) || 10,
      featured: !!form.featured,
      rating: 5,
      reviews: 0,
      modelColor: form.color,
    }
    upsertProduct(product)
    toast.success(editId ? 'Product updated' : 'Product added')
    setEditId(null)
    setForm((f) => ({ ...f, name: '', price: '', description: '' }))
    setFiles([])
    setFiles360([])
    setTab('products')
  }

  function startEdit(p) {
    setEditId(p.id)
    setForm({
      name: p.name, brand: p.brand, category: p.category, subcategory: p.subcategory || '',
      price: String(p.price), color: p.color || '', fabric: p.fabric || '', gender: p.gender,
      stock: String(p.stock || 10), description: p.description || '', featured: !!p.featured,
    })
    setTab('add')
  }

  if (!authed) {
    return (
      <div className="container-x py-16 max-w-md">
        <h1 className="font-display text-3xl mb-2">Rana Collection — Owner login</h1>
        <p className="text-sm text-[var(--color-mute)] mb-6">Frontend-only demo. Password: <code>arham123</code></p>
        <form onSubmit={login} className="border border-[var(--color-line)] bg-white p-5 space-y-3">
          <input className="input" type="password" placeholder="Admin password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button className="btn w-full" type="submit">Sign in</button>
        </form>
      </div>
    )
  }

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="font-display text-3xl">Rana Admin</h1>
        <button className="btn btn-outline" onClick={logout}><LogOut size={14} /> Logout</button>
      </div>
      <div className="flex gap-2 mb-6 flex-wrap">
        <button className={`chip ${tab === 'products' ? 'active' : ''}`} onClick={() => setTab('products')}><Package size={12} /> Products</button>
        <button className={`chip ${tab === 'orders' ? 'active' : ''}`} onClick={() => setTab('orders')}><ShoppingBag size={12} /> Orders</button>
        <button className={`chip ${tab === 'add' ? 'active' : ''}`} onClick={() => { setTab('add'); setEditId(null) }}><Plus size={12} /> Add product</button>
      </div>

      {tab === 'add' && (
        <form onSubmit={saveProduct} className="border border-[var(--color-line)] bg-white p-5 grid md:grid-cols-2 gap-3 mb-8">
          <input className="input" placeholder="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <select className="input" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
            <option>Custom</option>
          </select>
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            <option>Other</option>
          </select>
          <input className="input" placeholder="subcategory" value={form.subcategory} onChange={(e) => setForm({ ...form, subcategory: e.target.value })} />
          <input className="input" type="number" placeholder="price PKR" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          <input className="input" placeholder="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
          <input className="input" placeholder="fabric" value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} />
          <input className="input" type="number" placeholder="stock" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          <select className="input" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })}>
            <option value="women">Women</option>
            <option value="men">Men</option>
          </select>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured</label>
          <textarea className="input md:col-span-2 min-h-[80px]" placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          <div className="md:col-span-2 text-sm">
            <label className="block mb-1">Product photos</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files])} />
          </div>
          <div className="md:col-span-2 text-sm">
            <label className="block mb-1">360° angle photos (optional)</label>
            <input type="file" accept="image/*" multiple onChange={(e) => setFiles360([...e.target.files])} />
          </div>
          <button className="btn md:col-span-2" type="submit">{editId ? 'Update product' : 'Publish product'}</button>
        </form>
      )}

      {tab === 'products' && (
        <div className="border border-[var(--color-line)] bg-white divide-y divide-[var(--color-line)]">
          {sorted.map((p) => (
            <div key={p.id} className="flex gap-3 p-3 items-center">
              <LazyImage src={p.images?.[0]} alt="" sizes="56px" className="w-14 h-16 shrink-0 border border-[var(--color-line)]" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{p.name}</div>
                <div className="text-xs text-[var(--color-mute)]">{p.brand} · {p.gender} · {formatPKR(p.price)}</div>
              </div>
              <button className="text-xs uppercase tracking-wider px-2 py-1 border border-[var(--color-line)]" onClick={() => startEdit(p)}>Edit</button>
              <button className="p-2 text-[var(--color-mute)] hover:text-red-700" onClick={() => { if (confirm('Delete?')) { removeProduct(p.id); toast.success('Removed') } }}><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {tab === 'orders' && (
        <div className="space-y-3">
          {!orders.length && <div className="border border-[var(--color-line)] bg-white p-8 text-center text-[var(--color-mute)]">No orders yet</div>}
          {orders.map((o) => (
            <div key={o.id} className="border border-[var(--color-line)] bg-white p-4">
              <div className="flex flex-wrap justify-between gap-2 mb-2">
                <div className="font-medium">{o.orderNumber}</div>
                <div className="text-sm">{formatPKR(o.total)} · {o.paymentMethod}</div>
              </div>
              <div className="text-xs text-[var(--color-mute)] mb-2">{o.customer?.name} · {o.customer?.phone} · {o.customer?.city}</div>
              <ul className="text-sm space-y-1">
                {(o.items || []).map((it, i) => (
                  <li key={i}>{it.name} ×{it.qty} ({it.size}) — {formatPKR(it.price * it.qty)}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
