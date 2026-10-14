#!/usr/bin/env bash
# Run from the REPO ROOT (the folder that contains app/):  bash setup-core.sh
set -e

if [ ! -f app/package.json ]; then
  echo "ERROR: run this from the repo root (the folder that contains app/)."
  exit 1
fi

cd app
mkdir -p src/core src/data src/app/api/run

# ---------------------------------------------------------------------------
# 1) TYPES: the shape of our data. No logic here.
# ---------------------------------------------------------------------------
cat > src/core/types.ts << 'EOF'
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
EOF

# ---------------------------------------------------------------------------
# 2) POLICY ENGINE: deterministic business rules. The LLM can never bypass it.
# ---------------------------------------------------------------------------
cat > src/core/policy.ts << 'EOF'
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
EOF

# ---------------------------------------------------------------------------
# 3) DEMO DATA: synthetic electronics catalog (clearly labeled as demo data)
# ---------------------------------------------------------------------------
cat > src/data/catalog.ts << 'EOF'
import type { Product, Rules } from "../core/types";

// DEMO DATA: every record is synthetic (isSynthetic: true).
const UNIVERSAL = ["phone-a1", "phone-b2", "laptop-l1"];

export const catalog: Product[] = [
  { id: "phone-a1", name: "Phone Aria 128GB", category: "phone", price: 600, cost: 450, stock: 10, isSynthetic: true },
  { id: "phone-b2", name: "Phone Bolt 256GB", category: "phone", price: 800, cost: 620, stock: 5, isSynthetic: true },
  { id: "laptop-l1", name: "Laptop Lume 14", category: "laptop", price: 1000, cost: 800, stock: 4, isSynthetic: true },
  { id: "case-a1", name: "Case for Aria", category: "case", price: 20, cost: 6, stock: 50, compatibleWith: ["phone-a1"], isSynthetic: true },
  { id: "case-b2", name: "Case for Bolt", category: "case", price: 22, cost: 7, stock: 3, compatibleWith: ["phone-b2"], isSynthetic: true },
  { id: "screen-a1", name: "Screen protector for Aria", category: "protector", price: 15, cost: 4, stock: 0, compatibleWith: ["phone-a1"], isSynthetic: true }, // out of stock on purpose
  { id: "charger-65", name: "USB-C Charger 65W", category: "charger", price: 35, cost: 15, stock: 40, compatibleWith: UNIVERSAL, isSynthetic: true },
  { id: "cable-c", name: "USB-C Cable 1m", category: "cable", price: 12, cost: 3, stock: 100, compatibleWith: UNIVERSAL, isSynthetic: true },
  { id: "earbuds-e1", name: "Earbuds Echo", category: "audio", price: 80, cost: 50, stock: 12, isSynthetic: true },
  { id: "sleeve-l1", name: "Laptop sleeve 14in", category: "sleeve", price: 30, cost: 12, stock: 20, compatibleWith: ["laptop-l1"], isSynthetic: true },
  { id: "dock-d1", name: "USB-C Dock 7-in-1", category: "dock", price: 90, cost: 70, stock: 6, compatibleWith: ["laptop-l1"], isSynthetic: true }, // low margin on purpose
  { id: "mouse-m1", name: "Wireless Mouse", category: "mouse", price: 25, cost: 10, stock: 30, isSynthetic: true },
];

export const rules: Rules = { minMarginPct: 20, maxDiscountPct: 15 };
EOF

# ---------------------------------------------------------------------------
# 4) TESTS for the policy engine
# ---------------------------------------------------------------------------
cat > src/core/policy.test.ts << 'EOF'
import { describe, expect, it } from "vitest";
import { evaluateProposal } from "./policy";
import { catalog, rules } from "../data/catalog";
import type { Product } from "./types";

const failed = (e: ReturnType<typeof evaluateProposal>) =>
  e.results.filter((r) => !r.passed).map((r) => r.rule);

