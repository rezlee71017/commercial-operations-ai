import { NextResponse } from "next/server";
import { catalog, rules } from "@/data/catalog";
import { proposeWithGemini } from "@/core/llm";
import { proposeWithMock } from "@/core/mock";
import { makeAgentPropose } from "@/core/agent-propose";
import { workflowStream } from "@/core/stream";

// LLM_MODE=mock   -> keyword test double instead of Gemini
// AGENT_MODE=tools -> tool-using agent (every tool call is shown as an event)
const mock = process.env.LLM_MODE === "mock";
const propose =
  process.env.AGENT_MODE === "tools" ? makeAgentPropose(mock) : mock ? proposeWithMock : proposeWithGemini;
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
    return new Response(workflowStream(request, catalog, rules, { propose }, owned), {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
