#!/usr/bin/env bash
# Run from the REPO ROOT:  bash add-owned.sh
set -e
if [ ! -f app/src/core/mock.ts ]; then
  echo "ERROR: run this from the repo root, after setup-core.sh and add-mock.sh."
  exit 1
fi
cd app

# --- run.ts: the workflow now receives the list of products the customer already owns
cat > src/core/run.ts << 'EOF'
import { evaluateProposal } from "./policy";
import type { Evaluation, Product, Proposal, RunEvent, Rules } from "./types";

export type Deps = {
  propose: (request: string, catalog: Product[], owned: string[]) => Promise<Proposal>;
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

  log("request_received", "ok", { request, owned });
  log("catalog_loaded", "ok", { products: catalog.length });

  let proposal: Proposal;
  try {
    proposal = await deps.propose(request, catalog, owned);
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

# --- llm.ts: tell Gemini what the customer already owns
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

export async function proposeWithGemini(
  request: string,
  catalog: Product[],
  owned: string[] = [],
): Promise<Proposal> {
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
    owned.length > 0
      ? `The customer already owns these products (do not add them to the bundle): ${owned.join(", ")}.`
      : "The customer owns none of the catalog products.",
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

# --- mock.ts: the keyword test double also skips products the customer owns
cat > src/core/mock.ts << 'EOF'
import type { Product, Proposal } from "./types";

// TEST DOUBLE: there is NO language model here. It picks products from simple
// keywords so we can build and test the rest of the workflow without an API key.
// Every result is labeled MOCK in the explanation.
export async function proposeWithMock(
  request: string,
  catalog: Product[],
  owned: string[] = [],
): Promise<Proposal> {
  void catalog;
  const text = request.toLowerCase();
  const ids: string[] = [];

  const bolt = text.includes("bolt");
  if (text.includes("aria")) ids.push("phone-a1");
  if (bolt) ids.push("phone-b2");
  if (text.includes("laptop")) ids.push("laptop-l1");
  if (text.includes("case")) ids.push(bolt ? "case-b2" : "case-a1");
  if (text.includes("screen")) ids.push("screen-a1");
  if (text.includes("charger")) ids.push("charger-65");
  if (text.includes("cable")) ids.push("cable-c");
  if (text.includes("earbuds")) ids.push("earbuds-e1");
  if (text.includes("sleeve")) ids.push("sleeve-l1");
  if (text.includes("dock")) ids.push("dock-d1");
  if (text.includes("mouse")) ids.push("mouse-m1");

  const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const discountPct = m ? Number(m[1]) : 0;

  return {
    items: ids.filter((id) => !owned.includes(id)).map((productId) => ({ productId, qty: 1 })),
    discountPct,
    explanation: "MOCK proposal (keyword rules, no language model).",
  };
}
EOF

# --- route.ts: accepts "owned" from the user's selection. It is NEVER taken from the LLM.
cat > src/app/api/run/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { catalog, rules } from "@/data/catalog";
import { runWorkflow } from "@/core/run";
import { proposeWithGemini } from "@/core/llm";
import { proposeWithMock } from "@/core/mock";

// Start the server with LLM_MODE=mock to use the keyword test double instead of Gemini.
const propose = process.env.LLM_MODE === "mock" ? proposeWithMock : proposeWithGemini;
const knownIds = new Set(catalog.map((p) => p.id));

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const request = typeof body?.request === "string" ? body.request.trim() : "";
    if (!request) {
      return NextResponse.json({ error: "request is required" }, { status: 400 });
    }
    // Ownership comes from what the user selected (later: from order history in the database).
    const rawOwned: unknown = body?.owned;
    const owned = Array.isArray(rawOwned)
      ? rawOwned.filter((x): x is string => typeof x === "string" && knownIds.has(x))
      : [];
    const result = await runWorkflow(request, catalog, rules, { propose }, owned);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
EOF

# --- tests for the new behavior
cat > src/core/owned.test.ts << 'EOF'
import { describe, expect, it } from "vitest";
import { proposeWithMock } from "./mock";
import { runWorkflow } from "./run";
import { catalog, rules } from "../data/catalog";

const text = "I just bought the Aria phone. I need a case and a charger.";
const run = (owned: string[]) =>
  runWorkflow(text, catalog, rules, { propose: proposeWithMock, now: () => "T" }, owned);

describe("customer already owns a product", () => {
  it("accessories alone are approved when the compatible phone is owned", async () => {
    const r = await run(["phone-a1"]);
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["case-a1", "charger-65"]);
    expect(r.status).toBe("awaiting_approval");
  });

  it("accessories alone are rejected when ownership is not known", async () => {
    const r = await runWorkflow(
      "I need a case and a charger.",
      catalog,
      rules,
      { propose: proposeWithMock, now: () => "T" },
      [],
    );
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["case-a1", "charger-65"]);
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "compatibility")?.passed).toBe(false);
  });

  it("a model cannot create ownership by itself: only the owned list passed in counts", async () => {
    const r = await runWorkflow(text, catalog, rules, {
      now: () => "T",
      propose: async () => ({
        items: [{ productId: "case-a1", qty: 1 }],
        discountPct: 0,
        explanation: "I assume the customer owns the phone.",
      }),
    });
    expect(r.status).toBe("rejected_by_policy");
  });
});
EOF

# --- page.tsx: checkboxes for "customer already owns" + error details for failed events
cat > src/app/page.tsx << 'EOF'
"use client";

import { useState } from "react";
import type { RunResult } from "@/core/run";

const OWNABLE = [
  { id: "phone-a1", label: "Phone Aria" },
  { id: "phone-b2", label: "Phone Bolt" },
  { id: "laptop-l1", label: "Laptop Lume" },
];

export default function Home() {
  const [request, setRequest] = useState("I just bought the Aria phone. I need a case and a charger.");
  const [owned, setOwned] = useState<string[]>(["phone-a1"]);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setOwned((o) => (o.includes(id) ? o.filter((x) => x !== id) : [...o, id]));
  }

  async function run() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, owned }),
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
      <p style={{ marginBottom: 4 }}>Customer already owns:</p>
      <div>
        {OWNABLE.map((o) => (
          <label key={o.id} style={{ marginRight: 12 }}>
            <input type="checkbox" checked={owned.includes(o.id)} onChange={() => toggle(o.id)} /> {o.label}
          </label>
        ))}
      </div>
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
                {e.status === "failed" && (
                  <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(e.data, null, 2)}</pre>
                )}
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

echo ""
echo "DONE. Now run:  npm test"
