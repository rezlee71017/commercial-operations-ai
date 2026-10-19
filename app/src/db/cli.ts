import { sql } from "drizzle-orm";
import { openConfigured } from "./client";
import { loadCatalog, loadRules } from "./repo";
import { seedIfEmpty } from "./seed";

// npm run db:check  -> read-only: shows where the app points and what is in the database
// npm run db:setup  -> creates the tables (migrations) and loads the demo data if empty
async function main() {
  const command = process.argv[2] ?? "check";
  const handle = openConfigured();
  const url = process.env.DATABASE_URL;
  const target = url ? `hosted Postgres at ${new URL(url).host}` : `local PGlite in ${process.env.DB_DIR ?? ".data/pgdata"}`;
  console.log(`Target: ${target}`);

  try {
    if (command === "setup") {
      await handle.migrate();
      const seeded = await seedIfEmpty(handle.db);
      console.log(seeded ? "Tables are ready and the demo data was loaded." : "Tables are ready. Data already present, nothing loaded.");
    } else if (command !== "check") {
      throw new Error(`Unknown command '${command}'. Use: check or setup`);
    }

    const rows = async (q: ReturnType<typeof sql>) => {
      const res: unknown = await handle.db.execute(q);
      return (Array.isArray(res) ? res : (res as { rows: unknown[] }).rows) as Record<string, unknown>[];
    };
    const [version] = await rows(sql`select version() as v`);
    console.log(`Server: ${String(version.v).split(" on ")[0]}`);
    const [tables] = await rows(sql`select count(*)::int as n from information_schema.tables where table_schema = 'public'`);
    if (Number(tables.n) < 5) {
      console.log("The tables are missing. Run: npm run db:setup");
      process.exitCode = 1;
      return;
    }
    const catalog = await loadCatalog(handle.db);
    const rules = await loadRules(handle.db);
    const [counts] = await rows(sql`select
      (select count(*) from workflow_runs)::int as runs,
      (select count(*) from orders)::int as orders`);
    console.log(`Products: ${catalog.length} in ${new Set(catalog.map((p) => p.category)).size} categories`);
    console.log(`Rules: minimum margin ${rules.minMarginPct}%, maximum discount ${rules.maxDiscountPct}%`);
    console.log(`Saved runs: ${counts.runs}, orders: ${counts.orders}`);
  } finally {
    await handle.close().catch(() => undefined);
  }
}

main()
  .then(() => process.exit(process.exitCode ?? 0))
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  });
