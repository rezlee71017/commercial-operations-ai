# 0001: Core principles and first stack

Status: accepted (2026-10-15)

## Decisions
- Deterministic policy layer decides; the LLM only proposes and explains.
- LLM access sits behind one function (`propose`), so the provider can be swapped or faked in tests.
- Stack: Next.js + TypeScript. Start without a database (in-memory demo data); add Postgres (e.g. Supabase) in the next milestone.
- Demo data is synthetic and labeled as such.

## Why
- Business-critical numbers must be reproducible and testable, which an LLM cannot guarantee.
- Free-tier services and regional access can change; a swappable LLM layer limits that risk.

## Known risks (to re-check)
- Free-tier limits and regional availability of hosted LLM APIs.
- Hosted free plans may be non-commercial only.
- Free-tier LLM providers may use submitted data; never send real customer data.
