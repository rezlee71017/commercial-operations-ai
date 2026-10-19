import { describe, expect, it } from "vitest";
import { collapseEvents } from "./events";
import type { RunEvent } from "./types";

const ev = (step: string, status: RunEvent["status"]): RunEvent => ({ step, status, at: "T" });
const names = (list: RunEvent[]) => list.map((e) => `${e.step}:${e.status}`);

describe("collapseEvents", () => {
  it("replaces a started line with its finished event, in completion order", () => {
    const list = collapseEvents([
      ev("request_received", "ok"),
      ev("proposal_generated", "started"),
      ev("tool:search_products", "started"),
      ev("tool:search_products", "ok"),
      ev("proposal_generated", "ok"),
      ev("policy_checked", "ok"),
    ]);
    expect(names(list)).toEqual([
      "request_received:ok",
      "tool:search_products:ok",
      "proposal_generated:ok",
      "policy_checked:ok",
    ]);
  });

  it("keeps the started line of a step that has not finished yet", () => {
    const list = collapseEvents([ev("request_received", "ok"), ev("proposal_generated", "started")]);
    expect(names(list)).toEqual(["request_received:ok", "proposal_generated:started"]);
  });

  it("handles the same tool called twice", () => {
    const list = collapseEvents([
      ev("tool:check_bundle", "started"),
      ev("tool:check_bundle", "ok"),
      ev("tool:check_bundle", "started"),
      ev("tool:check_bundle", "failed"),
    ]);
    expect(names(list)).toEqual(["tool:check_bundle:ok", "tool:check_bundle:failed"]);
  });
});
