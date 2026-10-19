import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { eq, sql } from "drizzle-orm";
import { createDb, type Db } from "./client";
import { decideRun } from "./execute";
import { loadCatalog } from "./repo";
import { createRun, createRunRecorder, getRunDetail, listAudit, listOrders } from "./runs";
import { seedIfEmpty } from "./seed";
import { inventory, orders } from "./schema";
import type { RunResult } from "../core/run";

let db: Db;

beforeAll(async () => {
  db = await createDb(); // one in-memory database, created once (starting it takes a few seconds)
}, 60000);

beforeEach(async () => {
  // Every test starts from a clean, freshly seeded database.
  await db.execute(
    sql`TRUNCATE TABLE audit_log, order_items, orders, approvals, run_events, workflow_runs, product_compat, inventory, products, categories, policies RESTART IDENTITY CASCADE`,
  );
  await seedIfEmpty(db);
}, 60000);

const stockOf = async (id: string) => (await loadCatalog(db)).find((p) => p.id === id)!.stock;

// Creates a stored run exactly like the app does: recorded events, then the final result.
async function storedRun(items: { productId: string; qty: number }[], discountPct = 0, owned: string[] = []) {
  const runId = await createRun(db, { request: "test", owned, mode: "test" });
  const sink = createRunRecorder(db, runId);
  sink.event({ step: "request_received", status: "ok", at: "T1" });
  sink.event({ step: "proposal_generated", status: "ok", at: "T2" });
  const result: RunResult = {
    status: "awaiting_approval",
    events: [],
    proposal: { items, discountPct },
    evaluation: null,
  };
  await sink.finish(result);
  return runId;
}

describe("approval and execution", () => {
  it("stores the run and its events in order", async () => {
    const runId = await storedRun([{ productId: "case-a1", qty: 1 }], 0, ["phone-a1"]);
    const detail = await getRunDetail(db, runId);
    expect(detail?.run.status).toBe("awaiting_approval");
    expect(detail?.events.map((e) => e.step)).toEqual(["request_received", "proposal_generated"]);
  });

  it("approving removes stock, creates one order with exact money, and records the audit trail", async () => {
    const before = await stockOf("phone-a1");
    const runId = await storedRun([{ productId: "phone-a1", qty: 2 }, { productId: "case-a1", qty: 1 }], 5);
    const r = await decideRun(db, runId, "approve", "looks good");
    expect(r.ok && r.status).toBe("executed");
    expect(await stockOf("phone-a1")).toBe(before - 2);
    const [order] = await listOrders(db);
    // (2 x 600.00 + 20.00) = 1220.00, minus 5% = 1159.00
    expect(order.subtotalCents).toBe(122000);
    expect(order.totalCents).toBe(115900);
    expect(order.items.map((i) => i.productId).sort()).toEqual(["case-a1", "phone-a1"]);
    expect((await getRunDetail(db, runId))?.run.status).toBe("executed");
    const actions = (await listAudit(db)).map((a) => a.action);
    expect(actions).toEqual(expect.arrayContaining(["run.approved", "inventory.decremented", "order.created"]));
  });

  it("approving twice (even at the same moment) creates only ONE order and removes stock only once", async () => {
    const before = await stockOf("phone-a1");
    const runId = await storedRun([{ productId: "phone-a1", qty: 1 }]);
    const [a, b] = await Promise.all([decideRun(db, runId, "approve"), decideRun(db, runId, "approve")]);
    expect(a.ok && b.ok).toBe(true);
    expect((await listOrders(db)).length).toBe(1);
    expect(await stockOf("phone-a1")).toBe(before - 1);
    const replays = [a, b].filter((x) => x.ok && x.status === "executed" && x.replay).length;
    expect(replays).toBe(1);
  });

  it("rejecting changes nothing except the run status", async () => {
    const before = await stockOf("phone-a1");
    const runId = await storedRun([{ productId: "phone-a1", qty: 1 }]);
    const r = await decideRun(db, runId, "reject", "not now");
    expect(r.ok && r.status).toBe("rejected");
    expect(await stockOf("phone-a1")).toBe(before);
    expect((await listOrders(db)).length).toBe(0);
    // A rejected run cannot be approved afterwards.
    const late = await decideRun(db, runId, "approve");
    expect(late.ok).toBe(false);
    expect(!late.ok && late.code).toBe("not_awaiting");
  });

  it("re-checks the rules at approval time: stock that disappeared blocks the order and changes nothing", async () => {
    const runId = await storedRun([{ productId: "phone-d4", qty: 2 }]);
    // Meanwhile someone else bought the stock
    await db.update(inventory).set({ onHand: 1 }).where(eq(inventory.productId, "phone-d4"));
    const r = await decideRun(db, runId, "approve");
    expect(r.ok).toBe(false);
    expect(!r.ok && r.code).toBe("blocked");
    expect(!r.ok && r.reasons?.map((x) => x.rule)).toContain("stock_available");
    expect(await stockOf("phone-d4")).toBe(1);
    expect((await listOrders(db)).length).toBe(0);
    expect((await getRunDetail(db, runId))?.run.status).toBe("blocked");
    expect((await listAudit(db)).map((a) => a.action)).toContain("run.blocked");
  });

  it("never lets stock go negative or create a partial order when one line fails", async () => {
    const runId = await storedRun([{ productId: "phone-a1", qty: 1 }, { productId: "phone-d4", qty: 2 }]);
    await db.update(inventory).set({ onHand: 0 }).where(eq(inventory.productId, "phone-d4"));
    const aBefore = await stockOf("phone-a1");
    await decideRun(db, runId, "approve");
    expect(await stockOf("phone-a1")).toBe(aBefore); // the first line was NOT applied either
    expect(await db.select().from(orders)).toHaveLength(0);
  });

  it("handles unknown runs and runs that are not awaiting approval", async () => {
    const missing = await decideRun(db, "no-such-run", "approve");
    expect(!missing.ok && missing.code).toBe("not_found");
    const runId = await createRun(db, { request: "x", owned: [], mode: "test" }); // still 'running'
    const early = await decideRun(db, runId, "approve");
    expect(!early.ok && early.code).toBe("not_awaiting");
  });
});