describe("policy engine", () => {
  it("approves a valid bundle and computes the numbers itself", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }, { productId: "charger-65", qty: 1 }], discountPct: 5 },
      catalog,
      rules,
    );
    expect(e.approvable).toBe(true);
    expect(e.subtotal).toBe(655);
    expect(e.total).toBe(622.25);
    expect(e.cost).toBe(471);
    expect(e.marginPct).toBe(24.31);
  });

  it("rejects an out-of-stock product", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-a1", qty: 1 }, { productId: "screen-a1", qty: 1 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["stock_available"]);
  });

  it("rejects quantity above stock", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-b2", qty: 5 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["stock_available"]);
  });

  it("counts duplicate lines of the same product together", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-b2", qty: 2 }, { productId: "case-b2", qty: 2 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toContain("stock_available");
  });

  it("rejects a discount above the maximum", () => {
    const e = evaluateProposal(
      { items: [{ productId: "case-a1", qty: 1 }, { productId: "phone-a1", qty: 1 }], discountPct: 20 },
      catalog,
      rules,
    );
    expect(failed(e)).toContain("discount_limit");
  });

  it("rejects a bundle whose margin falls below the minimum", () => {
    // Allowed discount (15%) but the phone alone then has margin ~11.8%
    const e = evaluateProposal({ items: [{ productId: "phone-a1", qty: 1 }], discountPct: 15 }, catalog, rules);
    expect(failed(e)).toEqual(["min_margin"]);
  });

  it("accepts a margin exactly equal to the minimum (boundary)", () => {
    const tiny: Product[] = [{ id: "x", name: "X", category: "t", price: 100, cost: 80, stock: 5, isSynthetic: true }];
    const e = evaluateProposal({ items: [{ productId: "x", qty: 1 }], discountPct: 0 }, tiny, rules);
    expect(e.marginPct).toBe(20);
    expect(e.approvable).toBe(true);
  });

  it("rejects incompatible accessories", () => {
    const e = evaluateProposal(
      { items: [{ productId: "phone-b2", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 },
      catalog,
      rules,
    );
    expect(failed(e)).toEqual(["compatibility"]);
  });

  it("accepts an accessory when the customer already owns the compatible product", () => {
    const e = evaluateProposal({ items: [{ productId: "case-a1", qty: 1 }], discountPct: 0 }, catalog, rules, ["phone-a1"]);
    expect(e.approvable).toBe(true);
  });

  it("rejects unknown product ids, empty bundles and bad quantities", () => {
    expect(failed(evaluateProposal({ items: [{ productId: "nope", qty: 1 }], discountPct: 0 }, catalog, rules))).toContain("products_exist");
    expect(evaluateProposal({ items: [], discountPct: 0 }, catalog, rules).approvable).toBe(false);
    expect(evaluateProposal({ items: [{ productId: "case-a1", qty: 1.5 }], discountPct: 0 }, catalog, rules).approvable).toBe(false);
    expect(evaluateProposal({ items: [{ productId: "case-a1", qty: -1 }], discountPct: 0 }, catalog, rules).approvable).toBe(false);
  });

  it("rejects a NaN discount", () => {
    const e = evaluateProposal({ items: [{ productId: "case-a1", qty: 1 }], discountPct: Number.NaN }, catalog, rules, ["phone-a1"]);
    expect(failed(e)).toContain("discount_limit");
  });
});
EOF

# ---------------------------------------------------------------------------
# 5) LLM HELPER: asks Gemini for a proposal and VALIDATES the answer.
#    The model only picks product ids, quantities and a discount.
#    Prices, stock and margins are never taken from it.
# ---------------------------------------------------------------------------
cat > src/core/llm.ts << 'EOF'
import { z } from "zod";
import type { Product, Proposal } from "./types";

const ProposalSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number() })).min(1),
  discountPct: z.number(),
  explanation: z.string().optional(),
});

export function parseProposal(text: string): Proposal {
  // Some models wrap JSON in ```json fences even when told not to
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return ProposalSchema.parse(JSON.parse(cleaned));
}

export async function proposeWithGemini(request: string, catalog: Product[]): Promise<Proposal> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

  // We do NOT send cost to the model.
  const products = catalog.map(({ id, name, category, price, stock }) => ({ id, name, category, price, stock }));
  const system = [
    "You are a sales assistant for an electronics store.",
    "Build a bundle for the customer using ONLY products from the catalog below, referenced by id.",
    'Reply with JSON only, in this exact shape: {"items":[{"productId":string,"qty":integer}],"discountPct":number,"explanation":string}',
    "Use discountPct 0 unless a discount clearly helps. Never invent products, prices or stock levels.",
    "Catalog:",
    JSON.stringify(products),
  ].join("\n");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: request }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.find((p) => typeof p.text === "string")?.text;
  if (!text) throw new Error("Gemini returned no text");
  return parseProposal(text);
}
EOF

# ---------------------------------------------------------------------------
# 6) WORKFLOW RUNNER: runs the steps and records an event after each REAL step.
#    The LLM function is passed in ("dependency injection") so tests can fake it.
# ---------------------------------------------------------------------------
cat > src/core/run.ts << 'EOF'
import { evaluateProposal } from "./policy";
import type { Evaluation, Product, Proposal, RunEvent, Rules } from "./types";

