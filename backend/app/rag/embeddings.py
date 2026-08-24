import google.generativeai as genai

from app.core.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)

_MODEL_NAME = f"models/{settings.gemini_embedding_model}"


def embed_text(text: str) -> list[float]:
    """Soru gibi tek bir sorgu metnini embed eder (asimetrik retrieval icin task_type=retrieval_query)."""
    result = genai.embed_content(model=_MODEL_NAME, content=text, task_type="retrieval_query")
    return result["embedding"]


def embed_texts(texts: list[str]) -> list[list[float]]:
    """Kaynak chunk'larini embed eder (task_type=retrieval_document)."""
    if not texts:
        return []
    result = genai.embed_content(model=_MODEL_NAME, content=texts, task_type="retrieval_document")
    return result["embedding"]
