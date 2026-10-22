import { count, sql } from "drizzle-orm";
import type { Queryable } from "./client";
import { loadCatalog, loadRules } from "./repo";
import { orderItems, orders, workflowRuns } from "./schema";
import type { Rules } from "../core/types";

export type Summary = {
  runs: { total: number; byStatus: Record<string, number> };
  orders: { count: number; revenueCents: number; costCents: number; marginPct: number };
  inventory: { products: number; lowStockAt: number; lowStock: { id: string; name: string; stock: number }[] };
  rules: Rules;
};

// Numbers for the business-owner screen. Everything is computed from the database, nothing is invented.
export async function getSummary(db: Queryable, lowStockAt = 5): Promise<Summary> {
  const byStatusRows = await db
    .select({ status: workflowRuns.status, n: count() })
    .from(workflowRuns)
    .groupBy(workflowRuns.status);
  const byStatus: Record<string, number> = {};
  for (const r of byStatusRows) byStatus[r.status] = Number(r.n);

  const [o] = await db
    .select({ n: count(), revenue: sql<string | null>`sum(${orders.totalCents})` })
    .from(orders);
  const [c] = await db
    .select({ cost: sql<string | null>`sum(${orderItems.qty} * ${orderItems.unitCostCents})` })
    .from(orderItems);
  const revenueCents = Number(o.revenue ?? 0);
  const costCents = Number(c.cost ?? 0);
  const marginPct = revenueCents > 0 ? Math.round(((revenueCents - costCents) * 1000) / revenueCents) / 10 : 0;

  const catalog = await loadCatalog(db);
  const lowStock = catalog
    .filter((p) => p.stock <= lowStockAt)
    .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name))
    .map((p) => ({ id: p.id, name: p.name, stock: p.stock }));

  return {
    runs: { total: Object.values(byStatus).reduce((a, b) => a + b, 0), byStatus },
    orders: { count: Number(o.n), revenueCents, costCents, marginPct },
    inventory: { products: catalog.length, lowStockAt, lowStock },
    rules: await loadRules(db),
  };
}
