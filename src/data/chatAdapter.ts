/**
 * Catalog-aware shopping assistant adapter.
 *
 * Current mode: deterministic local matching against the synthetic catalog.
 * Future mode: set VITE_AI_ENDPOINT (or NEXT_PUBLIC_AI_ENDPOINT) to a real
 * chat/completions endpoint that returns the same ChatResponse shape.
 * The UI never trusts model output for stock, price, or margin — those always
 * come from the catalog objects returned by this layer.
 */

import type { ChatRequest, ChatResponse, MerchantProduct } from "../types"
import { products } from "./demo"
import { trackEvent } from "./events"

let previousRequest = ""
const money = (n: number) => `$${(n / 100).toFixed(n % 100 ? 2 : 0)}`

const AI_ENDPOINT =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_AI_ENDPOINT) ||
  (typeof process !== "undefined" && (process as any).env?.NEXT_PUBLIC_AI_ENDPOINT) ||
  ""

async function callRealAI(request: ChatRequest): Promise<ChatResponse | null> {
  if (!AI_ENDPOINT) return null
  try {
    const res = await fetch(AI_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...request,
        catalogSnapshot: products.map(p => ({
          id: p.id,
          name: p.name,
          brand: p.brand,
          category: p.category,
          kind: p.kind,
          priceCents: p.priceCents,
          stock: p.stock,
          specs: p.specs,
          strengths: p.strengths,
          limitation: p.limitation,
          compatibleWith: p.compatibleWith,
        })),
      }),
    })
    if (!res.ok) return null
    return (await res.json()) as ChatResponse
  } catch {
    return null
  }
}

