from openai import OpenAI

from app.core.config import get_settings
from app.rag.schemas import RAGAnswer, RetrievedChunk, SourceCitation

settings = get_settings()
_client = OpenAI(api_key=settings.openai_api_key)

SYSTEM_PROMPT = (
    "Sen bir TEKNOFEST yarismasi SSS asistanisin. SADECE sana verilen kaynak "
    "parcalarindaki bilgiye dayanarak yanit ver. Kaynaklarda yer almayan hicbir "
    "bilgiyi uydurma veya tahmin etme. Yanitinin dayandigi kaynagi belirt. "
    "Eger verilen parcalar soruyu yanitlamak icin yetersizse, bunu acikca soyle."
)


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> RAGAnswer:
    """Yeterli kanit yoksa (esik altinda) LLM'e hic sorulmadan insana yonlendirme
    isareti dondurulur — MVP gereksinim #3 ('yanit uydurmaz, insana yonlendirir')."""
    top_similarity = chunks[0].similarity if chunks else 0.0

    if not chunks or top_similarity < settings.rag_min_similarity:
        return RAGAnswer(answer=None, confidence=top_similarity, needs_human=True, sources=[])

    context = "\n\n".join(f"[Kaynak: {c.source_title}]\n{c.content}" for c in chunks)
    completion = _client.chat.completions.create(
        model=settings.openai_chat_model,
        temperature=0.1,
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": f"Baglam:\n{context}\n\nSoru: {question}"},
        ],
    )
    answer_text = completion.choices[0].message.content

    return RAGAnswer(
        answer=answer_text,
        confidence=top_similarity,
        needs_human=False,
        sources=[
            SourceCitation(source_id=c.source_id, source_title=c.source_title, similarity=c.similarity)
            for c in chunks
        ],
    )
