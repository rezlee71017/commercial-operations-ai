import { describe, expect, it } from "vitest";
import { runWorkflow } from "./run";
import { parseProposal } from "./llm";
import { catalog, rules } from "../data/catalog";

const now = () => "T";

describe("runWorkflow", () => {
  it("goes to awaiting_approval when the proposal passes all rules", async () => {
    const r = await runWorkflow("phone + case", catalog, rules, {
      now,
      propose: async () => ({ items: [{ productId: "phone-a1", qty: 1 }, { productId: "case-a1", qty: 1 }], discountPct: 0 }),
    });
    expect(r.status).toBe("awaiting_approval");
    expect(r.events.map((e) => e.step)).toEqual(["request_received", "catalog_loaded", "proposal_generated", "policy_checked"]);
  });

  it("blocks a proposal that breaks a rule, even if the 'LLM' asked for it", async () => {
    const r = await runWorkflow("big discount", catalog, rules, {
      now,
      propose: async () => ({ items: [{ productId: "phone-a1", qty: 1 }], discountPct: 15 }),
    });
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.approvable).toBe(false);
  });

  it("fails visibly (no policy step, no result) when the model call throws", async () => {
    const r = await runWorkflow("x", catalog, rules, {
      now,
      propose: async () => {
        throw new Error("timeout");
      },
    });
    expect(r.status).toBe("failed");
    expect(r.events.at(-1)).toMatchObject({ step: "proposal_generated", status: "failed" });
    expect(r.events.some((e) => e.step === "policy_checked")).toBe(false);
  });
});

describe("parseProposal", () => {
  it("accepts valid JSON, with or without code fences", () => {
    const json = '{"items":[{"productId":"case-a1","qty":1}],"discountPct":0}';
    expect(parseProposal(json).items).toHaveLength(1);
    expect(parseProposal("```json\n" + json + "\n```").items).toHaveLength(1);
  });

  it("throws on invalid model output", () => {
    expect(() => parseProposal("not json")).toThrow();
    expect(() => parseProposal('{"items":[],"discountPct":0}')).toThrow();
    expect(() => parseProposal('{"items":[{"productId":"a","qty":"two"}],"discountPct":0}')).toThrow();
  });
});
