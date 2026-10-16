import { describe, expect, it } from "vitest";
import { workflowStream, type StreamMessage } from "./stream";
import { catalog, rules } from "../data/catalog";

const now = () => "T";
const decoder = new TextDecoder();
const parse = (text: string): StreamMessage[] =>
  text.split("\n").filter(Boolean).map((l) => JSON.parse(l) as StreamMessage);

describe("workflowStream", () => {
  it("sends events one per line and ends with the result", async () => {
    const stream = workflowStream(
      "x",
      catalog,
      rules,
      { now, propose: async () => ({ items: [{ productId: "mouse-m1", qty: 1 }], discountPct: 0 }) },
      [],
    );
    const reader = stream.getReader();
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    const msgs = parse(text);
    expect(msgs.at(-1)?.type).toBe("result");
    expect(msgs.slice(0, -1).every((m) => m.type === "event")).toBe(true);
    expect(msgs.length).toBeGreaterThanOrEqual(5);
  });

  it("delivers the 'started' event while the slow step is still running", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    const stream = workflowStream(
      "x",
      catalog,
      rules,
      {
        now,
        propose: async () => {
          await gate;
          return { items: [{ productId: "mouse-m1", qty: 1 }], discountPct: 0 };
        },
      },
      [],
    );
    const reader = stream.getReader();
    let text = "";
    while (!text.includes('"status":"started"')) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    // The model step has not finished, so no result may exist yet.
    expect(text).toContain('"step":"proposal_generated"');
    expect(text).not.toContain('"type":"result"');

    release();
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    expect(text).toContain('"type":"result"');
  });

  it("reports a failing model as a failed event plus a failed result, not a crash", async () => {
    const stream = workflowStream(
      "x",
      catalog,
      rules,
      {
        now,
        propose: async () => {
          throw new Error("boom");
        },
      },
      [],
    );
    const reader = stream.getReader();
    let text = "";
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      text += decoder.decode(value);
    }
    const last = parse(text).at(-1);
    expect(last?.type).toBe("result");
    if (last?.type === "result") expect(last.result.status).toBe("failed");
  });
});
