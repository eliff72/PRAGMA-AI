from datetime import datetime

from sqlalchemy import DateTime, Float, ForeignKey, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


class QALog(Base):
    """Her soru-cevap etkileşiminin kaydı — Sistem Yöneticisi metriklerinin kaynağı."""

    __tablename__ = "qa_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id"))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    # Modelin kendi degerlendirdigi nitel guven seviyesi ("yuksek"/"orta"/"dusuk");
    # escalate edilen (kanit yok/yetersiz) sorularda None kalir. Sistem Yoneticisi
    # panelindeki "yanit kalitesi dagilimi" metrigi buradan hesaplanir.
    confidence_level: Mapped[str | None] = mapped_column(String(10), nullable=True)
    was_escalated: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    source_refs: Mapped[list["QASourceRef"]] = relationship(back_populates="qa_log", cascade="all, delete-orphan")


class QASourceRef(Base):
    """Bir yanıtın dayandığı kaynak chunk'ları — kaynak gösterimi için (M2M)."""

    __tablename__ = "qa_source_refs"

    id: Mapped[int] = mapped_column(primary_key=True)
    qa_log_id: Mapped[int] = mapped_column(ForeignKey("qa_logs.id"))
    source_chunk_id: Mapped[int] = mapped_column(ForeignKey("source_chunks.id"))
    similarity_score: Mapped[float] = mapped_column(Float)

    qa_log: Mapped["QALog"] = relationship(back_populates="source_refs")
