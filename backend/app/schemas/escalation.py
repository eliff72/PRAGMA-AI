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
