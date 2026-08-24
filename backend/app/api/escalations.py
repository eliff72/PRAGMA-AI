from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, Escalation, FAQEntry, QALog, User
from app.models.enums import EscalationStatus, UserRole
from app.schemas.escalation import EscalationAnswerRequest, EscalationOut

from .deps import require_role

router = APIRouter(prefix="/escalations", tags=["escalations"])


def _get_escalation_or_404(db: Session, escalation_id: int) -> Escalation:
    escalation = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not escalation:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Escalation bulunamadı: {escalation_id}")
    return escalation


@router.get("", response_model=list[EscalationOut])
def list_open_escalations(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> list[EscalationOut]:
    rows = (
        db.query(Escalation, QALog.question, Competition.name)
        .join(QALog, Escalation.qa_log_id == QALog.id)
        .join(Competition, QALog.competition_id == Competition.id)
        .filter(Escalation.status == EscalationStatus.OPEN)
        .order_by(Escalation.created_at)
        .all()
    )
    return [
        EscalationOut(
            id=escalation.id,
            question=question,
            competition_name=competition_name,
            status=escalation.status.value,
            created_at=escalation.created_at,
        )
        for escalation, question, competition_name in rows
    ]


@router.post("/{escalation_id}/answer", response_model=EscalationOut)
def answer_escalation(
    escalation_id: int,
    payload: EscalationAnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SUPPORT_AGENT, UserRole.SYSTEM_ADMIN)),
) -> EscalationOut:
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
        db.add(
            FAQEntry(
                competition_id=competition.id,
                question=qa_log.question,
                answer=payload.answer,
                created_by_id=current_user.id,
            )
        )
        db.commit()

    return EscalationOut(
        id=escalation.id,
        question=qa_log.question,
        competition_name=competition.name,
        status=escalation.status.value,
        created_at=escalation.created_at,
    )
