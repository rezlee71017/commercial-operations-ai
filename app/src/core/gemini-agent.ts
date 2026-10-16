import { TOOL_SPECS } from "./tools";
import type { AgentModel, ModelInput, ModelTurn } from "./agent";

type Part = {
  text?: string;
  functionCall?: { name: string; args?: unknown };
  thoughtSignature?: string;
  [key: string]: unknown;
};
type Content = { role: string; parts: Part[] };

export function parseGeminiResponse(data: unknown): { content: Content; turn: ModelTurn } {
  const content = (data as { candidates?: { content?: Content }[] })?.candidates?.[0]?.content;
  if (!content || !Array.isArray(content.parts)) throw new Error("Gemini returned no content");
  const toolCalls = content.parts
    .filter((p) => p.functionCall)
    .map((p) => ({ name: p.functionCall!.name, args: p.functionCall!.args ?? {} }));
  const text = content.parts
    .map((p) => (typeof p.text === "string" ? p.text : ""))
    .join("")
    .trim();
  return { content, turn: { text: text || undefined, toolCalls } };
}

export function createGeminiAgentModel(opts: { apiKey: string; model?: string; system: string }): AgentModel {
  const model = opts.model ?? "gemini-3.5-flash-lite";
  const contents: Content[] = [];

  return {
    async step(input: ModelInput) {
      if (input.kind === "toolResults") {
        contents.push({
          role: "user",
          parts: input.results.map((r) => ({ functionResponse: { name: r.name, response: { result: r.result } } })),
        });
      } else {
        contents.push({ role: "user", parts: [{ text: input.text }] });
      }

      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": opts.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: opts.system }] },
          contents,
          tools: [{ functionDeclarations: TOOL_SPECS }],
        }),
      });
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);

      const { content, turn } = parseGeminiResponse(await res.json());
      contents.push(content);
      return turn;
    },
  };
}
