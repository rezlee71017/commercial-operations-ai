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
