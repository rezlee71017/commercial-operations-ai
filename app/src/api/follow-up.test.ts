import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createDb, type Db } from "../db/client";
import { seedIfEmpty } from "../db/seed";

// Follow-ups through the real route handlers, a real (in-memory) database and the mock AI.
describe("POST /api/run follow-ups", () => {
  const g = globalThis as unknown as { __commerceDb?: Promise<Db> };
  const post = (body: unknown, token?: string) =>
    new Request("http://x/api/run", {
      method: "POST",
      body: JSON.stringify(body),
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
    });
  let route: typeof import("../app/api/run/route");
  let runRoute: typeof import("../app/api/runs/[id]/route");
  let decision: typeof import("../app/api/runs/[id]/decision/route");

  beforeAll(async () => {
    vi.stubEnv("OPERATOR_TOKEN", "tok");
    vi.stubEnv("LLM_MODE", "mock");
    const db = await createDb();
    await seedIfEmpty(db);
    g.__commerceDb = Promise.resolve(db);
    route = await import("../app/api/run/route");
    runRoute = await import("../app/api/runs/[id]/route");
    decision = await import("../app/api/runs/[id]/decision/route");
  }, 60000);
  afterAll(() => {
    vi.unstubAllEnvs();
    delete g.__commerceDb;
  });

  const start = async (body: unknown) => {
    const res = await route.POST(post(body));
    if (res.status !== 200) return { res, msgs: [] as { type: string; runId?: string; result?: { status: string } }[], runId: "" };
    const msgs = (await res.text()).trim().split("\n").map((l) => JSON.parse(l));
    return { res, msgs, runId: msgs.find((m) => m.type === "run")?.runId as string };
  };
  const detail = async (id: string) =>
    (await runRoute.GET(post({}, "tok"), { params: Promise.resolve({ id }) })).json();

  it("a follow-up keeps the ownership and records which run it continues", async () => {
    const first = await start({ request: "A case and a charger for my phone", owned: ["phone-a1"] });
    expect(first.res.status).toBe(200);
    const second = await start({ request: "Same again, a case and a charger", previousRunId: first.runId });
    expect(second.res.status).toBe(200);
    expect(second.msgs.some((m) => m.type === "result")).toBe(true);

    const d = await detail(second.runId);
    expect(d.run.owned).toEqual(["phone-a1"]);
    const received = d.events.find((e: { step: string }) => e.step === "request_received");
    expect(received.data.previousRunId).toBe(first.runId);
  });

  it("an explicit owned list in the follow-up wins over the inherited one", async () => {
    const first = await start({ request: "A case and a charger for my phone", owned: ["phone-a1"] });
    const second = await start({ request: "A case and a charger", owned: ["phone-b2"], previousRunId: first.runId });
    expect((await detail(second.runId)).run.owned).toEqual(["phone-b2"]);
  });

  it("an unknown earlier run answers 404, a malformed id answers 400", async () => {
    const missing = await start({ request: "hi there", previousRunId: "does-not-exist" });
    expect(missing.res.status).toBe(404);
    expect((await missing.res.json()).code).toBe("previous_run_not_found");
    expect((await start({ request: "hi there", previousRunId: 123 })).res.status).toBe(400);
    expect((await start({ request: "hi there", previousRunId: "" })).res.status).toBe(400);
  });

  it("a run that was already approved cannot be continued", async () => {
    const first = await start({ request: "I want to buy the Aria phone with a case and a charger." });
    const ok = await decision.POST(post({ decision: "approve" }, "tok"), { params: Promise.resolve({ id: first.runId }) });
    expect((await ok.json()).status).toBe("executed");
    const again = await start({ request: "and a cable", previousRunId: first.runId });
    expect(again.res.status).toBe(409);
    expect((await again.res.json()).code).toBe("previous_not_continuable");
  });
});
