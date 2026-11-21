import pytest

from app.errors import ProviderError
from app.providers.router import ProviderRouter
from app.schemas import ChatRequest, Message
from tests.conftest import ScriptedProvider, reply

REQ = ChatRequest(messages=[Message(role="user", content="hi")])


def err(kind, provider="a", retry=None):
    return ProviderError(kind, provider, 429 if kind == "rate_limited" else 500, "x", retry)


async def test_falls_back_on_provider_problems_and_records_attempts():
    a = ScriptedProvider([err("rate_limited")], name="a")
    b = ScriptedProvider([reply("ok", provider="b")], name="b")
    res = await ProviderRouter([a, b], max_retries=0).chat(REQ)
    assert res.provider == "b"
    assert [(x.provider, x.ok, x.error_kind) for x in res.attempts] == [("a", False, "rate_limited"), ("b", True, None)]


@pytest.mark.parametrize("kind", ["auth", "bad_request"])
async def test_does_not_fall_back_on_auth_or_bad_request(kind):
    a = ScriptedProvider([err(kind)], name="a")
    b = ScriptedProvider([reply("ok")], name="b")
    with pytest.raises(ProviderError):
        await ProviderRouter([a, b]).chat(REQ)
    assert b.requests == []


async def test_waits_only_when_the_provider_asks_for_a_short_wait():
    slept = []

    async def sleep(s):
        slept.append(s)

    a = ScriptedProvider([err("rate_limited", retry=3), reply("ok", provider="a")], name="a")
    res = await ProviderRouter([a], max_retries=1, max_wait_s=10, sleep=sleep).chat(REQ)
    assert res.provider == "a" and slept == [4]

    slept.clear()
    c = ScriptedProvider([err("rate_limited", retry=600)], name="c")
    d = ScriptedProvider([reply("ok", provider="d")], name="d")
    res = await ProviderRouter([c, d], max_retries=1, max_wait_s=10, sleep=sleep).chat(REQ)
    assert res.provider == "d" and slept == []  # too long to wait: switch provider instead


async def test_raises_the_last_error_when_everything_fails_and_when_nothing_is_configured():
    a = ScriptedProvider([err("timeout")], name="a")
    b = ScriptedProvider([err("unavailable")], name="b")
    with pytest.raises(ProviderError) as e:
        await ProviderRouter([a, b], max_retries=0).chat(REQ)
    assert e.value.kind == "unavailable"
    with pytest.raises(ProviderError):
        await ProviderRouter([]).chat(REQ)


async def test_forcing_a_provider_disables_fallback():
    a = ScriptedProvider([err("rate_limited")], name="a")
    b = ScriptedProvider([reply("ok")], name="b")
    with pytest.raises(ProviderError):
        await ProviderRouter([a, b], max_retries=0).chat(ChatRequest(messages=REQ.messages, provider="a"))
    assert b.requests == []
