from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import EscalationStatus


class Escalation(Base):
    """İnsana yönlendirilen soru — Destek Ekibi akışının kaynağı."""

    __tablename__ = "escalations"

    id: Mapped[int] = mapped_column(primary_key=True)
    qa_log_id: Mapped[int] = mapped_column(ForeignKey("qa_logs.id"))
    status: Mapped[EscalationStatus] = mapped_column(Enum(EscalationStatus), default=EscalationStatus.OPEN)
    assigned_to_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    support_answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    qa_log: Mapped["QALog"] = relationship()  # noqa: F821
