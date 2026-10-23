import { randomUUID } from "node:crypto";
import { and, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { evaluateProposal } from "../core/policy";
import type { Proposal, RuleResult } from "../core/types";
import type { Db } from "./client";
import { loadCatalog, loadRules } from "./repo";
import { approvals, auditLog, inventory, orderItems, orders, workflowRuns } from "./schema";

export type DecisionResult =
  | { ok: true; status: "executed"; orderId: string; totalCents: number; replay: boolean }
  | { ok: true; status: "rejected"; replay: boolean }
  | { ok: false; code: "not_found" | "not_awaiting" | "blocked"; message: string; reasons?: RuleResult[] };

const ProposalSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number() })),
  discountPct: z.number(),
  explanation: z.string().optional(),
  budgetCents: z.number().int().nonnegative().optional(),
});

// Thrown inside the transaction to undo everything it did so far.
class Blocked extends Error {
  constructor(
    message: string,
    public reasons?: RuleResult[],
  ) {
    super(message);
  }
}

// The only way a proposal becomes a real change. It:
//  1. loads the STORED proposal (the browser only sends a run id and a decision),
//  2. checks the business rules AGAIN against the current database (stock may have changed),
//  3. removes stock, creates the order and records the approval and audit trail,
//  all in one transaction: either everything happens or nothing does.
export async function decideRun(
  db: Db,
  runId: string,
  decision: "approve" | "reject",
  note?: string,
  actor = "demo-merchant",
): Promise<DecisionResult> {
  let outcome: DecisionResult;
  try {
    outcome = await db.transaction(async (tx): Promise<DecisionResult> => {
      // Lock this run so two clicks at the same moment are handled one after the other.
      const [run] = await tx.select().from(workflowRuns).where(eq(workflowRuns.id, runId)).for("update");
      if (!run) return { ok: false, code: "not_found", message: "Run not found" };

      if (run.status !== "awaiting_approval") {
        if (run.status === "executed" && decision === "approve") {
          const [o] = await tx.select().from(orders).where(eq(orders.runId, runId));
          if (o) return { ok: true, status: "executed", orderId: o.id, totalCents: o.totalCents, replay: true };
        }
        if (run.status === "rejected" && decision === "reject") return { ok: true, status: "rejected", replay: true };
        return { ok: false, code: "not_awaiting", message: `This run is '${run.status}', not awaiting approval` };
      }

      if (decision === "reject") {
        await tx.insert(approvals).values({ runId, decision: "rejected", note: note ?? null });
        await tx.update(workflowRuns).set({ status: "rejected" }).where(eq(workflowRuns.id, runId));
        await tx.insert(auditLog).values({
          actor,
          action: "run.rejected",
          entityType: "run",
          entityId: runId,
          data: { note: note ?? null },
        });
        return { ok: true, status: "rejected", replay: false };
      }

      const parsed = ProposalSchema.safeParse(run.proposal);
      if (!parsed.success) throw new Blocked("The stored proposal is invalid");
      const proposal: Proposal = parsed.data;

      // Check the rules again against what the database says NOW.
      const [catalog, rules] = await Promise.all([loadCatalog(tx), loadRules(tx)]);
      const evaluation = evaluateProposal(proposal, catalog, rules, run.owned);
      if (!evaluation.approvable) {
        throw new Blocked(
          "The proposal no longer passes the business rules",
          evaluation.results.filter((r) => !r.passed),
        );
      }

      // Remove stock. The WHERE clause makes it impossible to go below zero.
      const qty = new Map<string, number>();
      for (const i of proposal.items) qty.set(i.productId, (qty.get(i.productId) ?? 0) + i.qty);
      for (const [productId, q] of qty) {
        const updated = await tx
          .update(inventory)
          .set({ onHand: sql`${inventory.onHand} - ${q}`, updatedAt: new Date() })
          .where(and(eq(inventory.productId, productId), gte(inventory.onHand, q)))
          .returning({ productId: inventory.productId });
        if (updated.length === 0) throw new Blocked(`Not enough stock for ${productId}`);
      }

      const byId = new Map(catalog.map((p) => [p.id, p]));
      const orderId = `ord_${randomUUID().slice(0, 8)}`;
      await tx.insert(orders).values({
        id: orderId,
        runId,
        status: "confirmed",
        subtotalCents: evaluation.subtotalCents,
        totalCents: evaluation.totalCents,
        discountPct: proposal.discountPct,
      });
      await tx.insert(orderItems).values(
        [...qty].map(([productId, q]) => ({
          orderId,
          productId,
          qty: q,
          unitPriceCents: byId.get(productId)!.priceCents,
          unitCostCents: byId.get(productId)!.costCents,
        })),
      );
      await tx.insert(approvals).values({ runId, decision: "approved", note: note ?? null });
      await tx.update(workflowRuns).set({ status: "executed" }).where(eq(workflowRuns.id, runId));
      await tx.insert(auditLog).values([
        { actor, action: "run.approved", entityType: "run", entityId: runId, data: { note: note ?? null } },
        {
          actor: "system",
          action: "inventory.decremented",
          entityType: "run",
          entityId: runId,
          data: Object.fromEntries(qty),
        },
        {
          actor: "system",
          action: "order.created",
          entityType: "order",
          entityId: orderId,
          data: { totalCents: evaluation.totalCents },
        },
      ]);
      return { ok: true, status: "executed", orderId, totalCents: evaluation.totalCents, replay: false };
    });
  } catch (e) {
    if (!(e instanceof Blocked)) throw e;
    // The transaction was rolled back: nothing changed. Record why, in a separate small transaction.
    await db.transaction(async (tx) => {
      await tx.update(workflowRuns).set({ status: "blocked" }).where(eq(workflowRuns.id, runId));
      await tx.insert(auditLog).values({
        actor,
        action: "run.blocked",
        entityType: "run",
        entityId: runId,
        data: { message: e.message, reasons: e.reasons ?? null },
      });
    });
    return { ok: false, code: "blocked", message: e.message, reasons: e.reasons };
  }
  return outcome;
}
