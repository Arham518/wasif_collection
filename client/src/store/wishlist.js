import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useWishlist = create(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const ids = get().ids.includes(id) ? get().ids.filter((x) => x !== id) : [...get().ids, id]
        set({ ids })
      },
      has: (id) => get().ids.includes(id),
    }),
    { name: 'pkf-wish' },
  ),
)
