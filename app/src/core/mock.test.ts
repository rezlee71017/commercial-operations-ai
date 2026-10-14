import { describe, expect, it } from "vitest";
import { proposeWithMock } from "./mock";
import { runWorkflow } from "./run";
import { catalog, rules } from "../data/catalog";

const run = (text: string) =>
  runWorkflow(text, catalog, rules, { propose: proposeWithMock, now: () => "T" });

describe("mock proposer + policy engine", () => {
  it("approves phone + case + charger", async () => {
    const r = await run("I want to buy the Aria phone with a case and a charger.");
    expect(r.proposal?.items.map((i) => i.productId)).toEqual(["phone-a1", "case-a1", "charger-65"]);
    expect(r.status).toBe("awaiting_approval");
  });

  it("rejects the out-of-stock screen protector", async () => {
    const r = await run("I want the screen protector for my Aria phone.");
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "stock_available")?.passed).toBe(false);
  });

  it("rejects the 40% discount request", async () => {
    const r = await run("Give me the dock with a 40% discount.");
    expect(r.status).toBe("rejected_by_policy");
    expect(r.evaluation?.results.find((x) => x.rule === "discount_limit")?.passed).toBe(false);
  });

  it("an empty match fails validation visibly instead of crashing", async () => {
    const r = await run("hello there");
    expect(r.status).toBe("rejected_by_policy");
  });
});
