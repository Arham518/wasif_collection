import { useState } from 'react'
import { useDebouncedCallback } from '../hooks/useDebounce'

/** Text/number input that keeps typing smooth and only commits after a pause. */
export default function DebouncedInput({ value = '', onCommit, delay = 350, ...props }) {
  const [local, setLocal] = useState(value)
  const [synced, setSynced] = useState(value)
  // Follow external changes (e.g. "Clear filters") without fighting the user's typing.
  if (value !== synced) {
    setSynced(value)
    if (value !== local) setLocal(value)
  }
  const commit = useDebouncedCallback((v) => onCommit(v), delay)
  return (
    <input
      {...props}
      value={local}
      onChange={(e) => { setLocal(e.target.value); commit(e.target.value) }}
    />
  )
}
