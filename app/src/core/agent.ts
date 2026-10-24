import { executeTool, type ToolContext } from "./tools";
import type { ProposeCtx } from "./run";
import type { Proposal } from "./types";

// The model decided it cannot build a bundle and wants to say something to the customer instead.
export class AgentReply extends Error {
  constructor(
    public readonly kind: "clarification" | "cannot_fulfill",
    public readonly reply: string,
  ) {
    super(`Agent replied (${kind}): ${reply}`);
    this.name = "AgentReply";
  }
}

export type ModelInput =
  | { kind: "user"; text: string }
  | { kind: "toolResults"; results: { name: string; result: unknown }[] }
  | { kind: "nudge"; text: string };

export type ModelTurn = { text?: string; toolCalls: { name: string; args: unknown }[] };

// Any model (real or scripted) only has to implement this one method.
export type AgentModel = { step: (input: ModelInput) => Promise<ModelTurn> };

export async function runAgent(
  request: string,
  ctx: ToolContext,
  model: AgentModel,
  log: ProposeCtx["log"],
  maxSteps = 9,
): Promise<Proposal> {
  let input: ModelInput = { kind: "user", text: request };
  let nudges = 0;

  for (let step = 1; step <= maxSteps; step++) {
    const turn = await model.step(input);
    if (process.env.AGENT_DEBUG) console.error(`[step ${step}]`, JSON.stringify(turn.toolCalls.map((c) => ({ n: c.name, a: c.args }))), turn.text ?? "");

    if (turn.toolCalls.length === 0) {
      if (nudges >= 1) throw new Error("The model finished without submitting a bundle");
      nudges++;
      input = { kind: "nudge", text: "Call the submit_bundle tool with your final bundle." };
      continue;
    }

    const results: { name: string; result: unknown }[] = [];
    for (const call of turn.toolCalls) {
      const stepName = `tool:${call.name}`;
      log(stepName, "started", { args: call.args });
      const out = executeTool(call.name, call.args, ctx);
      if (out.ok) {
        log(stepName, "ok", { args: call.args, result: out.result });
        results.push({ name: call.name, result: out.result });
        if (out.final) return out.final;
        if (out.reply) throw new AgentReply(out.reply.kind, out.reply.message);
      } else {
        // The error is shown on screen AND fed back to the model so it can correct itself.
        log(stepName, "failed", { args: call.args, error: out.error });
        results.push({ name: call.name, result: { error: out.error } });
      }
    }
    input = { kind: "toolResults", results };
  }
  throw new Error(`The model did not submit a bundle within ${maxSteps} steps`);
}
