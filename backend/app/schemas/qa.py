from pydantic import BaseModel


class QuestionRequest(BaseModel):
    question: str


class SourceCitationOut(BaseModel):
    source_id: str
    source_title: str
    similarity: float


class AnswerResponse(BaseModel):
    answer: str | None
    confidence: float
    needs_human: bool
    sources: list[SourceCitationOut] = []
