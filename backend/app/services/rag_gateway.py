"""feature/backend-api ve feature/backend-rag branch'leri arasindaki entegrasyon noktasi.

Bu branch (feature/backend-api) tek basina calisabilsin diye app.rag paketi
mevcut degilse (henuz merge edilmediyse) guvenli bir fallback doner. Merge
sonrasi otomatik olarak gercek RAG pipeline'ini kullanmaya baslar.
"""


def get_answer(competition_slug: str, question: str) -> dict:
    try:
        from app.rag.pipeline import answer_question
    except ImportError:
        return {"answer": None, "confidence": 0.0, "needs_human": True, "sources": []}

    result = answer_question(competition_slug, question)
    return {
        "answer": result.answer,
        "confidence": result.confidence,
        "needs_human": result.needs_human,
        "sources": [
            {"source_id": s.source_id, "source_title": s.source_title, "similarity": s.similarity}
            for s in result.sources
        ],
    }
