import { useState } from "react"
import type { Proposal, PublicProduct } from "../../types"
import { compatibility, money } from "../../data/demo"
import { Button, Photo } from "../shared/UI"

export default function BundleSection({ products, proposal, onAddToCart }: {
  products: PublicProduct[]
  proposal: Proposal
  onAddToCart: (proposal: Proposal) => void
}) {
  const [draft, setDraft] = useState(proposal)
  const [addition, setAddition] = useState("")
  // Reset the draft when the published bundle changes (adjust state during render, not in an effect)
  const [seen, setSeen] = useState(proposal)
  if (seen !== proposal) { setSeen(proposal); setDraft(proposal) }
  const items = draft.items.map(i => ({ ...products.find(p => p.id === i.productId)!, qty: i.qty }))
  const total = items.reduce((s, p) => s + p.priceCents * p.qty, 0)
  const discounted = items.map(p => Math.round(p.priceCents * (1 - draft.discountPct / 100)) * p.qty).reduce((s, p) => s + p, 0)
  const confirmed = items.length > 1 && items.slice(1).every(p => compatibility(items[0], p))
  return <section className="border-y border-[#e4dff0] bg-[#eeebf6] px-5 py-12 md:px-12">
    <div className="mx-auto grid max-w-[1344px] items-start gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <div><p className="mb-4 text-xs font-semibold uppercase tracking-[.18em] text-[#655298]">Connected by design · Bundle studio</p><h2 className="font-display text-4xl font-medium leading-tight tracking-tight">{draft.name || "Your connected setup"}</h2><p className="my-5 max-w-lg text-sm leading-7 text-[#5b556d]">{draft.explanation}</p>
        <div className="mb-5 inline-flex rounded-full border border-[#ccc3e6] bg-white px-3 py-2 text-xs text-[#574774]">{confirmed ? "✓ Demo compatibility relationships confirmed" : "Compatibility not confirmed for every item"}</div>
        <div className="mb-5 flex flex-wrap items-center gap-4"><span className="text-slate-600 line-through">{money(total)}</span><strong className="font-display text-4xl">{money(discounted)}</strong><span className="rounded-full bg-[#ded6f4] px-3 py-2 text-xs font-semibold text-[#4c337f]">Save {draft.discountPct}%</span></div>
        <Button disabled={items.length < 2 || items.some(p => p.stock < p.qty)} onClick={() => onAddToCart(draft)}>Add {items.length} items to bag →</Button><p className="mt-3 text-xs text-slate-600">Edited totals update instantly. Minimum two items. No real checkout.</p>
      </div>
      <div className="space-y-3">{items.map(p => <article key={p.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#e0dce9] bg-white p-3 shadow-sm md:gap-5"><Photo src={p.imageUrl} alt={p.name} className="h-20 w-20 shrink-0 rounded-xl" /><div className="min-w-0 flex-1"><p className="text-xs text-slate-600">{p.brand} · {p.kind}</p><h3 className="my-1 text-sm font-semibold">{p.name}</h3><p className="text-sm">{money(p.priceCents)} × {p.qty}</p></div><button aria-label={`Remove ${p.name} from bundle`} onClick={() => setDraft(d => ({ ...d, items: d.items.filter(i => i.productId !== p.id) }))} className="min-h-11 px-2 text-xs text-slate-600 underline">Remove</button></article>)}
        <div className="flex gap-2"><select value={addition} onChange={e => setAddition(e.target.value)} aria-label="Add product to bundle" className="min-h-11 min-w-0 flex-1 rounded-xl border border-[#d0c7e4] bg-white px-3 text-sm"><option value="">Add an available product…</option>{products.filter(p => p.stock && !draft.items.some(i => i.productId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name} · {money(p.priceCents)}</option>)}</select><Button disabled={!addition} onClick={() => { setDraft(d => ({ ...d, items: [...d.items, { productId: addition, qty: 1 }] })); setAddition("") }}>Add</Button></div>
        <button onClick={() => setDraft(proposal)} className="min-h-11 text-xs text-[#594782] underline">Reset to published bundle</button>
      </div>
    </div>
  </section>
}
