import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { PGLiteSocketServer } from "@electric-sql/pglite-socket";
import { openHosted, type DbHandle } from "./client";
import { decideRun } from "./execute";
import { loadCatalog, loadRules } from "./repo";
import { createRun, createRunRecorder, getRunDetail, listOrders } from "./runs";
import { seedIfEmpty } from "./seed";

// This test checks the code path used for a HOSTED database such as Supabase: the "postgres"
// driver talking to a Postgres server over the network. The server here is PGlite exposed on a
// local port, because a real Supabase project cannot be used in an automated test.
// It proves our code works through that driver. It does NOT prove that your Supabase account,
// network or credentials work: for that run "npm run db:check" with your DATABASE_URL.

let server: PGLiteSocketServer;
let handle: DbHandle;
let backing: PGlite;

beforeAll(async () => {
  process.env.DB_POOL_MAX = "1";
  backing = await PGlite.create();
  const port = 55000 + Math.floor(Math.random() * 900);
  server = new PGLiteSocketServer({ db: backing, port, host: "127.0.0.1" });
  await server.start();
  handle = openHosted(`postgres://postgres:postgres@127.0.0.1:${port}/postgres`);
  await handle.migrate();
  await seedIfEmpty(handle.db);
}, 90000);

afterAll(async () => {
  await handle?.close().catch(() => undefined);
  await server?.stop().catch(() => undefined);
  await backing?.close().catch(() => undefined);
});

describe("hosted Postgres driver", () => {
  it("migrates, seeds and reads the catalog", async () => {
    expect(handle.kind).toBe("postgres");
    const catalog = await loadCatalog(handle.db);
    expect(catalog.length).toBeGreaterThanOrEqual(40);
    expect(await loadRules(handle.db)).toEqual({ minMarginPct: 20, maxDiscountPct: 15 });
  });

  it("runs the full approve-and-execute transaction", async () => {
    const db = handle.db;
    const runId = await createRun(db, { request: "x", owned: [], mode: "test" });
    const sink = createRunRecorder(db, runId);
    sink.event({ step: "request_received", status: "ok", at: "T" });
    await sink.finish({
      status: "awaiting_approval",
      events: [],
      proposal: { items: [{ productId: "mouse-m1", qty: 2 }], discountPct: 0 },
      evaluation: null,
    });
    const before = (await loadCatalog(db)).find((p) => p.id === "mouse-m1")!.stock;
    const r = await decideRun(db, runId, "approve");
    expect(r.ok && r.status).toBe("executed");
    expect((await loadCatalog(db)).find((p) => p.id === "mouse-m1")!.stock).toBe(before - 2);
    expect((await listOrders(db)).length).toBe(1);
    expect((await getRunDetail(db, runId))?.events.length).toBe(1);
  });
});
