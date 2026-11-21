import pytest

from app.schemas import ChatRequest, ChatResponse, Message, ToolCall

CATALOG = [
    {"id": "p-laptop", "name": "Laptop Nova 14", "category": "Laptops", "priceCents": 89900, "stock": 5, "compatibleWith": ["p-charger"], "isSynthetic": True},
    {"id": "p-laptop2", "name": "Laptop Atlas 16", "category": "Laptops", "priceCents": 129900, "stock": 0, "compatibleWith": [], "isSynthetic": True},
    {"id": "p-charger", "name": "USB-C Charger 65W", "category": "Chargers", "priceCents": 3900, "stock": 20, "compatibleWith": ["p-laptop"], "isSynthetic": True},
    {"id": "p-mouse", "name": "Wireless Mouse", "category": "Peripherals", "priceCents": 2500, "stock": 12, "compatibleWith": [], "isSynthetic": True},
]


class FakeCatalog:
    def __init__(self, items=None, fail=False):
        self.items, self.fail = CATALOG if items is None else items, fail

    async def products(self):
        if self.fail:
            raise RuntimeError("catalog down")
        return self.items


class ScriptedProvider:
    """A provider that answers from a script of ChatResponse objects and records what it was asked."""

    def __init__(self, script, name="fake"):
        self.name, self.model, self.script, self.requests = name, "m", list(script), []

    async def chat(self, req: ChatRequest) -> ChatResponse:
        self.requests.append(req)
        item = self.script.pop(0)
        if isinstance(item, Exception):
            raise item
        return item


def reply(text=None, calls=None, provider="fake"):
    return ChatResponse(text=text, tool_calls=[ToolCall(id=f"c{i}", name=n, args=a) for i, (n, a) in enumerate(calls or [])], provider=provider, model="m")


@pytest.fixture
def catalog():
    return FakeCatalog()
