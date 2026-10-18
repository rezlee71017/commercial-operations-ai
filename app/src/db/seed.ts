import { count } from "drizzle-orm";
import { defaultRules, seedCategories, seedProducts } from "../data/seed-data";
import type { Db } from "./client";
import { categories, inventory, policies, productCompat, products } from "./schema";

// Fills an empty database with the synthetic demo catalog. Safe to call many times.
export async function seedIfEmpty(db: Db): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(products);
  if (Number(row.n) > 0) return false;

  await db.transaction(async (tx) => {
    await tx.insert(categories).values(seedCategories);
    await tx.insert(products).values(
      seedProducts.map((p, i) => ({
        id: p.id,
        name: p.name,
        categoryId: p.category,
        priceCents: p.priceCents,
        costCents: p.costCents,
        sortOrder: i,
        isSynthetic: p.isSynthetic,
        source: "synthetic-demo",
      })),
    );
    await tx.insert(inventory).values(seedProducts.map((p) => ({ productId: p.id, onHand: p.stock })));
    const compat = seedProducts.flatMap((p) =>
      (p.compatibleWith ?? []).map((c) => ({ productId: p.id, compatibleWithId: c })),
    );
    if (compat.length > 0) await tx.insert(productCompat).values(compat);
    await tx.insert(policies).values({ key: "rules", value: defaultRules });
  });
  return true;
}
