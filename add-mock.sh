#!/usr/bin/env bash
# Run from the REPO ROOT:  bash add-mock.sh
set -e
if [ ! -f app/src/app/api/run/route.ts ]; then
  echo "ERROR: run this from the repo root, after setup-core.sh has been run."
  exit 1
fi
cd app

cat > src/core/mock.ts << 'EOF'
import type { Product, Proposal } from "./types";

// TEST DOUBLE: there is NO language model here. It picks products from simple
// keywords so we can build and test the rest of the workflow without an API key.
// Every result is labeled MOCK in the explanation.
export async function proposeWithMock(request: string, catalog: Product[]): Promise<Proposal> {
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
    items: ids.map((productId) => ({ productId, qty: 1 })),
    discountPct,
    explanation: "MOCK proposal (keyword rules, no language model).",
  };
}
EOF

cat > src/core/mock.test.ts << 'EOF'
import { describe, expect, it } from "vitest";
import { proposeWithMock } from "./mock";
import { runWorkflow } from "./run";
import { catalog, rules } from "../data/catalog";

const run = (text: string) =>
  runWorkflow(text, catalog, rules, { propose: proposeWithMock, now: () => "T" });

describe("mock proposer + policy engine", () => {
  it("approves phone + case + charger", async () => {
    const r = await run("I want to buy the Aria phone with a case and a charger.");
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["phone-a1", "case-a1", "charger-65"]);
    expect(r.status).toBe("awaiting_approval");
  });

  it("rejects the out-of-stock screen protector", async () => {
    const r = await run("I want the screen protector for my Aria phone.");
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "stock_available")?.passed).toBe(false);
  });

  it("rejects the 40% discount request", async () => {
    const r = await run("Give me the dock with a 40% discount.");
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "discount_limit")?.passed).toBe(false);
  });

  it("an empty match fails validation visibly instead of crashing", async () => {
    const r = await run("hello there");
    expect(r.status).toBe("rejected_by_policy");
  });
});
EOF

cat > src/app/api/run/route.ts << 'EOF'
import { NextResponse } from "next/server";
import { catalog, rules } from "@/data/catalog";
import { runWorkflow } from "@/core/run";
import { proposeWithGemini } from "@/core/llm";
import { proposeWithMock } from "@/core/mock";

// Start the server with LLM_MODE=mock to use the keyword test double instead of Gemini.
const propose = process.env.LLM_MODE === "mock" ? proposeWithMock : proposeWithGemini;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const request = typeof body?.request === "string" ? body.request.trim() : "";
    if (!request) {
      return NextResponse.json({ error: "request is required" }, { status: 400 });
    }
    const result = await runWorkflow(request, catalog, rules, { propose });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
EOF

# Default example text: the customer buys the phone too (the system does not know yet what a customer already owns)
sed -i 's/I just bought the Aria phone. I need a case and a charger./I want to buy the Aria phone with a case and a charger./' src/app/page.tsx

echo ""
echo "DONE. Now run:  npm test"
