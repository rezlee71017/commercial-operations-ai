# API reference (what the website and the AI use)

Rules that hold for every endpoint
- Money is integer cents. Errors always look like `{ "error": string, "code"?: string }`.
- **Customer endpoints never contain purchase cost or margin.** This is enforced in code (`app/src/core/redact.ts`) and covered by tests.
- **Operator endpoints** need the header `Authorization: Bearer <OPERATOR_TOKEN>`.
  - `OPERATOR_TOKEN` set: the token is required.
  - not set, development: open (local work).
  - not set, production: operator endpoints answer 503 (closed). They are never silently open.
  - This is a stop-gap: real merchant login (Supabase Auth) replaces `checkOperator` in `app/src/api/operator-auth.ts` later; routes do not change.
- The website should call the API through `app/src/api/client.ts` (typed), not with raw `fetch`.

## Customer
| Endpoint | What it does |
|---|---|
| `GET /api/products` | `{ products: PublicProduct[], categories: {id,name}[] }`, no cost, no margin |
| `POST /api/run` | body `{ request, owned?: string[], previousRunId?: string }`. Streams NDJSON messages `run`, `event`, `result`, `error`. For customers the stream is redacted (no cost, no margin numbers). Operators with a valid token get the full run |

### Follow-ups (conversation = a chain of runs)
- A follow-up sends `previousRunId`: the run it continues. The server gives the model a short summary of the earlier turn (up to 3 earlier messages, the earlier question or bundle). Names and prices come from the catalog; cost and margin are never included.
- A budget stated in the earlier bundle carries over unless the model states a new one.
- If `owned` is not sent, the follow-up keeps the ownership of the earlier run. A new `owned` list replaces it.
- The earlier run must be `needs_input`, `awaiting_approval` or `rejected_by_policy`. Unknown id: 404 `previous_run_not_found`. Run already finished or failed: 409 `previous_not_continuable`. Wrong type: 400.
- A run can end with status `needs_input`: the AI asked a question or explained why it cannot build a bundle (`result.reply = { kind: "clarification" | "cannot_fulfill", message }`). There is no proposal and nothing to approve.
- The link between runs is stored in the `request_received` event and the `run.created` audit entry (no database migration). Known limits: anyone who knows a run id can continue it (ids are random but there is no customer login yet); the earlier run stays open for the store to decide.

## Operator (token)
| Endpoint | What it does |
|---|---|
| `GET /api/runs`, `GET /api/runs/[id]` | run history and the stored run (full evaluation incl. cost and margin) |
| `POST /api/runs/[id]/decision` | `{ decision: "approve" \| "reject", note? }`. Approve re-checks the rules, removes stock, creates one order (one transaction) |
| `GET /api/operator/summary` | runs by status, orders, revenue, cost, margin, low stock, current rules |
| `GET /api/operator/inventory` | catalog with cost and margin |
| `GET /api/operator/rules`, `PUT /api/operator/rules` | read / change `{ minMarginPct 0-95, maxDiscountPct 0-90 }`; every change is written to the audit log |
| `GET /api/operator/orders?limit=`, `GET /api/operator/audit?limit=` | newest first, limit 1-200 |

## Status (as of this commit)
- Implemented and tested (104 tests, real handlers on an in-memory database with the mock AI): everything in the tables above, the redaction, the token guard, the typed client's stream reader.
- NOT done: the Figma UI does not call any of this yet (it still shows hard-coded data); no real merchant login; no customer accounts, carts or checkout endpoints; rate limiting; `npm run build` was not verified in the sandbox (no access to Google Fonts), only type-check, lint and tests.
