import { afterEach, describe, expect, it, vi } from "vitest";
import { geminiFetch, parseRetryDelayMs, ProviderError } from "./gemini-http";
import { redactForCustomer } from "./redact";
import { runWorkflow } from "./run";
import { seedProducts, defaultRules } from "../data/seed-data";

afterEach(() => vi.unstubAllGlobals());

const rateLimitBody = (delay: string) =>
  JSON.stringify({ error: { code: 429, details: [{ "@type": "type.googleapis.com/google.rpc.RetryInfo", retryDelay: delay }] } });

describe("Gemini HTTP helper (fake network, NOT the real API)", () => {
  it("reads the wait time Gemini asks for", () => {
    expect(parseRetryDelayMs(rateLimitBody("40s"))).toBe(41_000);
    expect(parseRetryDelayMs("Please retry in 22.5s.")).toBe(23_500);
    expect(parseRetryDelayMs("nothing here")).toBeNull();
  });

  it("waits and retries after a 429, then succeeds", async () => {
    const replies = [new Response(rateLimitBody("20s"), { status: 429 }), new Response("{}", { status: 200 })];
    vi.stubGlobal("fetch", async () => replies.shift()!);
    const sleep = vi.fn(async () => undefined);
    const res = await geminiFetch("http://x", {}, { sleep });
    expect(res.ok).toBe(true);
    expect(sleep).toHaveBeenCalledWith(21_000);
  });

  it("does not wait when Gemini asks for longer than the limit: fails fast as rate_limited", async () => {
    vi.stubGlobal("fetch", async () => new Response(rateLimitBody("120s"), { status: 429 }));
    const sleep = vi.fn(async () => undefined);
    const err = await geminiFetch("http://x", {}, { sleep }).catch((e) => e);
    expect(err).toBeInstanceOf(ProviderError);
    expect(err.kind).toBe("rate_limited");
    expect(sleep).not.toHaveBeenCalled();
  });

  it("gives up after the maximum number of retries", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", async () => (calls++, new Response(rateLimitBody("1s"), { status: 429 })));
    const err = await geminiFetch("http://x", {}, { sleep: async () => undefined, maxRetries: 2 }).catch((e) => e);
    expect(err.kind).toBe("rate_limited");
    expect(calls).toBe(3);
  });

  it("does not retry a wrong key (401) and classifies it as auth", async () => {
    let calls = 0;
    vi.stubGlobal("fetch", async () => (calls++, new Response("denied", { status: 401 })));
    const err = await geminiFetch("http://x", {}, { sleep: async () => undefined }).catch((e) => e);
    expect(err.kind).toBe("auth");
    expect(calls).toBe(1);
  });

  it("maps a timeout to a timeout error", async () => {
    vi.stubGlobal("fetch", async () => {
      throw new DOMException("timed out", "TimeoutError");
    });
    const err = await geminiFetch("http://x", {}, { timeoutMs: 5 }).catch((e) => e);
    expect(err.kind).toBe("timeout");
  });

  it("a provider failure shows the customer a safe message and keeps the detail for the operator only", async () => {
    const propose = async () => {
      throw new ProviderError("rate_limited", 429, "quota exceeded for project 12345, see https://ai.dev/billing");
    };
    const result = await runWorkflow("any request", seedProducts, defaultRules, { propose }, []);
    expect(result.status).toBe("failed");
    const failed = result.events.find((e) => e.status === "failed")!;
    const data = failed.data as { error: string; code: string; providerDetail: string };
    expect(data.code).toBe("rate_limited");
    expect(data.error).not.toContain("quota");
    expect(data.providerDetail).toContain("quota exceeded");

    const customerView = JSON.stringify(redactForCustomer(failed));
    expect(customerView).not.toContain("quota");
    expect(customerView).not.toContain("billing");
    expect(customerView).toContain("busy right now");
  });
});
