"""Configuration from environment variables (or .env files). Secrets never leave this module."""
from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=(".env", "../app/.env.local"), extra="ignore", populate_by_name=True)

    environment: str = Field(default="development", alias="ENVIRONMENT")

    # Shared secret with the Next.js app. Empty is allowed in development only.
    ai_service_token: str = Field(default="", alias="AI_SERVICE_TOKEN")

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    gemini_model: str = Field(default="gemini-3.5-flash-lite", alias="GEMINI_MODEL")

    openrouter_api_key: str = Field(default="", alias="OPENROUTER_API_KEY")
    openrouter_model: str = Field(default="openrouter/free", alias="OPENROUTER_MODEL")
    # Comma separated list of extra OpenRouter models to try if the first is unavailable.
    openrouter_fallback_models: str = Field(default="", alias="OPENROUTER_FALLBACK_MODELS")

    # Order in which providers are tried, e.g. "gemini,openrouter".
    llm_providers: str = Field(default="gemini,openrouter", alias="LLM_PROVIDERS")

    # Where the Next.js app (catalog, rules, orders) lives.
    next_api_url: str = Field(default="http://localhost:3000", alias="NEXT_API_URL")

    request_timeout_s: float = 30.0
    max_retry_wait_s: float = 20.0
    agent_max_steps: int = 6
    tool_timeout_s: float = 10.0

    @property
    def provider_order(self) -> list[str]:
        return [p.strip().lower() for p in self.llm_providers.split(",") if p.strip()]

    @property
    def openrouter_fallbacks(self) -> list[str]:
        return [m.strip() for m in self.openrouter_fallback_models.split(",") if m.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
