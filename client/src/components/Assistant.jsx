import { useState, useRef, useEffect } from 'react'
import LazyImage from './LazyImage'
import { MessageCircle, X, Send } from 'lucide-react'
import { Link } from 'react-router-dom'
import { formatPKR } from '../lib/utils'
import { useCart } from '../store/cart'
import { useProducts, runAssistant } from '../store/catalog'
import { toast } from 'sonner'

export default function Assistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hi! I can help you find outfits. Try "women lawn under 5000 Khaadi" or "men kurta navy".' },
  ])
  const endRef = useRef(null)
  const add = useCart((s) => s.add)
  const products = useProducts()

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [messages, open])

  function send(e) {
    e?.preventDefault()
    const msg = input.trim()
    if (!msg) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: msg }])
    const result = runAssistant(msg, products)
    setMessages((m) => [...m, { role: 'bot', text: result.reply, products: result.products }])
  }

  return (
    <>
      <button id="assistant" onClick={() => setOpen(true)} className="fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-[var(--color-ink)] text-white shadow-lg grid place-items-center hover:scale-105 transition" aria-label="Open assistant">
        <MessageCircle size={20} />
      </button>
      {open && (
        <div className="fixed bottom-5 right-5 z-50 w-[min(100vw-1.5rem,380px)] h-[min(70vh,560px)] bg-white border border-[var(--color-line)] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-line)] bg-[var(--color-paper)]">
            <div>
              <div className="text-sm font-medium">Rana Assistant</div>
              <div className="text-[10px] tracking-wider uppercase text-[var(--color-mute)]">Local · prices · filters</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-3" data-lenis-prevent>
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[90%] text-sm px-3 py-2 ${m.role === 'user' ? 'bg-[var(--color-ink)] text-white' : 'bg-[var(--color-paper-2)] border border-[var(--color-line)]'}`}>
                  <p className="leading-relaxed">{m.text}</p>
                  {m.products?.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {m.products.slice(0, 4).map((p) => (
                        <div key={p.id} className="flex gap-2 items-center bg-white border border-[var(--color-line)] p-1.5">
                          <LazyImage src={p.images?.[0]} alt="" sizes="48px" className="w-12 h-14 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <Link to={`/product/${p.id}`} className="text-xs font-medium line-clamp-1 hover:underline">{p.name}</Link>
                            <div className="text-[10px] text-[var(--color-mute)]">{p.brand} · {formatPKR(p.price)}</div>
                          </div>
                          <button className="text-[10px] uppercase tracking-wider px-2 py-1 border border-[var(--color-ink)]" onClick={() => { add(p); toast.success('Added to cart') }}>Add</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form onSubmit={send} className="border-t border-[var(--color-line)] p-2 flex gap-2">
            <input className="input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for outfits…" />
            <button type="submit" className="btn px-3"><Send size={16} /></button>
          </form>
        </div>
      )}
    </>
  )
}
