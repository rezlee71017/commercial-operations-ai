import type { Product } from "./types";

// What the OPERATOR sees about a product: the public fields plus cost and margin.
export type OperatorProduct = Product & { marginPct: number };

export function toOperatorProduct(p: Product): OperatorProduct {
  const marginPct = p.priceCents > 0 ? Math.round(((p.priceCents - p.costCents) * 1000) / p.priceCents) / 10 : 0;
  return { ...p, marginPct };
}
