from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, Escalation, QALog, QASourceRef, Source, SourceChunk, User
from app.models.enums import EscalationStatus, SourceStatus, SourceType, UserRole
from app.rag.ingestion import ingest_document
from app.rag.pipeline import answer_question
from app.schemas.competition import CompetitionCreate, CompetitionRead
from app.schemas.qa import AskRequest, AskResponse, SourceCitationRead
from app.schemas.source import SourceUploadResponse

from .deps import require_role

router = APIRouter(prefix="/competitions", tags=["competitions"])

UPLOAD_DIR = Path("app/data/uploads")


def _get_competition_or_404(db: Session, slug: str) -> Competition:
    competition = db.query(Competition).filter(Competition.slug == slug).first()
    if not competition:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Yarışma bulunamadı: {slug}")
    return competition


@router.post("", response_model=CompetitionRead, status_code=status.HTTP_201_CREATED)
def create_competition(payload: CompetitionCreate, db: Session = Depends(get_db)) -> Competition:
    if db.query(Competition).filter(Competition.slug == payload.slug).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Bu slug zaten kullanımda")

    competition = Competition(name=payload.name, slug=payload.slug, description=payload.description)
    db.add(competition)
    db.commit()
    db.refresh(competition)
    return competition


@router.post("/{slug}/sources/upload", response_model=SourceUploadResponse, status_code=status.HTTP_201_CREATED)
def upload_source(
    slug: str,
    file: UploadFile = File(...),
    title: str | None = Form(None),
    source_type: SourceType = Form(SourceType.SPECIFICATION),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER)),
) -> SourceUploadResponse:
    competition = _get_competition_or_404(db, slug)
    uploader = current_user

    competition_dir = UPLOAD_DIR / slug
    competition_dir.mkdir(parents=True, exist_ok=True)
    file_path = competition_dir / file.filename
    file_path.write_bytes(file.file.read())

    source = Source(
        competition_id=competition.id,
        title=title or file.filename,
        source_type=source_type,
        status=SourceStatus.ACTIVE,
        file_path=str(file_path),
        uploaded_by_id=uploader.id,
    )
    db.add(source)
    db.flush()  # source.id lazim (henuz commit etme — ingestion basarisiz olursa kayit kalmasin)

    chunks = ingest_document(
        file_path=str(file_path),
        competition_slug=slug,
        source_id=str(source.id),
        source_title=source.title,
    )

    for chunk in chunks:
        db.add(
            SourceChunk(
                source_id=source.id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                chroma_vector_id=chunk["chroma_vector_id"],
            )
        )
    db.commit()

    return SourceUploadResponse(source_id=source.id, title=source.title, chunk_count=len(chunks))


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
