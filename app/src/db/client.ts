import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

export type Db = PgliteDatabase<typeof schema>;

// PGlite is PostgreSQL running inside Node: no install, no account, no cost.
// The same schema and queries will run on a hosted Postgres later (for example Supabase).
// Without a directory the database lives in memory (used by tests).
export async function createDb(dataDir?: string): Promise<Db> {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

// One database per server process (survives hot reloads in development).
const g = globalThis as unknown as { __commerceDb?: Promise<Db> };

export function getDb(): Promise<Db> {
  if (!g.__commerceDb) {
    g.__commerceDb = (async () => {
      const db = await createDb(process.env.DB_DIR ?? ".data/pgdata");
      await seedIfEmpty(db);
      return db;
    })();
  }
  return g.__commerceDb;
}
