# Rules for anyone (human or AI) working on this repo

Status of features lives in README.md. Do not claim a feature works unless it is implemented AND tested.

## Stack and commands
- Web app: Next.js + TypeScript in `app/`.
- Tests: `cd app && npm test` (Vitest). Run them before saying a task is done.
- Core logic lives in `app/src/core/`, demo data in `app/src/data/`.

## Non-negotiable rules
1. Prices, stock levels, margins and totals come from the catalog or deterministic code, never from the LLM.
2. The policy engine (`core/policy.ts`) is the only thing that decides whether a proposal is allowed.
3. Validate all LLM output (zod) before using it. Model failures must show as visible failures.
4. Progress shown in the UI must come from real recorded events. Never fake steps.
5. Every demo record is marked `isSynthetic: true`. Do not present synthetic results as real-world evidence.
6. Never commit secrets (.env, API keys). Use `.env.local` and keep `.env.example` updated.
7. Money is stored and calculated as integer cents. Floats are only for display.

## Working style
- One task = one GitHub Issue = one branch. Keep diffs small; do not touch unrelated files.
- New business rule => new unit test, including a boundary case.
- Prefer the simplest solution; add a dependency only when it clearly pays for itself.
- Big decisions get a short note in `docs/decisions/`.
8. Stock and orders change ONLY through decideRun (src/db/execute.ts): one transaction that re-checks the rules first.
