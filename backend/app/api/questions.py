from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, Escalation, QALog, QASourceRef, Source, SourceChunk, User
from app.models.enums import EscalationStatus, UserRole
from app.rag.faq_matching import find_matching_faq
from app.rag.pipeline import answer_question
from app.schemas.chat import ChatMessageOut, EscalateResponseOut, QuestionCreate, SourceCitationOut

from .deps import require_role

router = APIRouter(prefix="/api", tags=["questions"])

NO_EVIDENCE_MESSAGE = "Bu bilgi mevcut kaynaklarda yer almamaktadır."


def _resolve_competition(db: Session, competition_id: int | str) -> Competition:
    try:
        competition_pk = int(competition_id)
    except (TypeError, ValueError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {competition_id}") from None

    competition = db.query(Competition).filter(Competition.id == competition_pk).first()
    if not competition:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {competition_id}")
    return competition


@router.post("/questions", response_model=ChatMessageOut, status_code=status.HTTP_201_CREATED)
def ask_question_flat(
    payload: QuestionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPETITOR)),
) -> ChatMessageOut:
    """frontend/src/api/chat.ts > askQuestion — /competitions/{slug}/ask ile ayni RAG
    pipeline'ini competition_id uzerinden calistiran, duz (flat) sozlesme uyumlu versiyon.

    Yanit sirasi (BOLUM 3): 1) kategorideki category_faq (FAQEntry) kayitlariyla
    anlamca eslesme var mi -> varsa direkt o cevabi don, insana hic dusmesin.
    2) yoksa sartname tabanli RAG akisina dus. 3) o da cevaplayamazsa escalation ac."""
    competition = _resolve_competition(db, payload.competition_id)

    matched_faq = find_matching_faq(db, competition.id, payload.question)
    if matched_faq is not None:
        qa_log = QALog(
            user_id=current_user.id,
            competition_id=competition.id,
            question=payload.question,
            answer=matched_faq.answer,
            confidence_score=1.0,
            confidence_level="yuksek",
            was_escalated=False,
        )
        db.add(qa_log)
        db.commit()
        db.refresh(qa_log)
        return ChatMessageOut(
            id=str(qa_log.id),
            role="assistant",
            content=matched_faq.answer,
            sources=[
                SourceCitationOut(
                    documentId=f"faq-{matched_faq.id}",
                    documentTitle="Destek Ekibi SSS Havuzu",
                    section=matched_faq.question,
                    version="-",
                    confidence=1.0,
                )
            ],
            createdAt=qa_log.created_at.isoformat(),
            confidenceLevel="yuksek",
            durum="cevaplandi",
        )

    result = answer_question(competition.slug, payload.question)

    qa_log = QALog(
        user_id=current_user.id,
        competition_id=competition.id,
        question=payload.question,
        answer=result.answer,
        confidence_score=result.confidence,
        confidence_level=result.confidence_level,
        # Artik burada otomatik escalate edilmiyor — was_escalated, kullanici
        # /destege-gonder ile GERCEKTEN onay verdiginde True olacak.
        was_escalated=False,
    )
    db.add(qa_log)
    db.commit()
    db.refresh(qa_log)

    sources: list[SourceCitationOut] = []
    if not result.needs_human:
        for citation in result.sources:
            source_chunk = (
                db.query(SourceChunk).filter(SourceChunk.chroma_vector_id == citation.chroma_vector_id).first()
            )
            if source_chunk is None:
                continue
            db.add(
                QASourceRef(
                    qa_log_id=qa_log.id,
                    source_chunk_id=source_chunk.id,
                    similarity_score=citation.similarity,
                )
            )
            source_row = db.query(Source).filter(Source.id == source_chunk.source_id).first()
            sources.append(
                SourceCitationOut(
                    documentId=str(citation.source_id),
                    documentTitle=citation.source_title,
                    # Source/SourceChunk modelinde ayri bir "bolum basligi" alani yok;
                    # en yakin gercek veri chunk_index oldugu icin ondan turetiyoruz
                    # (bkz. rapor: eksik/uyarlanan alanlar).
                    section=f"Bölüm {source_chunk.chunk_index + 1}",
                    version=str(source_row.version) if source_row else "1",
                    confidence=citation.similarity,
                    documentUrl=source_row.source_url if source_row else None,
                )
            )
        db.commit()

    if result.needs_human:
        return ChatMessageOut(
            id=str(qa_log.id),
            role="assistant",
            content=NO_EVIDENCE_MESSAGE,
            sources=[],
            createdAt=qa_log.created_at.isoformat(),
            confidenceLevel=None,
            durum="kanit_bulunamadi",
            mesaj=NO_EVIDENCE_MESSAGE,
            destegeYonlendirilebilir=True,
        )

    return ChatMessageOut(
        id=str(qa_log.id),
        role="assistant",
        content=result.answer,
        sources=sources,
        createdAt=qa_log.created_at.isoformat(),
        confidenceLevel=result.confidence_level,
        durum="cevaplandi",
    )


@router.post("/questions/{qa_log_id}/destege-gonder", response_model=EscalateResponseOut)
def send_to_support(
    qa_log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPETITOR)),
) -> EscalateResponseOut:
    """Yarismaci 'kanit_bulunamadi' durumundaki bir soruyu ONAYLADIGINDA
    cagrilir — Escalation kaydi ARTIK BURADA, kullanici onayiyla olusur
    (otomatik degil)."""
    qa_log = db.query(QALog).filter(QALog.id == qa_log_id).first()
    if not qa_log:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Soru bulunamadı: {qa_log_id}")
    if qa_log.user_id != current_user.id:
        raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu soru size ait değil")

    existing = db.query(Escalation).filter(Escalation.qa_log_id == qa_log.id).first()
    if existing:
        return EscalateResponseOut(durum="zaten_gonderildi")

    db.add(Escalation(qa_log_id=qa_log.id, status=EscalationStatus.OPEN))
    qa_log.was_escalated = True
    db.commit()

    return EscalateResponseOut(durum="gonderildi")
