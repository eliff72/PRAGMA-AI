import google.generativeai as genai

from app.core.config import get_settings
from app.rag.schemas import RAGAnswer, RetrievedChunk, SourceCitation

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = (
    "Sen bir TEKNOFEST yarismasi SSS asistanisin. SADECE sana verilen kaynak "
    "parcalarindaki bilgiye dayanarak yanit ver. Kaynaklarda yer almayan hicbir "
    "bilgiyi uydurma veya tahmin etme. Yanitinin dayandigi kaynagi belirt. "
    "Eger verilen parcalar soruyu yanitlamak icin yetersizse, bunu acikca soyle."
)

_model = genai.GenerativeModel(model_name=settings.gemini_chat_model, system_instruction=SYSTEM_PROMPT)


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> RAGAnswer:
    """Yeterli kanit yoksa (esik altinda) LLM'e hic sorulmadan insana yonlendirme
    isareti dondurulur — MVP gereksinim #3 ('yanit uydurmaz, insana yonlendirir')."""
    top_similarity = chunks[0].similarity if chunks else 0.0

    if not chunks or top_similarity < settings.rag_min_similarity:
        return RAGAnswer(answer=None, confidence=top_similarity, needs_human=True, sources=[])

    context = "\n\n".join(f"[Kaynak: {c.source_title}]\n{c.content}" for c in chunks)
    response = _model.generate_content(
        f"Baglam:\n{context}\n\nSoru: {question}",
        generation_config=genai.types.GenerationConfig(temperature=0.1),
    )
    answer_text = response.text

    return RAGAnswer(
        answer=answer_text,
        confidence=top_similarity,
        needs_human=False,
        sources=[
            SourceCitation(
                source_id=c.source_id,
                source_title=c.source_title,
                similarity=c.similarity,
                chroma_vector_id=c.chroma_vector_id,
            )
            for c in chunks
        ],
    )
