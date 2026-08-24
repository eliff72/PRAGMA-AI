from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base
from app.models.enums import SourceStatus, SourceType


class Source(Base):
    """Yüklenen bir belge (şartname/kılavuz/SSS) — bir yarışmaya bağlıdır."""

    __tablename__ = "sources"

    id: Mapped[int] = mapped_column(primary_key=True)
    competition_id: Mapped[int] = mapped_column(ForeignKey("competitions.id"))
    title: Mapped[str] = mapped_column(String(255))
    source_type: Mapped[SourceType] = mapped_column(
        Enum(SourceType, values_callable=lambda enum_cls: [e.value for e in enum_cls])
    )
    status: Mapped[SourceStatus] = mapped_column(
        Enum(SourceStatus, values_callable=lambda enum_cls: [e.value for e in enum_cls]),
        default=SourceStatus.ACTIVE,
    )
    version: Mapped[int] = mapped_column(Integer, default=1)
    file_path: Mapped[str] = mapped_column(String(500))
    source_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    uploaded_by_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    superseded_by_id: Mapped[int | None] = mapped_column(ForeignKey("sources.id"), nullable=True)

    competition: Mapped["Competition"] = relationship(back_populates="sources")  # noqa: F821
    chunks: Mapped[list["SourceChunk"]] = relationship(back_populates="source", cascade="all, delete-orphan")  # noqa: F821


class SourceChunk(Base):
    """Kaynağın embed edilmiş parçası; vektörün kendisi ChromaDB'de, burada sadece referans/metin tutulur."""

    __tablename__ = "source_chunks"

    id: Mapped[int] = mapped_column(primary_key=True)
    source_id: Mapped[int] = mapped_column(ForeignKey("sources.id"))
    chunk_index: Mapped[int] = mapped_column(Integer)
    content: Mapped[str] = mapped_column(Text)
    chroma_vector_id: Mapped[str] = mapped_column(String(255), unique=True)

    source: Mapped["Source"] = relationship(back_populates="chunks")
