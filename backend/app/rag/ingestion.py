from app.rag import vector_store
from app.rag.chunking import chunk_text
from app.rag.embeddings import embed_texts
from app.rag.loader import load_text


def ingest_document(file_path: str, competition_slug: str, source_id: str, source_title: str) -> list[dict]:
    """Bir kaynak dosyasini okur, parcalar, embed eder ve vektor deposuna yazar.

    feature/backend-api tarafindan, Icerik Yoneticisi yeni bir kaynak yukledigi
    zaman (source DB kaydi olusturulduktan sonra) cagrilmasi beklenir.
    Doner: her biri {"chunk_index", "content", "chroma_vector_id"} iceren liste
    (cagiran taraf bunlari source_chunks tablosuna yazar).
    """
    text = load_text(file_path)
    chunks = chunk_text(text)
    if not chunks:
        return []

    embeddings = embed_texts(chunks)
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {"source_id": source_id, "source_title": source_title, "chunk_index": i} for i in range(len(chunks))
    ]
    vector_store.add_chunks(competition_slug, ids, embeddings, chunks, metadatas)
    return [
        {"chunk_index": i, "content": chunk, "chroma_vector_id": chunk_id}
        for i, (chunk, chunk_id) in enumerate(zip(chunks, ids))
    ]
