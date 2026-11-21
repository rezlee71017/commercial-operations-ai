import { geminiFetch, type FetchOptions } from "./gemini-http";
import { TOOL_SPECS } from "./tools";
import type { AgentModel, ModelInput, ModelTurn } from "./agent";

type ToolCallMsg = { id: string; type: "function"; function: { name: string; arguments: string } };
type Msg =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCallMsg[] }
  | { role: "tool"; tool_call_id: string; content: string };

export type History = { input: ModelInput; turn: ModelTurn }[];
export type PreloadableModel = AgentModel & { preload: (history: History) => void };

// Gemini declares types like "OBJECT"; OpenAI-style APIs want lowercase JSON Schema.
function toJsonSchema(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(toJsonSchema);
  if (v && typeof v === "object") {
    return Object.fromEntries(
      Object.entries(v).map(([k, x]) => [k, k === "type" && typeof x === "string" ? x.toLowerCase() : toJsonSchema(x)]),
    );
  }
  return v;
}

export function parseChatCompletion(data: unknown): ModelTurn {
  const msg = (
    data as {
      choices?: { message?: { content?: string | null; tool_calls?: { function?: { name?: string; arguments?: string } }[] } }[];
    }
  )?.choices?.[0]?.message;
  if (!msg) throw new Error("The model returned no message");
  const toolCalls = (msg.tool_calls ?? [])
    .filter((c) => c.function?.name)
    .map((c) => {
      let args: unknown = {};
      try {
        args = c.function!.arguments ? JSON.parse(c.function!.arguments) : {};
      } catch {
        args = {}; // malformed arguments: the tool will report an error and the model can retry
      }
      return { name: c.function!.name!, args };
    });
  const text = typeof msg.content === "string" ? msg.content.trim() : "";
  return { text: text || undefined, toolCalls };
}

// OpenRouter free model ids rotate with little notice, so the default is the free router, which
// picks a currently free model that supports tool calling. Set OPENROUTER_MODEL for a fixed model and
// OPENROUTER_FALLBACK_MODELS (comma separated) for OpenRouter-side fallbacks.
export const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
export const OPENROUTER_DEFAULT_MODEL = "openrouter/free";

export function createOpenRouterAgentModel(opts: {
  apiKey: string;
  model?: string;
  fallbackModels?: string[];
  system: string;
  http?: FetchOptions;
}): PreloadableModel {
  const model = opts.model || OPENROUTER_DEFAULT_MODEL;
  const fallbacks = (opts.fallbackModels ?? []).filter(Boolean);
  const messages: Msg[] = [{ role: "system", content: opts.system }];
  const tools = (TOOL_SPECS as unknown as { name: string; description?: string; parameters?: unknown }[]).map((t) => ({
    type: "function" as const,
    function: { name: t.name, description: t.description, parameters: toJsonSchema(t.parameters ?? { type: "object", properties: {} }) },
  }));
  let pendingIds: string[] = [];
  let counter = 0;

  function pushInput(input: ModelInput) {
    if (input.kind === "toolResults") {
      input.results.forEach((r, i) => {
        messages.push({ role: "tool", tool_call_id: pendingIds[i] ?? `call_x${i}`, content: JSON.stringify(r.result) });
      });
    } else {
      messages.push({ role: "user", content: input.text });
    }
  }

  function pushTurn(turn: ModelTurn) {
    if (turn.toolCalls.length > 0) {
      pendingIds = turn.toolCalls.map(() => `call_${++counter}`);
      messages.push({
        role: "assistant",
        content: turn.text ?? null,
        tool_calls: turn.toolCalls.map((c, i) => ({
          id: pendingIds[i],
          type: "function" as const,
          function: { name: c.name, arguments: JSON.stringify(c.args ?? {}) },
        })),
      });
    } else {
      pendingIds = [];
      messages.push({ role: "assistant", content: turn.text ?? "" });
    }
  }

  return {
    // Replays steps another provider already completed, without calling the API.
    preload(history) {
      for (const h of history) {
        pushInput(h.input);
        pushTurn(h.turn);
      }
    },
    async step(input) {
      pushInput(input);
      const res = await geminiFetch(
        OPENROUTER_URL,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${opts.apiKey}`,
            "X-Title": "Commercial Operations AI",
          },
          body: JSON.stringify({
            model,
            ...(fallbacks.length > 0 ? { models: [model, ...fallbacks] } : {}),
            messages,
            tools,
            tool_choice: "auto",
            temperature: 0,
          }),
        },
        { provider: "OpenRouter", ...opts.http },
      );
      const turn = parseChatCompletion(await res.json());
      pushTurn(turn);
      return turn;
    },
  };
}
