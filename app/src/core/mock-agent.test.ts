import { describe, expect, it } from "vitest";
import { runWorkflow } from "./run";
import { makeAgentPropose } from "./agent-propose";
import { catalog, rules } from "../data/catalog";

const run = (text: string, owned: string[] = []) =>
  runWorkflow(text, catalog, rules, { propose: makeAgentPropose(true), now: () => "T" }, owned);
const steps = (r: Awaited<ReturnType<typeof run>>) => r.events.map((e) => `${e.step}:${e.status}`);

describe("tool-using agent (mock model) inside the workflow", () => {
  it("shows the tool calls between 'started' and 'ok' of the proposal step", async () => {
    const r = await run("I want to buy the Aria phone with a case and a charger.");
    expect(r.status).toBe("awaiting_approval");
    expect(steps(r)).toEqual([
      "request_received:ok",
      "catalog_loaded:ok",
      "proposal_generated:started",
      "tool:search_products:started",
      "tool:search_products:ok",
      "tool:check_bundle:started",
      "tool:check_bundle:ok",
      "tool:submit_bundle:started",
      "tool:submit_bundle:ok",
      "proposal_generated:ok",
      "policy_checked:ok",
    ]);
  });

  it("the final policy check still rejects a bad bundle the agent submitted", async () => {
    const r = await run("I want the screen protector for my Aria phone.");
    expect(r.status).toBe("rejected_by_policy");
  });

  it("fails visibly when nothing matches", async () => {
    const r = await run("hello there");
    expect(r.status).toBe("failed");
  });
});
