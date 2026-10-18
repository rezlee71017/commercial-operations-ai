import { z } from "zod";
import type { Product, Proposal } from "./types";

const ProposalSchema = z.object({
  items: z.array(z.object({ productId: z.string(), qty: z.number() })).min(1),
  discountPct: z.number(),
  explanation: z.string().optional(),
});

export function parseProposal(text: string): Proposal {
  // Some models wrap JSON in ```json fences even when told not to
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return ProposalSchema.parse(JSON.parse(cleaned));
}

export async function proposeWithGemini(
  request: string,
  catalog: Product[],
  owned: string[] = [],
): Promise<Proposal> {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY is not set");
  const model = process.env.GEMINI_MODEL ?? "gemini-3.5-flash-lite";

  // We do NOT send cost to the model.
  const products = catalog.map(({ id, name, category, priceCents, stock }) => ({
    id,
    name,
    category,
    price: priceCents / 100,
    stock,
  }));
  const system = [
    "You are a sales assistant for an electronics store.",
    "Build a bundle for the customer using ONLY products from the catalog below, referenced by id.",
    'Reply with JSON only, in this exact shape: {"items":[{"productId":string,"qty":integer}],"discountPct":number,"explanation":string}',
    "Use discountPct 0 unless a discount clearly helps. Never invent products, prices or stock levels.",
    owned.length > 0
      ? `The customer already owns these products (do not add them to the bundle): ${owned.join(", ")}.`
      : "The customer owns none of the catalog products.",
    "Catalog:",
    JSON.stringify(products),
  ].join("\n");

  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: request }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
  });
  if (!res.ok) throw new Error(`Gemini HTTP ${res.status}: ${await res.text()}`);

  const data = await res.json();
  const parts: { text?: string }[] = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts.find((p) => typeof p.text === "string")?.text;
  if (!text) throw new Error("Gemini returned no text");
  return parseProposal(text);
}
