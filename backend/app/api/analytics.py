from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import case, func, text
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.db.session import get_db
from app.models import Competition, Escalation, QALog, Source, User
from app.models.enums import EscalationStatus, UserRole
from app.schemas.analytics import (
    AnalyticsSummaryOut,
    CategoryEscalationOut,
    ConfidenceDistributionOut,
    TopicCountOut,
)

from .deps import require_role

router = APIRouter(prefix="/api", tags=["analytics"])
settings = get_settings()


@router.get("/analytics", response_model=AnalyticsSummaryOut)
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SYSTEM_ADMIN)),
) -> AnalyticsSummaryOut:
    """frontend/src/api/admin.ts > fetchAnalytics — /metrics/dashboard'un frontend sozlesmesine uyarlanmis hali."""
    total_questions = db.query(QALog).count()

    escalation_rate = 0.0
    if total_questions > 0:
        escalated_count = db.query(QALog).filter(QALog.was_escalated.is_(True)).count()
        escalation_rate = escalated_count / total_questions

    avg_confidence_row = (
        db.query(func.avg(QALog.confidence_score)).filter(QALog.confidence_score.isnot(None)).scalar()
    )
    avg_confidence = float(avg_confidence_row) if avg_confidence_row is not None else 0.0

    topic_rows = (
        db.query(Competition.name, func.count(QALog.id))
        .join(QALog, QALog.competition_id == Competition.id)
        .group_by(Competition.name)
        .order_by(func.count(QALog.id).desc())
        .all()
    )
    top_topics = [TopicCountOut(topic=name, count=count) for name, count in topic_rows]

    try:
        db.execute(text("SELECT 1"))
        db_status = "ok"
    except Exception:
        db_status = "down"

    ai_service_status = "ok" if settings.gemini_api_key else "not_configured"

    since = datetime.now(timezone.utc) - timedelta(hours=24)
    questions_last_24h = db.query(QALog).filter(QALog.created_at >= since).count()

    open_tickets_count = db.query(Escalation).filter(Escalation.status == EscalationStatus.OPEN).count()

    total_competitions = db.query(Competition).count()
    total_specifications = db.query(Source).count()

    confidence_counts = dict(
        db.query(QALog.confidence_level, func.count(QALog.id))
        .filter(QALog.confidence_level.isnot(None))
        .group_by(QALog.confidence_level)
        .all()
    )
    confidence_distribution = ConfidenceDistributionOut(
        yuksek=confidence_counts.get("yuksek", 0),
        orta=confidence_counts.get("orta", 0),
        dusuk=confidence_counts.get("dusuk", 0),
    )

    escalated_sum = func.sum(case((QALog.was_escalated.is_(True), 1), else_=0))
    category_rows = (
        db.query(Competition.name, func.count(QALog.id), escalated_sum)
        .join(QALog, QALog.competition_id == Competition.id)
        .group_by(Competition.name)
        .order_by(func.count(QALog.id).desc())
        .all()
    )
    escalation_by_category = [
        CategoryEscalationOut(
            competitionName=name,
            totalQuestions=total,
            escalatedCount=int(escalated or 0),
            escalationRate=(escalated or 0) / total if total else 0.0,
        )
        for name, total, escalated in category_rows
    ]

    return AnalyticsSummaryOut(
        totalQuestions=total_questions,
        escalationRate=escalation_rate,
        avgConfidence=avg_confidence,
        topTopics=top_topics,
        dbStatus=db_status,
        aiServiceStatus=ai_service_status,
        questionsLast24h=questions_last_24h,
        openTicketsCount=open_tickets_count,
        totalCompetitions=total_competitions,
        totalSpecifications=total_specifications,
        confidenceDistribution=confidence_distribution,
        escalationByCategory=escalation_by_category,
    )
