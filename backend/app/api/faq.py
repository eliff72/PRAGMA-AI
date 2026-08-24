from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, FAQEntry, User
from app.models.enums import UserRole
from app.schemas.faq import FAQEntryRead

from .deps import require_role

router = APIRouter(prefix="/support", tags=["faq"])


@router.get("/faq", response_model=list[FAQEntryRead])
def search_faq(
    kategori_id: int | None = Query(None),
    arama: str | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> list[FAQEntryRead]:
    """Icerik yoneticisinin 'bu soru daha once cevaplandi mi' diye
    bakabilecegi, kategoriye gore filtrelenebilir + serbest metin aramali
    category_faq (FAQEntry) listesi. Destek ekibinin buna erisimi yok —
    bu icerik yonetimi/kalite kontrol islevi (bkz. ContentManagerPage)."""
    query = db.query(FAQEntry, Competition).join(Competition, FAQEntry.competition_id == Competition.id)

    if kategori_id is not None:
        query = query.filter(FAQEntry.competition_id == kategori_id)
    if arama:
        query = query.filter(FAQEntry.question.ilike(f"%{arama}%"))

    rows = query.order_by(FAQEntry.created_at.desc()).all()
    return [
        FAQEntryRead(
            id=entry.id,
            competitionId=entry.competition_id,
            competitionName=competition.name,
            question=entry.question,
            answer=entry.answer,
            createdAt=entry.created_at,
        )
        for entry, competition in rows
    ]
