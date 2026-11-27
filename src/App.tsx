import { useRef, useState } from "react"
import Storefront from "./components/store/Storefront"
import Workspace from "./components/owner/Workspace"
import { Modal, Button, Photo, Wordmark } from "./components/shared/UI"
import { products as initialProducts, initialRuns, defaultRules, bundle, creatorBundle, checkProposal, money } from "./data/demo"
import type { CartLine, MerchantProduct, Proposal, Rules, Run } from "./types"

export default function App() {
  const [merchant, setMerchant] = useState(false)
  const [gate, setGate] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState<CartLine[]>([])
  const [products, setProducts] = useState(initialProducts)
  const [bundles, setBundles] = useState<Proposal[]>([bundle])
  const [runs, setRuns] = useState(initialRuns)
  const [rules, setRules] = useState<Rules>(defaultRules)
  const [notice, setNotice] = useState("")
  const decisions = useRef(new Set<string>())
  const add = (id: string) => addBundle({ items: [{ productId: id, qty: 1 }], discountPct: 0, explanation: "" })
  const addBundle = (proposal: Proposal) => {
    const enough = proposal.items.every(i => {
      const p = products.find(p => p.id === i.productId)
      return p && p.stock >= i.qty + cart.filter(l => l.productId === i.productId).reduce((s, l) => s + l.qty, 0)
    })
    setNotice(enough ? "" : "Some requested quantities exceed demo stock. Your bag was not changed.")
    if (enough) setCart(lines => {
      const next = [...lines]
      proposal.items.forEach(i => {
        const p = products.find(p => p.id === i.productId)!
        const price = Math.round(p.priceCents * (1 - proposal.discountPct / 100))
        const idx = next.findIndex(l => l.productId === p.id && l.unitPriceCents === price)
        if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + i.qty }
        else next.push({ productId: p.id, qty: i.qty, unitPriceCents: price })
      })
      return next
    })
    setCartOpen(true)
  }
  const submit = (request: string, failure: boolean) => {
    const proposal = /creator|photo|video|mic/i.test(request) ? creatorBundle : bundle
    const checks = checkProposal(proposal, rules, products)
    const now = new Date().toISOString()
    const status = failure ? "failed" : request.trim().length < 12 ? "needs_input" : checks.every(c => c.passed) ? "awaiting_approval" : "rejected_by_policy"
    const next: Run = {
      id: `RZ-${Date.now().toString().slice(-6)}`, request, proposal: { ...proposal, id: `bundle-${Date.now()}` }, checks, status, createdAt: now,
      events: [{ step: failure ? "Provider unavailable" : "Proposal prepared", status: failure ? "failed" : "ok", message: failure ? "Simulated failure; retry is available" : `${proposal.name}. Evaluated current demo stock, compatibility, and commercial policy.`, at: now }],
    }
    setRuns(r => [next, ...r])
  }
  const updateRun = (id: string, proposal: Proposal) => {
    setRuns(rs => rs.map(r => {
      if (r.id !== id || !["awaiting_approval", "rejected_by_policy"].includes(r.status)) return r
      const checks = checkProposal(proposal, rules, products)
      return { ...r, proposal, checks, status: checks.every(c => c.passed) ? "awaiting_approval" : "rejected_by_policy", events: [...r.events, { step: "Proposal edited", status: "ok", message: "Items and discount revalidated", at: new Date().toISOString() }] }
    }))
  }
  const decide = (id: string, action: "approve" | "reject" | "retry", note = "") => {
    const run = runs.find(r => r.id === id)
    if (!run || decisions.current.has(id)) return
    if (action === "retry" && !["failed", "running"].includes(run.status)) return
    if (action !== "retry" && !["awaiting_approval", "rejected_by_policy"].includes(run.status)) return
    const checks = checkProposal(run.proposal, rules, products)
    const passed = checks.every(c => c.passed)
    const status = action === "approve" ? passed ? "executed" : "rejected_by_policy" : action === "reject" ? "rejected" : passed ? "awaiting_approval" : "rejected_by_policy"
    if (status === "executed" || status === "rejected") decisions.current.add(id)
    if (status === "executed") setBundles(bs => [...bs.filter(b => b.id !== run.proposal.id), { ...run.proposal, name: run.proposal.name || run.request }])
    setRuns(rs => rs.map(r => r.id !== id ? r : { ...r, status, checks, events: [...r.events, { step: action === "approve" && passed ? "Approved and published locally" : action === "reject" ? "Rejected by operator" : "Revalidated", status: passed || action === "reject" ? "ok" : "failed", message: `${note.slice(0, 500) || "No operator note."} ${status === "executed" ? "Bundle now visible in customer Bundle Studio. No inventory sale or external execution." : ""}`, at: new Date().toISOString() }] }))
  }
  const editProduct = (id: string, priceCents: number, stock: number) => {
    setProducts(ps => ps.map(p => p.id === id ? { ...p, priceCents, stock } : p))
    const now = new Date().toISOString()
    setRuns(rs => rs.map((r, i) => i ? r : { ...r, events: [...r.events, { step: "Catalog updated", status: "ok", message: `${id}: price ${money(priceCents)}, stock ${stock}. Shared storefront updated.`, at: now }] }))
  }
  return <div className="min-h-screen overflow-x-hidden bg-[#f8f9fc] font-sans text-[#202235] selection:bg-violet-200 [&_button]:cursor-pointer [&_button:disabled]:cursor-not-allowed [&_button:focus-visible]:outline-2 [&_button:focus-visible]:outline-offset-2 [&_button:focus-visible]:outline-violet-500 [&_input:focus-visible]:outline-2 [&_input:focus-visible]:outline-violet-500 [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-violet-500 [&_textarea:focus-visible]:outline-2 [&_textarea:focus-visible]:outline-violet-500">
    {merchant ? <Workspace products={products} runs={runs} rules={rules} bundles={bundles} onEditProduct={editProduct} onEditProposal={updateRun} onSaveRules={r => { setRules(r); setRuns(rs => rs.map((run, i) => i ? run : { ...run, events: [...run.events, { step: "Policy updated", status: "ok", message: `Minimum margin ${r.minMarginPct}%, maximum discount ${r.maxDiscountPct}%`, at: new Date().toISOString() }] })) }} onSubmitRequest={submit} onApprove={(id, note) => decide(id, "approve", note)} onReject={(id, note) => decide(id, "reject", note)} onRetry={id => decide(id, "retry")} onExit={() => setMerchant(false)} /> :
      <Storefront products={products} bundles={bundles} cartCount={cart.reduce((s, l) => s + l.qty, 0)} onAddToCart={add} onAddBundle={addBundle} onOpenCart={() => { setNotice(""); setCartOpen(true) }} onSignIn={() => setGate(true)} />}
    {gate && <Modal title="Commerce, from the other side." onClose={() => setGate(false)}><Wordmark /><p className="my-6 leading-7 text-slate-600">One catalog. One intelligence layer. Enter the REZLEE merchant workspace to review opportunities, edit products, and publish bundles back to this store.</p><p className="mb-6 rounded-xl bg-violet-50 p-4 text-sm text-violet-900">Demo access only—not authentication. All changes stay in memory and reset on reload.</p><Button onClick={() => { setGate(false); setMerchant(true); window.scrollTo({ top: 0 }) }}>Enter demo workspace →</Button></Modal>}
    {cartOpen && <Modal title="Your shopping bag" onClose={() => setCartOpen(false)}>
      <p className="mb-5 text-sm text-slate-600">Purchasing preparation only. No payment or order will be placed.</p>
      {!cart.length && <p className="py-12">Your bag is empty. Start with a need, and find your fit.</p>}
      {cart.map((l, idx) => {
        const p = products.find(p => p.id === l.productId) as MerchantProduct
        return <div key={idx} className="flex items-center justify-between gap-3 border-b border-slate-200 py-4"><Photo src={p.imageUrl} alt={p.name} className="h-16 w-16 shrink-0 rounded-lg" /><div className="min-w-0 flex-1"><p className="text-sm font-medium">{p.name}</p><p className="mt-1 text-sm text-slate-600">{l.qty} × {money(l.unitPriceCents)}</p>{p.stock < cart.filter(i => i.productId === p.id).reduce((s, i) => s + i.qty, 0) && <p className="text-sm text-red-800">Stock changed. Remove and re-add this item.</p>}</div><button className="min-h-11 text-sm underline" onClick={() => setCart(c => c.filter((_, i) => i !== idx))}>Remove</button></div>
      })}
      <div className="my-6 flex justify-between text-xl"><span>Total</span><strong>{money(cart.reduce((s, l) => s + l.qty * l.unitPriceCents, 0))}</strong></div>
      <Button disabled={!cart.length} onClick={() => setNotice("Demo only. No payment provider, real order, or reservation is connected.")}>Prepare demo checkout →</Button>{notice && <p role="status" className="mt-4 rounded-xl bg-violet-50 p-4 text-sm">{notice}</p>}
    </Modal>}
  </div>
}
