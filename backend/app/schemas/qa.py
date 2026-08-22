from pydantic import BaseModel


class AskRequest(BaseModel):
    question: str


class SourceCitationRead(BaseModel):
    source_id: int
    source_title: str
    similarity: float


class AskResponse(BaseModel):
    qa_log_id: int
    answer: str | None
    confidence: float
    needs_human: bool
    sources: list[SourceCitationRead] = []
