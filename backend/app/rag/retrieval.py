from app.core.config import get_settings
from app.rag import vector_store
from app.rag.embeddings import embed_text
from app.rag.schemas import RetrievedChunk

settings = get_settings()


def retrieve(competition_slug: str, question: str, top_k: int | None = None) -> list[RetrievedChunk]:
    """Soruyu embed edip, sadece secili yarismanin koleksiyonunda en yakin
    parcalari bulur (MVP gereksinim #2 ve #4)."""
    top_k = top_k or settings.rag_top_k
    query_embedding = embed_text(question)
    results = vector_store.query(competition_slug, query_embedding, top_k)

    ids = results.get("ids") or [[]]
    documents = results.get("documents") or [[]]
    metadatas = results.get("metadatas") or [[]]
    distances = results.get("distances") or [[]]

    chunks: list[RetrievedChunk] = []
    for chunk_id, doc, meta, distance in zip(ids[0], documents[0], metadatas[0], distances[0]):
        similarity = 1 - distance  # chroma cosine distance -> benzerlik skoru
        chunks.append(
            RetrievedChunk(
                content=doc,
                source_id=str(meta.get("source_id", "")),
                source_title=str(meta.get("source_title", "")),
                similarity=similarity,
                chroma_vector_id=chunk_id,
            )
        )
    return sorted(chunks, key=lambda c: c.similarity, reverse=True)
