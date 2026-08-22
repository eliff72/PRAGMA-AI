from app.rag.generation import generate_answer
from app.rag.ingestion import ingest_document
from app.rag.retrieval import retrieve
from app.rag.schemas import RAGAnswer

__all__ = ["ingest_document", "answer_question", "RAGAnswer"]


def answer_question(competition_slug: str, question: str) -> RAGAnswer:
    """RAG akisinin uctan uca giris noktasi: retrieve -> generate.

    feature/backend-api bu tek fonksiyonu cagirarak /sorular endpoint'ini kurar.
    """
    chunks = retrieve(competition_slug, question)
    return generate_answer(question, chunks)
