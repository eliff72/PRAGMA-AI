from openai import OpenAI

from app.core.config import get_settings

settings = get_settings()
_client = OpenAI(api_key=settings.openai_api_key)


def embed_text(text: str) -> list[float]:
    response = _client.embeddings.create(model=settings.openai_embedding_model, input=text)
    return response.data[0].embedding


def embed_texts(texts: list[str]) -> list[list[float]]:
    if not texts:
        return []
    response = _client.embeddings.create(model=settings.openai_embedding_model, input=texts)
    return [item.embedding for item in response.data]
