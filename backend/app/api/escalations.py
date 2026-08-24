from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, Escalation, FAQEntry, QALog, User
from app.models.enums import EscalationStatus, UserRole
from app.schemas.escalation import (
    EscalationAnswerRequest,
    EscalationOut,
    EscalationRead,
    EscalationResolveRequest,
)

from .deps import require_role

router = APIRouter(prefix="/escalations", tags=["escalations"])


def _get_escalation_or_404(db: Session, escalation_id: int) -> Escalation:
    escalation = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not escalation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Escalation bulunamadı: {escalation_id}")
    return escalation


def _to_frontend_status(escalation_status: EscalationStatus) -> str:
    return "cozuldu" if escalation_status == EscalationStatus.RESOLVED else "bekliyor"


def _add_to_faq_if_new(db: Session, *, competition_id: int, question: str, answer: str, created_by_id: int) -> None:
    """category_faq (FAQEntry) kaydini olusturur; ayni kategoride ayni soru zaten
    varsa tekrar eklemez (hem otomatik hem manuel 'SSS'e ekle' cagrisi guvenli olsun diye)."""
    existing = (
        db.query(FAQEntry)
        .filter(FAQEntry.competition_id == competition_id, FAQEntry.question == question)
        .first()
    )
    if existing:
        return
    db.add(
        FAQEntry(
            competition_id=competition_id,
            question=question,
            answer=answer,
            created_by_id=created_by_id,
        )
    )
    db.commit()


def _to_escalation_read(db: Session, escalation: Escalation) -> EscalationRead:
    qa_log = db.query(QALog).filter(QALog.id == escalation.qa_log_id).first()
    competition = db.query(Competition).filter(Competition.id == qa_log.competition_id).first()
    asker = db.query(User).filter(User.id == qa_log.user_id).first()
    return EscalationRead(
        id=str(escalation.id),
        question=qa_log.question,
        competitionName=competition.name if competition else "",
        askedBy=asker.full_name if asker else "",
        status=_to_frontend_status(escalation.status),
        createdAt=escalation.created_at.isoformat(),
        answer=escalation.support_answer,
    )


@router.get("", response_model=list[EscalationRead])
def list_open_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> list[EscalationRead]:
    rows = (
        db.query(Escalation, QALog, Competition, User)
        .join(QALog, Escalation.qa_log_id == QALog.id)
        .join(Competition, QALog.competition_id == Competition.id)
        .join(User, QALog.user_id == User.id)
        .filter(Escalation.status == EscalationStatus.OPEN)
        .order_by(Escalation.created_at)
        .all()
    )
    return [
        EscalationRead(
            id=str(escalation.id),
            question=qa_log.question,
            competitionName=competition.name,
            askedBy=asker.full_name,
            status=_to_frontend_status(escalation.status),
            createdAt=escalation.created_at.isoformat(),
            answer=escalation.support_answer,
        )
        for escalation, qa_log, competition, asker in rows
    ]


@router.get("/mine", response_model=list[EscalationRead])
def list_my_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPETITOR)),
) -> list[EscalationRead]:
    """Yarismacinin kendi yonlendirdigi sorularin durumunu (ve varsa destek
    cevabini) gormesi icin — frontend'de polling/yenile ile okunur."""
    rows = (
        db.query(Escalation, QALog, Competition)
        .join(QALog, Escalation.qa_log_id == QALog.id)
        .join(Competition, QALog.competition_id == Competition.id)
        .filter(QALog.user_id == current_user.id)
        .order_by(Escalation.created_at.desc())
        .all()
    )
    return [
        EscalationRead(
            id=str(escalation.id),
            question=qa_log.question,
            competitionName=competition.name,
            askedBy=current_user.full_name,
            status=_to_frontend_status(escalation.status),
            createdAt=escalation.created_at.isoformat(),
            answer=escalation.support_answer,
        )
        for escalation, qa_log, competition in rows
    ]


@router.post("/{escalation_id}/resolve", response_model=EscalationRead)
def resolve_escalation(
    escalation_id: int,
    payload: EscalationResolveRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> EscalationRead:
    """frontend/src/api/admin.ts > resolveEscalation. Cozulen soru-cevap ayni
    zamanda otomatik olarak category_faq'a (FAQEntry) eklenir — BOLUM 3: ayni/
    benzer soru tekrar geldiginde sistem insana hic dusmeden kendi cevaplasin."""
    escalation = _get_escalation_or_404(db, escalation_id)

    escalation.support_answer = payload.answer
    escalation.status = EscalationStatus.RESOLVED
    escalation.assigned_to_id = current_user.id
    escalation.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(escalation)

    qa_log = db.query(QALog).filter(QALog.id == escalation.qa_log_id).first()
    _add_to_faq_if_new(
        db,
        competition_id=qa_log.competition_id,
        question=qa_log.question,
        answer=payload.answer,
        created_by_id=current_user.id,
    )

    return _to_escalation_read(db, escalation)


@router.post("/{escalation_id}/add-to-faq", response_model=EscalationRead)
def add_escalation_to_faq(
    escalation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> EscalationRead:
    """frontend/src/api/admin.ts > addEscalationToFaq — mevcut (cozulmus) escalation'i SSS'e ekler."""
    escalation = _get_escalation_or_404(db, escalation_id)
    if not escalation.support_answer:
        raise HTTPException(
            status.HTTP_400_BAD_REQUEST,
            "Escalation henuz yanitlanmadi; once /resolve ile yanitlayin",
        )

    qa_log = db.query(QALog).filter(QALog.id == escalation.qa_log_id).first()
    _add_to_faq_if_new(
        db,
        competition_id=qa_log.competition_id,
        question=qa_log.question,
        answer=escalation.support_answer,
        created_by_id=current_user.id,
    )

    return _to_escalation_read(db, escalation)


@router.post("/{escalation_id}/answer", response_model=EscalationOut)
def answer_escalation(
    escalation_id: int,
    payload: EscalationAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> EscalationOut:
    """Eski birlesik (cevapla + istege bagli SSS'e ekle) endpoint — geriye donuk uyumluluk icin korunuyor."""
    escalation = _get_escalation_or_404(db, escalation_id)
    qa_log = db.query(QALog).filter(QALog.id == escalation.qa_log_id).first()
    competition = db.query(Competition).filter(Competition.id == qa_log.competition_id).first()

    escalation.support_answer = payload.answer
    escalation.status = EscalationStatus.RESOLVED
    escalation.assigned_to_id = current_user.id
    escalation.resolved_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(escalation)

    if payload.add_to_faq:
        _add_to_faq_if_new(
            db,
            competition_id=competition.id,
            question=qa_log.question,
            answer=payload.answer,
            created_by_id=current_user.id,
        )

    return EscalationOut(
        id=escalation.id,
        question=qa_log.question,
        competition_name=competition.name,
        status=escalation.status.value,
        created_at=escalation.created_at,
    )
