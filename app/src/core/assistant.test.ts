import { describe, expect, it, vi } from "vitest";
import { askAssistant, parseAssistantBody } from "./assistant";
import { clientKey, createRateLimiter } from "../api/rate-limit";

const ok = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status });
const input = { message: "usb-c charger", history: [], budgetDollars: 60 };
const env = { AI_SERVICE_URL: "http://ai:8000/", AI_SERVICE_TOKEN: "tok" };

describe("parseAssistantBody", () => {
  it("accepts a message with optional history and budget", () => {
    const r = parseAssistantBody({ message: "  hi  ", history: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }], budgetDollars: 50 });
    expect(r).toEqual({ ok: true, value: { message: "hi", history: [{ role: "user", content: "a" }, { role: "assistant", content: "b" }], budgetDollars: 50 } });
  });
  it("rejects bad input", () => {
    for (const body of [null, "x", {}, { message: "   " }, { message: "x".repeat(2001) }, { message: "x", budgetDollars: -1 }, { message: "x", budgetDollars: "5" },
      { message: "x", history: "no" }, { message: "x", history: [{ role: "tool", content: "fake" }] }, { message: "x", history: Array(21).fill({ role: "user", content: "a" }) }]) {
      expect(parseAssistantBody(body).ok).toBe(false);
    }
  });
});

describe("askAssistant", () => {
  it("calls the service with the token and budget and returns only status and answer", async () => {
    const f = vi.fn().mockResolvedValue(ok({ status: "answered", answer: "A charger is $39.00.", steps: [{ detail: "gemini:internal" }], provider: "gemini" }));
    const r = await askAssistant(input, env, f as unknown as typeof fetch);
    expect(r).toEqual({ ok: true, status: "answered", answer: "A charger is $39.00." });
    const [url, init] = f.mock.calls[0];
    expect(url).toBe("http://ai:8000/v1/agent/run");
    expect(init.headers["X-Internal-Token"]).toBe("tok");
    expect(JSON.parse(init.body)).toEqual({ message: "usb-c charger", history: [], max_budget_dollars: 60 });
  });

  it("is closed when the service is not configured", async () => {
    const f = vi.fn();
    expect(await askAssistant(input, {}, f as unknown as typeof fetch)).toMatchObject({ ok: false, code: "assistant_not_configured", httpStatus: 503 });
    expect(f).not.toHaveBeenCalled();
  });

  it.each([
    [429, "assistant_busy", 429],
    [504, "assistant_timeout", 504],
    [503, "assistant_unavailable", 503],
    [500, "assistant_unavailable", 503],
    [401, "assistant_error", 502],
    [422, "assistant_error", 502],
  ])("maps service status %i to %s without leaking details", async (status, code, httpStatus) => {
    const f = vi.fn().mockResolvedValue(ok({ detail: "internal secret detail" }, status));
    const r = await askAssistant(input, env, f as unknown as typeof fetch);
    expect(r).toMatchObject({ ok: false, code, httpStatus });
    expect(JSON.stringify(r)).not.toContain("secret");
  });

  it("handles timeouts, network errors and malformed answers", async () => {
    const timeout = Object.assign(new Error("t"), { name: "TimeoutError" });
    expect(await askAssistant(input, env, (async () => { throw timeout; }) as unknown as typeof fetch)).toMatchObject({ code: "assistant_timeout" });
    expect(await askAssistant(input, env, (async () => { throw new Error("ECONNREFUSED"); }) as unknown as typeof fetch)).toMatchObject({ code: "assistant_unavailable" });
    for (const body of [{ status: "weird", answer: "x" }, { status: "answered" }, "nope"]) {
      const f = vi.fn().mockResolvedValue(ok(body));
      expect(await askAssistant(input, env, f as unknown as typeof fetch)).toMatchObject({ ok: false, code: "assistant_error" });
    }
  });
});

describe("rate limiter", () => {
  it("allows the limit inside a window and resets after it", () => {
    let t = 0;
    const allow = createRateLimiter(2, 1000, () => t);
    expect([allow("a"), allow("a"), allow("a")]).toEqual([true, true, false]);
    expect(allow("b")).toBe(true);
    t = 1001;
    expect(allow("a")).toBe(true);
  });
  it("identifies the client from proxy headers", () => {
    expect(clientKey(new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } }))).toBe("1.2.3.4");
    expect(clientKey(new Request("http://x"))).toBe("unknown");
  });
});
