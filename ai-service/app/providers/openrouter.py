"""OpenRouter adapter (OpenAI-compatible chat completions with tool calling).

Free models rotate and have a request cap (20/min, a small daily limit), so the default model is the
free router and extra fallback models can be listed; OpenRouter then tries them in order itself.
"""
import json

import httpx

from app.errors import ProviderError
from app.providers.base import post_json
from app.schemas import ChatRequest, ChatResponse, Message, ToolCall

BASE_URL = "https://openrouter.ai/api/v1"


def to_messages(system: str, messages: list[Message]) -> list[dict]:
    out: list[dict] = [{"role": "system", "content": system}] if system else []
    for m in messages:
        if m.role == "user":
            out.append({"role": "user", "content": m.content or ""})
        elif m.role == "assistant":
            msg: dict = {"role": "assistant", "content": m.content}
            if m.tool_calls:
                msg["tool_calls"] = [{"id": c.id, "type": "function", "function": {"name": c.name, "arguments": json.dumps(c.args)}} for c in m.tool_calls]
            out.append(msg)
        else:
            out.append({"role": "tool", "tool_call_id": m.tool_call_id or "", "content": m.content or ""})
    return out


def build_payload(req: ChatRequest, model: str, fallbacks: list[str]) -> dict:
    payload: dict = {"model": model, "messages": to_messages(req.system, req.messages), "temperature": req.temperature}
    if fallbacks:
        payload["models"] = [model, *fallbacks]
    if req.tools:
        payload["tools"] = [{"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.parameters}} for t in req.tools]
        payload["tool_choice"] = "auto"
    return payload


def parse_response(data: dict, provider: str, fallback_model: str) -> ChatResponse:
    # OpenRouter can answer HTTP 200 with an error object (for example when the chosen model failed).
    if data.get("error") and not data.get("choices"):
        err = data["error"]
        code = err.get("code") if isinstance(err, dict) else None
        kind = "rate_limited" if code == 429 else "auth" if code in (401, 403) else "unavailable"
        raise ProviderError(kind, provider, code if isinstance(code, int) else 200, json.dumps(err)[:400])
    msg = ((data.get("choices") or [{}])[0]).get("message")
    if not msg:
        raise ProviderError("unavailable", provider, 200, "the model returned no message")
    calls: list[ToolCall] = []
    for i, c in enumerate(msg.get("tool_calls") or []):
        fn = c.get("function") or {}
        if not fn.get("name"):
            continue
        try:
            args = json.loads(fn["arguments"]) if fn.get("arguments") else {}
        except json.JSONDecodeError:
            args = {}  # malformed arguments: the tool reports the problem and the model can retry
        calls.append(ToolCall(id=c.get("id") or f"call_{i}", name=fn["name"], args=args if isinstance(args, dict) else {}))
    text = (msg.get("content") or "").strip() if isinstance(msg.get("content"), str) else ""
    return ChatResponse(text=text or None, tool_calls=calls, provider=provider, model=data.get("model") or fallback_model)


class OpenRouterProvider:
    name = "openrouter"

    def __init__(self, api_key: str, model: str, client: httpx.AsyncClient, fallbacks: list[str] | None = None, timeout_s: float = 30.0, base_url: str = BASE_URL):
        self.api_key, self.model, self.client = api_key, model, client
        self.fallbacks, self.timeout_s, self.base_url = fallbacks or [], timeout_s, base_url

    async def chat(self, req: ChatRequest) -> ChatResponse:
        data = await post_json(
            self.client,
            self.name,
            f"{self.base_url}/chat/completions",
            {"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}", "X-Title": "Commercial Operations AI"},
            build_payload(req, self.model, self.fallbacks),
            self.timeout_s,
        )
        return parse_response(data, self.name, self.model)
