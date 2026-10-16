import { describe, expect, it } from "vitest";
import { runAgent, type AgentModel, type ModelTurn } from "./agent";
import { catalog, rules } from "../data/catalog";

const ctx = { catalog, rules, owned: [] as string[] };
const scripted = (turns: ModelTurn[]): AgentModel => {
  let i = 0;
  return { step: async () => turns[i++] ?? { toolCalls: [] } };
};
const call = (name: string, args: unknown): ModelTurn => ({ toolCalls: [{ name, args }] });

function recorder() {
  const seen: string[] = [];
  return { seen, log: (step: string, status: string) => void seen.push(`${step}:${status}`) };
}

const phoneCase = [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }];

describe("runAgent", () => {
  it("records every tool call and lets the model correct itself after a failed check", async () => {
    const { seen, log } = recorder();
    const proposal = await runAgent(
      "x",
      ctx,
      scripted([
        call("search_products", { query: "aria" }),
        call("check_bundle", { items: phoneCase, discountPct: 15 }), // margin too low -> not approvable
        call("check_bundle", { items: phoneCase, discountPct: 0 }),
        call("submit_bundle", { items: phoneCase, discountPct: 0, explanation: "ok" }),
      ]),
      log,
    );
    expect(proposal.items).toEqual(phoneCase);
    expect(seen).toEqual([
      "tool:search_products:started",
      "tool:search_products:ok",
      "tool:check_bundle:started",
      "tool:check_bundle:ok",
      "tool:check_bundle:started",
      "tool:check_bundle:ok",
      "tool:submit_bundle:started",
      "tool:submit_bundle:ok",
    ]);
  });

  it("shows a failed tool call and keeps going", async () => {
    const { seen, log } = recorder();
    const proposal = await runAgent(
      "x",
      ctx,
      scripted([call("check_stock", { productId: 5 }), call("submit_bundle", { items: phoneCase, discountPct: 0 })]),
      log,
    );
    expect(seen).toContain("tool:check_stock:failed");
    expect(proposal.items).toEqual(phoneCase);
  });

  it("gives up after the maximum number of steps", async () => {
    const { log } = recorder();
    const loop = Array.from({ length: 10 }, () => call("search_products", { query: "case" }));
    await expect(runAgent("x", ctx, scripted(loop), log, 3)).rejects.toThrow("within 3 steps");
  });

  it("nudges once when the model answers with text only, then fails", async () => {
    const { log } = recorder();
    await expect(runAgent("x", ctx, scripted([{ text: "hi", toolCalls: [] }]), log)).rejects.toThrow(
      "without submitting",
    );
    const ok = await runAgent(
      "x",
      ctx,
      scripted([{ text: "hi", toolCalls: [] }, call("submit_bundle", { items: phoneCase, discountPct: 0 })]),
      log,
    );
    expect(ok.items).toEqual(phoneCase);
  });
});
