from pydantic import BaseModel


class CompetitionOut(BaseModel):
    id: str
    name: str
    slug: str
