import { AgentReply } from "./agent";
import type { PreviousTurn } from "./conversation";
import { ProviderError } from "./gemini-http";
import { evaluateProposal } from "./policy";
import type { Evaluation, Product, Proposal, RunEvent, Rules } from "./types";

export type ProposeCtx = {
  log: (step: string, status: RunEvent["status"], data?: unknown) => void;
  rules: Rules;
  previous?: PreviousTurn; // the turn this one continues, if any
};

export type Deps = {
  propose: (request: string, catalog: Product[], owned: string[], ctx: ProposeCtx) => Promise<Proposal>;
  now?: () => string;
  // Called for every event the moment it is recorded (used for live streaming).
  onEvent?: (event: RunEvent) => void;
};

export type RunResult = {
  status: "awaiting_approval" | "needs_input" | "rejected_by_policy" | "failed";
  events: RunEvent[];
  proposal: Proposal | null;
  evaluation: Evaluation | null;
  // Present when status is "needs_input": the model asked a question or explained why it cannot build a bundle.
  reply?: { kind: "clarification" | "cannot_fulfill"; message: string };
};

export async function runWorkflow(
  request: string,
  catalog: Product[],
  rules: Rules,
  deps: Deps,
  owned: string[] = [],
  previous?: PreviousTurn,
): Promise<RunResult> {
  const events: RunEvent[] = [];
  const now = deps.now ?? (() => new Date().toISOString());
  // "started" is recorded when a step really begins; "ok"/"failed" only AFTER it has finished.
  const log = (step: string, status: RunEvent["status"], data?: unknown) => {
    const event: RunEvent = { step, status, at: now(), data };
    events.push(event);
    deps.onEvent?.(event);
  };

  log("request_received", "ok", { request, owned, ...(previous ? { previousRunId: previous.runId } : {}) });
  log("catalog_loaded", "ok", { products: catalog.length });

  let proposal: Proposal;
  log("proposal_generated", "started");
  try {
    proposal = await deps.propose(request, catalog, owned, { log, rules, previous });
    // The customer's budget carries over to a follow-up unless the model states a new one.
    if (previous?.bundle?.budgetCents !== undefined && proposal.budgetCents === undefined) {
      proposal = { ...proposal, budgetCents: previous.bundle.budgetCents };
    }
    log("proposal_generated", "ok", proposal);
  } catch (e) {
    if (e instanceof AgentReply) {
      // Not a failure: the agent finished its task by talking to the customer. No bundle exists, so no policy check.
      const reply = { kind: e.kind, message: e.reply };
      log("proposal_generated", "ok", { reply });
      return { status: "needs_input", events, proposal: null, evaluation: null, reply };
    }
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
