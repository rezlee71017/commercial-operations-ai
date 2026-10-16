import { runAgent } from "./agent";
import { createGeminiAgentModel } from "./gemini-agent";
import { createMockAgentModel } from "./mock-agent";
import type { Deps } from "./run";

function systemPrompt(owned: string[]): string {
  return [
    "You are a sales assistant for an electronics store. Build the best bundle for the customer's request.",
    "Work only through the tools: search_products to find products, check_bundle to test a draft against the store's rules, and submit_bundle to submit the final bundle (call it exactly once).",
    "Never invent products, prices, stock levels or margins. Use only what the tools return.",
    "If check_bundle reports a failed rule, fix the bundle and check it again before submitting.",
    "Use discountPct 0 unless a discount clearly helps and the rules allow it.",
    owned.length > 0
      ? `The customer already owns these products (do not add them to the bundle): ${owned.join(", ")}.`
      : "The customer owns none of the catalog products.",
  ].join("\n");
}

export function makeAgentPropose(useMock: boolean): Deps["propose"] {
  return async (request, catalog, owned, ctx) => {
    let model;
    if (useMock) {
      model = createMockAgentModel(catalog, owned);
    } else {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY is not set");
      model = createGeminiAgentModel({ apiKey, model: process.env.GEMINI_MODEL, system: systemPrompt(owned) });
    }
    return runAgent(request, { catalog, rules: ctx.rules, owned }, model, ctx.log);
  };
}
