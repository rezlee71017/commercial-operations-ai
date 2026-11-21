"""Provider-neutral data contracts. Every provider adapter converts to and from these."""
from typing import Any, Literal

from pydantic import BaseModel, Field


class ToolCall(BaseModel):
    id: str
    name: str
    args: dict[str, Any] = Field(default_factory=dict)


class Message(BaseModel):
    role: Literal["user", "assistant", "tool"]
    content: str | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)  # assistant messages
    tool_call_id: str | None = None  # tool messages: which call this answers
    name: str | None = None  # tool messages: tool name
    # Raw provider data that must be replayed unchanged (for example Gemini thought signatures).
    # Other providers ignore it.
    provider_data: dict[str, Any] | None = None


class ToolSpec(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]  # JSON Schema (lowercase types)


class ChatRequest(BaseModel):
    system: str = ""
    messages: list[Message]
    tools: list[ToolSpec] = Field(default_factory=list)
    temperature: float = 0.0
    provider: str | None = None  # force one provider (no fallback)


class Attempt(BaseModel):
    provider: str
    ok: bool
    error_kind: str | None = None


class ChatResponse(BaseModel):
    text: str | None = None
    tool_calls: list[ToolCall] = Field(default_factory=list)
    provider: str
    model: str | None = None
    attempts: list[Attempt] = Field(default_factory=list)
    provider_data: dict[str, Any] | None = None


class AgentRunRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[Message] = Field(default_factory=list, max_length=40)
    max_budget_dollars: float | None = Field(default=None, gt=0)


class AgentStep(BaseModel):
    kind: Literal["model", "tool"]
    detail: str
    ok: bool = True


class AgentRunResponse(BaseModel):
    status: Literal["answered", "step_limit", "failed"]
    answer: str
    steps: list[AgentStep]
    provider: str | None = None
