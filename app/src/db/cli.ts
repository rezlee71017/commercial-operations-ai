import { getDb } from "./client";
import { loadCatalog, loadRules } from "./repo";

async function main() {
  const db = await getDb();
  const catalog = await loadCatalog(db);
  const rules = await loadRules(db);
  const categories = new Set(catalog.map((p) => p.category));
  console.log(`Database ready: ${catalog.length} products in ${categories.size} categories.`);
  console.log(`Rules: minimum margin ${rules.minMarginPct}%, maximum discount ${rules.maxDiscountPct}%.`);
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
