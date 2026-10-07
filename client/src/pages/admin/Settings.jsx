import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { requireSupabase, errorMessage } from '../../lib/supabase'
import { useSettings, deliveryFromRow } from '../../store/settings'
import { formatPKR } from '../../lib/utils'

/** Settings > Delivery: flat fee and free-shipping threshold (public.settings, key 'delivery'). */
export default function Settings() {
  const delivery = useSettings((s) => s.delivery)
  const setDelivery = useSettings((s) => s.setDelivery)
  const [form, setForm] = useState({ flatFee: String(delivery.flatFee), freeOver: String(delivery.freeOver) })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let alive = true
    requireSupabase().from('settings').select('value').eq('key', 'delivery').maybeSingle()
      .then(({ data, error }) => {
        if (!alive) return
        if (error) return toast.error(errorMessage(error, 'Could not load settings'))
        if (data?.value) {
          const d = deliveryFromRow(data.value)
          setForm({ flatFee: String(d.flatFee), freeOver: String(d.freeOver) })
        }
      })
    return () => { alive = false }
  }, [])

  async function save(e) {
    e.preventDefault()
    const flatFee = Number(form.flatFee)
    const freeOver = Number(form.freeOver)
    if (!(flatFee >= 0) || !(freeOver >= 0)) return toast.error('Enter amounts of 0 or more')
    setBusy(true)
    try {
      const { error } = await requireSupabase().from('settings')
        .upsert({ key: 'delivery', value: { flat_fee: flatFee, free_over: freeOver } }, { onConflict: 'key' })
      if (error) throw error
      setDelivery({ flatFee, freeOver })
      toast.success('Delivery settings saved')
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save settings'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={save} className="border border-[var(--color-line)] bg-white p-5 grid md:grid-cols-2 gap-3 max-w-2xl">
      <h2 className="md:col-span-2 text-[11px] tracking-[0.16em] uppercase">Delivery</h2>
      <label className="text-sm">
        <span className="block mb-1">Delivery fee (PKR)</span>
        <input className="input" type="number" min="0" value={form.flatFee} onChange={(e) => setForm({ ...form, flatFee: e.target.value })} required />
      </label>
      <label className="text-sm">
        <span className="block mb-1">Free delivery from (PKR, 0 = never free)</span>
        <input className="input" type="number" min="0" value={form.freeOver} onChange={(e) => setForm({ ...form, freeOver: e.target.value })} required />
      </label>
      <p className="md:col-span-2 text-xs text-[var(--color-mute)]">
        Orders below {formatPKR(Number(form.freeOver) || 0)} pay {formatPKR(Number(form.flatFee) || 0)}. Used by checkout and re-checked by the database on every order.
      </p>
      <button className="btn md:col-span-2" type="submit" disabled={busy}>{busy ? 'Saving\u2026' : 'Save'}</button>
    </form>
  )
}