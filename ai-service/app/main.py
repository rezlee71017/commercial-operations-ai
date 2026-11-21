"""FastAPI service. The Next.js app calls it with a shared token; keys never leave this process."""
import hmac
from contextlib import asynccontextmanager

import httpx
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse

from app.agent import ShoppingAgent
from app.errors import ProviderError
from app.providers.gemini import GeminiProvider
from app.providers.openrouter import OpenRouterProvider
from app.providers.router import ProviderRouter
from app.schemas import AgentRunRequest, AgentRunResponse, ChatRequest, ChatResponse, Message
from app.settings import Settings, get_settings
from app.tools import CatalogClient, HttpCatalog

HTTP_STATUS = {"rate_limited": 429, "timeout": 504, "unavailable": 503, "auth": 500, "bad_request": 502}


def build_router(settings: Settings, client: httpx.AsyncClient) -> ProviderRouter:
    providers = []
    for name in settings.provider_order:
        if name == "gemini" and settings.gemini_api_key:
            providers.append(GeminiProvider(settings.gemini_api_key, settings.gemini_model, client, settings.request_timeout_s))
        elif name == "openrouter" and settings.openrouter_api_key:
            providers.append(
                OpenRouterProvider(settings.openrouter_api_key, settings.openrouter_model, client, settings.openrouter_fallbacks, settings.request_timeout_s)
            )
    return ProviderRouter(providers, max_wait_s=settings.max_retry_wait_s)


def create_app(settings: Settings | None = None, router: ProviderRouter | None = None, catalog: CatalogClient | None = None) -> FastAPI:
    settings = settings or get_settings()

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        client = httpx.AsyncClient()
        app.state.router = router or build_router(settings, client)
        app.state.catalog = catalog or HttpCatalog(settings.next_api_url, client, settings.tool_timeout_s)
        yield
        await client.aclose()

    app = FastAPI(title="Commercial Operations AI service", version="0.1.0", lifespan=lifespan)

    def require_token(x_internal_token: str | None = Header(default=None)) -> None:
        expected = settings.ai_service_token
        if not expected:
            if settings.environment == "production":
                raise HTTPException(503, "AI_SERVICE_TOKEN is not set")  # never open in production
            return
        if not x_internal_token or not hmac.compare_digest(x_internal_token, expected):
            raise HTTPException(401, "invalid token")

    @app.exception_handler(ProviderError)
    async def provider_error(_, e: ProviderError):
        return JSONResponse({"error": e.kind, "message": e.public_message}, status_code=HTTP_STATUS[e.kind])

    @app.get("/health")
    async def health():
        # Which providers are configured, never the keys themselves.
        return {"status": "ok", "providers": app.state.router.names, "environment": settings.environment}

    @app.post("/v1/chat", response_model=ChatResponse, dependencies=[Depends(require_token)])
    async def chat(req: ChatRequest):
        return await app.state.router.chat(req)

    @app.post("/v1/agent/run", response_model=AgentRunResponse, dependencies=[Depends(require_token)])
    async def agent_run(req: AgentRunRequest):
        # History from the caller may only be plain user/assistant text: no fake tool results, no raw provider data.
        clean = [Message(role=m.role, content=m.content) for m in req.history if m.role in ("user", "assistant") and m.content]
        agent = ShoppingAgent(app.state.router, app.state.catalog, settings.agent_max_steps, settings.tool_timeout_s)
        return await agent.run(req.message, clean, req.max_budget_dollars)

    return app


app = create_app() if __name__ != "__main__" else None  # `uvicorn app.main:app`