export type Deps = {
  propose: (request: string, catalog: Product[]) => Promise<Proposal>;
  now?: () => string;
};

export type RunResult = {
  status: "awaiting_approval" | "rejected_by_policy" | "failed";
  events: RunEvent[];
  proposal: Proposal | null;
  evaluation: Evaluation | null;
};

export async function runWorkflow(
  request: string,
  catalog: Product[],
  rules: Rules,
  deps: Deps,
  owned: string[] = [],
): Promise<RunResult> {
  const events: RunEvent[] = [];
  const now = deps.now ?? (() => new Date().toISOString());
  // An event is recorded only AFTER the step has really finished.
  const log = (step: string, status: "ok" | "failed", data?: unknown) =>
    events.push({ step, status, at: now(), data });

  log("request_received", "ok", { request });
  log("catalog_loaded", "ok", { products: catalog.length });

  let proposal: Proposal;
  try {
    proposal = await deps.propose(request, catalog);
    log("proposal_generated", "ok", proposal);
  } catch (e) {
    log("proposal_generated", "failed", { error: e instanceof Error ? e.message : String(e) });
    return { status: "failed", events, proposal: null, evaluation: null };
  }

  const evaluation = evaluateProposal(proposal, catalog, rules, owned);
  log("policy_checked", evaluation.approvable ? "ok" : "failed", evaluation.results);

  return {
    status: evaluation.approvable ? "awaiting_approval" : "rejected_by_policy",
    events,
    proposal,
    evaluation,
  };
}
EOF

cat > src/core/run.test.ts << 'EOF'
import { describe, expect, it } from "vitest";
import { runWorkflow } from "./run";
import { parseProposal } from "./llm";
import { catalog, rules } from "../data/catalog";

const now = () => "T";

describe("runWorkflow", () => {
  it("goes to awaiting_approval when the proposal passes all rules", async () => {
    const r = await runWorkflow("phone + case", catalog, rules, {
      now,
      propose: async () => ({ items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 }),
    });
    expect(r.status).toBe("awaiting_approval");
    expect(r.events.map((e) => e.step)).toEqual(["request_received", "catalog_loaded", "proposal_generated", "policy_checked"]);
  });

  it("blocks a proposal that breaks a rule, even if the 'LLM' asked for it", async () => {
    const r = await runWorkflow("big discount", catalog, rules, {
      now,
      propose: async () => ({ items: [{ productId: "phone-a1", qty: 1 }], discountPct: 15 }),
    });
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.approvable).toBe(false);
  });

  it("fails visibly (no policy step, no result) when the model call throws", async () => {
    const r = await runWorkflow("x", catalog, rules, {
      now,
      propose: async () => {
        throw new Error("timeout");
      },
    });
    expect(r.status).toBe("failed");
    expect(r.events.at(-1)).toMatchObject({ step: "proposal_generated", status: "failed" });
    expect(r.events.some((e) => e.step === "policy_checked")).toBe(false);
  });
});

describe("parseProposal", () => {
  it("accepts valid JSON, with or without code fences", () => {
    const json = '{"items":[{"productId":"case-a1","qty":1}],"discountPct":0}';
    expect(parseProposal(json).items).toHaveLength(1);
    expect(parseProposal("```json\n" + json + "\n```").items).toHaveLength(1);
  });

  it("throws on invalid model output", () => {
    expect(() => parseProposal("not json")).toThrow();
    expect(() => parseProposal('{"items":[],"discountPct":0}')).toThrow();
    expect(() => parseProposal('{"items":[{"productId":"a","qty":"two"}],"discountPct":0}')).toThrow();
  });
});
EOF

# ---------------------------------------------------------------------------
# 7) API ROUTE: the web endpoint that runs the workflow
# ---------------------------------------------------------------------------
cat > src/app/api/run/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { catalog, rules } from "@/data/catalog";
import { runWorkflow } from "@/core/run";
import { proposeWithGemini } from "@/core/llm";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const request = typeof body?.request === "string" ? body.request.trim() : "";
    if (!request) {
      return NextResponse.json({ error: "request is required" }, { status: 400 });
    }
    const result = await runWorkflow(request, catalog, rules, { propose: proposeWithGemini });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
EOF

# ---------------------------------------------------------------------------
# 8) MINIMAL PAGE (plain on purpose; design comes later). REPLACES the default page.
# ---------------------------------------------------------------------------
cat > src/app/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import type { RunResult } from "@/core/run";

