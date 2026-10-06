import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useCart = create(
  persist(
    (set, get) => ({
      items: [],
      add: (product, { size = 'M', qty = 1 } = {}) => {
        const items = [...get().items]
        const i = items.findIndex((x) => x.productId === product.id && x.size === size)
        if (i >= 0) items[i] = { ...items[i], qty: items[i].qty + qty }
        else {
          items.push({
            productId: product.id,
            name: product.name,
            brand: product.brand,
            price: product.price,
            image: product.images?.[0],
            size,
            color: product.color,
            qty,
          })
        }
        set({ items })
      },
      remove: (productId, size) => set({ items: get().items.filter((x) => !(x.productId === productId && x.size === size)) }),
      setQty: (productId, size, qty) => {
        if (qty < 1) return get().remove(productId, size)
        set({
          items: get().items.map((x) => (x.productId === productId && x.size === size ? { ...x, qty } : x)),
        })
      },
      clear: () => set({ items: [] }),
      count: () => get().items.reduce((s, x) => s + x.qty, 0),
      subtotal: () => get().items.reduce((s, x) => s + x.price * x.qty, 0),
    }),
    { name: 'pkf-cart' },
  ),
)
