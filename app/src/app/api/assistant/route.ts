import { NextResponse } from "next/server";
import { badRequest, serverError } from "@/api/http";
import { clientKey, createRateLimiter } from "@/api/rate-limit";
import { askAssistant, parseAssistantBody } from "@/core/assistant";

// 12 questions per minute per client: every question can cost several LLM calls on a free tier.
const allow = createRateLimiter(12, 60_000);

// POST /api/assistant  { message, history?: [{role, content}], budgetDollars? }  ->  { status, answer }
// Public, like /api/run. The Python service behind it is read-only and only sees the public catalog.
export async function POST(req: Request) {
  try {
    if (!allow(clientKey(req))) {
      return NextResponse.json({ error: "Too many questions. Please wait a minute.", code: "rate_limited" }, { status: 429 });
    }
    const parsed = parseAssistantBody(await req.json().catch(() => null));
    if (!parsed.ok) return badRequest(parsed.message);
    const result = await askAssistant(parsed.value);
    if (!result.ok) return NextResponse.json({ error: result.message, code: result.code }, { status: result.httpStatus });
    return NextResponse.json({ status: result.status, answer: result.answer });
  } catch (e) {
    return serverError(e);
  }
}
