from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.session import Base


class FAQEntry(Base):
    """Destek ekibinin tekrarlayan konulardan ürettiği onaylı SSS girdisi.

    Onaylandığında feature/backend-rag akışıyla yeni bir Source (source_type=FAQ)
    olarak kaynak havuzuna da eklenir, böylece sonraki sorular otomatik yanıtlanabilir.
    """

    __tablename__ = "faq_entries"
    __table_args__ = (
        CheckConstraint(
            "source_type IN ('manual_entry', 'auto_from_chat', 'document_extracted')",
            name="ck_faq_entries_source_type",
        ),
        CheckConstraint(
            "confidence_level IN ('verified', 'pending_review')",
            name="ck_faq_entries_confidence_level",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id"))
    question: Mapped[str] = mapped_column(Text)
    answer: Mapped[str] = mapped_column(Text)
    # Var olan created_by_id (users.id FK) zaten audit/gosterim amacli
    # "kim ekledi" bilgisini tasiyor — ayrica bir created_by_user_id kolonu
    # EKLENMEDI (mukerrer olurdu; bu proje UUID degil integer PK kullaniyor).
    created_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    promoted_source_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"), nullable=True)
    # KRITIK: bu iki alan SADECE audit/gosterim amaclidir. find_matching_faq()
    # eslesme sorgusu SADECE competition_id ile filtreler — source_type/
    # confidence_level eslesme WHERE kosuluna KESINLIKLE eklenmemeli (bkz.
    # rapor: onceki "farkli kullanici gorunmuyor" bug'inin kok nedeni tam
    # olarak boyle bir gereksiz scope filtresiydi).
    source_type: Mapped[str] = mapped_column(Text, server_default="auto_from_chat")
    confidence_level: Mapped[str] = mapped_column(Text, server_default="pending_review")
