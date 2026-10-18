import { z } from "zod";
import { evaluateProposal } from "./policy";
import type { Product, Proposal, Rules } from "./types";

export type ToolContext = { catalog: Product[]; rules: Rules; owned: string[] };

const Item = z.object({ productId: z.string(), qty: z.number() });

const schemas = {
  search_products: z.object({ query: z.string(), category: z.string().optional() }),
  check_stock: z.object({ productId: z.string(), qty: z.number() }),
  check_bundle: z.object({ items: z.array(Item).min(1), discountPct: z.number() }),
  submit_bundle: z.object({
    items: z.array(Item).min(1),
    discountPct: z.number(),
    explanation: z.string().optional(),
  }),
} as const;

export type ToolName = keyof typeof schemas;

const itemSpec = {
  type: "object",
  properties: { productId: { type: "string" }, qty: { type: "integer" } },
  required: ["productId", "qty"],
};

// What the model is told about each tool (JSON-schema style)
export const TOOL_SPECS = [
  {
    name: "search_products",
    description:
      "Search the product catalog by keywords. Returns up to 5 products with id, name, category, price, stock and compatibleWith. Prices and stock are authoritative.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "keywords, for example: usb-c charger" },
        category: { type: "string", description: "optional category filter, for example: case" },
      },
      required: ["query"],
    },
  },
  {
    name: "check_stock",
    description: "Check whether a product is available in the requested quantity.",
    parameters: {
      type: "object",
      properties: { productId: { type: "string" }, qty: { type: "integer" } },
      required: ["productId", "qty"],
    },
  },
  {
    name: "check_bundle",
    description:
      "Run the store's business rules (stock, compatibility, discount limit, minimum margin) on a DRAFT bundle. Returns totals and which rules passed or failed. Use it before submitting.",
    parameters: {
      type: "object",
      properties: { items: { type: "array", items: itemSpec }, discountPct: { type: "number" } },
      required: ["items", "discountPct"],
    },
  },
  {
    name: "submit_bundle",
    description: "Submit the FINAL bundle. Call this exactly once, when you are done.",
    parameters: {
      type: "object",
      properties: {
        items: { type: "array", items: itemSpec },
        discountPct: { type: "number" },
        explanation: { type: "string", description: "one or two sentences for the customer" },
      },
      required: ["items", "discountPct"],
    },
  },
];

const STOPWORDS = new Set([
  "the", "and", "for", "with", "need", "just", "bought", "want", "buy", "get", "you", "your",
  "can", "please", "give", "some", "have", "has", "that", "this", "from", "like", "also",
]);

const tokens = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));

// Product fields the model may see. Cost is never included.
const publicView = (p: Product) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.priceCents / 100, // dollars, easier for the model to read
  stock: p.stock,
  compatibleWith: p.compatibleWith ?? [],
});

export type ToolOutcome =
  | { ok: true; result: unknown; final?: Proposal }
  | { ok: false; error: string };

export function executeTool(name: string, rawArgs: unknown, ctx: ToolContext): ToolOutcome {
  if (!(name in schemas)) return { ok: false, error: `Unknown tool: ${name}` };
  const toolName = name as ToolName;
  const parsed = schemas[toolName].safeParse(rawArgs);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".") || "args"}: ${i.message}`).join("; ");
    return { ok: false, error: `Invalid arguments: ${issues}` };
  }
  const args = parsed.data;

  switch (toolName) {
    case "search_products": {
      const a = args as z.infer<typeof schemas.search_products>;
      const wanted = new Set(tokens(a.query));
      const category = a.category?.toLowerCase();
      const scored = ctx.catalog
        .filter((p) => !category || p.category.toLowerCase() === category)
        .map((p) => {
          const own = new Set(tokens(`${p.id} ${p.name} ${p.category}`));
          let score = 0;
          for (const t of wanted) if (own.has(t)) score++;
          return { p, score };
        })
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score)
        .slice(0, 5);
      return { ok: true, result: { products: scored.map((x) => publicView(x.p)) } };
    }
    case "check_stock": {
      const a = args as z.infer<typeof schemas.check_stock>;
      const p = ctx.catalog.find((x) => x.id === a.productId);
      if (!p) return { ok: true, result: { productId: a.productId, exists: false } };
      return {
        ok: true,
        result: { productId: p.id, exists: true, stock: p.stock, requested: a.qty, enough: a.qty <= p.stock },
      };
    }
    case "check_bundle": {
      const a = args as z.infer<typeof schemas.check_bundle>;
      const e = evaluateProposal({ items: a.items, discountPct: a.discountPct }, ctx.catalog, ctx.rules, ctx.owned);
      return {
        ok: true,
        result: {
          approvable: e.approvable,
          subtotal: e.subtotalCents / 100,
          total: e.totalCents / 100,
          marginPct: e.marginPct,
          rules: e.results,
        },
      };
    }
    case "submit_bundle": {
      const a = args as z.infer<typeof schemas.submit_bundle>;
      return {
        ok: true,
        result: { accepted: true },
        final: { items: a.items, discountPct: a.discountPct, explanation: a.explanation },
      };
    }
  }
}
