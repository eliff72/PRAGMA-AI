from app.rag import vector_store
from app.rag.chunking import chunk_text
from app.rag.embeddings import embed_texts
from app.rag.loader import load_text


def ingest_document(file_path: str, competition_slug: str, source_id: str, source_title: str) -> int:
    """Bir kaynak dosyasini okur, parcalar, embed eder ve vektor deposuna yazar.

    feature/backend-api tarafindan, Icerik Yoneticisi yeni bir kaynak yukledigi
    zaman (source DB kaydi olusturulduktan sonra) cagrilmasi beklenir.
    Doner: olusturulan chunk sayisi.
    """
    text = load_text(file_path)
    chunks = chunk_text(text)
    if not chunks:
        return 0

    embeddings = embed_texts(chunks)
    ids = [f"{source_id}_{i}" for i in range(len(chunks))]
    metadatas = [
        {"source_id": source_id, "source_title": source_title, "chunk_index": i} for i in range(len(chunks))
    ]
    vector_store.add_chunks(competition_slug, ids, embeddings, chunks, metadatas)
    return len(chunks)
