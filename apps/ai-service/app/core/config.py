from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # OpenRouter
    OPENROUTER_API_KEY: str
    OPENROUTER_BASE_URL: str = "https://openrouter.ai/api/v1"

    # Server
    PORT: int = 8000
    NODE_ENV: str = "development"

    # Rate Limiting
    RATE_LIMIT_WINDOW_MS: int = 900000
    RATE_LIMIT_MAX_AUTH: int = 5

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
