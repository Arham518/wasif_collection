import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { errorMessage } from '../lib/supabase'

/** Load async data with loading / error state; errors are shown as a toast. */
export function useAsync(fn, deps = [], { errorText = 'Could not load data' } = {}) {
  const [state, setState] = useState({ data: null, loading: true, error: null })
  const fnRef = useRef(fn)
  fnRef.current = fn
  const seq = useRef(0)

  const reload = useCallback(() => {
    const id = ++seq.current
    setState((s) => ({ ...s, loading: true }))
    return Promise.resolve()
      .then(() => fnRef.current())
      .then((data) => { if (id === seq.current) setState({ data, loading: false, error: null }) ; return data })
      .catch((err) => {
        if (id !== seq.current) return null
        const msg = errorMessage(err, errorText)
        setState((s) => ({ data: s.data, loading: false, error: msg }))
        toast.error(msg, { id: `load-${errorText}` })
        return null
      })
  }, [errorText])

  useEffect(() => { reload() }, deps) // eslint-disable-line react-hooks/exhaustive-deps

  const setData = useCallback((updater) => {
    setState((s) => ({ ...s, data: typeof updater === 'function' ? updater(s.data) : updater }))
  }, [])

  return { ...state, reload, setData }
}