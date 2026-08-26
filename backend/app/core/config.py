from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central app configuration, loaded from environment / .env."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_name: str = "PRAGMA-AI"
    environment: str = "development"

    # CORS — virgulle ayrilmis origin listesi ya da "*" (tum origin'lere izin).
    # Ornek prod degeri:
    #   CORS_ORIGINS=https://pragma-ai.vercel.app,https://pragma-ai.netlify.app
    cors_origins: str = "*"

    # Database
    database_url: str = "postgresql+psycopg://pragma:pragma@localhost:5432/pragma_ai"

    # Auth
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60

    # LLM / RAG
    gemini_api_key: str = ""
    gemini_chat_model: str = "gemini-3.6-flash"
    gemini_embedding_model: str = "gemini-embedding-001"
    chroma_persist_dir: str = "./app/data/chroma"
    rag_top_k: int = 5
    rag_min_similarity: float = 0.35

    @property
    def cors_origin_list(self) -> list[str]:
        """CORS_ORIGINS degerini listeye cevirir.

        "*" (varsayilan) tum origin'lere izin verir — jury demosu / hizli
        dagitim icin pratik. Production'da acik liste verildiginde yalnizca o
        domainler kabul edilir.
        """
        raw = (self.cors_origins or "").strip()
        if not raw or raw == "*":
            return ["*"]
        return [origin.strip().rstrip("/") for origin in raw.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
