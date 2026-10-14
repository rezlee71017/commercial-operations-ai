import type { Product, Proposal } from "./types";

// TEST DOUBLE: there is NO language model here. It picks products from simple
// keywords so we can build and test the rest of the workflow without an API key.
// Every result is labeled MOCK in the explanation.
export async function proposeWithMock(
  request: string,
  catalog: Product[],
  owned: string[] = [],
): Promise<Proposal> {
  void catalog;
  const text = request.toLowerCase();
  const ids: string[] = [];

  const bolt = text.includes("bolt");
  if (text.includes("aria")) ids.push("phone-a1");
  if (bolt) ids.push("phone-b2");
  if (text.includes("laptop")) ids.push("laptop-l1");
  if (text.includes("case")) ids.push(bolt ? "case-b2" : "case-a1");
  if (text.includes("screen")) ids.push("screen-a1");
  if (text.includes("charger")) ids.push("charger-65");
  if (text.includes("cable")) ids.push("cable-c");
  if (text.includes("earbuds")) ids.push("earbuds-e1");
  if (text.includes("sleeve")) ids.push("sleeve-l1");
  if (text.includes("dock")) ids.push("dock-d1");
  if (text.includes("mouse")) ids.push("mouse-m1");

  const m = text.match(/(\d+(?:\.\d+)?)\s*%/);
  const discountPct = m ? Number(m[1]) : 0;

  return {
    items: ids.filter((id) => !owned.includes(id)).map((productId) => ({ productId, qty: 1 })),
    discountPct,
    explanation: "MOCK proposal (keyword rules, no language model).",
  };
}
