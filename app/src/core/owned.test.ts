import { describe, expect, it } from "vitest";
import { proposeWithMock } from "./mock";
import { runWorkflow } from "./run";
import { catalog, rules } from "../data/catalog";

const text = "I just bought the Aria phone. I need a case and a charger.";
const run = (owned: string[]) =>
  runWorkflow(text, catalog, rules, { propose: proposeWithMock, now: () => "T" }, owned);

describe("customer already owns a product", () => {
  it("accessories alone are approved when the compatible phone is owned", async () => {
    const r = await run(["phone-a1"]);
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["case-a1", "charger-65"]);
    expect(r.status).toBe("awaiting_approval");
  });

  it("accessories alone are rejected when ownership is not known", async () => {
    const r = await runWorkflow(
      "I need a case and a charger.",
      catalog,
      rules,
      { propose: proposeWithMock, now: () => "T" },
      [],
    );
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["case-a1", "charger-65"]);
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "compatibility")?.passed).toBe(false);
  });

  it("a model cannot create ownership by itself: only the owned list passed in counts", async () => {
    const r = await runWorkflow(text, catalog, rules, {
      now: () => "T",
      propose: async () => ({
        items: [{ productId: "case-a1", qty: 1 }],
        discountPct: 0,
        explanation: "I assume the customer owns the phone.",
      }),
    });
    expect(r.status).toBe("rejected_by_policy");
  });
});
