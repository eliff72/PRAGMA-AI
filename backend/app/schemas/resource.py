from pydantic import BaseModel

# frontend/src/api/resources.ts + frontend/src/types/index.ts (KnowledgeDocument, DocumentChunk)


class KnowledgeDocumentOut(BaseModel):
    id: str
    title: str
    competitionId: str
    version: str
    isActive: bool
    uploadedAt: str
    uploadedBy: str
    sourceUrl: str | None = None


class DocumentChunkOut(BaseModel):
    id: str
    content: str
    chunkIndex: str
