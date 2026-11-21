import { afterEach, describe, expect, it, vi } from "vitest";
import { createOpenRouterAgentModel, parseChatCompletion } from "./openrouter-agent";

const reply = (message: unknown) => new Response(JSON.stringify({ choices: [{ message }] }), { status: 200 });

afterEach(() => vi.unstubAllGlobals());

describe("openrouter agent", () => {
  it("parses tool calls and tolerates malformed arguments", () => {
    const turn = parseChatCompletion({
      choices: [
        { message: { content: null, tool_calls: [
          { function: { name: "search_products", arguments: '{"query":"case"}' } },
          { function: { name: "check_bundle", arguments: "{oops" } },
        ] } },
      ],
    });
    expect(turn.toolCalls).toEqual([
      { name: "search_products", args: { query: "case" } },
      { name: "check_bundle", args: {} },
    ]);
  });

  it("links tool results to the assistant tool calls by id", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(reply({ content: null, tool_calls: [{ function: { name: "search_products", arguments: "{}" } }] }))
      .mockResolvedValueOnce(reply({ content: "done" }));
    vi.stubGlobal("fetch", fetchMock);
    const m = createOpenRouterAgentModel({ apiKey: "k", system: "sys" });
    await m.step({ kind: "user", text: "hi" });
    await m.step({ kind: "toolResults", results: [{ name: "search_products", result: { ok: 1 } }] });

    const body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.messages.map((x: { role: string }) => x.role)).toEqual(["system", "user", "assistant", "tool"]);
    expect(body.messages[3].tool_call_id).toBe(body.messages[2].tool_calls[0].id);
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer k");
  });

  it("preload replays history without calling the API", async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(reply({ content: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    const m = createOpenRouterAgentModel({ apiKey: "k", system: "sys" });
    m.preload([{ input: { kind: "user", text: "hi" }, turn: { toolCalls: [{ name: "search_products", args: { query: "x" } }] } }]);
    expect(fetchMock).not.toHaveBeenCalled();
    await m.step({ kind: "toolResults", results: [{ name: "search_products", result: [] }] });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.messages.map((x: { role: string }) => x.role)).toEqual(["system", "user", "assistant", "tool"]);
  });

  it("targets OpenRouter, defaults to the free router and sends optional fallback models", async () => {
    const fetchMock = vi.fn().mockImplementation(async () => reply({ content: "ok" }));
    vi.stubGlobal("fetch", fetchMock);
    await createOpenRouterAgentModel({ apiKey: "k", system: "sys" }).step({ kind: "user", text: "hi" });
    expect(fetchMock.mock.calls[0][0]).toBe("https://openrouter.ai/api/v1/chat/completions");
    let body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.model).toBe("openrouter/free");
    expect(body.models).toBeUndefined();

    await createOpenRouterAgentModel({ apiKey: "k", system: "s", model: "a/b:free", fallbackModels: ["c/d:free", ""] }).step({
      kind: "user",
      text: "hi",
    });
    body = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(body.models).toEqual(["a/b:free", "c/d:free"]);
  });

  it("reports provider errors with the OpenRouter name", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("nope", { status: 401 })));
    await expect(createOpenRouterAgentModel({ apiKey: "bad", system: "s" }).step({ kind: "user", text: "hi" })).rejects.toThrow(
      /OpenRouter HTTP 401 \(auth\)/,
    );
  });
});
