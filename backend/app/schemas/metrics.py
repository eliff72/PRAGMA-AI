from pydantic import BaseModel


class DashboardMetrics(BaseModel):
    total_questions: int
    escalation_rate: float | None
    top_topics: list[str]
