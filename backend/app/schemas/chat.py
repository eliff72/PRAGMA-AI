from pydantic import BaseModel

# frontend/src/api/chat.ts + frontend/src/types/index.ts (ChatMessage, SourceCitation)


class QuestionCreate(BaseModel):
    question: str
    # Frontend Competition.id tip olarak `string`, ama runtime'da backend'in
    # int competition.id degeri de gelebilir — ikisini de kabul edip endpoint
    # icinde int'e ceviriyoruz.
    competition_id: int | str


class SourceCitationOut(BaseModel):
    documentId: str
    documentTitle: str
    section: str
    version: str
    confidence: float
    documentUrl: str | None = None


class ChatMessageOut(BaseModel):
    id: str
    role: str = "assistant"
    content: str
    sources: list[SourceCitationOut] = []
    createdAt: str
    confidenceLevel: str | None = None  # "yuksek" | "orta" | "dusuk" | None (kanit bulunamadiysa)
    durum: str = "cevaplandi"  # "cevaplandi" | "kanit_bulunamadi"
    mesaj: str | None = None  # durum == "kanit_bulunamadi" oldugunda kullaniciya gosterilecek net mesaj
    destegeYonlendirilebilir: bool = False


class EscalateResponseOut(BaseModel):
    durum: str  # "gonderildi" | "zaten_gonderildi"
