import json

import httpx
import pytest

from app.errors import ProviderError
from app.providers.gemini import GeminiProvider, build_payload, to_contents, to_gemini_schema
from app.providers.openrouter import OpenRouterProvider
from app.schemas import ChatRequest, Message, ToolCall, ToolSpec

TOOL = ToolSpec(
    name="search_products",
    description="d",
    parameters={"type": "object", "properties": {"query": {"type": "string", "title": "Query", "default": "x"}}, "required": ["query"], "additionalProperties": False},
)


def client(handler):
    return httpx.AsyncClient(transport=httpx.MockTransport(handler))


def test_gemini_schema_uses_upper_case_types_and_drops_unsupported_keys():
    out = to_gemini_schema(TOOL.parameters)
    assert out["type"] == "OBJECT" and out["properties"]["query"]["type"] == "STRING"
    assert "additionalProperties" not in out and "title" not in out["properties"]["query"] and "default" not in out["properties"]["query"]


def test_gemini_replays_raw_parts_and_merges_parallel_tool_results():
    raw = [{"functionCall": {"name": "a", "args": {}}, "thoughtSignature": "sig"}, {"functionCall": {"name": "b", "args": {}}}]
    msgs = [
        Message(role="user", content="hi"),
        Message(role="assistant", tool_calls=[ToolCall(id="c0", name="a"), ToolCall(id="c1", name="b")], provider_data={"gemini_parts": raw}),
        Message(role="tool", name="a", tool_call_id="c0", content='{"x": 1}'),
        Message(role="tool", name="b", tool_call_id="c1", content="plain text"),
    ]
    contents = to_contents(msgs)
    assert contents[1] == {"role": "model", "parts": raw}  # thoughtSignature preserved untouched
    assert len(contents) == 3 and len(contents[2]["parts"]) == 2
    assert contents[2]["parts"][0]["functionResponse"]["response"] == {"x": 1}
    assert contents[2]["parts"][1]["functionResponse"]["response"] == {"result": "plain text"}


async def test_gemini_request_and_response():
    seen = {}

    def handler(request: httpx.Request):
        seen["url"], seen["key"], seen["body"] = str(request.url), request.headers["x-goog-api-key"], json.loads(request.content)
        return httpx.Response(200, json={"candidates": [{"content": {"parts": [{"functionCall": {"name": "search_products", "args": {"query": "case"}}, "thoughtSignature": "s"}]}}]})

    p = GeminiProvider("KEY", "gemini-x", client(handler))
    res = await p.chat(ChatRequest(system="sys", messages=[Message(role="user", content="hi")], tools=[TOOL]))
    assert seen["url"].endswith("/models/gemini-x:generateContent") and seen["key"] == "KEY"
    assert seen["body"]["systemInstruction"]["parts"][0]["text"] == "sys"
    assert seen["body"]["tools"][0]["functionDeclarations"][0]["parameters"]["type"] == "OBJECT"
    assert res.tool_calls[0].name == "search_products" and res.tool_calls[0].args == {"query": "case"}
    assert res.provider_data["gemini_parts"][0]["thoughtSignature"] == "s"


@pytest.mark.parametrize(
    "status,body,kind",
    [
        (429, '{"error":{"details":[{"retryDelay":"40s"}]}}', "rate_limited"),
        (400, '{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}', "auth"),
        (403, "{}", "auth"),
        (404, "{}", "bad_request"),
        (503, "{}", "unavailable"),
    ],
)
async def test_gemini_error_mapping(status, body, kind):
    p = GeminiProvider("KEY", "m", client(lambda r: httpx.Response(status, text=body)))
    with pytest.raises(ProviderError) as e:
        await p.chat(ChatRequest(messages=[Message(role="user", content="hi")]))
    assert e.value.kind == kind
    if status == 429:
        assert e.value.retry_after_s == 40.0


async def test_gemini_blocked_prompt_is_a_bad_request():
    p = GeminiProvider("KEY", "m", client(lambda r: httpx.Response(200, json={"promptFeedback": {"blockReason": "SAFETY"}})))
    with pytest.raises(ProviderError) as e:
        await p.chat(ChatRequest(messages=[Message(role="user", content="hi")]))
    assert e.value.kind == "bad_request"


async def test_timeout_and_network_errors():
    def boom(kind):
        def handler(request):
            raise kind("x")
        return handler

    for exc, kind in [(httpx.ReadTimeout, "timeout"), (httpx.ConnectError, "unavailable")]:
        p = OpenRouterProvider("K", "openrouter/free", client(boom(exc)))
        with pytest.raises(ProviderError) as e:
            await p.chat(ChatRequest(messages=[Message(role="user", content="hi")]))
        assert e.value.kind == kind


async def test_openrouter_request_shape_fallback_models_and_malformed_args():
    seen = {}

    def handler(request: httpx.Request):
        seen["url"], seen["auth"], seen["body"] = str(request.url), request.headers["authorization"], json.loads(request.content)
        return httpx.Response(
            200,
            json={"model": "vendor/free:free", "choices": [{"message": {"content": None, "tool_calls": [
                {"id": "t1", "function": {"name": "search_products", "arguments": '{"query":"x"}'}},
                {"id": "t2", "function": {"name": "get_product", "arguments": "{oops"}},
            ]}}]},
        )

    p = OpenRouterProvider("K", "a/b:free", client(handler), fallbacks=["c/d:free"])
    msgs = [
        Message(role="user", content="hi"),
        Message(role="assistant", tool_calls=[ToolCall(id="t0", name="search_products", args={"query": "q"})]),
        Message(role="tool", name="search_products", tool_call_id="t0", content="{}"),
    ]
    res = await p.chat(ChatRequest(system="sys", messages=msgs, tools=[TOOL]))
    body = seen["body"]
    assert seen["url"] == "https://openrouter.ai/api/v1/chat/completions" and seen["auth"] == "Bearer K"
    assert body["models"] == ["a/b:free", "c/d:free"] and body["tool_choice"] == "auto"
    assert [m["role"] for m in body["messages"]] == ["system", "user", "assistant", "tool"]
    assert body["messages"][3]["tool_call_id"] == "t0"
    assert res.model == "vendor/free:free"
    assert [(c.name, c.args) for c in res.tool_calls] == [("search_products", {"query": "x"}), ("get_product", {})]


async def test_openrouter_http_200_with_error_object_is_an_error():
    p = OpenRouterProvider("K", "m", client(lambda r: httpx.Response(200, json={"error": {"code": 429, "message": "slow down"}})))
    with pytest.raises(ProviderError) as e:
        await p.chat(ChatRequest(messages=[Message(role="user", content="hi")]))
    assert e.value.kind == "rate_limited"


def test_build_payload_without_tools_has_no_tool_fields():
    assert "tools" not in build_payload(ChatRequest(messages=[Message(role="user", content="hi")]))
