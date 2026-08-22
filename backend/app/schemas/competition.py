from pydantic import BaseModel, ConfigDict


class CompetitionCreate(BaseModel):
    name: str
    slug: str
    description: str | None = None


class CompetitionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str | None
    is_active: bool
