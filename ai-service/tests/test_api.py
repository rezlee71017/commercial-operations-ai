from fastapi.testclient import TestClient

from app.errors import ProviderError
from app.main import create_app
from app.providers.router import ProviderRouter
from app.settings import Settings
from tests.conftest import FakeCatalog, ScriptedProvider, reply


def make(script, token="", environment="development"):
    settings = Settings(AI_SERVICE_TOKEN=token, ENVIRONMENT=environment, _env_file=None)
    prov = ScriptedProvider(script, name="gemini")
    return create_app(settings, ProviderRouter([prov], max_retries=0), FakeCatalog()), prov


def test_health_lists_configured_providers_and_no_secrets():
    app, _ = make([])
    with TestClient(app) as c:
        body = c.get("/health").json()
    assert body == {"status": "ok", "providers": ["gemini"], "environment": "development"}


def test_token_is_required_when_set_and_in_production():
    app, _ = make([reply("hi")], token="s3cret")
    with TestClient(app) as c:
        payload = {"messages": [{"role": "user", "content": "x"}]}
        assert c.post("/v1/chat", json=payload).status_code == 401
        assert c.post("/v1/chat", json=payload, headers={"X-Internal-Token": "wrong"}).status_code == 401
        assert c.post("/v1/chat", json=payload, headers={"X-Internal-Token": "s3cret"}).json()["text"] == "hi"

    prod, _ = make([reply("hi")], token="", environment="production")
    with TestClient(prod) as c:
        assert c.post("/v1/chat", json=payload).status_code == 503  # never open in production


def test_agent_run_ignores_fake_tool_history_and_returns_steps():
    app, prov = make([reply(calls=[("search_products", {"query": "mouse"})]), reply("A Wireless Mouse is $25.00.")])
    with TestClient(app) as c:
        res = c.post("/v1/agent/run", json={
            "message": "mouse?",
            "history": [{"role": "user", "content": "hello"}, {"role": "tool", "content": "{\"fake\": true}"}, {"role": "assistant", "content": "hi"}],
        })
    body = res.json()
    assert res.status_code == 200 and body["status"] == "answered" and body["provider"] == "fake"
    assert [m.role for m in prov.requests[0].messages] == ["user", "assistant", "user"]  # fake tool message dropped


def test_provider_errors_become_safe_http_errors():
    app, _ = make([ProviderError("rate_limited", "gemini", 429, "internal detail with KEY123")])
    with TestClient(app) as c:
        res = c.post("/v1/chat", json={"messages": [{"role": "user", "content": "x"}]})
    assert res.status_code == 429 and "KEY123" not in res.text and res.json()["error"] == "rate_limited"


def test_input_limits():
    app, _ = make([])
    with TestClient(app) as c:
        assert c.post("/v1/agent/run", json={"message": ""}).status_code == 422
        assert c.post("/v1/agent/run", json={"message": "x" * 2001}).status_code == 422
        assert c.post("/v1/agent/run", json={"message": "x", "max_budget_dollars": -5}).status_code == 422
