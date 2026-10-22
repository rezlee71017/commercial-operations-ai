# Figma site integration

**Rule: Figma owns the look.** The site design is the Figma Make export in `app/src/design/figma/`.
Do not restyle it by hand. If the look must change, change it in Figma Make and re-export.
Our code (API, database, AI, adapters) lives outside `src/design/`.

## Layout of the app
- `app/src/app/(figma)/` : root layout and `/` page that mount the Figma site (own `<html>` and CSS).
- `app/src/app/(legacy)/` : the old template dashboard (`/workflow`, `/inventory`, `/orders`). Temporary: delete each page when a Figma screen replaces it.
- `app/src/design/figma/FigmaApp.tsx` and `figma.css` : the export.
- `app/src/app/api/` : backend routes (unchanged by the design).

## Mechanical changes made to the export (re-apply after every re-export)
1. `"use client"` added at the top of `FigmaApp.tsx` (it uses React state).
2. Figma's formatter dropped separators in two inline type literals, which is invalid TypeScript in Next.js:
   `{ name: string; size?: number }` and `{ product: Product; quantity: number }[]`.
Nothing else was changed.

## What is real and what is mock (status as of this commit)
| Part of the Figma site | Status |
|---|---|
| Storefront, cart, bundle builder, operator and owner screens | MOCK: all data is hard-coded in `FigmaApp.tsx` (guitars, amps, ...). Not connected to the backend |
| `GET /api/products` (public catalog + categories, no cost) | Implemented, tested (no `costCents` in the response) |
| `POST /api/run`, `GET /api/runs`, `GET /api/runs/[id]`, `POST /api/runs/[id]/decision` | Implemented; runs/decision are now operator-only (token); the customer stream is redacted; not yet used by the Figma UI |
| `GET /api/operator/{summary,inventory,rules,orders,audit}`, `PUT /api/operator/rules` | Implemented and tested; not yet used by the Figma UI |
| Typed client `app/src/api/client.ts` | Implemented and tested; the Figma UI should use it |

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
