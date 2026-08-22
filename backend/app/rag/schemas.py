from dataclasses import dataclass, field


@dataclass
class RetrievedChunk:
    content: str
    source_id: str
    source_title: str
    similarity: float
    chroma_vector_id: str


@dataclass
class SourceCitation:
    source_id: str
    source_title: str
    similarity: float
    chroma_vector_id: str


@dataclass
class RAGAnswer:
    answer: str | None
    confidence: float
    needs_human: bool
    sources: list[SourceCitation] = field(default_factory=list)
