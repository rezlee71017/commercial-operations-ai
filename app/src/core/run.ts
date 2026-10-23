import { ProviderError } from "./gemini-http";
import { evaluateProposal } from "./policy";
import type { Evaluation, Product, Proposal, RunEvent, Rules } from "./types";

export type ProposeCtx = {
  log: (step: string, status: RunEvent["status"], data?: unknown) => void;
  rules: Rules;
};

export type Deps = {
  propose: (request: string, catalog: Product[], owned: string[], ctx: ProposeCtx) => Promise<Proposal>;
  now?: () => string;
  // Called for every event the moment it is recorded (used for live streaming).
  onEvent?: (event: RunEvent) => void;
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
  // "started" is recorded when a step really begins; "ok"/"failed" only AFTER it has finished.
  const log = (step: string, status: RunEvent["status"], data?: unknown) => {
    const event: RunEvent = { step, status, at: now(), data };
    events.push(event);
    deps.onEvent?.(event);
  };

  log("request_received", "ok", { request, owned });
  log("catalog_loaded", "ok", { products: catalog.length });

  let proposal: Proposal;
  log("proposal_generated", "started");
  try {
    proposal = await deps.propose(request, catalog, owned, { log, rules });
    log("proposal_generated", "ok", proposal);
  } catch (e) {
    // A provider failure is recorded as such: customers get a safe message, the operator keeps the detail.
    log(
      "proposal_generated",
      "failed",
      e instanceof ProviderError
        ? { error: e.publicMessage, code: e.kind, providerDetail: e.message }
        : { error: e instanceof Error ? e.message : String(e) },
    );
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
