import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import LazyImage from './LazyImage'
import { normalizeImage } from '../services/catalogService'

/**
 * Photo picker for the admin product form: dashed drop area (click or drag & drop),
 * thumbnails for saved photos and new files, remove buttons. First photo = main photo.
 */
export default function ImageDropzone({ label, urls = [], files = [], onFiles, onRemoveUrl, onMakeMain, hint }) {
  const input = useRef(null)
  const [over, setOver] = useState(false)
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files])
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews])

  const addFiles = (list) => {
    const imgs = [...(list || [])].filter((f) => f.type.startsWith('image/'))
    if (imgs.length) onFiles([...files, ...imgs])
  }

  return (
    <div className="md:col-span-2 text-sm">
      <div className="mb-1">{label}</div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => input.current?.click()}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click() } }}
        onDragOver={(e) => { e.preventDefault(); setOver(true) }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); addFiles(e.dataTransfer.files) }}
        className={`border border-dashed p-5 text-center bg-[var(--color-paper)] transition-colors ${over ? 'border-[var(--color-ink)]' : 'border-[var(--color-line)] hover:border-[var(--color-ink)]'}`}
      >
        <span className="btn btn-outline pointer-events-none">Choose photos</span>
        <p className="text-xs text-[var(--color-mute)] mt-2">or drag and drop here{hint ? ` \u00b7 ${hint}` : ''}</p>
        <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
      </div>
      {(urls.length > 0 || files.length > 0) && (
        <div className="flex gap-2 flex-wrap mt-3">
          {urls.map((url, i) => (
            <div key={url} className="relative">
              <button type="button" onClick={() => onMakeMain?.(url)} title={onMakeMain ? 'Make main photo' : undefined} className={`block w-16 aspect-[3/4] border ${i === 0 && onMakeMain ? 'border-[var(--color-ink)]' : 'border-[var(--color-line)]'}`}>
                <LazyImage src={normalizeImage(url)} alt="" responsive={false} className="w-full h-full" />
              </button>
              <button type="button" onClick={() => onRemoveUrl(url)} aria-label="Remove photo" className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-[var(--color-line)] grid place-items-center"><X size={10} /></button>
            </div>
          ))}
          {previews.map((src, i) => (
            <div key={src} className="relative">
              <span className="block w-16 aspect-[3/4] border border-dashed border-[var(--color-ink)] overflow-hidden">
                <img src={src} alt="" className="w-full h-full object-cover" />
              </span>
              <button type="button" onClick={() => onFiles(files.filter((_, j) => j !== i))} aria-label="Remove photo" className="absolute -top-2 -right-2 w-5 h-5 bg-white border border-[var(--color-line)] grid place-items-center"><X size={10} /></button>
            </div>
          ))}
        </div>
      )}
      {files.length > 0 && <p className="text-xs text-[var(--color-mute)] mt-1">{files.length} new photo(s) upload on save (resized to max 1200px).</p>}
    </div>
  )
}