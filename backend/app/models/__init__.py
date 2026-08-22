"""Tum SQLAlchemy modellerini burada toplu import ediyoruz ki Base.metadata
(Alembic autogenerate ve create_all icin) hepsini tanisin."""

from app.models.competition import Competition
from app.models.escalation import Escalation
from app.models.faq import FAQEntry
from app.models.qa_log import QALog, QASourceRef
from app.models.source import Source, SourceChunk
from app.models.user import User

__all__ = [
    "Competition",
    "Escalation",
    "FAQEntry",
    "QALog",
    "QASourceRef",
    "Source",
    "SourceChunk",
    "User",
]
