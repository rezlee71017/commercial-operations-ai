# 0006: Python AI service and provider strategy

Date: 2026-11-19. Status: accepted (implementation started, not yet wired to the web app).

## Context
The TypeScript agent works against Gemini but depended on one fallback provider (Groq) that did not fit the
project. We also want Python to be a real part of the AI layer (agent orchestration, later RAG and evaluation).

## Decisions
1. **Providers:** Google AI Studio (Gemini) is the primary provider; OpenRouter is the fallback and a way to try other
   models. Groq is removed. Both TypeScript (`app/src/core`) and Python (`ai-service/app/providers`) use the same rules:
   timeouts, bounded retries that respect the provider's wait hint, no fallback on auth or bad-request errors,
   customer-safe error messages, keys only on the server.
2. **Python service (`ai-service/`):** FastAPI + Pydantic + LangGraph. It owns provider access and a read-only,
   tool-using shopping agent (search, get, compare over the public catalog). The agent cannot change anything.
3. **Boundary stays the same:** proposals, policy checks, approvals and execution remain in the TypeScript backend
   (`core/policy.ts`, `db/execute.ts`). The Python agent only advises; budgets are enforced inside its tools.
4. **RAG and evaluation (LlamaIndex, Ragas):** a dry-run dependency resolution together with LangGraph succeeded
   (llama-index-core 0.14.x, ragas 0.4.x), but nothing is implemented. They are listed under the `rag` extra in
   `ai-service/pyproject.toml` and come in the RAG phase.
5. **Free tiers are not production:** OpenRouter free models allow about 20 requests/minute and a small daily cap
   (more after buying credits), free model ids rotate, and free endpoints may log prompts. Gemini free-tier data may be
   used by Google to improve products. Only synthetic demo data is sent. Re-verify limits before relying on them.

## Consequences
- Two runtimes to deploy later (Next.js and the Python service). Until the Python service is called from the web app,
  the TypeScript agent remains the one used by `/api/run`.
- Keep the two provider layers behaviorally identical until one of them is retired.
