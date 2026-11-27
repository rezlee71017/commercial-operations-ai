// Server-side bridge to the Python AI service (ai-service/). The browser never talks to the service
// and never sees its address, token or internal steps: it only gets { status, answer }.
// The service is read-only and works on the public catalog; prices and stock in its answers come from its tools.

export type AssistantTurn = { role: "user" | "assistant"; content: string };
export type AssistantInput = { message: string; history: AssistantTurn[]; budgetDollars?: number };

export type AssistantErrorCode = "bad_request" | "assistant_not_configured" | "assistant_busy" | "assistant_timeout" | "assistant_unavailable" | "assistant_error";
export type AssistantResult =
  | { ok: true; status: "answered" | "step_limit" | "failed"; answer: string }
  | { ok: false; code: AssistantErrorCode; message: string; httpStatus: number };

const MAX_MESSAGE = 2000;
const MAX_HISTORY = 20;
const TIMEOUT_MS = 45_000;

export function parseAssistantBody(body: unknown): { ok: true; value: AssistantInput } | { ok: false; message: string } {
  if (typeof body !== "object" || body === null) return { ok: false, message: "A JSON body is required" };
  const b = body as Record<string, unknown>;
  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) return { ok: false, message: "message is required" };
  if (message.length > MAX_MESSAGE) return { ok: false, message: `message must be at most ${MAX_MESSAGE} characters` };

  const history: AssistantTurn[] = [];
  if (b.history !== undefined) {
    if (!Array.isArray(b.history) || b.history.length > MAX_HISTORY) return { ok: false, message: `history must be a list of at most ${MAX_HISTORY} turns` };
    for (const t of b.history) {
      const turn = t as { role?: unknown; content?: unknown };
      if ((turn?.role !== "user" && turn?.role !== "assistant") || typeof turn.content !== "string" || turn.content.length > MAX_MESSAGE) {
        return { ok: false, message: "each history turn needs role user or assistant and text content" };
      }
      history.push({ role: turn.role, content: turn.content });
    }
  }

  let budgetDollars: number | undefined;
  if (b.budgetDollars !== undefined) {
    if (typeof b.budgetDollars !== "number" || !Number.isFinite(b.budgetDollars) || b.budgetDollars <= 0 || b.budgetDollars > 1_000_000) {
      return { ok: false, message: "budgetDollars must be a positive number" };
    }
    budgetDollars = b.budgetDollars;
  }
  return { ok: true, value: { message, history, budgetDollars } };
}

const fail = (code: AssistantErrorCode, httpStatus: number, message: string): AssistantResult => ({ ok: false, code, message, httpStatus });

export async function askAssistant(
  input: AssistantInput,
  env: Record<string, string | undefined> = process.env,
  fetchFn: typeof fetch = fetch,
): Promise<AssistantResult> {
  const base = env.AI_SERVICE_URL?.replace(/\/+$/, "");
  if (!base) return fail("assistant_not_configured", 503, "The shopping assistant is not available right now.");

  let res: Response;
  try {
    res = await fetchFn(`${base}/v1/agent/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(env.AI_SERVICE_TOKEN ? { "X-Internal-Token": env.AI_SERVICE_TOKEN } : {}) },
      body: JSON.stringify({ message: input.message, history: input.history, max_budget_dollars: input.budgetDollars }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (e) {
    const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    return timedOut
      ? fail("assistant_timeout", 504, "The assistant took too long to answer. Please try again.")
      : fail("assistant_unavailable", 503, "The shopping assistant is not available right now.");
  }

  if (res.status === 429) return fail("assistant_busy", 429, "The assistant is busy right now. Please try again in a minute.");
  if (res.status === 504) return fail("assistant_timeout", 504, "The assistant took too long to answer. Please try again.");
  if (res.status >= 500) return fail("assistant_unavailable", 503, "The shopping assistant is not available right now.");
  if (!res.ok) return fail("assistant_error", 502, "The assistant could not answer this request."); // 401/422/...: details stay in the server

  const data: unknown = await res.json().catch(() => null);
  const d = data as { status?: unknown; answer?: unknown } | null;
  const status = d?.status;
  if ((status !== "answered" && status !== "step_limit" && status !== "failed") || typeof d?.answer !== "string") {
    return fail("assistant_error", 502, "The assistant could not answer this request.");
  }
  return { ok: true, status, answer: d.answer };
}
