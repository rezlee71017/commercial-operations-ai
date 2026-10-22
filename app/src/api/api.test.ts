import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createDb, type Db } from "../db/client";
import { seedIfEmpty } from "../db/seed";
import { redactForCustomer, redactNdjson } from "../core/redact";
import { toOperatorProduct } from "../core/operator";
import { checkOperator } from "./operator-auth";
import { createApiClient, ApiError } from "./client";

const req = (auth?: string) => new Request("http://x/api", { headers: auth ? { authorization: auth } : {} });

describe("operator auth", () => {
  it("is open in development when no token is configured", () => {
    expect(checkOperator(req(), { NODE_ENV: "development" }).ok).toBe(true);
  });
  it("is CLOSED in production when no token is configured", () => {
    const r = checkOperator(req(), { NODE_ENV: "production" });
    expect(r).toMatchObject({ ok: false, status: 503, code: "operator_not_configured" });
  });
  it("requires the right bearer token when one is configured", () => {
    const env = { OPERATOR_TOKEN: "s3cret", NODE_ENV: "production" };
    expect(checkOperator(req(), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkOperator(req("Bearer nope"), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkOperator(req("s3cret"), env)).toMatchObject({ ok: false, status: 401 });
    expect(checkOperator(req("Bearer s3cret"), env).ok).toBe(true);
    expect(checkOperator(req("bearer s3cret"), env).ok).toBe(true);
  });
});

describe("customer redaction", () => {
  it("removes cost and margin, even deeply nested, and hides the margin numbers in the rule text", () => {
    const out = redactForCustomer({
      evaluation: {
        totalCents: 100,
        costCents: 60,
        marginPct: 40,
        results: [
          { rule: "stock_available", passed: true, detail: "ok" },
          { rule: "min_margin", passed: false, detail: "Margin 5% is below the minimum 20%" },
        ],
      },
      events: [{ step: "tool", data: { unitCostCents: 3, name: "x" } }],
    });
    const text = JSON.stringify(out);
    expect(text).not.toMatch(/costCents|marginPct|unitCostCents|5%|20%/);
    expect(text).toContain("totalCents");
    expect(text).toContain("profitability");
  });

  it("works on a stream even when a line is split across chunks", async () => {
    const enc = new TextEncoder();
    const line = JSON.stringify({ type: "result", result: { evaluation: { costCents: 9, totalCents: 1 } } }) + "\n";
    const src = new ReadableStream<Uint8Array>({
      start(c) {
        c.enqueue(enc.encode(line.slice(0, 20)));
        c.enqueue(enc.encode(line.slice(20)));
        c.close();
      },
    });
    const text = await new Response(redactNdjson(src)).text();
    expect(text).not.toContain("costCents");
    expect(JSON.parse(text.trim()).result.evaluation.totalCents).toBe(1);
  });

  it("operator product view adds the margin", () => {
    expect(
      toOperatorProduct({ id: "a", name: "A", category: "c", priceCents: 10000, costCents: 7500, stock: 1, isSynthetic: true }).marginPct,
    ).toBe(25);
  });
});

// Full route tests: real handlers, real (in-memory) database, mock AI.
describe("API routes", () => {
  let db: Db;
  const g = globalThis as unknown as { __commerceDb?: Promise<Db> };
  const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
  const json = (path: string, init: RequestInit = {}, token?: string) =>
    new Request(`http://x${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
  let routes: {
    products: typeof import("../app/api/products/route");
    run: typeof import("../app/api/run/route");
    runs: typeof import("../app/api/runs/route");
    decision: typeof import("../app/api/runs/[id]/decision/route");
    summary: typeof import("../app/api/operator/summary/route");
    inventory: typeof import("../app/api/operator/inventory/route");
    rules: typeof import("../app/api/operator/rules/route");
    audit: typeof import("../app/api/operator/audit/route");
    orders: typeof import("../app/api/operator/orders/route");
  };

  beforeAll(async () => {
    vi.stubEnv("OPERATOR_TOKEN", "tok");
    vi.stubEnv("LLM_MODE", "mock");
    db = await createDb();
    await seedIfEmpty(db);
    g.__commerceDb = Promise.resolve(db);
    routes = {
      products: await import("../app/api/products/route"),
      run: await import("../app/api/run/route"),
      runs: await import("../app/api/runs/route"),
      decision: await import("../app/api/runs/[id]/decision/route"),
      summary: await import("../app/api/operator/summary/route"),
      inventory: await import("../app/api/operator/inventory/route"),
      rules: await import("../app/api/operator/rules/route"),
      audit: await import("../app/api/operator/audit/route"),
      orders: await import("../app/api/operator/orders/route"),
    };
  }, 60000);
  afterAll(() => {
    vi.unstubAllEnvs();
    delete g.__commerceDb;
  });

  it("the public catalog has categories and never contains cost or margin", async () => {
    const res = await routes.products.GET();
    const text = await res.text();
    expect(res.status).toBe(200);
    expect(text).not.toMatch(/costCents|marginPct/);
    const body = JSON.parse(text);
    expect(body.products.length).toBeGreaterThanOrEqual(40);
    expect(body.categories.length).toBeGreaterThanOrEqual(10);
  });

  it("operator endpoints answer 401 without the token and 200 with it", async () => {
    for (const [name, handler] of [
      ["summary", routes.summary.GET],
      ["inventory", routes.inventory.GET],
      ["rules", routes.rules.GET],
      ["audit", routes.audit.GET],
      ["orders", routes.orders.GET],
      ["runs", routes.runs.GET],
    ] as const) {
      expect((await handler(json(`/api/operator/${name}`))).status, `${name} without token`).toBe(401);
      expect((await handler(json(`/api/operator/${name}`, {}, "tok"))).status, `${name} with token`).toBe(200);
    }
    const inv = await (await routes.inventory.GET(json("/api/operator/inventory", {}, "tok"))).json();
    expect(inv.products[0]).toHaveProperty("costCents");
    expect(inv.products[0]).toHaveProperty("marginPct");
  });

  const body = JSON.stringify({ request: "I want to buy the Aria phone with a case and a charger." });
  const readRun = async (token?: string) => {
    const res = await routes.run.POST(json("/api/run", { method: "POST", body }, token));
    const text = await res.text();
    const msgs = text.trim().split("\n").map((l) => JSON.parse(l));
    return { text, msgs, runId: msgs.find((m) => m.type === "run").runId as string };
  };

  it("a customer's run stream never contains cost or margin, an operator's does", async () => {
    const customer = await readRun();
    expect(customer.text).not.toMatch(/costCents|marginPct/);
    const result = customer.msgs.find((m) => m.type === "result").result;
    expect(result.status).toBe("awaiting_approval");
    expect(result.evaluation.totalCents).toBeGreaterThan(0);

    const operator = await readRun("tok");
    expect(operator.text).toContain("costCents");
  });

  it("only an operator can decide; approving creates one order that the summary and audit then show", async () => {
    const { runId } = await readRun();
    const post = (token?: string) =>
      routes.decision.POST(json(`/api/runs/${runId}/decision`, { method: "POST", body: JSON.stringify({ decision: "approve" }) }, token), ctx(runId));

    expect((await post()).status).toBe(401);
    const ok = await post("tok");
    expect(ok.status).toBe(200);
    expect((await ok.json()).status).toBe("executed");

    const sum = await (await routes.summary.GET(json("/api/operator/summary", {}, "tok"))).json();
    expect(sum.orders.count).toBe(1);
    expect(sum.orders.revenueCents).toBeGreaterThan(0);
    expect(sum.orders.marginPct).toBeGreaterThanOrEqual(sum.rules.minMarginPct);
    expect(sum.runs.byStatus.executed).toBe(1);
    expect(sum.runs.total).toBeGreaterThanOrEqual(3);

    const audit = await (await routes.audit.GET(json("/api/operator/audit?limit=200", {}, "tok"))).json();
    expect(audit.entries.some((e: { action: string }) => e.action === "run.created")).toBe(true);
  });

  it("rules: invalid values are rejected, valid values are saved and audited", async () => {
    const put = (rules: unknown) =>
      routes.rules.PUT(json("/api/operator/rules", { method: "PUT", body: JSON.stringify(rules) }, "tok"));
    expect((await put({ minMarginPct: -5, maxDiscountPct: 10 })).status).toBe(400);
    expect((await put({ minMarginPct: 20, maxDiscountPct: 120 })).status).toBe(400);
    expect((await put({ minMarginPct: "x" })).status).toBe(400);

    const ok = await put({ minMarginPct: 25, maxDiscountPct: 12 });
    expect(ok.status).toBe(200);
    const now = await (await routes.rules.GET(json("/api/operator/rules", {}, "tok"))).json();
    expect(now).toEqual({ minMarginPct: 25, maxDiscountPct: 12 });
    const audit = await (await routes.audit.GET(json("/api/operator/audit?limit=200", {}, "tok"))).json();
    expect(audit.entries.some((e: { action: string }) => e.action === "rules.updated")).toBe(true);
  });
});

describe("typed client", () => {
  it("reads the run stream even when messages are split across chunks, and returns the result", async () => {
    const enc = new TextEncoder();
    const lines =
      [
        { type: "run", runId: "r1" },
        { type: "event", event: { step: "proposal", status: "ok", at: "t" } },
        { type: "result", result: { status: "awaiting_approval", events: [], proposal: null, evaluation: null } },
      ]
        .map((m) => JSON.stringify(m))
        .join("\n") + "\n";
    const fakeFetch = (async () =>
      new Response(
        new ReadableStream({
          start(c) {
            c.enqueue(enc.encode(lines.slice(0, 33)));
            c.enqueue(enc.encode(lines.slice(33)));
            c.close();
          },
        }),
      )) as unknown as typeof fetch;
    const seen: string[] = [];
    const api = createApiClient({ fetch: fakeFetch });
    const result = await api.streamRun({ request: "x" }, (m) => seen.push(m.type));
    expect(seen).toEqual(["run", "event", "result"]);
    expect(result.status).toBe("awaiting_approval");
  });

  it("turns error responses into ApiError and sends the operator token", async () => {
    let sentAuth: string | null = null;
    const fakeFetch = (async (_u: string, init: RequestInit) => {
      sentAuth = new Headers(init.headers).get("authorization");
      return new Response(JSON.stringify({ error: "Operator token required", code: "unauthorized" }), { status: 401 });
    }) as unknown as typeof fetch;
    const api = createApiClient({ fetch: fakeFetch, operatorToken: "tok" });
    await expect(api.operator.summary()).rejects.toMatchObject({ status: 401, code: "unauthorized" });
    expect(sentAuth).toBe("Bearer tok");
    await expect(api.operator.summary()).rejects.toBeInstanceOf(ApiError);
  });
});
