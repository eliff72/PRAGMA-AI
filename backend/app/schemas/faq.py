from datetime import datetime

from pydantic import BaseModel


class FAQEntryRead(BaseModel):
    id: int
    competitionId: int
    competitionName: str
    question: str
    answer: str
    source: str = "destek_ekibi"
    createdAt: datetime


class FAQManualEntryCreate(BaseModel):
    competition_id: int
    question: str
    answer: str
