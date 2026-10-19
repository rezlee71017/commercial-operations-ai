import { mkdirSync } from "node:fs";
import path from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import { migrate as migratePglite } from "drizzle-orm/pglite/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { drizzle as drizzlePostgres } from "drizzle-orm/postgres-js";
import { migrate as migratePostgres } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as schema from "./schema";
import { seedIfEmpty } from "./seed";

// Both drivers expose the same query API, so the rest of the code only sees this type.
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
// What a query function needs: works with the database and with a transaction.
export type Queryable = Pick<Db, "select" | "insert" | "update" | "delete">;

export type DbHandle = {
  db: Db;
  kind: "pglite" | "postgres";
  migrate: () => Promise<void>;
  close: () => Promise<void>;
};

const migrationsFolder = () => path.join(process.cwd(), "drizzle");

// LOCAL: PostgreSQL running inside Node (PGlite). No install, no account, no cost.
// Without a directory the database lives in memory (used by tests).
export function openLocal(dataDir?: string): DbHandle {
  if (dataDir) mkdirSync(dataDir, { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzlePglite(client, { schema });
  return {
    db: db as unknown as Db,
    kind: "pglite",
    migrate: () => migratePglite(db, { migrationsFolder: migrationsFolder() }),
    close: () => client.close(),
  };
}

// HOSTED: any Postgres, for example Supabase. Use the "pooler" connection string from the
// Supabase dashboard. Prepared statements are off because the pooler does not support them.
export function openHosted(url: string): DbHandle {
  const local = /@(localhost|127\.0\.0\.1)(:|\/)/.test(url);
  const client = postgres(url, {
    max: Number(process.env.DB_POOL_MAX ?? 5),
    prepare: false,
    ssl: local ? false : "require",
  });
  const db = drizzlePostgres(client, { schema });
  return {
    db: db as unknown as Db,
    kind: "postgres",
    migrate: () => migratePostgres(db, { migrationsFolder: migrationsFolder() }),
    close: () => client.end(),
  };
}

// Tests and scripts: a local database with migrations applied.
export async function createDb(dataDir?: string): Promise<Db> {
  const handle = openLocal(dataDir);
  await handle.migrate();
  return handle.db;
}

// The app's database: hosted if DATABASE_URL is set, otherwise local.
// Hosted databases are NOT changed automatically: run "npm run db:setup" once to create the tables.
export function openConfigured(): DbHandle {
  const url = process.env.DATABASE_URL;
  return url ? openHosted(url) : openLocal(process.env.DB_DIR ?? ".data/pgdata");
}

const g = globalThis as unknown as { __commerceDb?: Promise<Db> };

// One database per server process (survives hot reloads in development).
export function getDb(): Promise<Db> {
  if (!g.__commerceDb) {
    g.__commerceDb = (async () => {
      const handle = openConfigured();
      if (handle.kind === "pglite") {
        await handle.migrate();
        await seedIfEmpty(handle.db);
      }
      return handle.db;
    })();
  }
  return g.__commerceDb;
}
