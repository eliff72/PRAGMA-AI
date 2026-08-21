from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class FAQEntry(Base):
    """Destek ekibinin tekrarlayan konulardan ürettiği onaylı SSS girdisi.

    Onaylandığında feature/backend-rag akışıyla yeni bir Source (source_type=FAQ)
    olarak kaynak havuzuna da eklenir, böylece sonraki sorular otomatik yanıtlanabilir.
    """

    __tablename__ = "faq_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id"))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    promoted_source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"), nullable=True)
