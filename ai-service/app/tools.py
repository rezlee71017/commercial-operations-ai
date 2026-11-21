"""Shopping-agent tools. They read the PUBLIC catalog only (no cost or margin) and every number the
model sees comes from here, never from the model itself. Arguments are validated with Pydantic."""
import json
from typing import Any, Protocol

import httpx
from pydantic import BaseModel, Field, ValidationError

from app.schemas import ToolSpec


class CatalogClient(Protocol):
    async def products(self) -> list[dict[str, Any]]: ...


class HttpCatalog:
    """Reads GET /api/products from the Next.js app (public projection: no cost, no margin)."""

    def __init__(self, base_url: str, client: httpx.AsyncClient, timeout_s: float = 10.0):
        self.base_url, self.client, self.timeout_s = base_url.rstrip("/"), client, timeout_s

    async def products(self) -> list[dict[str, Any]]:
        res = await self.client.get(f"{self.base_url}/api/products", timeout=self.timeout_s)
        res.raise_for_status()
        return list(res.json().get("products", []))


class SearchProductsArgs(BaseModel):
    query: str = Field(min_length=1, max_length=120, description="Words describing the product, e.g. 'usb-c charger' or 'laptop'.")
    category: str | None = Field(default=None, description="Optional exact category name.")
    max_price_dollars: float | None = Field(default=None, gt=0, description="Optional price ceiling in dollars.")
    in_stock_only: bool = Field(default=True, description="Only return products that are in stock.")
    limit: int = Field(default=5, ge=1, le=10)


class GetProductArgs(BaseModel):
    product_id: str = Field(min_length=1, max_length=64)


class CompareProductsArgs(BaseModel):
    product_ids: list[str] = Field(min_length=2, max_length=4)


TOOL_MODELS: dict[str, tuple[type[BaseModel], str]] = {
    "search_products": (SearchProductsArgs, "Search the store catalog. Returns real prices and stock; use it before recommending anything."),
    "get_product": (GetProductArgs, "Get one product by id (price, stock, category, compatible products)."),
    "compare_products": (CompareProductsArgs, "Compare 2 to 4 products side by side by id, with price difference and stated compatibility."),
}


def _strip_titles(node: Any) -> Any:
    if isinstance(node, dict):
        return {k: _strip_titles(v) for k, v in node.items() if k != "title"}
    if isinstance(node, list):
        return [_strip_titles(x) for x in node]
    return node


def tool_specs() -> list[ToolSpec]:
    return [ToolSpec(name=n, description=d, parameters=_strip_titles(m.model_json_schema())) for n, (m, d) in TOOL_MODELS.items()]


def _view(p: dict[str, Any]) -> dict[str, Any]:
    cents = int(p["priceCents"])
    return {
        "id": p["id"],
        "name": p["name"],
        "category": p["category"],
        "price_dollars": round(cents / 100, 2),  # display only; money is integer cents in the backend
        "price_cents": cents,
        "stock": int(p["stock"]),
        "in_stock": int(p["stock"]) > 0,
        "compatible_with": list(p.get("compatibleWith") or []),
    }


async def run_tool(name: str, raw_args: dict[str, Any], catalog: CatalogClient, budget_dollars: float | None = None) -> dict[str, Any]:
    """Never raises for bad model input: the model gets an error object and may retry."""
    if name not in TOOL_MODELS:
        return {"error": f"unknown tool '{name}'", "available_tools": sorted(TOOL_MODELS)}
    try:
        args = TOOL_MODELS[name][0].model_validate(raw_args)
    except ValidationError as e:
        return {"error": "invalid arguments", "details": [f"{'.'.join(map(str, x['loc']))}: {x['msg']}" for x in e.errors()][:5]}

    items = await catalog.products()
    by_id = {p["id"]: p for p in items}

    if isinstance(args, SearchProductsArgs):
        ceiling = args.max_price_dollars
        if budget_dollars is not None:  # the customer's budget is enforced here, not by the model
            ceiling = min(ceiling, budget_dollars) if ceiling is not None else budget_dollars
        words = [w for w in args.query.lower().split() if w]
        scored = []
        for p in items:
            hay = f"{p['name']} {p['category']}".lower()
            score = sum(1 for w in words if w in hay)
            if score == 0:
                continue
            if args.category and p["category"].lower() != args.category.lower():
                continue
            if args.in_stock_only and int(p["stock"]) <= 0:
                continue
            if ceiling is not None and int(p["priceCents"]) > round(ceiling * 100):
                continue
            scored.append((-score, int(p["priceCents"]), p))
        scored.sort(key=lambda t: (t[0], t[1]))
        found = [_view(p) for _, _, p in scored[: args.limit]]
        out: dict[str, Any] = {"count": len(found), "products": found}
        if budget_dollars is not None:
            out["budget_dollars_enforced"] = budget_dollars
        return out

    if isinstance(args, GetProductArgs):
        p = by_id.get(args.product_id)
        return _view(p) if p else {"error": f"no product with id '{args.product_id}'"}

    assert isinstance(args, CompareProductsArgs)
    missing = [i for i in args.product_ids if i not in by_id]
    if missing:
        return {"error": "unknown product ids", "missing": missing}
    views = [_view(by_id[i]) for i in args.product_ids]
    cheapest = min(views, key=lambda v: v["price_cents"])
    pairs = []
    for a in views:
        for b in views:
            if a["id"] < b["id"]:
                known = b["id"] in a["compatible_with"] or a["id"] in b["compatible_with"]
                pairs.append({"a": a["id"], "b": b["id"], "listed_as_compatible": known})
    return {
        "products": views,
        "cheapest_id": cheapest["id"],
        "price_difference_cents": max(v["price_cents"] for v in views) - cheapest["price_cents"],
        "compatibility": pairs,
        "note": "listed_as_compatible=false means the catalog does not state compatibility; it does not prove incompatibility.",
    }


def tool_result_text(result: dict[str, Any]) -> str:
    return json.dumps(result, ensure_ascii=False)[:6000]
