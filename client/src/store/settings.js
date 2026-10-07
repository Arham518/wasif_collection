import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import { DEFAULT_DELIVERY } from '../lib/cartLogic'

/** Store settings managed by the admin (public.settings). Defaults are used until loaded. */
export const useSettings = create((set) => ({
  delivery: DEFAULT_DELIVERY,
  load: async () => {
    if (!supabase) return
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'delivery').maybeSingle()
    if (error || !data?.value) return
    set({ delivery: deliveryFromRow(data.value) })
  },
  setDelivery: (delivery) => set({ delivery }),
}))

export function deliveryFromRow(v) {
  const flatFee = Number(v?.flat_fee)
  const freeOver = Number(v?.free_over)
  return {
    flatFee: Number.isFinite(flatFee) ? flatFee : DEFAULT_DELIVERY.flatFee,
    freeOver: Number.isFinite(freeOver) ? freeOver : DEFAULT_DELIVERY.freeOver,
  }
}