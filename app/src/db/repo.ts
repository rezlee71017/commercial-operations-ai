import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Product, Rules } from "../core/types";
import type { Queryable } from "./client";
import { auditLog, categories, inventory, policies, productCompat, products } from "./schema";

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

export async function loadCategories(db: Queryable): Promise<{ id: string; name: string }[]> {
  return db.select({ id: categories.id, name: categories.name }).from(categories).orderBy(categories.name);
}

// Limits for the business rules an operator may set (validated again on the server).
export const RulesInput = z.object({
  minMarginPct: z.number().min(0).max(95),
  maxDiscountPct: z.number().min(0).max(90),
});

// Changes the rules and records who changed what in the audit log.
export async function saveRules(db: Queryable, rules: Rules, actor = "operator"): Promise<Rules> {
  const before = await loadRules(db);
  await db.update(policies).set({ value: rules, updatedAt: new Date() }).where(eq(policies.key, "rules"));
  await db.insert(auditLog).values({
    actor,
    action: "rules.updated",
    entityType: "policy",
    entityId: "rules",
    data: { before, after: rules },
  });
  return rules;
}
