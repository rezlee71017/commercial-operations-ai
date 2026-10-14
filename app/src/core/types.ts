export type Product = {
  id: string;
  name: string;
  category: string;
  price: number; // selling price
  cost: number; // our purchase cost (never sent to the LLM)
  stock: number;
  // ids of main products this item works with. Empty/undefined = no restriction.
  compatibleWith?: string[];
  isSynthetic: boolean; // true = demo data, not real
};

export type BundleItem = { productId: string; qty: number };

export type Proposal = {
  items: BundleItem[];
  discountPct: number;
  explanation?: string;
};

export type Rules = { minMarginPct: number; maxDiscountPct: number };

export type RuleResult = { rule: string; passed: boolean; detail: string };

export type Evaluation = {
  approvable: boolean;
  subtotal: number;
  total: number;
  cost: number;
  marginPct: number;
  results: RuleResult[];
};

export type RunEvent = {
  step: string;
  status: "ok" | "failed";
  at: string; // ISO time when the step FINISHED
  data?: unknown;
};
