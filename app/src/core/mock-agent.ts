import { proposeWithMock } from "./mock";
import type { AgentModel } from "./agent";
import type { Product, Proposal } from "./types";

// TEST DOUBLE: no language model. It follows a fixed script: search, check, submit.
export function createMockAgentModel(catalog: Product[], owned: string[]): AgentModel {
  let phase = 0;
  let request = "";
  let plan: Proposal | null = null;

  return {
    async step(input) {
      if (input.kind === "user") request = input.text;
      phase++;
      if (phase === 1) return { toolCalls: [{ name: "search_products", args: { query: request } }] };

      plan ??= await proposeWithMock(request, catalog, owned);
      if (plan.items.length === 0) return { text: "MOCK: no matching products", toolCalls: [] };
      if (phase === 2) {
        return { toolCalls: [{ name: "check_bundle", args: { items: plan.items, discountPct: plan.discountPct } }] };
      }
      return {
        toolCalls: [
          {
            name: "submit_bundle",
            args: { items: plan.items, discountPct: plan.discountPct, explanation: plan.explanation },
          },
        ],
      };
    },
  };
}
