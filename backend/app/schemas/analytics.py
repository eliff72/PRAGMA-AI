from pydantic import BaseModel

# frontend/src/api/admin.ts + frontend/src/types/index.ts (AnalyticsSummary)


class TopicCountOut(BaseModel):
    topic: str
    count: int


class ConfidenceDistributionOut(BaseModel):
    """PRD — Sistem Yoneticisi 'yanit kalitesi': son cevaplarin nitel guven
    seviyesi dagilimi (modelin kendi degerlendirmesinden, bkz. generation.py)."""

    yuksek: int
    orta: int
    dusuk: int


class CategoryEscalationOut(BaseModel):
    """PRD — 'insana yonlendirme orani, kategori bazinda kirilim'."""

    competitionName: str
    totalQuestions: int
    escalatedCount: int
    escalationRate: float


class AnalyticsSummaryOut(BaseModel):
    totalQuestions: int
    escalationRate: float
    avgConfidence: float
    topTopics: list[TopicCountOut]
    dbStatus: str  # "ok" | "down"
    aiServiceStatus: str  # "ok" | "not_configured"
    questionsLast24h: int
    openTicketsCount: int
    totalCompetitions: int
    totalSpecifications: int
    confidenceDistribution: ConfidenceDistributionOut
    escalationByCategory: list[CategoryEscalationOut]
