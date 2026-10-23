import type { Evaluation, Product, Proposal, RuleResult, Rules } from "./types";

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

  // Money math: ALWAYS computed here from catalog data, in integer cents. Never taken from the LLM.
  let subtotalCents = 0;
  let costCents = 0;
  for (const [id, qty] of qtyById) {
    const p = byId.get(id);
    if (p) {
      subtotalCents += p.priceCents * qty;
      costCents += p.costCents * qty;
    }
  }
  const safeDiscount = Number.isFinite(d) ? d : 0;
  const totalCents = Math.round((subtotalCents * (100 - safeDiscount)) / 100);

  // Margin in basis points (1/100 of a percent), compared as integers
  const marginBps = totalCents > 0 ? Math.round(((totalCents - costCents) * 10000) / totalCents) : 0;
  const marginPct = marginBps / 100;
  const minBps = Math.round(rules.minMarginPct * 100);

  // Rule: minimum profit margin
  const marginOk = totalCents > 0 && marginBps >= minBps;
  add(
    "min_margin",
    marginOk,
    marginOk ? "ok" : `Margin ${marginPct}% is below the minimum ${rules.minMarginPct}%`,
  );

  // Rule: the customer's own budget, if the model understood one. The total is our code's number, never the model's.
  if (proposal.budgetCents !== undefined) {
    const b = proposal.budgetCents;
    const budgetOk = Number.isInteger(b) && b >= 0 && totalCents <= b;
    add(
      "within_budget",
      budgetOk,
      budgetOk ? "ok" : `Total $${(totalCents / 100).toFixed(2)} is above the customer's budget of $${(b / 100).toFixed(2)}`,
    );
  }

  return {
    approvable: results.every((r) => r.passed),
    subtotalCents,
    totalCents,
    costCents,
    marginPct,
    results,
  };
}
