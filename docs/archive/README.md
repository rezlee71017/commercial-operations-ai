# Archive

`draft-supabase-schema.sql` is a broad 28-table draft (warehouses, webhooks, workspaces, reviews, pgvector
`knowledge_base`, ...) written on 2026-10-22. It is NOT used by the app and is NOT applied to Supabase.

Why: the app's real schema lives in `app/src/db/schema.ts` with migrations in `app/drizzle`. Two schemas
would drift apart. If a table from this draft is needed later (for example `knowledge_base` for RAG),
re-add it through a Drizzle migration (`npm run db:generate`) and keep this file only as reference.
