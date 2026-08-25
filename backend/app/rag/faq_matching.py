import json
import logging
import re
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
#
# Karakter-bazli SequenceMatcher.ratio() TEK BASINA yeterli degil: ortak
# cumle kaliplari ("Bu yarismanin ___ nedir/kimlerdir?") ratio'yu icerik
# kelimelerinden bagimsiz sekilde sisiriyor (bkz. rapor — "gizli denetim
# kodu nedir?" sorusu yanlislikla "paydaslari kimlerdir?" ile eslesti,
# cr=0.622). Ayni sekilde kelime-govdesi ortusmesi de tek basina yeterli
# degil (havuz-ici FARKLI sorular arasinda tk=0.333'e kadar cikabiliyor).
# Esikler, projedeki 9 GERCEK FAQ kaydiyla (SADECE ayni competition_id
# icindeki, yani pratikte gercekten karsilastirilacak ciftlerle) olculmus
# en yuksek yanlis-pozitif skorunun (cr=0.622, tk=0.333) GUVENLI MARJLA
# uzerinde tutuluyor — bkz. scratchpad/tune_v3.py.
_CHAR_RATIO_THRESHOLD = 0.75
_TOKEN_OVERLAP_THRESHOLD = 0.65

_STOPWORDS = {"bu", "su", "o", "ve", "ile", "ki", "mi", "mu", "de", "da", "icin", "ne", "nedir"}


def _normalized_tokens(text: str) -> set[str]:
    words = re.findall(r"\w+", text.lower())
    return {w[:5] for w in words if w not in _STOPWORDS and len(w) > 2}


def _token_overlap_ratio(a: str, b: str) -> float:
    tokens_a, tokens_b = _normalized_tokens(a), _normalized_tokens(b)
    if not tokens_a or not tokens_b:
        return 0.0
    return len(tokens_a & tokens_b) / min(len(tokens_a), len(tokens_b))


def _match_score(a: str, b: str) -> float:
    """Esik gecerse siralama icin skor, gecmezse 0.0 (asla None degil, gecen
    adaylar arasinda en iyisini secebilmek icin)."""
    char_ratio = SequenceMatcher(None, a.lower(), b.lower()).ratio()
    token_ratio = _token_overlap_ratio(a, b)
    passes = char_ratio >= _CHAR_RATIO_THRESHOLD or token_ratio >= _TOKEN_OVERLAP_THRESHOLD
    return max(char_ratio, token_ratio) if passes else 0.0


def _text_similarity_fallback(question: str, faqs: list[FAQEntry]) -> FAQEntry | None:
    best_entry, best_score = None, 0.0
    for entry in faqs:
        score = _match_score(question, entry.question)
        if score > best_score:
            best_entry, best_score = entry, score
    return best_entry

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
