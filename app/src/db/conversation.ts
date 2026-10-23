import { z } from "zod";
import { MAX_HISTORY, type PreviousTurn } from "../core/conversation";
import type { Queryable } from "./client";
import { getRunDetail } from "./runs";

// A follow-up may continue a run that is still open (a question was asked, or a bundle is waiting for the store)
// or that the rules turned down. A finished or failed run is not continued.
const CONTINUABLE = new Set(["needs_input", "awaiting_approval", "rejected_by_policy"]);

const BundleSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number() })),
  discountPct: z.number(),
  budgetCents: z.number().optional(),
});

export type LoadPrevious =
  | { ok: true; turn: PreviousTurn }
  | { ok: false; code: "previous_run_not_found" | "previous_not_continuable"; message: string };

const eventData = (events: { step: string; status: string; data?: unknown }[], step: string, status = "ok") =>
  events.find((e) => e.step === step && e.status === status)?.data as Record<string, unknown> | undefined;

export async function loadPreviousTurn(db: Queryable, runId: string): Promise<LoadPrevious> {
  const last = await getRunDetail(db, runId);
  if (!last) return { ok: false, code: "previous_run_not_found", message: "The earlier run was not found" };
  if (!CONTINUABLE.has(last.run.status)) {
    return { ok: false, code: "previous_not_continuable", message: `The earlier run is '${last.run.status}' and cannot be continued` };
  }

  // Walk back along the chain to collect the earlier customer messages (at most MAX_HISTORY in total).
  const requests = [last.run.request];
  let link = eventData(last.events, "request_received")?.previousRunId;
  while (typeof link === "string" && requests.length < MAX_HISTORY) {
    const older = await getRunDetail(db, link);
    if (!older) break;
    requests.unshift(older.run.request);
    link = eventData(older.events, "request_received")?.previousRunId;
  }

  const reply = eventData(last.events, "proposal_generated")?.reply as PreviousTurn["reply"] | undefined;
  const bundle = BundleSchema.safeParse(last.run.proposal);
  return {
    ok: true,
    turn: {
      runId,
      requests,
      reply: reply && typeof reply.message === "string" ? reply : undefined,
      bundle: bundle.success ? bundle.data : undefined,
      owned: last.run.owned,
    },
  };
}
