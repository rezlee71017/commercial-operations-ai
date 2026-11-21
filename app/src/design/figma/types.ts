export type View = "store" | "bundle" | "ops" | "owner"

export type PublicProduct = {
  id: string
  name: string
  category: string
  priceCents: number
  stock: number
  compatibleWith: string[]
  isSynthetic: boolean
}

export type MerchantProduct = PublicProduct & {
  costCents: number
  description: string
}

export type RunStatus = "running" | "needs_input" | "awaiting_approval" | "rejected_by_policy" | "approved" | "executed" | "rejected" | "failed"

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
  isSynthetic: true
}

export type CartLine = {
  productId: string
  qty: number
  unitPriceCents?: number
  bundleLabel?: string
}
export type LoadState = "ready" | "loading" | "empty" | "error"
