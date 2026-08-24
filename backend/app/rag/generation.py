import json

import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError

from app.core.config import get_settings
from app.rag.schemas import RAGAnswer, RetrievedChunk, SourceCitation

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)

SYSTEM_PROMPT = (
    "Sen bir TEKNOFEST yarismasi SSS asistanisin. SADECE sana verilen kaynak "
    "parcalarindaki bilgiye dayanarak yanit ver. Kaynaklarda yer almayan hicbir "
    "bilgiyi uydurma veya tahmin etme. Yanitinin dayandigi kaynagi (madde numarasi "
    "dahil) belirt ve o kaynagin ID'sini kaynak_belge_id alanina yaz. Verilen "
    "parcalar soruyu yanitlamak icin yetersizse can_answer alanini false yap; "
    "yetersiz oldugunda answer alanini bos birak.\n\n"
    "Cevaplayabiliyorsan (can_answer=true) guven_seviyesi alanini da doldur:\n"
    "- 'yuksek': cevap kaynakta ACIKCA ve DOGRUDAN yaziliyorsa\n"
    "- 'orta': cevap icin kaynaktaki bilgiden makul bir cikarim/birlestirme "
    "gerekiyorsa\n"
    "- 'dusuk': cevap sadece dolayli/zayif bir ipucuna dayaniyorsa, veya emin "
    "degilsen"
)

ANSWER_SCHEMA = {
    "type": "object",
    "properties": {
        "can_answer": {"type": "boolean"},
        "answer": {"type": "string"},
        "kaynak_belge_id": {"type": "string"},
        "guven_seviyesi": {"type": "string", "enum": ["yuksek", "orta", "dusuk"]},
    },
    "required": ["can_answer", "answer"],
}

VALID_CONFIDENCE_LEVELS = {"yuksek", "orta", "dusuk"}

_model = genai.GenerativeModel(model_name=settings.gemini_chat_model, system_instruction=SYSTEM_PROMPT)


def generate_answer(question: str, chunks: list[RetrievedChunk]) -> RAGAnswer:
    """Kategori icin hic kaynak yoksa LLM'e hic sorulmadan insana yonlendirilir.
    Kaynak varsa, sabit bir embedding-benzerlik esigiyle onceden filtrelemek yerine
    (kisa sartnamelerde bu esik parafrazlanmis ama gecerli sorulari da eliyordu),
    karar tamamen modelin yapilandirilmis can_answer cikisina birakilir
    — MVP gereksinim #3 ('yanit uydurmaz, insana yonlendirir')."""
    top_similarity = chunks[0].similarity if chunks else 0.0

    if not chunks:
        return RAGAnswer(answer=None, confidence=top_similarity, needs_human=True, sources=[])

    context = "\n\n".join(f"[Kaynak ID: {c.source_id} - {c.source_title}]\n{c.content}" for c in chunks)
    try:
        response = _model.generate_content(
            f"Baglam:\n{context}\n\nSoru: {question}",
            generation_config=genai.types.GenerationConfig(
                temperature=0.1,
                response_mime_type="application/json",
                response_schema=ANSWER_SCHEMA,
            ),
        )
    except GoogleAPIError:
        # Gemini API gecici olarak ulasilamaz/kota asimi vb. — kullaniciya 500
        # cikarmak yerine insana yonlendir (MVP gereksinim #3 ile tutarli).
        return RAGAnswer(answer=None, confidence=top_similarity, needs_human=True, sources=[])

    try:
        parsed = json.loads(response.text)
        can_answer = bool(parsed.get("can_answer", True))
        answer_text = parsed.get("answer") or None
        confidence_level = parsed.get("guven_seviyesi")
        if confidence_level not in VALID_CONFIDENCE_LEVELS:
            confidence_level = "orta"  # model alanı doldurmadiysa guvenli orta deger
    except (json.JSONDecodeError, AttributeError):
        # Model beklenmedik bicimde yanit verirse guvenli tarafta kal: insana yonlendir.
        can_answer = False
        answer_text = None
        confidence_level = None

    if not can_answer or not answer_text:
        return RAGAnswer(answer=None, confidence=top_similarity, needs_human=True, sources=[])

    if confidence_level == "dusuk":
        # PRD madde 05: dusuk guvenle bile "kesin" bir yanit gosterilmez —
        # model cevaplayabilecegini soylese de (can_answer=true) insana yonlendirilir.
        return RAGAnswer(
            answer=None,
            confidence=top_similarity,
            needs_human=True,
            confidence_level=confidence_level,
        )

    return RAGAnswer(
        answer=answer_text,
        confidence=top_similarity,
        needs_human=False,
        confidence_level=confidence_level,
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
