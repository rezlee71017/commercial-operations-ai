# 0003: Database and money

Status: accepted

## Decision
- The database is the source of truth for products, stock and business rules.
- Postgres-compatible, embedded: PGlite with Drizzle ORM. No install, no account, no cost.
  Data lives in app/.data (not committed). The demo catalog is created automatically on first use.
- Schema changes are SQL migrations in app/drizzle (generated with drizzle-kit, committed).
- Money is stored and calculated as integer cents.
- Every product row records whether it is synthetic.

## Why
- Business-critical numbers must be exact and reproducible; floats are not.
- The same schema and queries can move to a hosted Postgres (for example Supabase) by changing src/db/client.ts only.

## To re-check
- Hosting: the embedded database needs a persistent disk, so the public demo needs a hosted Postgres.
