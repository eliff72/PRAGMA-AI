from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, FAQEntry, User
from app.models.enums import UserRole
from app.schemas.faq import FAQEntryRead, FAQManualEntryCreate

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


@router.post("/faq/manual-entry", response_model=FAQEntryRead, status_code=status.HTTP_201_CREATED)
def create_manual_faq_entry(
    payload: FAQManualEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> FAQEntryRead:
    """Icerik yoneticisinin, destek ekibinden bir escalation gecmeden,
    dogrudan soru havuzuna manuel bir soru-cevap eklemesi.

    NOT: bu proje FAQ eslesmesini embedding/vektor ile degil, LLM tabanli
    anlamsal eslestirme (ya da API kesintisinde metin-benzerligi fallback'i)
    ile yapiyor (bkz. app/rag/faq_matching.py) — bu yuzden burada bir
    "question_embedding" hesaplanmiyor; boyle bir alan/mekanizma bu projede
    hic yok ve eklenmesi kullanilmayan/olu bir alan olurdu.

    KRITIK: source_type/confidence_level SADECE audit/gosterim icin
    kaydediliyor. find_matching_faq() eslesme sorgusu hala SADECE
    competition_id ile filtreliyor — bu alanlar eslesme WHERE kosuluna
    KESINLIKLE eklenmedi (bkz. rapor: onceki bug'in kok nedeni boyle
    gereksiz bir scope filtresiydi)."""
    competition = db.query(Competition).filter(Competition.id == payload.competition_id).first()
    if not competition:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {payload.competition_id}")

    entry = FAQEntry(
        competition_id=competition.id,
        question=payload.question,
        answer=payload.answer,
        created_by_id=current_user.id,
        source_type="manual_entry",
        confidence_level="verified",
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)

    return FAQEntryRead(
        id=entry.id,
        competitionId=entry.competition_id,
        competitionName=competition.name,
        question=entry.question,
        answer=entry.answer,
        createdAt=entry.created_at,
    )
