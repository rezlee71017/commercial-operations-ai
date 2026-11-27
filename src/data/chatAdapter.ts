import type { ChatRequest, ChatResponse, MerchantProduct } from "../types"
import { products } from "./demo"
import { trackEvent } from "./events"

let previousRequest = ""
const money = (n:number) => `$${(n/100).toFixed(2)}`
export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  trackEvent({ type:"ask", query:request.message })
  const isFollowUp = /cheaper|with |under \\$|compare|more battery|better specs/i.test(request.message)
  const effectiveMessage = isFollowUp && previousRequest ? `${previousRequest} ${request.message}` : request.message
  previousRequest = effectiveMessage
  const q = effectiveMessage.toLowerCase()
  const budgetMatch = q.match(/(?:under|below|max(?:imum)?|budget(?: of)?|less than)\s*\$?\s*(\d+(?:\.\d+)?)/)
  const budget = budgetMatch ? Math.round(Number(budgetMatch[1]) * 100) : undefined
  const brands = [...new Set(products.map(p=>p.brand.toLowerCase()))]
  const brand = brands.find(b=>q.includes(b))
  const kindWords = ["headphones","earbuds","chargers","power banks","keyboards","mice","microphones","cameras","smart cameras","routers","lights"]
  const kind = kindWords.find(k=>q.includes(k))
  const category = products.find(p=>q.includes(p.category.toLowerCase()))?.category
  const specTerms = ["anc","65 w","100 w","4k","2k","5g","wireless","bluetooth","usb-c","wifi 6"]
  const specs = specTerms.filter(t=>q.includes(t))
  const followup = /cheaper|lower price|less expensive/.test(q)
  let candidates = [...products] as MerchantProduct[]
  if (budget !== undefined) candidates = candidates.filter(p=>p.priceCents<=budget)
  if (brand) candidates = candidates.filter(p=>p.brand.toLowerCase()===brand)
  if (kind) candidates = candidates.filter(p=>p.kind.toLowerCase()===kind)
  if (category) candidates = candidates.filter(p=>p.category===category)
  for (const term of specs) candidates = candidates.filter(p=>`${Object.values(p.specs).join(" ")} ${p.name}`.toLowerCase().includes(term))
  if (followup) {
    const previous = request.context?.productId
    if (previous) { const prev=products.find(p=>p.id===previous); if(prev) candidates=candidates.filter(p=>p.kind===prev.kind) }
    candidates.sort((a,b)=>a.priceCents-b.priceCents)
  } else candidates.sort((a,b)=>(b.stock>0?1:0)-(a.stock>0?1:0) || a.priceCents-b.priceCents)
  const available = candidates.filter(p=>p.stock>0).slice(0,4)
  const messageId = `msg-${Date.now()}`
  if (!available.length) {
    trackEvent({type:"no_match",query:request.message})
    return { messageId, blocks:[{type:"no_match",text:"I couldn't find an in-stock product that satisfies every recorded constraint. Here are nearby catalog alternatives; their compatibility is not assumed.",alternativeIds:candidates.slice(0,3).map(p=>p.id)}],usedProductIds:candidates.slice(0,3).map(p=>p.id),needsInput:true }
  }
  const reasons = Object.fromEntries(available.map(p=>[p.id,[
    budget!==undefined && p.priceCents<=budget ? `Within your ${money(budget)} budget` : null,
    brand && p.brand.toLowerCase()===brand ? `Brand: ${p.brand}` : null,
    kind && p.kind.toLowerCase()===kind ? `Product type: ${p.kind}` : null,
    ...specs.filter(t=>Object.values(p.specs).join(" ").toLowerCase().includes(t)).map(t=>`Includes ${t.toUpperCase()}`)
  ].filter(Boolean).join(" · ") || "Relevant catalog match; check the listed specifications and limitations."]))
  if (/compare/i.test(q) && available.length > 1) {
    const sameType = available.filter(p => p.kind === available[0].kind).slice(0,3)
    if (sameType.length > 1) return { messageId, blocks:[
      {type:"text",text:"Here is a same-type comparison using the recorded catalog fields."},
      {type:"comparison_table",productIds:sameType.map(p=>p.id)}
    ],usedProductIds:sameType.map(p=>p.id) }
  }
  return { messageId, blocks:[
    {type:"text",text:`I found ${available.length} in-stock option(s)${budget!==undefined?` within ${money(budget)}`:""} using the catalog data. Compatibility is only confirmed where the catalog explicitly records it.`},
    {type:"product_cards",productIds:available.map(p=>p.id),reasons},
    ...(available.length>1?[{type:"clarifying_question" as const,question:"What matters most in the next step?",answers:["Lower price","Better specifications","Compare these options"]}]:[])
  ],usedProductIds:available.map(p=>p.id) }
}
