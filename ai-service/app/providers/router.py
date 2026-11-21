"""Tries providers in order with bounded, polite retries. Business logic never sees provider details."""
import asyncio
from collections.abc import Awaitable, Callable

from app.errors import FALLBACK_KINDS, ProviderError
from app.providers.base import Provider
from app.schemas import Attempt, ChatRequest, ChatResponse


class ProviderRouter:
    def __init__(
        self,
        providers: list[Provider],
        max_retries: int = 1,
        max_wait_s: float = 20.0,
        sleep: Callable[[float], Awaitable[None]] = asyncio.sleep,
    ):
        self.providers = providers
        self.max_retries = max_retries
        self.max_wait_s = max_wait_s
        self.sleep = sleep

    @property
    def names(self) -> list[str]:
        return [p.name for p in self.providers]

    async def chat(self, req: ChatRequest) -> ChatResponse:
        candidates = [p for p in self.providers if req.provider in (None, p.name)]
        if not candidates:
            raise ProviderError("auth", req.provider or "none", None, "no provider is configured")
        attempts: list[Attempt] = []
        last: ProviderError | None = None
        for provider in candidates:
            for retry in range(self.max_retries + 1):
                try:
                    res = await provider.chat(req)
                except ProviderError as e:
                    last = e
                    attempts.append(Attempt(provider=provider.name, ok=False, error_kind=e.kind))
                    # Wait and retry the same provider only when it told us a short wait is enough.
                    wait = e.retry_after_s
                    if e.kind in ("rate_limited", "unavailable") and wait is not None and wait <= self.max_wait_s and retry < self.max_retries:
                        await self.sleep(wait + 1)
                        continue
                    if e.kind not in FALLBACK_KINDS:
                        raise  # auth / bad_request: another provider would not fix this request
                    break  # try the next provider
                else:
                    res.attempts = [*attempts, Attempt(provider=provider.name, ok=True)]
                    return res
        assert last is not None
        raise last
