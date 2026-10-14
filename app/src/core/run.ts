import { evaluateProposal } from "./policy";
import type { Evaluation, Product, Proposal, RunEvent, Rules } from "./types";

export type Deps = {
  propose: (request: string, catalog: Product[], owned: string[]) => Promise<Proposal>;
  now?: () => string;
};

export type RunResult = {
  status: "awaiting_approval" | "rejected_by_policy" | "failed";
  events: RunEvent[];
  proposal: Proposal | null;
  evaluation: Evaluation | null;
};

export async function runWorkflow(
  request: string,
  catalog: Product[],
  rules: Rules,
  deps: Deps,
  owned: string[] = [],
): Promise<RunResult> {
  const events: RunEvent[] = [];
  const now = deps.now ?? (() => new Date().toISOString());
  // An event is recorded only AFTER the step has really finished.
  const log = (step: string, status: "ok" | "failed", data?: unknown) =>
    events.push({ step, status, at: now(), data });

  log("request_received", "ok", { request, owned });
  log("catalog_loaded", "ok", { products: catalog.length });

  let proposal: Proposal;
  try {
    proposal = await deps.propose(request, catalog, owned);
    log("proposal_generated", "ok", proposal);
  } catch (e) {
    log("proposal_generated", "failed", { error: e instanceof Error ? e.message : String(e) });
    return { status: "failed", events, proposal: null, evaluation: null };
  }

  const evaluation = evaluateProposal(proposal, catalog, rules, owned);
  log("policy_checked", evaluation.approvable ? "ok" : "failed", evaluation.results);

  return {
    status: evaluation.approvable ? "awaiting_approval" : "rejected_by_policy",
    events,
    proposal,
    evaluation,
  };
}
