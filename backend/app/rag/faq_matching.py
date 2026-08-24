import json
import logging
from difflib import SequenceMatcher

import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models import FAQEntry

logger = logging.getLogger(__name__)

# Gemini cagrisi basarisiz olursa (kota/ag hatasi) kullanilan basit metin
# benzerligi esigi. LLM'in yakalayacagi genis parafrazlari yakalamaz ama
# neredeyse-ayni/cok benzer sorularin (asil raporlanan sikayet senaryosu)
# API kesintisinde bile bulunmasini saglar.
FALLBACK_SIMILARITY_THRESHOLD = 0.55


def _text_similarity_fallback(question: str, faqs: list[FAQEntry]) -> FAQEntry | None:
    best_entry, best_ratio = None, 0.0
    for entry in faqs:
        ratio = SequenceMatcher(None, question.lower(), entry.question.lower()).ratio()
        if ratio > best_ratio:
            best_entry, best_ratio = entry, ratio
    if best_entry is not None and best_ratio >= FALLBACK_SIMILARITY_THRESHOLD:
        return best_entry
    return None

settings = get_settings()
genai.configure(api_key=settings.gemini_api_key)

MATCH_SYSTEM_PROMPT = (
    "Sana bir kullanicinin sordugu yeni soru ve ayni yarisma kategorisinde "
    "destek ekibi tarafindan daha once cevaplanmis SSS (FAQ) sorularinin bir "
    "listesi verilecek. Yeni sorunun, listedeki sorulardan biriyle KELIME "
    "KELIME degil ANLAMCA ayni seyi sorup sormadigina karar ver (farkli "
    "ifade, farkli kelime sirasi onemli degil). Sadece gercekten ayni konuyu "
    "soruyorsa eslesme_var=true yap ve eslesen_faq_id alanina o SSS "
    "kaydinin id degerini yaz. Emin degilsen veya farkli bir konuysa "
    "eslesme_var=false yap ve eslesen_faq_id alanini bos birak."
)

MATCH_SCHEMA = {
    "type": "object",
    "properties": {
        "eslesme_var": {"type": "boolean"},
        "eslesen_faq_id": {"type": "integer"},
    },
    "required": ["eslesme_var"],
}

_match_model = genai.GenerativeModel(
    model_name=settings.gemini_chat_model, system_instruction=MATCH_SYSTEM_PROMPT
)


def find_matching_faq(db: Session, competition_id: int, question: str) -> FAQEntry | None:
    """BOLUM 3 — sartname tabanli cevaplama denenmeden ONCE cagrilir. O
    kategoride destek ekibinin daha once cevapladigi bir soruyla anlamca
    eslesiyorsa, saklanan cevabi dondurur; yoksa None doner ve cagiran taraf
    sartname/RAG akisina duser."""
    faqs = db.query(FAQEntry).filter(FAQEntry.competition_id == competition_id).all()
    if not faqs:
        return None

    faq_list = "\n".join(f"- id={f.id}: {f.question}" for f in faqs)
    prompt = f"Kategorideki mevcut SSS sorulari:\n{faq_list}\n\nYeni soru: {question}"

    try:
        response = _match_model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                temperature=0.0,
                response_mime_type="application/json",
                response_schema=MATCH_SCHEMA,
            ),
        )
        parsed = json.loads(response.text)
    except GoogleAPIError as exc:
        # Gemini API gecici olarak ulasilamaz (kota/ag hatasi) — anlamsal
        # eslestirme yapamayiz ama FAQ havuzunda ZATEN kayitli, neredeyse
        # ayni ifadeli bir soru varsa onu yine de bulmak icin basit metin
        # benzerligine dusuyoruz (bkz. rapor: kok neden — API kesintisinde
        # FAQ'daki hazir cevaplar bile erisilemez hale geliyordu).
        logger.error("Gemini FAQ eslestirme basarisiz (soru: %r): %s", question, exc)
        return _text_similarity_fallback(question, faqs)
    except (json.JSONDecodeError, AttributeError):
        return None

    if not parsed.get("eslesme_var"):
        return None

    matched_id = parsed.get("eslesen_faq_id")
    return next((f for f in faqs if f.id == matched_id), None)
