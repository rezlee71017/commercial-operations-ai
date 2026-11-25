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
