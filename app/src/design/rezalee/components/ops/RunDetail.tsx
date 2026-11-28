import { useState } from "react"
import type { MerchantProduct, Proposal, RuleCheck, Run } from "../../types"
import { money } from "../../data/demo"
import { Button, Photo } from "../shared/UI"

export default function RunDetail({ run, products, checks, onApprove, onReject, onRetry, onEditProposal }: {
  run: Run
  products: MerchantProduct[]
  checks: RuleCheck[]
  onApprove: (id: string, note: string) => void
  onReject: (id: string, note: string) => void
  onRetry: (id: string) => void
  onEditProposal: (id: string, proposal: Proposal) => void
}) {
  const [note, setNote] = useState("")
  const [draft, setDraft] = useState(run.proposal)
  const [addition, setAddition] = useState("")
  // Reset the draft and note when another run (or a new proposal) is selected
  const [seen, setSeen] = useState({ id: run.id, proposal: run.proposal })
  if (seen.id !== run.id || seen.proposal !== run.proposal) { setSeen({ id: run.id, proposal: run.proposal }); setDraft(run.proposal); setNote("") }
  const editable = ["awaiting_approval", "rejected_by_policy"].includes(run.status)
  const passed = checks.every(c => c.passed)
  const dirty = JSON.stringify(draft) !== JSON.stringify(run.proposal)
  const total = draft.items.reduce((s, i) => s + (products.find(p => p.id === i.productId)?.priceCents ?? 0) * i.qty, 0)
  return <div className="grid gap-6 lg:grid-cols-[.75fr_1.25fr]">
    <section className="min-w-0 rounded-2xl border border-[#24443d] bg-[#0d2b26] p-6"><p className="text-xs uppercase tracking-widest text-[#bdaaff]">{run.id}</p><h2 className="my-4 font-display text-2xl tracking-tight">{run.request}</h2><span className="inline-flex rounded-full border border-[#66517e] bg-[#342840] px-3 py-2 text-xs">{run.status.replace(/_/g, " ")}</span><h3 className="mb-5 mt-8 text-lg">Recorded workflow</h3>{run.events.map((e, i) => <div key={i} className="border-l border-[#8e72ce] pb-7 pl-5"><p className="text-sm font-medium">{e.status === "ok" ? "✓" : e.status === "failed" ? "×" : "…"} {e.step}</p><p className="mt-2 text-sm leading-6 text-slate-300">{e.message}</p><time className="mt-2 block text-xs text-slate-300">{new Date(e.at).toLocaleTimeString()}</time></div>)}<p className="text-xs leading-5 text-slate-300">Only recorded local events are shown. No live external agent or fulfillment service is running.</p></section>
    <section className="min-w-0 rounded-2xl border border-[#24443d] bg-[#0d2b26] p-6">
      <p className="text-xs uppercase tracking-widest text-[#bdaaff]">Action preview</p><h2 className="mb-3 mt-2 text-xl">{draft.name || "Proposed setup"}</h2><p className="mb-5 text-sm leading-6 text-slate-300">{draft.explanation}</p>
      {draft.items.map(i => { const p = products.find(p => p.id === i.productId)!; return <div key={i.productId} className="flex flex-wrap items-center gap-3 border-t border-white/10 py-3"><Photo src={p.imageUrl} alt={p.name} className="h-12 w-12 rounded-lg" /><span className="min-w-0 flex-1 text-sm">{p.name}<span className="mt-1 block text-xs text-slate-300">{i.qty} × {money(p.priceCents)}</span></span>{editable && <button aria-label={`Remove ${p.name} from proposal`} onClick={() => setDraft(d => ({ ...d, items: d.items.filter(x => x.productId !== p.id) }))} className="min-h-11 text-xs text-slate-300 underline">Remove</button>}</div> })}
      {editable && <><div className="mt-3 flex gap-2"><select aria-label="Product to add to proposal" value={addition} onChange={e => setAddition(e.target.value)} className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#454254] bg-[#071f1c] px-3 text-sm"><option value="">Add product…</option>{products.filter(p => !draft.items.some(i => i.productId === p.id)).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select><button disabled={!addition} onClick={() => { setDraft(d => ({ ...d, items: [...d.items, { productId: addition, qty: 1 }] })); setAddition("") }} className="min-h-11 rounded-lg border border-[#454254] px-4 text-sm disabled:text-slate-500">Add</button></div><label className="my-4 flex items-center justify-between text-sm">Bundle discount %<input aria-label="Proposal discount" type="number" min="0" max="90" value={Number.isNaN(draft.discountPct) ? "" : draft.discountPct} onChange={e => setDraft(d => ({ ...d, discountPct: e.target.value === "" ? NaN : +e.target.value }))} className="min-h-11 w-24 rounded-lg border border-[#454254] bg-[#071f1c] p-3" /></label>{dirty && <Button disabled={!Number.isFinite(draft.discountPct) || draft.discountPct < 0 || draft.discountPct > 90 || draft.items.length < 2} onClick={() => onEditProposal(run.id, draft)}>Save edits & revalidate</Button>}</>}
      <div className="my-5 flex justify-between border-y border-white/10 py-4 text-sm"><span>Customer bundle price</span><strong>{Number.isFinite(draft.discountPct) ? money(Math.round(total * (1 - draft.discountPct / 100))) : "Invalid discount"}</strong></div>
      <h3 className="mb-3 text-lg">Policy validation</h3>{checks.map(c => <div key={c.rule} className="border-t border-white/10 py-3"><p className={`text-sm font-medium ${c.passed ? "text-[#c9e5dc]" : "text-[#ffc0b2]"}`}>{c.passed ? "✓ PASS" : "× FAIL"} · {c.rule}</p><p className="mt-1 text-xs leading-5 text-slate-300">{c.detail}</p></div>)}
      {(!passed || run.status === "rejected_by_policy") && <p className="my-4 rounded-lg border border-[#b37972] bg-[#442c32] p-4 text-sm text-[#ffd5cd]">Publishing blocked. Edit and revalidate the proposal, or review the policy. Every check must pass.</p>}
      {editable && <><label className="mb-2 mt-5 block text-sm" htmlFor={`note-${run.id}`}>Decision note · {note.length}/500</label><textarea id={`note-${run.id}`} value={note} onChange={e => setNote(e.target.value)} maxLength={500} className="min-h-24 w-full rounded-lg border border-[#454254] bg-[#071f1c] p-3 text-sm" /><div className="mt-4 flex flex-wrap gap-3"><Button disabled={!passed || dirty || run.status === "rejected_by_policy"} onClick={() => onApprove(run.id, note)}>Approve & publish locally →</Button><Button onClick={() => onReject(run.id, note)} className="border border-[#555064] bg-[#292535]">Reject</Button></div><p className="mt-3 text-xs leading-5 text-slate-300">Approval publishes to the customer Bundle Studio in this session. It does not sell inventory, place an order, or execute an external API.</p></>}
      {run.status === "failed" && <div className="mt-5"><p className="mb-4 text-sm">Simulated provider failure. Retry will re-evaluate the same proposal.</p><Button onClick={() => onRetry(run.id)}>Retry evaluation</Button></div>}
      {run.status === "needs_input" && <p className="mt-5 text-sm">Needs input: submit a new Copilot request with “remote-work bundle” or “creator kit” to select a recorded template.</p>}
      {run.status === "executed" && <p role="status" className="mt-5 rounded-lg border border-[#67746d] bg-[#263a35] p-4 text-sm">Published locally. Open the customer store → Build a bundle to see this proposal. Already decided; duplicate approval is blocked.</p>}
      {run.status === "rejected" && <p className="mt-5 text-sm">Rejected by operator. No bundle was published. This decision is final for this run.</p>}
    </section>
  </div>
}
