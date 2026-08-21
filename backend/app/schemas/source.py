from pydantic import BaseModel


class SourceOut(BaseModel):
    id: str
    title: str
    source_type: str
    status: str
    version: int