function deterministicMatch(request: ChatRequest): ChatResponse {
  trackEvent({ type: "ask", query: request.message })
  const isFollowUp = /cheaper|with |under \$|compare|more battery|better specs|another|else/i.test(request.message)
  const effectiveMessage = isFollowUp && previousRequest ? `${previousRequest} ${request.message}` : request.message
  previousRequest = effectiveMessage
  const q = effectiveMessage.toLowerCase()

  const budgetMatch = q.match(/(?:under|below|max(?:imum)?|budget(?: of)?|less than|to)\s*\$?\s*(\d+(?:\.\d+)?)/)
  const budget = budgetMatch ? Math.round(Number(budgetMatch[1]) * 100) : undefined

  const brands = [...new Set(products.map(p => p.brand.toLowerCase()))]
  const brand = brands.find(b => q.includes(b))

  const kindMap: Record<string, string[]> = {
    headphones: ["headphones"],
    earbuds: ["earbuds", "buds"],
    chargers: ["charger", "chargers", "gan"],
    "power banks": ["power bank", "powerbank", "battery pack"],
    keyboards: ["keyboard", "keyboards"],
    mice: ["mouse", "mice", "trackball"],
    microphones: ["mic", "microphone", "microphones"],
    cameras: ["camera", "cameras", "webcam"],
    "smart cameras": ["security cam", "doorbell", "indoor cam", "outdoor cam"],
    routers: ["router", "mesh", "wifi"],
    lighting: ["light", "softbox", "ring light", "led"],
    laptops: ["laptop", "laptops", "notebook"],
    speakers: ["speaker", "speakers", "soundbar"],
    "fitness bands": ["band", "fitness", "tracker"],
    smartwatches: ["watch", "smartwatch"],
  }
  let kind = ""
  for (const [k, words] of Object.entries(kindMap)) {
    if (words.some(w => q.includes(w))) {
      kind = k
      break
    }
  }

  const categoryHint = products.find(p => q.includes(p.category.toLowerCase().split(" ")[0]))?.category
  const wantsPortableWork = /portable work|work setup|remote.?work|desk setup|workspace/i.test(q)
  const wantsCompare = /compare/i.test(q)

  let candidates = [...products] as MerchantProduct[]
  if (budget !== undefined) candidates = candidates.filter(p => p.priceCents <= budget)
  if (brand) candidates = candidates.filter(p => p.brand.toLowerCase() === brand)
  if (kind) candidates = candidates.filter(p => p.kind.toLowerCase().includes(kind) || kind.includes(p.kind.toLowerCase()))
  if (categoryHint && !kind) candidates = candidates.filter(p => p.category === categoryHint)

  if (wantsPortableWork) {
    const preferred = ["Laptops", "Keyboards", "Mice", "Docks and hubs", "Laptop sleeves", "Stands", "Power banks", "Chargers"]
    candidates = candidates.filter(p => preferred.some(k => p.kind.includes(k) || k.includes(p.kind)) || p.category === "Computing & Workspace" || p.category === "Travel & Portable Tech")
  }

  const specTerms = ["anc", "65 w", "100 w", "4k", "2k", "5g", "wireless", "bluetooth", "usb-c", "wifi 6", "gan", "ipx"]
  const specs = specTerms.filter(t => q.includes(t))
  for (const term of specs) {
    candidates = candidates.filter(p => `${Object.values(p.specs).join(" ")} ${p.name}`.toLowerCase().includes(term))
  }

  if (/cheaper|lower price|less expensive/.test(q)) {
    candidates.sort((a, b) => a.priceCents - b.priceCents)
  } else {
    candidates.sort((a, b) => (b.stock > 0 ? 1 : 0) - (a.stock > 0 ? 1 : 0) || a.priceCents - b.priceCents)
  }

  const available = candidates.filter(p => p.stock > 0).slice(0, 4)
  const messageId = `msg-${Date.now()}`

  if (!available.length) {
    trackEvent({ type: "no_match", query: request.message })
    const alts = candidates.slice(0, 3).map(p => p.id)
    return {
      messageId,
      blocks: [
        {
          type: "no_match",
          text: "I couldn't find an in-stock product that satisfies every recorded constraint. Here are nearby catalog alternatives; their compatibility is not assumed.",
          alternativeIds: alts,
        },
      ],
      usedProductIds: alts,
      needsInput: true,
    }
  }

  const reasons = Object.fromEntries(
    available.map(p => [
      p.id,
      [
        budget !== undefined && p.priceCents <= budget ? `Within your ${money(budget)} budget` : null,
        brand && p.brand.toLowerCase() === brand ? `Brand: ${p.brand}` : null,
        kind && (p.kind.toLowerCase().includes(kind) || kind.includes(p.kind.toLowerCase())) ? `Product type: ${p.kind}` : null,
        p.stock <= 5 ? `Only ${p.stock} left in demo stock` : null,
        ...specs.filter(t => Object.values(p.specs).join(" ").toLowerCase().includes(t)).map(t => `Includes ${t.toUpperCase()}`),
      ]
        .filter(Boolean)
        .join(" · ") || "Relevant catalog match; check the listed specifications and limitations.",
    ]),
  )

  if (wantsCompare && available.length > 1) {
    const sameType = available.filter(p => p.kind === available[0].kind).slice(0, 3)
    if (sameType.length > 1) {
      return {
        messageId,
        blocks: [
          { type: "text", text: "Here is a same-type comparison using only the recorded catalog fields." },
          { type: "comparison_table", productIds: sameType.map(p => p.id) },
        ],
        usedProductIds: sameType.map(p => p.id),
      }
    }
  }

  const intro =
    wantsPortableWork
      ? `I found ${available.length} in-stock catalog options that fit a portable work setup${budget !== undefined ? ` and the stated budget` : ""}. These are catalog-grounded suggestions, not live AI research. I'll only mark compatibility as confirmed when the catalog explicitly records it.`
      : `I found ${available.length} in-stock option(s)${budget !== undefined ? ` within ${money(budget)}` : ""} using the catalog data. Compatibility is only confirmed where the catalog explicitly records it.`

  return {
    messageId,
    blocks: [
      { type: "text", text: intro },
      { type: "product_cards", productIds: available.map(p => p.id), reasons },
      ...(available.length > 1
        ? [{ type: "clarifying_question" as const, question: "What matters most in the next step?", answers: ["Lower price", "Better specifications", "Compare these options", "Show accessories"] }]
        : []),
    ],
    usedProductIds: available.map(p => p.id),
  }
}

export async function sendMessage(request: ChatRequest): Promise<ChatResponse> {
  // Prefer real AI endpoint when configured; fall back to deterministic matcher.
  const remote = await callRealAI(request)
  if (remote) return remote
  return deterministicMatch(request)
}
