export type Compatibility = "confirmed" | "unknown" | "conflict"
export type PublicProduct = {
  id: string
  name: string
  category: string
  priceCents: number
  stock: number
  compatibleWith: string[]
  imageUrl: string
  isSynthetic: boolean
  brand: string
  kind: string
  specs: Record<string, string>
  strengths: string[]
  limitation: string
  complementaryWith: string[]
  compatibility: Record<string, Compatibility>
}
export type MerchantProduct = PublicProduct & {
  costCents: number
}
export type RunStatus =
  | "running"
  | "needs_input"
  | "awaiting_approval"
  | "rejected_by_policy"
  | "approved"
  | "executed"
  | "rejected"
  | "failed"
export type RunEvent = {
  step: string
  status: "started" | "ok" | "failed"
  message: string
  at: string
}
export type BundleItem = {
  productId: string
  qty: number
}
export type Proposal = {
  id?: string
  name?: string
  items: BundleItem[]
  discountPct: number
  explanation: string
}
export type RuleCheck = {
  rule: string
  passed: boolean
  detail: string
}
export type Rules = {
  minMarginPct: number
  maxDiscountPct: number
}
export type Run = {
  id: string
  request: string
  status: RunStatus
  createdAt: string
  events: RunEvent[]
  proposal: Proposal
  checks: RuleCheck[]
}
export type CartLine = {
  productId: string
  qty: number
  unitPriceCents: number
}

export type ChatRequest = { sessionId: string; message: string; context?: { productId?: string; cartIds?: string[] } }
export type ChatResponse = { messageId: string; blocks: Block[]; usedProductIds: string[]; needsInput?: boolean }
export type Block =
  | { type: "text"; text: string }
  | { type: "product_cards"; productIds: string[]; reasons: Record<string, string> }
  | { type: "comparison_table"; productIds: string[] }
  | { type: "clarifying_question"; question: string; answers: string[] }
  | { type: "shopping_project"; title: string; productIds: string[]; budgetCents?: number }
  | { type: "no_match"; text: string; alternativeIds: string[] }
  | { type: "error"; text: string }