export default function Home() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.");
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as RunResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "0 auto", padding: 16, fontFamily: "system-ui" }}>
      <h1>Commercial Operations AI (demo data)</h1>
      <textarea
        value={request}
        onChange={(e) => setRequest(e.target.value)}
        rows={3}
        style={{ width: "100%", padding: 8 }}
      />
      <button onClick={run} disabled={loading} style={{ marginTop: 8, padding: "8px 16px" }}>
        {loading ? "Running..." : "Run workflow"}
      </button>

      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}

      {result && (
        <>
          <h2>Status: {result.status}</h2>

          <h3>Events</h3>
          <ol>
            {result.events.map((e, i) => (
              <li key={i}>
                <b>{e.step}</b> {e.status === "ok" ? "OK" : "FAILED"} <small>({e.at})</small>
              </li>
            ))}
          </ol>

          {result.proposal && (
            <>
              <h3>Proposal</h3>
              <ul>
                {result.proposal.items.map((it, i) => (
                  <li key={i}>
                    {it.productId} x {it.qty}
                  </li>
                ))}
              </ul>
              <p>Discount: {result.proposal.discountPct}%</p>
              {result.proposal.explanation && <p>{result.proposal.explanation}</p>}
            </>
          )}

          {result.evaluation && (
            <>
              <h3>Policy checks</h3>
              <ul>
                {result.evaluation.results.map((r) => (
                  <li key={r.rule}>
                    {r.passed ? "PASS" : "FAIL"} {r.rule}: {r.detail}
                  </li>
                ))}
              </ul>
              <p>
                Subtotal {result.evaluation.subtotal} | Total {result.evaluation.total} | Margin{" "}
                {result.evaluation.marginPct}%
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
EOF

# ---------------------------------------------------------------------------
# 9) Install what we need and add the "test" command
# ---------------------------------------------------------------------------
npm install zod
npm install -D vitest
npm pkg set scripts.test="vitest run"

# ---------------------------------------------------------------------------
# 10) Project rules for any AI/human working on the repo + first decision record.
#     Only created if they do not exist yet, so nothing of yours is overwritten.
# ---------------------------------------------------------------------------
cd ..
mkdir -p docs/decisions

if [ ! -f AGENTS.md ]; then
cat > AGENTS.md << 'EOF'
# Rules for anyone (human or AI) working on this repo

Status of features lives in README.md. Do not claim a feature works unless it is implemented AND tested.

## Stack and commands
- Web app: Next.js + TypeScript in `app/`.
- Tests: `cd app && npm test` (Vitest). Run them before saying a task is done.
- Core logic lives in `app/src/core/`, demo data in `app/src/data/`.

## Non-negotiable rules
1. Prices, stock levels, margins and totals come from the catalog or deterministic code, never from the LLM.
2. The policy engine (`core/policy.ts`) is the only thing that decides whether a proposal is allowed.
3. Validate all LLM output (zod) before using it. Model failures must show as visible failures.
4. Progress shown in the UI must come from real recorded events. Never fake steps.
5. Every demo record is marked `isSynthetic: true`. Do not present synthetic results as real-world evidence.
6. Never commit secrets (.env, API keys). Use `.env.local` and keep `.env.example` updated.

## Working style
- One task = one GitHub Issue = one branch. Keep diffs small; do not touch unrelated files.
- New business rule => new unit test, including a boundary case.
- Prefer the simplest solution; add a dependency only when it clearly pays for itself.
- Big decisions get a short note in `docs/decisions/`.
EOF
fi

if [ ! -f docs/decisions/0001-core-principles.md ]; then
cat > docs/decisions/0001-core-principles.md << 'EOF'
# 0001: Core principles and first stack

Status: accepted (2026-10-15)

## Decisions
- Deterministic policy layer decides; the LLM only proposes and explains.
- LLM access sits behind one function (`propose`), so the provider can be swapped or faked in tests.
- Stack: Next.js + TypeScript. Start without a database (in-memory demo data); add Postgres (e.g. Supabase) in the next milestone.
- Demo data is synthetic and labeled as such.

## Why
- Business-critical numbers must be reproducible and testable, which an LLM cannot guarantee.
- Free-tier services and regional access can change; a swappable LLM layer limits that risk.

## Known risks (to re-check)
- Free-tier limits and regional availability of hosted LLM APIs.
- Hosted free plans may be non-commercial only.
- Free-tier LLM providers may use submitted data; never send real customer data.
EOF
fi

echo ""
echo "DONE. Now run:  cd app && npm test"
