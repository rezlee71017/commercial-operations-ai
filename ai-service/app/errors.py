"""Provider errors. `kind` decides what the router does next; `public_message` is safe to show a customer."""
from typing import Literal

ErrorKind = Literal["rate_limited", "timeout", "unavailable", "auth", "bad_request"]

PUBLIC_MESSAGES: dict[str, str] = {
    "rate_limited": "The AI service is busy right now. Please try again in a minute.",
    "timeout": "The AI service took too long to answer. Please try again.",
    "unavailable": "The AI service is temporarily unavailable. Please try again.",
    "auth": "The AI service is not configured correctly. Please contact the store.",
    "bad_request": "The AI service could not process this request. Please try again.",
}

# Problems of the provider itself: another provider may succeed.
FALLBACK_KINDS = {"rate_limited", "timeout", "unavailable"}


class ProviderError(Exception):
    def __init__(self, kind: ErrorKind, provider: str, status: int | None, detail: str, retry_after_s: float | None = None):
        super().__init__(f"{provider} HTTP {status if status is not None else 'none'} ({kind}): {detail[:500]}")
        self.kind = kind
        self.provider = provider
        self.status = status
        self.retry_after_s = retry_after_s

    @property
    def public_message(self) -> str:
        return PUBLIC_MESSAGES[self.kind]
