# AI service (Python)

FastAPI + Pydantic + LangGraph service for Commercial Operations AI. It provides:

- a provider layer for **Google AI Studio (Gemini)** and **OpenRouter** with timeouts, bounded retries that respect the
  provider's wait hint, fallback only for provider problems (not for auth or bad requests), and customer-safe error messages;
- a **read-only, tool-using shopping agent** built as a LangGraph graph (`model -> tools -> model`) with a step limit.
  Tools: `search_products`, `get_product`, `compare_products`, all over the public catalog (no cost or margin).
  A customer's budget is enforced inside the search tool, not by the model.

It never changes prices, stock, rules or approvals. Those stay in the TypeScript backend.

## Status

| Part | Status |
|---|---|
| Provider adapters, router, error mapping | Implemented, tested with mock HTTP |
| LangGraph agent and tools | Implemented, tested with scripted providers |
| FastAPI endpoints, token auth, input limits | Implemented, tested; server boot checked locally |
| Live calls to Gemini or OpenRouter | **Not run** (needs your keys) |
| Called from the Next.js app | **Not yet** |
| RAG (LlamaIndex), Ragas evaluation | Planned (`rag` extra; dependency resolution checked, nothing implemented) |

## Run

```bash
python -m venv .venv && source .venv/bin/activate
pip install -e ".[dev]"
python -m pytest                       # 34 tests, no network
uvicorn app.main:app --reload --port 8000
```

Configuration comes from environment variables or `ai-service/.env` or `app/.env.local`:
`GEMINI_API_KEY`, `GEMINI_MODEL`, `OPENROUTER_API_KEY`, `OPENROUTER_MODEL`, `OPENROUTER_FALLBACK_MODELS`,
`LLM_PROVIDERS` (order, default `gemini,openrouter`), `NEXT_API_URL` (default `http://localhost:3000`),
`AI_SERVICE_TOKEN`, `ENVIRONMENT`.

## Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /health` | Status and which providers are configured (never the keys) |
| `POST /v1/chat` | Provider-neutral chat with optional tools; `provider` forces one provider (no fallback) |
| `POST /v1/agent/run` | `{ message, history?, max_budget_dollars? }` returns `{ status, answer, steps, provider }` |

Auth: send `X-Internal-Token` equal to `AI_SERVICE_TOKEN`. If it is unset the service is open in development and
answers 503 when `ENVIRONMENT=production`.

```bash
curl -s localhost:8000/v1/agent/run -H 'content-type: application/json' \
  -d '{"message":"I need a USB-C charger for my laptop","max_budget_dollars":60}'
```

The web app must be running (it serves `/api/products`). History sent by a caller is reduced to plain user and
assistant text; fake tool results and raw provider data are dropped.

## Design notes

- Gemini function calling needs the model's own `parts` (which can contain `thoughtSignature`) replayed unchanged on the
  next turn. They are kept in `provider_data`. If a conversation switches providers mid-way, Gemini receives history
  without those signatures; this path is untested against the live API.
- OpenRouter can answer HTTP 200 with an error object; that is treated as an error.
- Free tiers are not production: OpenRouter free models have a request cap and rotate; free endpoints may log prompts.

## Layout

`app/settings.py` configuration, `app/schemas.py` contracts, `app/providers/` adapters and router,
`app/tools.py` catalog tools, `app/agent.py` LangGraph agent, `app/main.py` FastAPI, `tests/` mock-based tests.
