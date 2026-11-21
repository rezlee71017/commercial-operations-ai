"""What every LLM provider adapter must offer, plus shared HTTP error handling."""
import json
import re
from typing import Protocol

import httpx

from app.errors import ProviderError
from app.schemas import ChatRequest, ChatResponse


class Provider(Protocol):
    name: str
    model: str

    async def chat(self, req: ChatRequest) -> ChatResponse: ...


def parse_retry_after_s(body: str) -> float | None:
    """Gemini: "retryDelay": "40s" or "Please retry in 40.7s"."""
    m = re.search(r'"retryDelay":\s*"(\d+(?:\.\d+)?)s"', body) or re.search(r"retry in (\d+(?:\.\d+)?)s", body, re.I)
    return float(m.group(1)) if m else None


def classify_http_error(provider: str, status: int, body: str) -> ProviderError:
    retry = parse_retry_after_s(body)
    if status == 429:
        return ProviderError("rate_limited", provider, status, body, retry)
    if status in (401, 403):
        return ProviderError("auth", provider, status, body)
    # Google answers an invalid key with HTTP 400 and reason API_KEY_INVALID.
    if status == 400 and ("API_KEY_INVALID" in body or "API key not valid" in body):
        return ProviderError("auth", provider, status, body)
    if status == 503 or status >= 500:
        return ProviderError("unavailable", provider, status, body, retry)
    return ProviderError("bad_request", provider, status, body)


async def post_json(client: httpx.AsyncClient, provider: str, url: str, headers: dict, payload: dict, timeout_s: float) -> dict:
    try:
        res = await client.post(url, headers=headers, json=payload, timeout=timeout_s)
    except httpx.TimeoutException as e:
        raise ProviderError("timeout", provider, None, f"no answer within {timeout_s}s") from e
    except httpx.HTTPError as e:
        raise ProviderError("unavailable", provider, None, str(e)) from e
    if res.status_code >= 400:
        raise classify_http_error(provider, res.status_code, res.text)
    try:
        return res.json()
    except json.JSONDecodeError as e:
        raise ProviderError("unavailable", provider, res.status_code, "response was not JSON") from e
