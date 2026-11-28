# Figma site integration

**Rule: Figma owns the look.** The site design is the Figma Make line of work in `app/src/design/rezalee/` (the REZLEE UI, see decision 0007).
Larger look changes are designed in Figma / Figma Make and brought back as code; small fixes may be made in code and are listed below.
Our code (API, database, AI, adapters) lives outside `src/design/`.

## Layout of the app
- `app/src/app/(figma)/` : root layout and `/` page that mount the REZLEE site (own `<html>` and CSS).
- `app/src/app/(legacy)/` : the old template dashboard (`/workflow`, `/inventory`, `/orders`). Temporary: delete each page when a Figma screen replaces it.
- `app/src/design/rezalee/` : the UI. `RezaleeApp.tsx` (from `App.tsx`), `components/{shared,store,bundle,ops,owner}`, `data/` (`demo.ts` synthetic 100-product catalog, `api.ts` async data access, `chatAdapter.ts` deterministic matcher, `events.ts`), `types.ts`, `rezalee.css` (from `index.css`).
- `app/src/app/api/` : backend routes (unchanged by the design).

## Re-exporting from Figma Make (checklist)
1. Copy `src/App.tsx` to `RezaleeApp.tsx` (rename the component) and put `"use client"` plus a blank line at the top.
2. Copy `src/components`, `src/data`, `src/types.ts`, and `src/index.css` (as `rezalee.css`) over the same paths.
   Do NOT copy `supabase/`, `utils/`, `.figma/`, `index.html`, `main.tsx`, the Vite config or `.gitattributes` (it sends images, zips and fonts to Git LFS).
3. Figma's formatter removes `;` inside one-line type literals, which breaks TypeScript. Keep every type multi-line.
4. Re-apply the CSS fixes below if the new export brings the problems back.
5. Run `cd app && npx tsc --noEmit && npm test`.

## Code fixes made on top of the export
### REZLEE UI port (2026-11-28)
- Ported from the Vite preview (`snapshot/rezalee-preview`) into Next: `"use client"` entry, `NEXT_PUBLIC_AI_ENDPOINT` instead of `import.meta`, categories count derived from data instead of the stale text "seven".
- Lint: state resets moved from effects to render-time updates (`BundleSection`, `RunDetail`, `Photo`), and the `Modal` callback ref is updated in an effect.
- Fonts: still loaded with a CSS `@import` from Google Fonts (follow-up: self-host).

### Earlier fixes (2026-11-19, previous UI, kept for reference)
- Text was tiny (61 of 105 font-size rules were 10px or smaller; status badges used 7px). All sizes below 12px were raised to 12px, 12px to 13px and 13px to 14px.
- Status badges stretched to the height of their row; they now keep their own size (rule at the end of `figma.css`).
- On phones the "Sign in" button was hidden together with the demo badge, so the merchant area was unreachable; it is visible again.
- `types.ts` had four one-line type literals without separators; they are now multi-line.

## Backend contract the Figma UI must use
- `POST /api/run` body `{ request: string, owned?: string[] }` answers with NDJSON (`application/x-ndjson`), one workflow event per line.
- `GET /api/runs` returns `{ id, request, status, mode, createdAt }[]`.
- `GET /api/runs/[id]` returns `{ run, events, approval, order }`.
- `POST /api/runs/[id]/decision` body `{ decision: "approve" | "reject", note?: string }` (max 500 chars).
  Results: `{ ok: true, status: "executed", orderId, totalCents, replay }`, `{ ok: true, status: "rejected", replay }`,
  or `{ ok: false, code: "not_found" | "not_awaiting" | "blocked", message, reasons? }` with HTTP 404 / 409 / 422.
- Run statuses seen in code: `running`, `awaiting_approval`, `rejected_by_policy`, `approved`, `executed`, `rejected`, `failed`.
- Run modes: `gemini-single` (default), `gemini-tools` (`AGENT_MODE=tools`), `mock-single`, `mock-tools` (`LLM_MODE=mock`).
- Money is integer cents. The purchase cost and margin are operator-only and must never appear in storefront data.
- Full endpoint list, auth rules and status: see `docs/api.md`.
