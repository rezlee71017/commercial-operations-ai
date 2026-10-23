import { describe, expect, it } from "vitest";
import { AgentReply, runAgent, type AgentModel } from "./agent";
import { evaluateProposal } from "./policy";
import { runWorkflow } from "./run";
import { executeTool } from "./tools";
import { defaultRules, seedProducts } from "../data/seed-data";

const ctx = { catalog: seedProducts, rules: defaultRules, owned: [] as string[] };

describe("customer budget rule", () => {
  // laptop-n1 costs $900.00 = 90000 cents, no discount
  const base = { items: [{ productId: "laptop-n1", qty: 1 }], discountPct: 0 };

  it("passes when the total is exactly the budget", () => {
    const e = evaluateProposal({ ...base, budgetCents: 90000 }, seedProducts, defaultRules, []);
    expect(e.results.find((r) => r.rule === "within_budget")?.passed).toBe(true);
    expect(e.approvable).toBe(true);
  });

  it("fails when the total is one cent over the budget", () => {
    const e = evaluateProposal({ ...base, budgetCents: 89999 }, seedProducts, defaultRules, []);
    expect(e.results.find((r) => r.rule === "within_budget")?.passed).toBe(false);
    expect(e.approvable).toBe(false);
  });

  it("adds no budget rule when the customer gave no budget", () => {
    const e = evaluateProposal(base, seedProducts, defaultRules, []);
    expect(e.results.some((r) => r.rule === "within_budget")).toBe(false);
  });

  it("uses the total after discount, calculated by our code", () => {
    // 10% off $900 = $810
    const e = evaluateProposal({ ...base, discountPct: 10, budgetCents: 81000 }, seedProducts, defaultRules, []);
    expect(e.results.find((r) => r.rule === "within_budget")?.passed).toBe(true);
  });
});

describe("budget through the tools", () => {
  it("converts dollars to integer cents and the check reports the budget rule", () => {
    const out = executeTool("check_bundle", { items: [{ productId: "laptop-n1", qty: 1 }], discountPct: 0, budgetDollars: 300 }, ctx);
    expect(out.ok && JSON.stringify(out.result)).toContain("within_budget");
    const sub = executeTool("submit_bundle", { items: [{ productId: "case-a1", qty: 1 }], discountPct: 0, budgetDollars: 12.34 }, ctx);
    expect(sub.ok && sub.final?.budgetCents).toBe(1234);
  });

  it("rejects a zero or negative budget", () => {
    const out = executeTool("check_bundle", { items: [{ productId: "case-a1", qty: 1 }], discountPct: 0, budgetDollars: -5 }, ctx);
    expect(out.ok).toBe(false);
  });
});

describe("reply_to_customer", () => {
  it("accepts a clarification or a 'cannot fulfill' message", () => {
    const out = executeTool("reply_to_customer", { kind: "clarification", message: "What is your budget?" }, ctx);
    expect(out.ok && out.reply).toEqual({ kind: "clarification", message: "What is your budget?" });
  });

  it("rejects an unknown kind and an empty message", () => {
    expect(executeTool("reply_to_customer", { kind: "chat", message: "hi" }, ctx).ok).toBe(false);
    expect(executeTool("reply_to_customer", { kind: "clarification", message: "   " }, ctx).ok).toBe(false);
  });

  it("ends the agent with an AgentReply instead of an error", async () => {
    const model: AgentModel = {
      step: async () => ({ toolCalls: [{ name: "reply_to_customer", args: { kind: "cannot_fulfill", message: "We do not sell that." } }] }),
    };
    const err = await runAgent("iPhone 20", ctx, model, () => undefined).catch((e) => e);
    expect(err).toBeInstanceOf(AgentReply);
    expect(err.reply).toBe("We do not sell that.");
  });

  it("the workflow ends as needs_input: no proposal, no policy check, and the run is not a failure", async () => {
    const propose = async () => {
      throw new AgentReply("clarification", "Which phone do you have?");
    };
    const r = await runWorkflow("I need something", seedProducts, defaultRules, { propose }, []);
    expect(r.status).toBe("needs_input");
    expect(r.proposal).toBeNull();
    expect(r.evaluation).toBeNull();
    expect(r.reply).toEqual({ kind: "clarification", message: "Which phone do you have?" });
    expect(r.events.some((e) => e.step === "policy_checked")).toBe(false);
    expect(r.events.some((e) => e.status === "failed")).toBe(false);
  });
});
