// Connection checks for the LLM providers. Each check makes small real requests and reports what
// worked and what did not, so a wrong key, a wrong model name or an exhausted quota is obvious.
// Nothing here prints or returns the API key.

export type CheckStep = { name: string; ok: boolean; detail: string };
export type CheckReport = { provider: string; ok: boolean; steps: CheckStep[] };
type FetchFn = typeof fetch;

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";
const OPENROUTER_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";

const WEATHER_TOOL_PROMPT = "What is the stock level of product p-1? Use the tool.";

async function call(fetchFn: FetchFn, url: string, init: RequestInit, timeoutMs = 20_000) {
  try {
    const res = await fetchFn(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    const text = await res.text();
    let json: unknown = null;
    try {
      json = JSON.parse(text);
    } catch {
      /* not JSON */
    }
    return { status: res.status, ok: res.ok, json, text, headers: res.headers };
  } catch (e) {
    return { status: 0, ok: false, json: null, text: e instanceof Error ? e.message : String(e), headers: new Headers() };
  }
}

function redact(text: string, secret: string): string {
  return secret ? text.replaceAll(secret, "<key>") : text;
}

// Turns an HTTP failure into advice a person can act on.
export function explainFailure(provider: "gemini" | "openrouter", status: number, body: string): string {
  const b = body.toLowerCase();
  if (status === 0) return `network error: ${body.slice(0, 160)}`;
  if (status === 400 && (b.includes("api_key_invalid") || b.includes("api key not valid"))) return "the API key is not valid (check for typos or whitespace)";
  if (status === 401 || status === 403) return "authentication failed: the key is wrong, disabled, or not allowed for this API";
  if (status === 404) return "model or endpoint not found: check the model name (run this check without GEMINI_MODEL to see the models your key can use)";
  if (status === 429) {
    return provider === "gemini"
      ? "rate limit or free-tier quota reached (per-minute or per-day); wait, or use another model"
      : "rate limit reached (free models: 20 requests/minute and a daily cap); wait, or add credits";
  }
  if (status >= 500) return "the provider is temporarily unavailable";
  return `HTTP ${status}: ${body.replace(/\s+/g, " ").slice(0, 200)}`;
}

export function keyShape(key: string | undefined): CheckStep {
  if (!key) return { name: "key", ok: false, detail: "not set" };
  const issues: string[] = [];
  if (/\s/.test(key)) issues.push("contains whitespace or a line break");
  if (/^["']|["']$/.test(key)) issues.push("wrapped in quotes");
  if (key.length < 20) issues.push("suspiciously short");
  return issues.length
    ? { name: "key", ok: false, detail: `found (length ${key.length}) but ${issues.join(", ")}` }
    : { name: "key", ok: true, detail: `found (length ${key.length}, prefix "${key.slice(0, 3)}")` };
}

type GeminiModel = { name?: string; supportedGenerationMethods?: string[] };

export async function checkGemini(env: Record<string, string | undefined>, fetchFn: FetchFn = fetch): Promise<CheckReport> {
  const key = env.GEMINI_API_KEY ?? "";
  const wanted = env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const steps: CheckStep[] = [keyShape(key || undefined)];
  const report = (): CheckReport => ({ provider: "Google AI Studio (Gemini)", ok: steps.every((s) => s.ok), steps });
  if (!steps[0].ok) return report();
  const headers = { "Content-Type": "application/json", "x-goog-api-key": key };

  // 1) The key works and which models can it generate content with?
  const list = await call(fetchFn, `${GEMINI_BASE}/models?pageSize=200`, { headers });
  if (!list.ok) {
    steps.push({ name: "list models", ok: false, detail: explainFailure("gemini", list.status, redact(list.text, key)) });
    return report();
  }
  const models = ((list.json as { models?: GeminiModel[] })?.models ?? []).filter((m) => m.supportedGenerationMethods?.includes("generateContent"));
  const ids = models.map((m) => (m.name ?? "").replace(/^models\//, ""));
  steps.push({ name: "list models", ok: true, detail: `${ids.length} models support generateContent` });
  const found = ids.includes(wanted);
  const alt = ids.filter((id) => /flash/.test(id)).slice(0, 5).join(", ") || ids.slice(0, 5).join(", ");
  steps.push({
    name: "configured model",
    ok: found,
    detail: found ? `${wanted} is available` : `${wanted} is NOT available to this key. Some models you can use: ${alt}`,
  });
  if (!found) return report();

  // 2) A tiny real generation.
  const url = `${GEMINI_BASE}/models/${wanted}:generateContent`;
  const gen = await call(fetchFn, url, { method: "POST", headers, body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with the single word: ok" }] }] }) });
  if (gen.ok) {
    const text = (gen.json as { candidates?: { content?: { parts?: { text?: string }[] } }[] })?.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text;
    steps.push({ name: "generate", ok: Boolean(text), detail: text ? `answered: ${text.trim().slice(0, 40)}` : "HTTP 200 but no text in the answer" });
  } else {
    steps.push({ name: "generate", ok: false, detail: explainFailure("gemini", gen.status, redact(gen.text, key)) });
    return report();
  }

  // 3) Function calling, which the agent depends on.
  const tool = await call(fetchFn, url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      contents: [{ parts: [{ text: WEATHER_TOOL_PROMPT }] }],
      tools: [{ functionDeclarations: [{ name: "get_stock", description: "Stock level of a product", parameters: { type: "OBJECT", properties: { productId: { type: "STRING" } }, required: ["productId"] } }] }],
    }),
  });
  if (tool.ok) {
    const called = ((tool.json as { candidates?: { content?: { parts?: { functionCall?: unknown }[] } }[] })?.candidates?.[0]?.content?.parts ?? []).some((p) => p.functionCall);
    steps.push({ name: "tool calling", ok: called, detail: called ? "the model returned a function call" : "the model answered in text instead of calling the tool" });
  } else {
    steps.push({ name: "tool calling", ok: false, detail: explainFailure("gemini", tool.status, redact(tool.text, key)) });
  }
  return report();
}

export async function checkOpenRouter(env: Record<string, string | undefined>, fetchFn: FetchFn = fetch): Promise<CheckReport> {
  const key = env.OPENROUTER_API_KEY ?? "";
  const model = env.OPENROUTER_MODEL || "openrouter/free";
  const steps: CheckStep[] = [keyShape(key || undefined)];
  const report = (): CheckReport => ({ provider: "OpenRouter", ok: steps.every((s) => s.ok), steps });
  if (!steps[0].ok) return report();
  const headers = { "Content-Type": "application/json", Authorization: `Bearer ${key}`, "X-Title": "Commercial Operations AI" };

  // 1) Key info (valid key, free tier or not, usage). Informational: a failure here is reported, not fatal.
  const info = await call(fetchFn, `${OPENROUTER_BASE}/key`, { headers });
  if (info.ok) {
    const d = (info.json as { data?: { is_free_tier?: boolean; usage?: number; limit?: number | null } })?.data;
    steps.push({ name: "key info", ok: true, detail: `free tier: ${d?.is_free_tier ?? "unknown"}, usage so far: ${d?.usage ?? "unknown"}, limit: ${d?.limit ?? "none"}` });
  } else {
    steps.push({ name: "key info", ok: false, detail: explainFailure("openrouter", info.status, redact(info.text, key)) });
    if (info.status === 401 || info.status === 403) return report();
  }

  // 2) A tiny real chat completion.
  const chat = (extra: object) => call(fetchFn, `${OPENROUTER_BASE}/chat/completions`, { method: "POST", headers, body: JSON.stringify({ model, temperature: 0, ...extra }) });
  const gen = await chat({ messages: [{ role: "user", content: "Reply with the single word: ok" }] });
  if (gen.ok) {
    const j = gen.json as { model?: string; choices?: { message?: { content?: string | null } }[] };
    const text = j?.choices?.[0]?.message?.content;
    steps.push({ name: "chat", ok: Boolean(text), detail: text ? `answered by ${j.model ?? model}: ${String(text).trim().slice(0, 40)}` : "HTTP 200 but empty answer (free models sometimes return nothing; retry)" });
  } else {
    steps.push({ name: "chat", ok: false, detail: explainFailure("openrouter", gen.status, redact(gen.text, key)) });
    return report();
  }

  // 3) Tool calling. The free router should pick a model that supports it.
  const tool = await chat({
    messages: [{ role: "user", content: WEATHER_TOOL_PROMPT }],
    tools: [{ type: "function", function: { name: "get_stock", description: "Stock level of a product", parameters: { type: "object", properties: { productId: { type: "string" } }, required: ["productId"] } } }],
    tool_choice: "auto",
  });
  if (tool.ok) {
    const j = tool.json as { model?: string; choices?: { message?: { tool_calls?: unknown[] } }[] };
    const called = (j?.choices?.[0]?.message?.tool_calls?.length ?? 0) > 0;
    steps.push({ name: "tool calling", ok: called, detail: called ? `${j.model ?? model} returned a tool call` : `${j.model ?? model} answered in text instead of calling the tool` });
  } else {
    steps.push({ name: "tool calling", ok: false, detail: explainFailure("openrouter", tool.status, redact(tool.text, key)) });
  }
  return report();
}

export function formatReport(r: CheckReport): string {
  return [`${r.ok ? "OK    " : "FAILED"}  ${r.provider}`, ...r.steps.map((s) => `   ${s.ok ? "✓" : "✗"} ${s.name}: ${s.detail}`)].join("\n");
}
