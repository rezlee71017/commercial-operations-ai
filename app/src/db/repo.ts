import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Product, Rules } from "../core/types";
import type { Queryable } from "./client";
import { inventory, policies, productCompat, products } from "./schema";

// The database is the source of truth. These functions turn rows into the plain
// objects the business logic works with.

export async function loadCatalog(db: Queryable): Promise<Product[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      category: products.categoryId,
      priceCents: products.priceCents,
      costCents: products.costCents,
      isSynthetic: products.isSynthetic,
      stock: inventory.onHand,
    })
    .from(products)
    .innerJoin(inventory, eq(inventory.productId, products.id))
    .orderBy(products.sortOrder);

  const compatRows = await db.select().from(productCompat);
  const compat = new Map<string, string[]>();
  for (const c of compatRows) {
    compat.set(c.productId, [...(compat.get(c.productId) ?? []), c.compatibleWithId]);
  }

  return rows.map((r) => {
    const list = compat.get(r.id);
    return list && list.length > 0 ? { ...r, compatibleWith: list } : r;
  });
}

const RulesSchema = z.object({ minMarginPct: z.number(), maxDiscountPct: z.number() });

export async function loadRules(db: Queryable): Promise<Rules> {
  const [row] = await db.select().from(policies).where(eq(policies.key, "rules"));
  if (!row) throw new Error("No business rules found in the database (policies.rules)");
  return RulesSchema.parse(row.value);
}
