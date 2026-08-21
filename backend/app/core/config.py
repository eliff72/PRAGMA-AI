from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central app configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "PRAGMA-AI"
    environment: str = "development"

    # Database
    database_url: str = "postgresql+psycopg://pragma:pragma@localhost:5432/pragma_ai"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # LLM / RAG
    openai_api_key: str = ""
    openai_chat_model: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-small"
    chroma_persist_dir: str = "./app/data/chroma"
    rag_top_k: int = 5
    rag_min_similarity: float = 0.72


@lru_cache
def get_settings() -> Settings:
    return Settings()
