from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, QALog, User
from app.models.enums import UserRole
from app.schemas.metrics import DashboardMetrics

from .deps import require_role

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/dashboard", response_model=DashboardMetrics)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SYSTEM_ADMIN)),
) -> DashboardMetrics:
    total_questions = db.query(QALog).count()

    escalation_rate = None
    if total_questions > 0:
        escalated_count = db.query(QALog).filter(QALog.was_escalated.is_(True)).count()
        escalation_rate = escalated_count / total_questions

    top_topics_rows = (
        db.query(Competition.name)
        .join(QALog, QALog.competition_id == Competition.id)
        .group_by(Competition.name)
        .order_by(func.count(QALog.id).desc())
        .all()
    )
    top_topics = [name for (name,) in top_topics_rows]

    return DashboardMetrics(
        total_questions=total_questions,
        escalation_rate=escalation_rate,
        top_topics=top_topics,
    )
