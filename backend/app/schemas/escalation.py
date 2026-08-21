from pydantic import BaseModel


class EscalationOut(BaseModel):
    id: str
    question: str
    status: str
    created_at: str


class EscalationAnswerRequest(BaseModel):
    answer: str
    add_to_faq: bool = False
