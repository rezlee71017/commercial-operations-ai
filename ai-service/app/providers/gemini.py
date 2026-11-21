"""Google AI Studio (Gemini API) adapter, plain REST so errors and quotas stay visible.

Notes learned from the TypeScript agent that already runs against Gemini:
- Function calling needs the model's own `parts` replayed unchanged on the next turn (they can
  carry `thoughtSignature`), so we keep them in `provider_data` and send them back as they were.
- Gemini wants upper-case schema types and rejects some JSON Schema keywords.
"""
import json
from typing import Any

import httpx

from app.providers.base import post_json
from app.schemas import ChatRequest, ChatResponse, Message, ToolCall

BASE_URL = "https://generativelanguage.googleapis.com/v1beta"
_UNSUPPORTED_SCHEMA_KEYS = {"additionalProperties", "$schema", "title", "default", "examples", "$defs", "definitions"}


def to_gemini_schema(node: Any) -> Any:
    if isinstance(node, list):
        return [to_gemini_schema(x) for x in node]
    if isinstance(node, dict):
        out = {}
        for k, v in node.items():
            if k in _UNSUPPORTED_SCHEMA_KEYS:
                continue
            out[k] = v.upper() if k == "type" and isinstance(v, str) else to_gemini_schema(v)
        return out
    return node


def _response_object(content: str | None) -> dict:
    """functionResponse.response must be a JSON object."""
    if not content:
        return {"result": None}
    try:
        parsed = json.loads(content)
    except json.JSONDecodeError:
        return {"result": content}
    return parsed if isinstance(parsed, dict) else {"result": parsed}


def to_contents(messages: list[Message]) -> list[dict]:
    contents: list[dict] = []
    for m in messages:
        if m.role == "user":
            contents.append({"role": "user", "parts": [{"text": m.content or ""}]})
        elif m.role == "assistant":
            raw = (m.provider_data or {}).get("gemini_parts")
            if raw:
                parts = raw
            else:
                parts = [{"text": m.content}] if m.content else []
                parts += [{"functionCall": {"name": c.name, "args": c.args}} for c in m.tool_calls]
            contents.append({"role": "model", "parts": parts or [{"text": ""}]})
        else:  # tool result; parallel results go together in one content
            part = {"functionResponse": {"name": m.name or "tool", "response": _response_object(m.content)}}
            if contents and contents[-1]["role"] == "user" and all("functionResponse" in p for p in contents[-1]["parts"]):
                contents[-1]["parts"].append(part)
            else:
                contents.append({"role": "user", "parts": [part]})
    return contents


def build_payload(req: ChatRequest) -> dict:
    payload: dict[str, Any] = {"contents": to_contents(req.messages), "generationConfig": {"temperature": req.temperature}}
    if req.system:
        payload["systemInstruction"] = {"parts": [{"text": req.system}]}
    if req.tools:
        payload["tools"] = [
            {"functionDeclarations": [{"name": t.name, "description": t.description, "parameters": to_gemini_schema(t.parameters)} for t in req.tools]}
        ]
    return payload


def parse_response(data: dict, provider: str, model: str) -> ChatResponse:
    from app.errors import ProviderError

    candidates = data.get("candidates") or []
    if not candidates:
        block = (data.get("promptFeedback") or {}).get("blockReason")
        raise ProviderError("bad_request", provider, 200, f"no candidates returned (blockReason={block})")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    text = "".join(p["text"] for p in parts if isinstance(p.get("text"), str)).strip()
    calls = [
        ToolCall(id=f"call_{i}", name=p["functionCall"]["name"], args=p["functionCall"].get("args") or {})
        for i, p in enumerate(p for p in parts if "functionCall" in p)
    ]
    return ChatResponse(text=text or None, tool_calls=calls, provider=provider, model=model, provider_data={"gemini_parts": parts})


class GeminiProvider:
    name = "gemini"

    def __init__(self, api_key: str, model: str, client: httpx.AsyncClient, timeout_s: float = 30.0, base_url: str = BASE_URL):
        self.api_key, self.model, self.client, self.timeout_s, self.base_url = api_key, model, client, timeout_s, base_url

    async def chat(self, req: ChatRequest) -> ChatResponse:
        data = await post_json(
            self.client,
            self.name,
            f"{self.base_url}/models/{self.model}:generateContent",
            {"Content-Type": "application/json", "x-goog-api-key": self.api_key},
            build_payload(req),
            self.timeout_s,
        )
        return parse_response(data, self.name, self.model)
