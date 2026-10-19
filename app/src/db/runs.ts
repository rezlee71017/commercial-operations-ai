import { randomUUID } from "node:crypto";
import { asc, desc, eq, inArray } from "drizzle-orm";
import type { RunEvent } from "../core/types";
import type { RunResult } from "../core/run";
import type { RunSink } from "../core/stream";
import type { Db, Queryable } from "./client";
import { approvals, auditLog, orderItems, orders, runEvents, workflowRuns } from "./schema";

export async function createRun(
  db: Db,
  input: { request: string; owned: string[]; mode: string },
): Promise<string> {
  const id = randomUUID();
  await db.insert(workflowRuns).values({
    id,
    request: input.request,
    owned: input.owned,
    mode: input.mode,
    status: "running",
  });
  await db.insert(auditLog).values({
    actor: "demo-customer",
    action: "run.created",
    entityType: "run",
    entityId: id,
    data: { mode: input.mode },
  });
  return id;
}

// Writes events in order, one after another, without slowing the run down.
export function createRunRecorder(db: Db, runId: string): RunSink {
  let seq = 0;
  let chain: Promise<unknown> = Promise.resolve();
  const enqueue = (job: () => Promise<unknown>) => {
    chain = chain.then(job).catch((e) => console.error("run recorder:", e));
  };

  return {
    event(e: RunEvent) {
      const n = seq++;
      enqueue(() =>
        db.insert(runEvents).values({ runId, seq: n, step: e.step, status: e.status, at: e.at, data: e.data ?? null }),
      );
    },
    async finish(result: RunResult) {
      await chain;
      await db
        .update(workflowRuns)
        .set({ status: result.status, proposal: result.proposal, evaluation: result.evaluation, finishedAt: new Date() })
        .where(eq(workflowRuns.id, runId));
      await db.insert(auditLog).values({
        actor: "system",
        action: "run.finished",
        entityType: "run",
        entityId: runId,
        data: { status: result.status },
      });
    },
    async fail(message: string) {
      await chain;
      await db
        .update(workflowRuns)
        .set({ status: "failed", finishedAt: new Date() })
        .where(eq(workflowRuns.id, runId));
      await db.insert(auditLog).values({
        actor: "system",
        action: "run.failed",
        entityType: "run",
        entityId: runId,
        data: { message },
      });
    },
  };
}

export async function listRuns(db: Queryable, limit = 20) {
  return db
    .select({
      id: workflowRuns.id,
      request: workflowRuns.request,
      status: workflowRuns.status,
      mode: workflowRuns.mode,
      createdAt: workflowRuns.createdAt,
    })
    .from(workflowRuns)
    .orderBy(desc(workflowRuns.createdAt))
    .limit(limit);
}

export async function getRunDetail(db: Queryable, id: string) {
  const [run] = await db.select().from(workflowRuns).where(eq(workflowRuns.id, id));
  if (!run) return null;
  const events = await db.select().from(runEvents).where(eq(runEvents.runId, id)).orderBy(asc(runEvents.seq));
  const [approval] = await db.select().from(approvals).where(eq(approvals.runId, id));
  const [order] = await db.select().from(orders).where(eq(orders.runId, id));
  const items = order ? await db.select().from(orderItems).where(eq(orderItems.orderId, order.id)) : [];
  return {
    run,
    events: events.map((e) => ({ step: e.step, status: e.status as RunEvent["status"], at: e.at, data: e.data ?? undefined })),
    approval: approval ?? null,
    order: order ? { ...order, items } : null,
  };
}

export async function listOrders(db: Queryable, limit = 50) {
  const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(limit);
  if (rows.length === 0) return [];
  const items = await db.select().from(orderItems).where(inArray(orderItems.orderId, rows.map((r) => r.id)));
  return rows.map((o) => ({
    ...o,
    items: items.filter((i) => i.orderId === o.id),
  }));
}

export async function listAudit(db: Queryable, limit = 50) {
  return db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(limit);
}
