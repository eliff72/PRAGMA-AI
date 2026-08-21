from dataclasses import dataclass, field


@dataclass
class RetrievedChunk:
    content: str
    source_id: str
    source_title: str
    similarity: float


@dataclass
class SourceCitation:
    source_id: str
    source_title: str
    similarity: float


@dataclass
class RAGAnswer:
    answer: str | None
    confidence: float
    needs_human: bool
    sources: list[SourceCitation] = field(default_factory=list)
