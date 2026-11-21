import { describe, expect, it } from "vitest";
import { checkGemini, checkOpenRouter, explainFailure, formatReport, keyShape } from "./provider-check";

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const KEY = "AQ.abcdefghijklmnopqrstuvwxyz";

function router(handlers: Record<string, () => Response>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = String(input);
    const hit = Object.keys(handlers).find((k) => url.includes(k));
    if (!hit) throw new Error(`unexpected request: ${url}`);
    return handlers[hit]();
  }) as typeof fetch;
}

describe("key shape", () => {
  it("rejects a missing, quoted or whitespace key without echoing it", () => {
    expect(keyShape(undefined).ok).toBe(false);
    expect(keyShape(`"${KEY}"`).detail).toContain("quotes");
    expect(keyShape(`${KEY}\n`).detail).toContain("whitespace");
    expect(keyShape(KEY).ok).toBe(true);
    expect(keyShape(KEY).detail).not.toContain(KEY);
  });
});

describe("gemini check", () => {
  const ok = {
    "/models?pageSize": () => json({ models: [{ name: "models/gemini-3.5-flash-lite", supportedGenerationMethods: ["generateContent"] }, { name: "models/embed", supportedGenerationMethods: ["embedContent"] }] }),
  };

  it("passes when listing, generation and tool calling work", async () => {
    let n = 0;
    const f = router({
      ...ok,
      ":generateContent": () => (n++ === 0 ? json({ candidates: [{ content: { parts: [{ text: "ok" }] } }] }) : json({ candidates: [{ content: { parts: [{ functionCall: { name: "get_stock" } }] } }] })),
    });
    const r = await checkGemini({ GEMINI_API_KEY: KEY }, f);
    expect(r.ok).toBe(true);
    expect(r.steps.map((s) => s.name)).toEqual(["key", "list models", "configured model", "generate", "tool calling"]);
    expect(formatReport(r)).not.toContain(KEY);
  });

  it("explains an unknown model and suggests available ones", async () => {
    const r = await checkGemini({ GEMINI_API_KEY: KEY, GEMINI_MODEL: "gemini-nope" }, router(ok));
    expect(r.ok).toBe(false);
    expect(r.steps.at(-1)?.detail).toContain("gemini-3.5-flash-lite");
  });

  it("explains an invalid key and a quota error without leaking the key", async () => {
    const bad = await checkGemini({ GEMINI_API_KEY: KEY }, router({ "/models?pageSize": () => json({ error: { status: "INVALID_ARGUMENT", message: `API key not valid ${KEY}`, details: [{ reason: "API_KEY_INVALID" }] } }, 400) }));
    expect(bad.steps.at(-1)?.detail).toContain("not valid");
    expect(JSON.stringify(bad)).not.toContain(KEY);

    const quota = await checkGemini({ GEMINI_API_KEY: KEY }, router({ ...ok, ":generateContent": () => json({ error: { status: "RESOURCE_EXHAUSTED" } }, 429) }));
    expect(quota.steps.at(-1)).toMatchObject({ name: "generate", ok: false });
    expect(quota.steps.at(-1)?.detail).toContain("quota");
  });

  it("fails fast without a key and reports a network failure", async () => {
    expect((await checkGemini({}, router({}))).steps).toHaveLength(1);
    const f = (async () => {
      throw new Error("ENOTFOUND");
    }) as unknown as typeof fetch;
    expect((await checkGemini({ GEMINI_API_KEY: KEY }, f)).steps.at(-1)?.detail).toContain("network error");
  });
});

describe("openrouter check", () => {
  it("passes and reports which model answered", async () => {
    let n = 0;
    const f = router({
      "/key": () => json({ data: { is_free_tier: true, usage: 0, limit: null } }),
      "/chat/completions": () =>
        n++ === 0
          ? json({ model: "vendor/free-model:free", choices: [{ message: { content: "ok" } }] })
          : json({ model: "vendor/free-model:free", choices: [{ message: { content: null, tool_calls: [{ function: { name: "get_stock" } }] } }] }),
    });
    const r = await checkOpenRouter({ OPENROUTER_API_KEY: KEY }, f);
    expect(r.ok).toBe(true);
    expect(r.steps.find((s) => s.name === "chat")?.detail).toContain("vendor/free-model:free");
  });

  it("stops on a rejected key and explains a rate limit", async () => {
    const rejected = await checkOpenRouter({ OPENROUTER_API_KEY: KEY }, router({ "/key": () => json({ error: { message: "No auth" } }, 401) }));
    expect(rejected.steps.map((s) => s.name)).toEqual(["key", "key info"]);

    const limited = await checkOpenRouter({ OPENROUTER_API_KEY: KEY }, router({ "/key": () => json({ data: {} }), "/chat/completions": () => json({ error: {} }, 429) }));
    expect(limited.steps.at(-1)?.detail).toContain("20 requests/minute");
  });

  it("flags a model that answers in text instead of calling the tool", async () => {
    const f = router({
      "/key": () => json({ data: {} }),
      "/chat/completions": () => json({ model: "m", choices: [{ message: { content: "ok" } }] }),
    });
    const r = await checkOpenRouter({ OPENROUTER_API_KEY: KEY }, f);
    expect(r.steps.at(-1)).toMatchObject({ name: "tool calling", ok: false });
  });
});

describe("explainFailure", () => {
  it("maps common statuses", () => {
    expect(explainFailure("gemini", 404, "")).toContain("model or endpoint not found");
    expect(explainFailure("openrouter", 503, "")).toContain("unavailable");
  });
});
