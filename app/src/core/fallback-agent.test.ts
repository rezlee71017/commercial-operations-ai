import { describe, expect, it, vi } from "vitest";
import { createFallbackAgentModel } from "./fallback-agent";
import type { AgentModel, ModelTurn } from "./agent";
import type { PreloadableModel } from "./groq-agent";

const providerError = (kind: string) => Object.assign(new Error(kind), { kind });
const turn = (name: string): ModelTurn => ({ toolCalls: [{ name, args: {} }] });

describe("fallback agent", () => {
  it("switches to the secondary on rate limit, replays history, and stays switched", async () => {
    const primary: AgentModel = {
      step: vi.fn().mockResolvedValueOnce(turn("a")).mockRejectedValue(providerError("rate_limited")),
    };
    const secondary: PreloadableModel = { preload: vi.fn(), step: vi.fn().mockResolvedValue(turn("b")) };
    const onFallback = vi.fn();
    const m = createFallbackAgentModel(primary, () => secondary, onFallback);

    await m.step({ kind: "user", text: "hi" });
    const t2 = await m.step({ kind: "toolResults", results: [] });
    await m.step({ kind: "toolResults", results: [] });

    expect(t2.toolCalls[0].name).toBe("b");
    expect(secondary.preload).toHaveBeenCalledWith([{ input: { kind: "user", text: "hi" }, turn: turn("a") }]);
    expect(onFallback).toHaveBeenCalledWith("rate_limited");
    expect(primary.step).toHaveBeenCalledTimes(2); // not retried after the switch
  });

  it("does not hide auth or bad_request errors", async () => {
    const primary: AgentModel = { step: vi.fn().mockRejectedValue(providerError("auth")) };
    const makeSecondary = vi.fn();
    const m = createFallbackAgentModel(primary, makeSecondary);
    await expect(m.step({ kind: "user", text: "hi" })).rejects.toThrow("auth");
    expect(makeSecondary).not.toHaveBeenCalled();
  });

  it("reports the original error when the secondary cannot be created", async () => {
    const primary: AgentModel = { step: vi.fn().mockRejectedValue(providerError("timeout")) };
    const m = createFallbackAgentModel(primary, () => {
      throw new Error("GROQ_API_KEY is not set");
    });
    await expect(m.step({ kind: "user", text: "hi" })).rejects.toThrow("timeout");
  });
});
