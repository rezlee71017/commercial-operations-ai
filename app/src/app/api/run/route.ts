import { NextResponse } from "next/server";
import { isOperator } from "@/api/operator-auth";
import { serverError } from "@/api/http";
import { redactNdjson } from "@/core/redact";
import { proposeWithGemini } from "@/core/llm";
import { proposeWithMock } from "@/core/mock";
import { makeAgentPropose } from "@/core/agent-propose";
import { workflowStream } from "@/core/stream";
import { getDb } from "@/db/client";
import { loadCatalog, loadRules } from "@/db/repo";
import { createRun, createRunRecorder } from "@/db/runs";

// LLM_MODE=mock   -> keyword test double instead of Gemini
// AGENT_MODE=tools -> tool-using agent (every tool call is shown as an event)
const mock = process.env.LLM_MODE === "mock";
const agent = process.env.AGENT_MODE === "tools";
const propose = agent ? makeAgentPropose(mock) : mock ? proposeWithMock : proposeWithGemini;
const mode = `${mock ? "mock" : "gemini"}-${agent ? "tools" : "single"}`;

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const request = typeof body?.request === "string" ? body.request.trim() : "";
    if (!request) {
      return NextResponse.json({ error: "request is required" }, { status: 400 });
    }

    // The database is the source of truth for products, stock and rules.
    const db = await getDb();
    const [catalog, rules] = await Promise.all([loadCatalog(db), loadRules(db)]);
    const knownIds = new Set(catalog.map((p) => p.id));

    // Ownership comes from what the user selected (later: from order history in the database).
    const rawOwned: unknown = body?.owned;
    const owned = Array.isArray(rawOwned)
      ? rawOwned.filter((x): x is string => typeof x === "string" && knownIds.has(x))
      : [];

    // Every run is stored, with every event, so the history survives a page refresh.
    const runId = await createRun(db, { request, owned, mode });
    const sink = createRunRecorder(db, runId);
    const stream = workflowStream(request, catalog, rules, { propose }, owned, { runId, sink });
    // Customers never receive purchase cost or margin. The database keeps the full run for the operator.
    return new Response(isOperator(req) ? stream : redactNdjson(stream), {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  } catch (e) {
    return serverError(e);
  }
}
