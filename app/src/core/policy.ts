import type { Evaluation, Product, Proposal, RuleResult, Rules } from "./types";

const round2 = (n: number) => Math.round(n * 100) / 100;

export function evaluateProposal(
  proposal: Proposal,
  catalog: Product[],
  rules: Rules,
  owned: string[] = [], // products the customer already has (for compatibility)
): Evaluation {
  const byId = new Map(catalog.map((p) => [p.id, p]));
  const results: RuleResult[] = [];
  const add = (rule: string, passed: boolean, detail: string) =>
    results.push({ rule, passed, detail });

  // Rule: structure
  const structureOk =
    proposal.items.length > 0 &&
    proposal.items.every((i) => Number.isInteger(i.qty) && i.qty > 0);
  add(
    "items_valid",
    structureOk,
    structureOk ? "ok" : "Need at least one item, and every quantity must be a positive whole number",
  );

  // Merge duplicate lines of the same product
  const qtyById = new Map<string, number>();
  for (const i of proposal.items) {
    qtyById.set(i.productId, (qtyById.get(i.productId) ?? 0) + i.qty);
  }

  // Rule: every product must exist in the catalog
  const unknown = [...qtyById.keys()].filter((id) => !byId.has(id));
  add(
    "products_exist",
    unknown.length === 0,
    unknown.length === 0 ? "ok" : `Unknown product ids: ${unknown.join(", ")}`,
  );

  // Rule: enough stock
  const stockProblems: string[] = [];
  for (const [id, qty] of qtyById) {
    const p = byId.get(id);
    if (p && qty > p.stock) stockProblems.push(`${id}: wanted ${qty}, in stock ${p.stock}`);
  }
  add(
    "stock_available",
    stockProblems.length === 0,
    stockProblems.length === 0 ? "ok" : stockProblems.join("; "),
  );

  // Rule: compatibility (accessory needs a compatible main product in bundle or owned)
  const have = new Set([...qtyById.keys(), ...owned]);
  const compatProblems: string[] = [];
  for (const id of qtyById.keys()) {
    const p = byId.get(id);
    if (p?.compatibleWith?.length && !p.compatibleWith.some((c) => have.has(c))) {
      compatProblems.push(`${id} needs one of: ${p.compatibleWith.join(", ")}`);
    }
  }
  add(
    "compatibility",
    compatProblems.length === 0,
    compatProblems.length === 0 ? "ok" : compatProblems.join("; "),
  );

  // Rule: discount limit
  const d = proposal.discountPct;
  const discountOk = Number.isFinite(d) && d >= 0 && d <= rules.maxDiscountPct;
  add(
    "discount_limit",
    discountOk,
    discountOk ? "ok" : `Discount ${d}% must be between 0 and ${rules.maxDiscountPct}%`,
  );

  // Money math: ALWAYS computed here from catalog data, never taken from the LLM
  let subtotal = 0;
  let cost = 0;
  for (const [id, qty] of qtyById) {
    const p = byId.get(id);
    if (p) {
      subtotal += p.price * qty;
      cost += p.cost * qty;
    }
  }
  const safeDiscount = Number.isFinite(d) ? d : 0;
  const total = subtotal * (1 - safeDiscount / 100);
  const marginPct = total > 0 ? round2(((total - cost) / total) * 100) : 0;

  // Rule: minimum profit margin
  const marginOk = total > 0 && marginPct >= rules.minMarginPct;
  add(
    "min_margin",
    marginOk,
    marginOk ? "ok" : `Margin ${marginPct}% is below the minimum ${rules.minMarginPct}%`,
  );

  return {
    approvable: results.every((r) => r.passed),
    subtotal: round2(subtotal),
    total: round2(total),
    cost: round2(cost),
    marginPct,
    results,
  };
}
