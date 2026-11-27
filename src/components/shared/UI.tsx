import { useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from "react"
import Icon from "./Icon"

export function Button({ children, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...props} className={`inline-flex min-h-11 items-center justify-center gap-3 rounded-xl bg-[#e85706] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-slate-600 motion-reduce:transition-none ${className}`}>{children}</button>
}
export function Photo({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  const [failed, setFailed] = useState(false)
  useEffect(() => setFailed(false), [src])
  return failed ? <div className={`grid place-items-center bg-[#e6e2d8] text-slate-700 ${className}`}><div className="p-5 text-center"><svg className="mx-auto h-10 w-10" viewBox="0 0 40 40" fill="none" stroke="currentColor" aria-hidden="true"><rect x="4" y="6" width="32" height="28" rx="3"/><path d="m5 29 10-11 8 8 6-6 7 9"/><circle cx="28" cy="14" r="3"/></svg><p className="mt-2 text-sm">{alt} · Photo unavailable</p></div></div> : <img src={src} alt={alt} onError={() => setFailed(true)} className={`object-cover ${className}`} />
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const before = document.activeElement as HTMLElement
    const el = ref.current!
    const targets = () => Array.from(el.querySelectorAll<HTMLElement>('button:not(:disabled), input, textarea, select, [tabindex="0"]'))
    targets()[0]?.focus()
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close.current()
      if (e.key !== "Tab") return
      const t = targets(), first = t[0], last = t[t.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener("keydown", key)
    const overflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.removeEventListener("keydown", key); document.body.style.overflow = overflow; before?.focus() }
  }, [])
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onMouseDown={onClose}>
    <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="dialog-title" onMouseDown={e => e.stopPropagation()} className="max-h-[90dvh] w-full max-w-4xl overflow-auto rounded-2xl bg-[#f5f0e6] p-6 text-[#191c2b] shadow-2xl md:p-9">
      <div className="mb-5 flex items-start justify-between gap-5"><h2 id="dialog-title" className="text-3xl font-medium tracking-tight">{title}</h2><button aria-label="Close dialog" className="grid min-h-11 min-w-11 place-items-center rounded-full border border-black/20 focus-visible:ring-2" onClick={onClose}><Icon name="close" /></button></div>{children}
    </div>
  </div>
}
export function Badge() {
  return <span className="inline-flex rounded-full border border-current/25 px-3 py-1 text-xs">Demo data · Simulated intelligence</span>
}
export function Wordmark() {
  return <span className="inline-flex items-center overflow-hidden rounded-xl bg-[#023530] p-1.5">
    <img src="/brand/rezalee.svg" alt="ReZalee!" className="h-10 w-auto max-w-[190px] object-contain" />
  </span>
}
