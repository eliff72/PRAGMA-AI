import chromadb

from app.core.config import get_settings

settings = get_settings()
_client = chromadb.PersistentClient(path=settings.chroma_persist_dir)


def _collection_name(competition_slug: str) -> str:
    return f"competition_{competition_slug}"


def get_collection(competition_slug: str):
    """Her yarisma/kategori kendi ChromaDB koleksiyonunda izole edilir; boylece
    arama (MVP gereksinim #4) baska yarismanin kaynaklarina asla sizmaz."""
    return _client.get_or_create_collection(name=_collection_name(competition_slug))


def add_chunks(
    competition_slug: str,
    ids: list[str],
    embeddings: list[list[float]],
    documents: list[str],
    metadatas: list[dict],
) -> None:
    if not ids:
        return
    collection = get_collection(competition_slug)
    collection.add(ids=ids, embeddings=embeddings, documents=documents, metadatas=metadatas)


def query(competition_slug: str, query_embedding: list[float], top_k: int) -> dict:
    collection = get_collection(competition_slug)
    return collection.query(query_embeddings=[query_embedding], n_results=top_k)


def deactivate_source(competition_slug: str, source_id: str) -> None:
    """Iceri yonetici bir kaynagi pasife aldiginda, o kaynagin chunk'larini
    aramadan tamamen cikarmak icin koleksiyondan siler (MVP gereksinim #6)."""
    collection = get_collection(competition_slug)
    collection.delete(where={"source_id": source_id})
