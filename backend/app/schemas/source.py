from pydantic import BaseModel


class SourceUploadResponse(BaseModel):
    source_id: int
    title: str
    chunk_count: int
