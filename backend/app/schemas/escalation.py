from datetime import datetime

from pydantic import BaseModel


class EscalationOut(BaseModel):
    id: int
    question: str
    competition_name: str
    status: str
    created_at: datetime


class EscalationAnswerRequest(BaseModel):
    answer: str
    add_to_faq: bool = False


class EscalationResolveRequest(BaseModel):
    answer: str


class EscalationRead(BaseModel):
    """frontend/src/types/index.ts > Escalation ile birebir uyumlu."""

    id: str
    question: str
    competitionName: str
    askedBy: str
    status: str  # "bekliyor" | "cozuldu"
    createdAt: str
    answer: str | None = None
