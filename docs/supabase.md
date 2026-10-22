# Using Supabase (free) instead of the local database

The app uses a local database by default. To use a hosted Postgres such as Supabase:

1. Create a Supabase project. In its dashboard open the connection settings and copy the
   **pooler** connection string (Session or Transaction mode). Put your database password in it.
2. Put it in app/.env.local on its own line:  DATABASE_URL=postgresql://...
   Never commit this file (it is ignored by git).
3. Check the connection:   cd app && npm run db:check
4. Create the tables and load the demo data (once):   npm run db:setup
5. Start the app as usual. It now reads and writes the hosted database.

Notes
- Free projects can be paused after a period of inactivity and have a size limit; check your dashboard for the current limits.
- Tables have row level security enabled with no policies. The app connects as the database owner role.
  If queries unexpectedly return nothing on Supabase, check that the role used in DATABASE_URL can bypass row level security.
- The automated tests cover our code through the hosted-database driver, but only a real project proves that your account and network work.

## Rules for working with Supabase in this project
- Use a dedicated Supabase project for this app. Do not share it with another application.
- Do not use the database or backend that Figma Make can create for its own prototypes. The website talks to our API only.
- Schema changes go through Drizzle migrations in `app/drizzle` (`npm run db:generate`), then `npm run db:setup`. Do not edit tables by hand in the dashboard, or the repo and the database drift apart.
- Before any public deployment: merchant login and RLS policies for anything reachable with the anon key, and protection of `POST /api/runs/[id]/decision`.
