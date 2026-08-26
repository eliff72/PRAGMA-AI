from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, Escalation, FAQEntry, QALog, QASourceRef, Source, SourceChunk, User
from app.models.enums import EscalationStatus, SourceStatus, SourceType, UserRole
from app.rag import vector_store
from app.rag.pipeline import answer_question
from app.schemas.competition import CompetitionCreate, CompetitionRead
from app.schemas.qa import AskRequest, AskResponse, SourceCitationRead
from app.schemas.source import SourceRead, SourceUploadResponse
from app.services.source_ingestion import store_and_ingest_source

from .deps import require_role

router = APIRouter(prefix="/competitions", tags=["competitions"])


def _get_competition_or_404(db: Session, slug: str) -> Competition:
    competition = db.query(Competition).filter(Competition.slug == slug).first()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Yarışma bulunamadı: {slug}")
    return competition


def _get_source_or_404(db: Session, competition_id: int, source_id: int) -> Source:
    source = (
        db.query(Source)
        .filter(Source.id == source_id, Source.competition_id == competition_id)
        .first()
    )
    if not source:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Kaynak bulunamadı: {source_id}")
    return source


def _to_source_read(source: Source, uploaded_by_name: str) -> SourceRead:
    return SourceRead(
        id=source.id,
        title=source.title,
        source_type=source.source_type.value,
        status=source.status.value,
        version=source.version,
        uploaded_by=uploaded_by_name,
        uploaded_at=source.uploaded_at,
        source_url=source.source_url,
    )


@router.get("", response_model=list[CompetitionRead])
def list_competitions(db: Session = Depends(get_db)) -> list[Competition]:
    return db.query(Competition).filter(Competition.is_active.is_(True)).order_by(Competition.id).all()


@router.post("", response_model=CompetitionRead, status_code=status.HTTP_201_CREATED)
def create_competition(
    payload: CompetitionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> Competition:
    if db.query(Competition).filter(Competition.slug == payload.slug).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu slug zaten kullanımda")

    competition = Competition(name=payload.name, slug=payload.slug, description=payload.description)
    db.add(competition)
    db.commit()
    db.refresh(competition)
    return competition


@router.delete("/{competition_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_competition(
    competition_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> None:
    """Kalici silme. BOLUM: 'Yeni Kategori Ekle' artik kaynak yukleme akisinin
    bir parcasi — once kategori olusturulur, sonra dosya yuklenir; dosya
    yukleme (ingest) basarisiz olursa frontend bu endpoint'i cagirarak icinde
    hic kaynak olmayan yarim kalmis kategoriyi geri alir (rollback), boylece
    yarismaciya kaynaksiz/bos bir kategori hic gorunmez (bkz. rapor).

    Bagli kayit varsa (sources/qa_logs/faq_entries) sessizce silmek yerine
    409 ile aciklayici hata donuyoruz — delete_user'daki ayni desen."""
    competition = db.query(Competition).filter(Competition.id == competition_id).first()
    if not competition:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {competition_id}")

    blockers: list[str] = []
    if db.query(Source).filter(Source.competition_id == competition_id).count():
        blockers.append("yüklenmiş kaynaklar (sources)")
    if db.query(QALog).filter(QALog.competition_id == competition_id).count():
        blockers.append("soru geçmişi (qa_logs)")
    if db.query(FAQEntry).filter(FAQEntry.competition_id == competition_id).count():
        blockers.append("SSS kayıtları (faq_entries)")

    if blockers:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Bu kategori silinemez, bağlı kayıtlar var: {', '.join(blockers)}.",
        )

    db.delete(competition)
    db.commit()


@router.post("/{slug}/sources/upload", response_model=SourceUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_source(
    slug: str,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    title_qs: str | None = Query(None, alias="title"),
    source_type: SourceType = Form(SourceType.SPECIFICATION),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER)),
) -> SourceUploadResponse:
    # feature/frontend-admin title'i multipart form alani degil, query string
    # parametresi olarak gonderiyor (bilinen sorun, bkz. docs/API_CONTRACT.md) —
    # bu yuzden her iki yoldan da kabul ediyoruz.
    resolved_title = title or title_qs or file.filename

    competition = _get_competition_or_404(db, slug)

    source = store_and_ingest_source(
        db,
        competition_id=competition.id,
        competition_slug=slug,
        filename=file.filename,
        file_bytes=file.file.read(),
        title=resolved_title,
        source_type=source_type,
        version=1,
        uploaded_by_id=current_user.id,
    )

    return SourceUploadResponse(source_id=source.id, title=source.title, chunk_count=len(source.chunks))


@router.get("/{slug}/sources", response_model=list[SourceRead])
def list_sources(
    slug: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> list[SourceRead]:
    competition = _get_competition_or_404(db, slug)
    rows = (
        db.query(Source, User.full_name)
        .join(User, Source.uploaded_by_id == User.id)
        .filter(Source.competition_id == competition.id)
        .order_by(Source.id)
        .all()
    )
    return [_to_source_read(source, full_name) for source, full_name in rows]


@router.post("/{slug}/sources/{source_id}/deactivate", response_model=SourceRead)
def deactivate_source(
    slug: str,
    source_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> SourceRead:
    competition = _get_competition_or_404(db, slug)
    source = _get_source_or_404(db, competition.id, source_id)

    source.status = SourceStatus.INACTIVE
    db.commit()
    db.refresh(source)

    vector_store.deactivate_source(slug, str(source.id))

    uploader = db.query(User).filter(User.id == source.uploaded_by_id).first()
    return _to_source_read(source, uploader.full_name if uploader else "")


@router.post("/{slug}/ask", response_model=AskResponse, status_code=status.HTTP_201_CREATED)
def ask_question(
    slug: str,
    payload: AskRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.COMPETITOR)),
) -> AskResponse:
    competition = _get_competition_or_404(db, slug)
    asker = current_user

    result = answer_question(slug, payload.question)

    qa_log = QALog(
        user_id=asker.id,
        competition_id=competition.id,
        question=payload.question,
        answer=result.answer,
        confidence_score=result.confidence,
        was_escalated=result.needs_human,
    )
    db.add(qa_log)
    db.commit()
    db.refresh(qa_log)

    sources: list[SourceCitationRead] = []
    if result.needs_human:
        db.add(Escalation(qa_log_id=qa_log.id, status=EscalationStatus.OPEN))
        db.commit()
    else:
        for citation in result.sources:
            source_chunk = (
                db.query(SourceChunk).filter(SourceChunk.chroma_vector_id == citation.chroma_vector_id).first()
            )
            if source_chunk is None:
                continue
            db.add(
                QASourceRef(
                    qa_log_id=qa_log.id,
                    source_chunk_id=source_chunk.id,
                    similarity_score=citation.similarity,
                )
            )
            sources.append(
                SourceCitationRead(
                    source_id=int(citation.source_id),
                    source_title=citation.source_title,
                    similarity=citation.similarity,
                )
            )
        db.commit()

    return AskResponse(
        qa_log_id=qa_log.id,
        answer=result.answer,
        confidence=result.confidence,
        needs_human=result.needs_human,
        sources=sources,
    )
