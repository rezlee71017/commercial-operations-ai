import { afterEach, describe, expect, it, vi } from "vitest";
import { createGeminiAgentModel } from "./gemini-agent";

type Body = {
  contents: { parts: { functionResponse?: { name: string } }[] }[];
  tools: { functionDeclarations: { name: string }[] }[];
};

afterEach(() => vi.unstubAllGlobals());

describe("Gemini agent adapter (fake network, NOT the real API)", () => {
  it("sends the tools, returns tool calls, and replays the model's reply untouched", async () => {
    const bodies: Body[] = [];
    const replies = [
      {
        candidates: [
          {
            content: {
              role: "model",
              parts: [{ functionCall: { name: "search_products", args: { query: "case" } }, thoughtSignature: "SIG123" }],
            },
          },
        ],
      },
      { candidates: [{ content: { role: "model", parts: [{ text: "done" }] } }] },
    ];
    vi.stubGlobal("fetch", async (_url: string, init: { body: string }) => {
      bodies.push(JSON.parse(init.body) as Body);
      return new Response(JSON.stringify(replies[bodies.length - 1]), { status: 200 });
    });

    const model = createGeminiAgentModel({ apiKey: "k", system: "sys" });
    const first = await model.step({ kind: "user", text: "hi" });
    expect(first.toolCalls).toEqual([{ name: "search_products", args: { query: "case" } }]);

    await model.step({ kind: "toolResults", results: [{ name: "search_products", result: { products: [] } }] });
    expect(bodies[0].tools[0].functionDeclarations.map((f) => f.name)).toEqual([
      "search_products",
      "check_stock",
      "check_bundle",
      "submit_bundle",
    ]);
    // The signature from the first reply must be sent back unchanged.
    expect(JSON.stringify(bodies[1].contents)).toContain("SIG123");
    expect(bodies[1].contents[2].parts[0].functionResponse?.name).toBe("search_products");
  });

  it("reports an HTTP error without leaking the key", async () => {
    vi.stubGlobal("fetch", async () => new Response("denied", { status: 401 }));
    const model = createGeminiAgentModel({ apiKey: "SECRETKEY", system: "sys" });
    const err = await model.step({ kind: "user", text: "hi" }).catch((e: Error) => e);
    expect(String(err)).toContain("401");
    expect(String(err)).not.toContain("SECRETKEY");
  });
});
