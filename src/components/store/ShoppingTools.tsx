import { useState } from "react"
import type { PublicProduct } from "../../types"
import { compatibility, money } from "../../data/demo"
import { Button, Modal, Photo } from "../shared/UI"

export function CompareView({ products, onClose, onAddToCart }: {
  products: PublicProduct[]
  onClose: () => void
  onAddToCart: (id: string) => void
}) {
  const [differences, setDifferences] = useState(false)
  const keys = Array.from(new Set(products.flatMap(p => Object.keys(p.specs))))
  const cheapest = Math.min(...products.map(p => p.priceCents))
  return <Modal title={`Compare ${products[0]?.kind.toLowerCase()}`} onClose={onClose}>
    <p className="mb-5 text-sm text-slate-600">Same-type comparison · Declared demo specifications, not independently verified testing.</p>
    <button aria-pressed={differences} onClick={() => setDifferences(!differences)} className="mb-5 min-h-11 rounded-lg border border-slate-300 px-4 text-sm">{differences ? "Show all specifications" : "Show only differences"}</button>
    <div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-sm"><thead><tr><th className="w-36 p-3 text-slate-600">Your shortlist</th>{products.map(p => <th key={p.id} className="min-w-44 p-3 align-top"><Photo src={p.imageUrl} alt={p.name} className="mb-3 aspect-[1.3] w-full rounded-xl" /><span className="block text-xs font-normal text-slate-600">{p.brand}</span><span className="mt-1 block text-base">{p.name}</span><span className="my-2 block">{money(p.priceCents)}</span><span className="block text-xs font-normal text-orange-800">{p.priceCents === cheapest ? "Lowest price" : `${money(p.priceCents - cheapest)} more`}</span></th>)}</tr></thead><tbody>
      {keys.filter(k => !differences || new Set(products.map(p => p.specs[k])).size > 1).map(k => <tr key={k} className={new Set(products.map(p => p.specs[k])).size > 1 ? "border-t border-orange-100 bg-orange-50" : "border-t border-slate-200"}><th className="p-3 font-medium">{k}</th>{products.map(p => <td key={p.id} className="p-3">{p.specs[k] ?? "Not recorded"}</td>)}</tr>)}
      <tr className="border-t border-slate-200"><th className="p-3 font-medium">Advantages</th>{products.map(p => <td key={p.id} className="p-3 align-top">{p.strengths.join(" · ")}</td>)}</tr>
      <tr className="border-t border-slate-200"><th className="p-3 font-medium">Trade-off</th>{products.map(p => <td key={p.id} className="p-3 align-top">{p.limitation}</td>)}</tr>
      <tr className="border-t border-slate-200"><th className="p-3 font-medium">Availability</th>{products.map(p => <td key={p.id} className="p-3">{p.stock} in stock<Button disabled={!p.stock} onClick={() => onAddToCart(p.id)} className="mt-3">Add to bag</Button></td>)}</tr>
    </tbody></table></div>
    <div className="mt-6 rounded-xl border border-orange-200 bg-orange-50 p-5"><h3 className="font-semibold">The REZLEE take</h3><p className="mt-2 text-sm leading-6">For lowest cost, choose {products.find(p => p.priceCents === cheapest)?.name}. {products[0]?.kind === "Headphones" ? "For focus, look for ANC; passive isolation is not active cancellation. Longer battery life may come with more weight. Microphone quality has not been independently tested." : "Compare the highlighted requirements against your devices. An unrecorded specification is unknown, not an implied match."}</p></div>
  </Modal>
}
export function ProductDetail({ product: p, products, onClose, onAddToCart, onOpen }: {
  product: PublicProduct
  products: PublicProduct[]
  onClose: () => void
  onAddToCart: (id: string) => void
  onOpen: (p: PublicProduct) => void
}) {
  const [device, setDevice] = useState("")
  const [question, setQuestion] = useState("")
  const [answer, setAnswer] = useState("")
  const target = products.find(p => p.id === device)
  const matched = target ? compatibility(p, target) : false
  const alternatives = products.filter(i => i.id !== p.id && i.kind === p.kind && i.stock > 0)
  const complements = products.filter(i => p.complementaryWith.includes(i.id) && i.stock > 0)
  return <Modal title={p.name} onClose={onClose}><div className="grid gap-6 md:grid-cols-2"><Photo src={p.imageUrl} alt={`${p.name}, representative product photography`} className="aspect-square w-full rounded-2xl" /><div><p className="text-xs tracking-wider text-orange-800">{p.brand} / {p.kind}</p><p className="my-4 text-3xl font-semibold">{money(p.priceCents)}</p><p className="text-sm text-emerald-800">{p.stock ? `${p.stock} available in this demo` : "Currently out of stock"}</p><ul className="my-5 space-y-2 text-sm">{p.strengths.map(s => <li key={s}>✓ {s}</li>)}</ul><p className="mb-5 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">Know the trade-off: {p.limitation}</p><Button disabled={!p.stock} onClick={() => onAddToCart(p.id)}>Add to bag →</Button></div></div>
    <p className="my-4 text-xs text-slate-600">Fictional demo model and specifications. Photograph is illustrative, not a verified product image.</p>
    <h3 className="mb-3 mt-7 text-xl">Specifications that matter</h3><table className="w-full text-sm"><tbody>{Object.entries(p.specs).map(([k, v]) => <tr key={k} className="border-b border-slate-200"><th className="py-3 pr-4 text-left font-medium">{k}</th><td className="py-3">{v}</td></tr>)}</tbody></table>
    <section className="my-6 rounded-xl border border-orange-200 bg-orange-50 p-5"><h3 className="text-xl">Will they work together?</h3><select aria-label="Product to check compatibility" value={device} onChange={e => setDevice(e.target.value)} className="my-4 min-h-11 w-full rounded-lg border border-orange-200 bg-white px-3 text-sm"><option value="">Choose another product</option>{products.filter(i => i.id !== p.id).map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select>{target && <p role="status" className="text-sm">{matched ? "✓ Confirmed in demo compatibility data." : "Not confirmed. No explicit relationship is recorded; do not assume compatibility."} Always check your host requirements and connectors.</p>}</section>
    <form onSubmit={e => {
      e.preventDefault()
      const entry = Object.entries(p.specs).find(([k]) => question.toLowerCase().split(/\s+/).some(word => word.length > 2 && k.toLowerCase().includes(word)))
      setAnswer(entry ? `${entry[0]}: ${entry[1]}. Source: declared demo specification.` : "This information is not recorded. I cannot verify it from this catalog.")
    }} className="rounded-xl border border-slate-200 p-5"><label htmlFor="product-question" className="block text-lg">Ask about this product</label><div className="mt-3 flex gap-2"><input id="product-question" value={question} onChange={e => setQuestion(e.target.value)} placeholder="What is the battery life?" className="min-h-11 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm" /><Button disabled={!question.trim()}>Ask</Button></div>{answer && <p role="status" className="mt-4 text-sm text-slate-600">{answer}</p>}</form>
    {[["Complementary products", complements], ["In-stock alternatives", alternatives]].map(([title, list]) => <section key={title as string} className="mt-7"><h3 className="mb-3 text-xl">{title as string}</h3>{!(list as PublicProduct[]).length && <p className="text-sm text-slate-600">No recorded matches in this demo catalog.</p>}<div className="grid gap-3 md:grid-cols-3">{(list as PublicProduct[]).slice(0, 3).map(i => <button key={i.id} onClick={() => { setDevice(""); setAnswer(""); onOpen(i) }} className="rounded-xl border border-slate-200 p-3 text-left"><Photo src={i.imageUrl} alt={i.name} className="mb-3 aspect-video w-full rounded-lg" /><span className="block text-sm font-medium">{i.name}</span><span className="mt-1 block text-sm text-slate-600">{money(i.priceCents)} ↗</span></button>)}</div></section>)}
  </Modal>
}
