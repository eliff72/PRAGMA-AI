from datetime import datetime

from pydantic import BaseModel, ConfigDict


class SourceUploadResponse(BaseModel):
    source_id: int
    title: str
    chunk_count: int


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    source_type: str
    status: str
    version: int
    uploaded_by: str
    uploaded_at: datetime
