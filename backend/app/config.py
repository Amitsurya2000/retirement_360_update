"""Application settings, loaded from environment variables."""
from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Postgres — docker-compose injects this; default points at a local instance.
    database_url: str = "postgresql+psycopg://retire:retire@localhost:5432/retire360"

    # Google Gemini (free tier): https://aistudio.google.com/apikey
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"

    # Comma-separated list of allowed CORS origins for the frontend.
    cors_origins: str = "http://localhost:3000,http://localhost:5173"

    app_name: str = "Retirement360 API"
    debug: bool = False

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
