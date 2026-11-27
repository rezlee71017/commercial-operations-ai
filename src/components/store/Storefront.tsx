import { useRef, useState } from "react"
import type { Proposal, PublicProduct } from "../../types"
import { heroImage, money, categories, prompts, simulateAssistant } from "../../data/demo"
import { Badge, Button, Photo, Wordmark } from "../shared/UI"
import Icon from "../shared/Icon"
import BundleSection from "../bundle/BundleSection"
import { CompareView, ProductDetail } from "./ShoppingTools"
import { trackEvent } from "../../data/events"

type Props = {
  products: PublicProduct[]
  bundles: Proposal[]
  cartCount: number
  onAddToCart: (id: string) => void
  onAddBundle: (proposal: Proposal) => void
  onOpenCart: () => void
  onSignIn: () => void
  onOpenAI: () => void
  darkTheme: boolean
  onToggleTheme: () => void
}
export function ProductCard({ product: p, onAddToCart, onCompare, onOpen, selected = false, reason }: {
  product: PublicProduct
  onAddToCart: (id: string) => void
  onCompare: (id: string) => void
  onOpen: (p: PublicProduct) => void
  selected?: boolean
  reason?: boolean
}) {
  return <article className={`group min-w-0 rounded-2xl border bg-white p-3 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/50 motion-reduce:transform-none motion-reduce:transition-none ${selected ? "border-orange-500 ring-1 ring-orange-500" : "border-[#d8e0da]"}`}>
    <div className="relative overflow-hidden rounded-xl bg-[#eef1eb]">
      <button className="block w-full focus-visible:ring-2 focus-visible:ring-orange-600" onClick={() => { trackEvent({type:"view_product",productId:p.id}); onOpen(p) }} aria-label={`View ${p.name}`}><Photo src={p.imageUrl} alt={`${p.name} · representative ${p.kind.toLowerCase()} photography`} className="aspect-[1.23] w-full" /></button>
      <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-xs font-semibold text-slate-700">{p.brand}</span>
      <button aria-label={`Add ${p.name} to bag`} disabled={!p.stock} onClick={() => { trackEvent({type:"add_to_cart",productId:p.id}); onAddToCart(p.id) }} className="absolute bottom-3 right-3 grid min-h-11 min-w-11 place-items-center rounded-full bg-white text-[#023530] shadow-sm focus-visible:ring-2 disabled:bg-slate-200"><Icon name="plus" /></button>
    </div>
    <div className="px-1 pt-3">
      <p className="text-xs text-slate-600">{p.kind}</p>
      <div className="flex items-start justify-between gap-2"><button onClick={() => onOpen(p)} className="min-h-11 text-left text-base font-semibold tracking-tight">{p.name}</button><strong className="pt-3 text-sm">{money(p.priceCents)}</strong></div>
      <p className="min-h-10 text-sm leading-5 text-slate-600">{Object.values(p.specs).slice(0, 2).join(" · ")}</p>
      {reason && <div className="my-3 rounded-lg bg-[#e8eee8] p-3 text-sm text-[#023530]"><span className="font-semibold">Why it fits</span><p className="mt-1">{p.strengths[0]}</p></div>}
      <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-1 text-xs"><span className={p.stock ? "text-emerald-800" : "text-slate-600"}>{p.stock ? "● In stock" : "Out of stock"}</span><button aria-pressed={selected} onClick={() => onCompare(p.id)} className={`flex min-h-11 items-center gap-2 text-xs ${selected ? "text-orange-800" : "text-slate-600"}`}><Icon name="compare" size={15} />{selected ? "Selected" : "Compare"}</button></div>
    </div>
  </article>
}
export default function Storefront({ products, bundles, cartCount, onAddToCart, onAddBundle, onOpenCart, onSignIn, onOpenAI, darkTheme, onToggleTheme }: Props) {
  const [view, setView] = useState("Discover")
  const [category, setCategory] = useState("All")
  const [query, setQuery] = useState("")
  const [brand, setBrand] = useState("All")
  const [maxPrice, setMaxPrice] = useState(250)
  const [stockOnly, setStockOnly] = useState(false)
  const [detail, setDetail] = useState<PublicProduct | null>(null)
  const [selected, setSelected] = useState<string[]>([])
  const [compareOpen, setCompareOpen] = useState(false)
  const [request, setRequest] = useState("")
  const [lastRequest, setLastRequest] = useState("")
  const [failure, setFailure] = useState(false)
  const [result, setResult] = useState<ReturnType<typeof simulateAssistant> | null>(null)
  const [error, setError] = useState(false)
  const [selectionNote, setSelectionNote] = useState("")
  const resultsRef = useRef<HTMLDivElement>(null)
  const compare = (id: string) => {
    const p = products.find(p => p.id === id)!
    if (selected.includes(id)) { setSelected(s => s.filter(i => i !== id)); return }
    if (selected.length && products.find(p => p.id === selected[0])?.kind !== p.kind) { setSelectionNote("Compare products of the same type. Clear your selection to compare another type."); return }
    if (selected.length === 4) { setSelectionNote("You can compare up to four products at a time."); return }
    setSelectionNote(""); setSelected(s => [...s, id])
  }
  const ask = (text: string, retry = false) => {
    if (!text.trim()) return
    const combined = /^(under|below|budget|cheaper|\$|with |what |does |is )/i.test(text) && lastRequest ? `${lastRequest}. ${text}` : text
    setView("Discover"); setLastRequest(combined); setRequest(""); setError(failure && !retry)
    setResult(failure && !retry ? null : simulateAssistant(combined, products))
    window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "instant", block: "start" }), 50)
  }
  const filtered = products.filter(p => (category === "All" || p.category === category) && (brand === "All" || p.brand === brand) && `${p.name} ${p.brand} ${p.kind} ${p.category}`.toLowerCase().includes(query.toLowerCase()) && p.priceCents <= maxPrice * 100 && (!stockOnly || p.stock > 0))
  const card = (p: PublicProduct, reason = false) => <ProductCard key={p.id} product={p} selected={selected.includes(p.id)} onAddToCart={onAddToCart} onCompare={compare} onOpen={setDetail} reason={reason} />
  const navigate = (v: string) => { setView(v); window.scrollTo({ top: 0, behavior: "instant" }) }
  const browse = (c: string) => { setCategory(c); setView("Explore"); window.scrollTo({ top: 0 }) }
  return <>
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#d8e0da] bg-[#e8eee8] px-5 py-2 text-xs text-[#31534b] md:px-12"><span>One connected platform. Smarter decisions on both sides.</span><button onClick={onSignIn} className="min-h-6 font-medium">Meet REZLEE for business ↗</button></div>
    <header className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-5 md:px-12">
      <button onClick={() => navigate("Discover")} aria-label="REZLEE home" className="min-h-11"><Wordmark /></button>
      <nav aria-label="Store" className="order-3 flex w-full gap-6 overflow-x-auto md:order-none md:w-auto">{["Discover", "Explore", "Build a bundle"].map(v => <button key={v} onClick={() => navigate(v)} className={`min-h-11 shrink-0 text-sm ${view === v ? "font-semibold text-orange-800" : "text-slate-600"}`}>{v === "Discover" && <span className="mr-1">✧</span>}{v}</button>)}</nav>
      <div className="flex items-center gap-3"><button aria-label="Merchant workspace" onClick={onSignIn} className="hidden min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm lg:flex"><Icon name="grid" size={16} />Workspace ↗</button><button onClick={onOpenCart} aria-label={`Shopping bag, ${cartCount} items`} className="flex min-h-11 items-center gap-2 rounded-lg px-2"><Icon name="bag" /><span className="text-sm">{cartCount}</span></button></div>
    </header>
    <div className="border-y border-[#d8e0da] bg-white"><div className="mx-auto flex max-w-[1500px] items-center gap-7 overflow-x-auto px-5 md:px-12">{categories.map((c, i) => <button key={c} onClick={() => browse(c)} className="min-h-12 shrink-0 text-xs text-slate-600">{["◉", "↯", "⌘", "⌂", "↗", "◎", "▣"][i]} <span className="ml-1">{c}</span></button>)}</div></div>
    {view === "Discover" && <>
      <main className="mx-auto max-w-[1440px] px-5 pt-8 md:px-12 md:pt-10">
        <section className="grid gap-5 lg:grid-cols-[1.18fr_1fr]">
          <div className="relative overflow-hidden rounded-[24px] border border-[#d8e0da] bg-[#e8eee8] p-6 md:p-10">
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-[.13em] text-[#31534b]"><span className="h-2 w-2 rounded-full bg-[#6c54d4]" />Your needs. Connected to the right tech.</div>
            <h1 className="mb-5 mt-7 font-display text-[45px] font-medium leading-[1.07] tracking-[-.06em] md:text-[66px]">Less searching.<br />More <span className="text-[#e85706]">knowing.</span></h1>
            <p className="max-w-md text-base leading-7 text-[#52665f]">Meet your next upgrade with clarity. Discover, compare, and connect the tech that actually fits your life.</p>
            <form onSubmit={e => { e.preventDefault(); ask(request) }} className="mt-8 rounded-2xl border border-[#b9cbc0] bg-white p-3 shadow-xl shadow-[#bbb1e0]/15">
              <label htmlFor="shopping-request" className="flex items-center gap-2 px-2 text-xs font-medium text-[#31534b]"><Icon name="spark" size={16} /> REZLEE ADVISOR</label>
              <textarea id="shopping-request" aria-label="Shopping requirements" value={request} onChange={e => setRequest(e.target.value)} placeholder="Tell us what you need, not just a product name…" className="mt-2 min-h-16 w-full resize-none bg-transparent px-2 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500" />
              <div className="flex flex-wrap items-center justify-between gap-2"><span className="px-2 text-xs text-slate-600">Your budget. Your priorities. Clear answers.</span><Button disabled={!request.trim()} className="min-w-11 px-3" aria-label="Find my match"><Icon name="arrow" size={18} /></Button></div>
            </form>
            <div className="mt-4 flex flex-wrap gap-2">{prompts.map((p, i) => <button key={p} onClick={() => ask(p)} className="min-h-11 rounded-lg border border-[#c7d6cd] px-3 text-xs text-[#31534b]">{["◉", "⌘", "▣"][i]} {p} ↗</button>)}</div>
          </div>
          <div className="relative isolate min-h-[410px] overflow-hidden rounded-[24px] bg-[#20252a] text-white">
            <Photo src={heroImage} alt="Over-ear headphones, representative of the REZLEE audio collection" className="absolute inset-0 -z-20 h-full w-full" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#121827] via-[#121827]/10 to-transparent" />
            <div className="absolute left-6 right-6 top-6 flex justify-between"><span className="rounded-full border border-white/40 bg-black/40 px-3 py-2 text-xs backdrop-blur-md">THE FOCUS EDIT</span><span className="grid h-10 w-10 place-items-center rounded-full bg-white/90 text-black"><Icon name="spark" size={20} /></span></div>
            <div className="absolute bottom-7 left-7 right-7"><p className="mb-2 text-xs tracking-[.18em]">TUNE IN. TUNE EVERYTHING ELSE OUT.</p><h2 className="font-display text-4xl leading-tight tracking-tight">Find your focus.<br />Keep your world.</h2><div className="mt-5 flex items-center justify-between gap-3"><span className="text-sm text-white">Headphones chosen around your priorities.</span><button onClick={() => browse(categories[0])} aria-label="Explore audio" className="grid min-h-11 min-w-11 place-items-center rounded-full bg-white text-black"><Icon name="arrow" /></button></div></div>
          </div>
        </section>
        <div className="my-7 grid grid-cols-2 gap-4 border-b border-slate-200 pb-7 md:grid-cols-4">{[
          ["compare", "Compare what matters", "Real differences. Clear trade-offs."],
          ["shield", "Check before you connect", "Compatibility, not assumptions."],
          ["inventory", "Better together", "Build a setup, not just a basket."],
          ["spark", "Intelligence with evidence", "Demo specs. Transparent reasoning."],
        ].map(([icon, title, text]) => <div key={title} className="flex gap-3"><span className="mt-1 text-[#e85706]"><Icon name={icon as "compare"} size={21} /></span><div><h3 className="text-sm font-semibold">{title}</h3><p className="mt-1 text-xs leading-5 text-slate-600">{text}</p></div></div>)}</div>
        <div ref={resultsRef} className="scroll-mt-6">
          {(result || error) && <section className="mb-10 rounded-2xl border border-[#d9d1ef] bg-[#f0edf9] p-5 md:p-7">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs uppercase tracking-wider text-orange-800">Decision workspace · Simulated advisor</p><h2 className="mt-2 text-2xl font-medium tracking-tight">{lastRequest}</h2></div><button className="min-h-11 text-sm underline" onClick={() => { setResult(null); setError(false); setLastRequest("") }}>Start fresh</button></div>
            {error ? <div role="alert"><p className="mb-4">The simulated provider failed. Nothing was lost.</p><Button onClick={() => ask(lastRequest, true)}>Retry request</Button></div> : result?.clarification ? <><p>What kind of technology are you looking for?</p><div className="mt-4 flex flex-wrap gap-2">{prompts.map(p => <Button key={p} onClick={() => ask(p)}>{p}</Button>)}</div></> : result && <>
              <div className="mb-5 flex flex-wrap gap-3 text-sm text-[#514675]"><span className="rounded-full bg-white px-3 py-2">✓ Availability checked</span><span className="rounded-full bg-white px-3 py-2">{result.budget ? `Budget ≤ ${money(result.budget)}` : "No budget specified"}</span><span className="rounded-full bg-white px-3 py-2">{result.kind || result.category || "All technology"}</span></div>
              {!result.results.length && <p className="mb-4">No exact match. These in-stock alternatives may exceed your budget.</p>}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">{(result.results.length ? result.results : result.alternatives).map(p => card(p, true))}</div>
              <p className="mt-5 text-sm leading-6 text-slate-600">Recommendations use price, stock, product type, and declared demo specifications—not reviews or inferred performance. {result.results[0] ? `Trade-off for ${result.results[0].name}: ${result.results[0].limitation}.` : "Try increasing your budget."}</p>
              <form onSubmit={e => { e.preventDefault(); ask(request) }} className="mt-4 flex gap-2"><input aria-label="Refine recommendations" value={request} onChange={e => setRequest(e.target.value)} placeholder="Refine: under $100, with ANC…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-orange-200 bg-white px-4 text-sm" /><Button disabled={!request.trim()}>Refine →</Button></form>
            </>}
            <label className="mt-4 flex min-h-11 items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={failure} onChange={e => setFailure(e.target.checked)} />Simulate next provider failure</label>
          </section>}
        </div>
        <section className="pb-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-medium uppercase tracking-[.17em] text-[#6e58b5]">Explore with intention</p><h2 className="font-display text-3xl font-medium tracking-tight">Your world. Better connected.</h2></div><button onClick={() => navigate("Explore")} className="flex min-h-11 items-center gap-2 text-sm">Explore all categories <Icon name="arrow" size={17} /></button></div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">{categories.map((c, i) => {
            const p = products.find(p => p.category === c)!
            return <button key={c} onClick={() => browse(c)} className="group overflow-hidden rounded-xl border border-slate-200 bg-white p-2 text-left transition hover:border-orange-400"><Photo src={p.imageUrl} alt={c} className="aspect-[1.5] w-full rounded-lg" /><p className="flex min-h-14 items-center justify-between gap-1 px-1 text-xs font-medium">{c}<span className="text-slate-600">↗</span></p><span className="sr-only">Browse category {i + 1}</span></button>
          })}</div>
        </section>
        <section className="pb-12"><div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs uppercase tracking-[.17em] text-[#6e58b5]">A more informed shortlist</p><h2 className="font-display text-3xl font-medium tracking-tight">Designed for your next decision.</h2></div><button onClick={() => browse(categories[0])} className="min-h-11 text-sm">See audio collection ↗</button></div><div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{products.slice(0, 4).map(p => card(p))}</div></section>
      </main>
      <BundleSection products={products} proposal={bundles[0]} onAddToCart={onAddBundle} />
    </>}
    {view === "Explore" && <main className="mx-auto max-w-[1440px] px-5 py-10 md:px-12">
      <p className="text-xs uppercase tracking-widest text-orange-800">The connected catalog</p><h1 className="mb-3 mt-3 font-display text-4xl tracking-tight">{category === "All" ? "Good decisions start here." : category}</h1><p className="mb-8 text-sm text-slate-600">Fictional brands and specifications. Product photography is representative, not an exact SKU image.</p>
      <div className="mb-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-3 lg:grid-cols-5">
        <input aria-label="Search products" placeholder="Search products or brands" value={query} onChange={e => setQuery(e.target.value)} className="min-h-11 min-w-0 rounded-lg border border-slate-200 px-3 text-sm" />
        <select aria-label="Category" value={category} onChange={e => setCategory(e.target.value)} className="min-h-11 min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm">{["All", ...categories].map(c => <option key={c}>{c}</option>)}</select>
        <select aria-label="Brand" value={brand} onChange={e => setBrand(e.target.value)} className="min-h-11 rounded-lg border border-slate-200 bg-white px-3 text-sm">{["All", ...Array.from(new Set(products.map(p => p.brand)))].map(c => <option key={c} value={c}>{c === "All" ? "All brands" : c}</option>)}</select>
        <label className="text-xs text-slate-600">Up to {money(maxPrice * 100)}<input aria-label="Maximum price" type="range" min="15" max="250" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} className="mt-2 block w-full accent-orange-600" /></label>
        <label className="flex min-h-11 items-center gap-2 text-sm"><input type="checkbox" checked={stockOnly} onChange={e => setStockOnly(e.target.checked)} />In stock only</label>
      </div>
      <div className="mb-5 flex justify-between text-sm text-slate-600"><span>{filtered.length} products · Same-type comparison enabled</span><button onClick={() => { setQuery(""); setCategory("All"); setBrand("All"); setMaxPrice(250); setStockOnly(false) }} className="min-h-11 underline">Reset</button></div>
      {filtered.length ? <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">{filtered.map(p => card(p))}</div> : <div className="rounded-2xl border border-dashed border-slate-300 p-12 text-center"><h2 className="text-2xl">No products fit these filters.</h2><p className="mt-3 text-slate-600">Reset your filters to explore the full demo catalog.</p></div>}
    </main>}
    {view === "Build a bundle" && <main className="py-10">{bundles.map(p => <BundleSection key={p.id} products={products} proposal={p} onAddToCart={onAddBundle} />)}</main>}
    <footer className="mt-10 border-t border-slate-200 bg-white px-5 py-9 md:px-12"><div className="mx-auto flex max-w-[1344px] flex-wrap items-center justify-between gap-6"><div><Wordmark /><p className="mt-3 text-sm text-slate-600">Smarter Commerce.</p></div><Badge /><button onClick={onSignIn} className="min-h-11 text-sm underline">Open merchant workspace ↗</button></div><p className="mx-auto mt-7 max-w-[1344px] text-xs leading-5 text-slate-600">REZLEE prototype · Fictional brands, specs, prices, and inventory. Representative editorial imagery. No verified ratings, live AI, payments, or backend connection. Changes reset on reload.</p></footer>
    {(selected.length > 0 || selectionNote) && <div role="status" className="fixed bottom-4 left-1/2 z-30 w-[calc(100%-24px)] max-w-xl -translate-x-1/2 rounded-2xl border border-white/20 bg-[#222135] p-3 text-white shadow-2xl">{selectionNote && <p className="px-2 pb-2 text-sm">{selectionNote}</p>}<div className="flex flex-wrap items-center justify-between gap-2"><span className="px-2 text-sm">{selected.length}/4 selected · {products.find(p => p.id === selected[0])?.kind || "None"}</span><button className="min-h-11 px-2 text-sm underline" onClick={() => { setSelected([]); setSelectionNote("") }}>Clear</button><Button disabled={selected.length < 2} onClick={() => setCompareOpen(true)}>Compare →</Button></div></div>}
    {compareOpen && <CompareView products={products.filter(p => selected.includes(p.id))} onClose={() => setCompareOpen(false)} onAddToCart={id => { setCompareOpen(false); onAddToCart(id) }} />}
    {detail && <ProductDetail product={detail} products={products} onClose={() => setDetail(null)} onAddToCart={id => { setDetail(null); onAddToCart(id) }} onOpen={setDetail} />}
  </>
}
