import { useMemo, useState } from "react"
import type { MerchantProduct } from "../../types"
import { sendMessage } from "../../data/chatAdapter"
import { trackEvent } from "../../data/events"
import { money } from "../../data/demo"
import { Wordmark, Photo, Button } from "../shared/UI"

type Msg = { id:string; role:"assistant"|"user"; text?:string; productIds?:string[]; reasons?:Record<string,string>; noMatch?:boolean; comparisonIds?:string[] }
export default function AIChat({ products, cartCount, onAddToCart, onCompare, onView, onShop }: {
  products:MerchantProduct[]; cartCount:number; onAddToCart:(id:string)=>void; onCompare:(id:string)=>void; onView:(id:string)=>void; onShop:()=>void
}) {
  const [input,setInput]=useState("")
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState("")
  const [messages,setMessages]=useState<Msg[]>([{id:"welcome",role:"assistant",text:"Tell me what you're looking for, your budget, and what matters most. I'll match against the demo catalog and explain the trade-offs."}])
  const [project,setProject]=useState<string[]>([])
  const [compareIds,setCompareIds]=useState<string[]>([])
  const [dark,setDark]=useState(true)
  const byId=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products])
  const send=async (value=input)=>{
    if(!value.trim()||busy)return
    const text=value.trim(); setInput(""); setBusy(true);setError("")
    setMessages(m=>[...m,{id:`u${Date.now()}`,role:"user",text}])
    try{
      const response=await sendMessage({sessionId:"local-preview",message:text,context:{cartIds:[]}})
      const blocks=response.blocks
      const next:Msg[]=[]
      for(const b of blocks){
        if(b.type==="text")next.push({id:`a${Date.now()}-${next.length}`,role:"assistant",text:b.text})
        if(b.type==="product_cards")next.push({id:`p${Date.now()}`,role:"assistant",productIds:b.productIds,reasons:b.reasons})
        if(b.type==="comparison_table")next.push({id:`c${Date.now()}`,role:"assistant",comparisonIds:b.productIds})
        if(b.type==="no_match")next.push({id:`n${Date.now()}`,role:"assistant",text:b.text,productIds:b.alternativeIds,noMatch:true})
        if(b.type==="clarifying_question")next.push({id:`q${Date.now()}`,role:"assistant",text:b.question})
      }
      setMessages(m=>[...m,...next])
    }catch{setError("The local catalog adapter could not complete this request. Retry in a moment.")}
    finally{setBusy(false)}
  }
  const addProject=(id:string)=>setProject(p=>p.includes(id)?p.filter(x=>x!==id):[...p,id])
  return <div data-theme={dark?"dark":"light"} className="min-h-screen bg-[var(--rz-bg)] text-[var(--rz-text)]">
    <header className="sticky top-0 z-20 border-b border-[var(--rz-border)] bg-[var(--rz-surface)]/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
        <Wordmark/><div className="flex items-center gap-2"><span className="rounded-full bg-[var(--rz-orange)]/15 px-3 py-1 text-xs font-semibold text-[var(--rz-orange)]">AI Mode · Preview</span><span className="hidden rounded-full border border-[var(--rz-border)] px-3 py-1 text-xs sm:inline">Synthetic demo data</span><button onClick={onShop} className="min-h-10 px-3 text-sm">Shop</button><span className="rounded-full bg-[var(--rz-green)] px-3 py-2 text-sm text-white">Bag {cartCount}</span><button onClick={()=>setDark(d=>!d)} className="min-h-10 rounded-lg border border-[var(--rz-border)] px-3 text-xs">{dark?"Light":"Dark"}</button></div>
      </div>
    </header>
    <main className="mx-auto grid max-w-6xl gap-6 px-4 pb-36 pt-10 lg:grid-cols-[minmax(0,1fr)_260px]">
      <section>
        <div className="mb-8 text-center"><p className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[var(--rz-orange)]">REZLEE INTELLIGENCE</p><h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">Let’s find the right fit.</h1><p className="mt-3 text-sm text-[var(--rz-muted)]">A catalog-aware shopping companion. No guesses, no hidden compatibility claims.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">{["Headphones with ANC under $150","65 W USB-C charger","Build a portable work setup"].map(s=><button key={s} onClick={()=>send(s)} className="rounded-full border border-[var(--rz-border)] px-4 py-2 text-sm hover:border-[var(--rz-orange)]">{s}</button>)}</div>
        </div>
        <div aria-live="polite" className="space-y-5">
          {messages.map(m=><div key={m.id} className={`flex gap-3 ${m.role==="user"?"justify-end":""}`}>
            {m.role==="assistant"&&<div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--rz-orange)] font-bold text-white">R</div>}
            <div className={`max-w-3xl rounded-2xl p-4 ${m.role==="user"?"bg-[var(--rz-green)] text-white":"border border-[var(--rz-border)] bg-[var(--rz-surface)]"}`}>
              {m.role==="user"&&<p className="mb-1 text-xs opacity-70">You</p>}
              {m.text&&<p className="text-sm leading-6">{m.text}</p>}
              {m.comparisonIds&&<div className="mt-3 overflow-x-auto"><table className="w-full min-w-[420px] text-left text-xs"><thead><tr><th>Model</th><th>Brand</th><th>Price</th><th>Stock</th></tr></thead><tbody>{m.comparisonIds.map(id=>{const p=byId.get(id);return p?<tr key={id} className="border-t border-[var(--rz-border)]"><td className="py-2">{p.name}</td><td>{p.brand}</td><td>{money(p.priceCents)}</td><td>{p.stock}</td></tr>:null})}</tbody></table></div>}
              {m.text?.includes("What matters most")&&<div className="mt-3 flex flex-wrap gap-2">{["Lower price","Better specifications","Compare these options"].map(a=><button key={a} onClick={()=>send(a)} className="rounded-full border border-[var(--rz-border)] px-3 py-2 text-xs">{a}</button>)}</div>}
              {m.productIds&&<div className="mt-3 grid gap-3 sm:grid-cols-2">{m.productIds.map(id=>{const p=byId.get(id);if(!p)return null;return <article key={id} className="overflow-hidden rounded-xl border border-[var(--rz-border)] bg-[var(--rz-bg)]">
                <Photo src={p.imageUrl} alt={`${p.brand} ${p.name}`} className="h-36 w-full"/>
                <div className="p-3"><div className="flex justify-between gap-2 text-xs"><b>{p.brand}</b><span className="font-semibold">{money(p.priceCents)}</span></div><h3 className="mt-1 font-semibold">{p.name}</h3><p className="mt-1 text-xs text-[var(--rz-muted)]">{p.stock>5?"In stock":p.stock>0?`Low stock · ${p.stock} left`:"Out of stock"}</p><p className="mt-2 text-xs">{p.compatibility[project[0]??""]==="confirmed"?"Compatibility confirmed":"Compatibility unknown unless explicitly recorded"}</p><p className="mt-2 text-xs text-[var(--rz-muted)]">{m.reasons?.[id]??"Catalog alternative; review specifications."}</p>
                <details className="mt-3 text-xs"><summary className="cursor-pointer font-semibold">What could make this the wrong pick?</summary><p className="mt-2 text-[var(--rz-muted)]">{p.limitation} Compatibility may be unknown for your setup.</p></details>
                <div className="mt-3 flex flex-wrap gap-2"><button disabled={!p.stock} onClick={()=>{onAddToCart(id);trackEvent({type:"add_to_cart",productId:id})}} className="rounded-lg bg-[var(--rz-orange)] px-3 py-2 text-xs font-semibold text-white disabled:opacity-40">Add to cart</button><button onClick={()=>setCompareIds(ids=>ids.includes(id)?ids.filter(x=>x!==id):ids.length<3&&(!ids.length||byId.get(ids[0])?.kind===p.kind)?[...ids,id]:ids)} className="rounded-lg border border-[var(--rz-border)] px-3 py-2 text-xs">Compare</button><button onClick={()=>{onView(id);trackEvent({type:"view_product",productId:id})}} className="rounded-lg border border-[var(--rz-border)] px-3 py-2 text-xs">View</button><button onClick={()=>addProject(id)} className="rounded-lg border border-[var(--rz-border)] px-3 py-2 text-xs">{project.includes(id)?"In project":"Add to project"}</button></div>
                <button onClick={()=>alert("Preview only · notification service is not connected.")} className="mt-2 text-xs text-[var(--rz-orange)]">Notify me when back / price drops · Preview</button>
              </div></article>})}</div>}
            </div>
            {m.role==="user"&&<div className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--rz-border)] text-xs">You</div>}
          </div>)}
          {busy&&<div className="ml-12 rounded-xl border border-[var(--rz-border)] p-4 text-sm text-[var(--rz-muted)]">Checking catalog…</div>}
          {error&&<div role="alert" className="ml-12 rounded-xl border border-red-500/40 p-4 text-sm">{error}<button onClick={()=>send("Show me suitable in-stock products")} className="ml-3 underline">Retry</button></div>}
        </div>
      </section>
      <aside className="h-fit rounded-2xl border border-[var(--rz-border)] bg-[var(--rz-surface)] p-4 lg:sticky lg:top-24">{compareIds.length>0&&<div className="mb-5"><h2 className="font-semibold">Compare · Preview</h2>{compareIds.map(id=>{const p=byId.get(id)!;return <p key={id} className="mt-2 text-xs">{p.name} · {money(p.priceCents)} <button onClick={()=>setCompareIds(ids=>ids.filter(x=>x!==id))}>×</button></p>})}</div>}<h2 className="font-semibold">Shopping Project</h2><p className="mt-1 text-xs text-[var(--rz-muted)]">Preview · persistent in this session only</p>{project.length===0?<p className="mt-4 text-sm text-[var(--rz-muted)]">Add recommendations to plan a setup.</p>:<><div className="mt-4 space-y-3">{project.map(id=>{const p=byId.get(id)!;return <div key={id} className="flex items-center justify-between gap-2 text-sm"><span>{p.name}<small className="block text-[var(--rz-muted)]">{money(p.priceCents)}</small></span><button onClick={()=>addProject(id)} aria-label={`Remove ${p.name}`}>×</button></div>})}</div><div className="mt-4 border-t border-[var(--rz-border)] pt-3 text-sm font-semibold">Total {money(project.reduce((s,id)=>s+(byId.get(id)?.priceCents??0),0))}</div><p className="mt-2 text-xs text-[var(--rz-muted)]">Compatibility is not inferred between project items.</p></>}</aside>
    </main>
    <form onSubmit={e=>{e.preventDefault();send()}} className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--rz-border)] bg-[var(--rz-surface)]/95 px-4 pb-3 pt-3 backdrop-blur"><div className="mx-auto flex max-w-3xl gap-2"><input value={input} onChange={e=>setInput(e.target.value)} placeholder="Tell me what you're looking for…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-[var(--rz-border)] bg-[var(--rz-bg)] px-4 text-sm outline-none focus:ring-2 focus:ring-[var(--rz-orange)]"/><Button type="submit" disabled={!input.trim()||busy}>Send</Button></div><p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-[var(--rz-muted)]">Catalog demo · deterministic matching · no live AI provider or checkout is connected</p></form>
  </div>
}
