import os
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, Header, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Competition, QASourceRef, Source, SourceChunk, User
from app.models.enums import SourceStatus, SourceType, UserRole
from app.rag import vector_store
from app.rag.embeddings import embed_texts
from app.schemas.resource import DocumentChunkOut, KnowledgeDocumentOut
from app.services.source_ingestion import store_and_ingest_source

router = APIRouter(prefix="/api/resources", tags=["resources"])


def _get_current_user_flexible(db: Session, authorization: Optional[str] = None) -> User:
    """Token varsa doğrular; token yoksa veritabanındaki varsayılan yöneticiyi döner."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user = db.query(User).filter(User.email == payload["sub"]).first()
            if user:
                return user

    dev_user = db.query(User).filter(User.role.in_([UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN])).first()
    if not dev_user:
        dev_user = db.query(User).first()
    return dev_user


def _get_competition_by_id_or_404(db: Session, competition_id: str) -> Competition:
    try:
        competition_pk = int(competition_id)
    except (TypeError, ValueError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {competition_id}") from None

    competition = db.query(Competition).filter(Competition.id == competition_pk).first()
    if not competition:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Yarışma bulunamadı: {competition_id}")
    return competition


def _get_resource_or_404(db: Session, resource_id: int) -> Source:
    source = db.query(Source).filter(Source.id == resource_id).first()
    if not source:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Kaynak bulunamadı: {resource_id}")
    return source


def _to_knowledge_document(source: Source, uploaded_by_name: str) -> KnowledgeDocumentOut:
    return KnowledgeDocumentOut(
        id=str(source.id),
        title=source.title,
        competitionId=str(source.competition_id),
        version=str(source.version),
        isActive=source.status == SourceStatus.ACTIVE,
        uploadedAt=source.uploaded_at.isoformat(),
        uploadedBy=uploaded_by_name,
        sourceUrl=source.source_url,
    )


@router.get("", response_model=list[KnowledgeDocumentOut])
def list_resources(
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> list[KnowledgeDocumentOut]:
    _get_current_user_flexible(db, authorization)
    rows = (
        db.query(Source, User.full_name)
        .join(User, Source.uploaded_by_id == User.id)
        .order_by(Source.id)
        .all()
    )
    return [_to_knowledge_document(source, full_name) for source, full_name in rows]


@router.get("/{competition_id}/active", response_model=list[KnowledgeDocumentOut])
def list_active_resources_for_competition(
    competition_id: str,
    db: Session = Depends(get_db),
) -> list[KnowledgeDocumentOut]:
    competition = _get_competition_by_id_or_404(db, competition_id)
    rows = (
        db.query(Source, User.full_name)
        .join(User, Source.uploaded_by_id == User.id)
        .filter(Source.competition_id == competition.id, Source.status == SourceStatus.ACTIVE)
        .order_by(Source.id)
        .all()
    )
    return [_to_knowledge_document(source, full_name) for source, full_name in rows]


@router.post("", response_model=KnowledgeDocumentOut, status_code=status.HTTP_201_CREATED)
def create_resource(
    file: UploadFile = File(...),
    competition_id: str = Form(...),
    version: str = Form("1"),
    db: Session = Depends(get_db),
    authorization: Optional[str] = Header(None),
) -> KnowledgeDocumentOut:
    current_user = _get_current_user_flexible(db, authorization)
    competition = _get_competition_by_id_or_404(db, competition_id)
    version_int = int(version) if version.strip().isdigit() else 1

    source = store_and_ingest_source(
        db,
        competition_id=competition.id,
        competition_slug=competition.slug,
        filename=file.filename,
        file_bytes=file.file.read(),
        title=file.filename,
        source_type=SourceType.SPECIFICATION,
        version=version_int,
        uploaded_by_id=current_user.id if current_user else 1,
    )
    return _to_knowledge_document(source, current_user.full_name if current_user else "Sistem")


@router.get("/{resource_id}/download")
def download_resource(
    resource_id: int,
    db: Session = Depends(get_db),
):
    """Yüklenen orijinal şartname PDF dosyasını tarayıcıda açar veya indirir."""
    source = _get_resource_or_404(db, resource_id)
    competition = db.query(Competition).filter(Competition.id == source.competition_id).first()

    filename = source.title
    base_dir = Path.cwd()

    # Olası tüm eşleşmeleri diskte ara
    matches = list(base_dir.rglob(filename))

    if not matches and competition:
        matches = list(base_dir.rglob(f"*{competition.slug}*/**/{filename}"))

    if not matches:
        matches = list(base_dir.rglob(f"*{filename}*"))

    valid_files = [f for f in matches if f.is_file()]

    if not valid_files:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"'{filename}' sunucu diskinde bulunamadı.")

    target_file = valid_files[0]

    return FileResponse(
        path=str(target_file),
        filename=filename,
        media_type="application/pdf",
        content_disposition_type="inline",
    )


@router.get("/{resource_id}/chunks", response_model=list[DocumentChunkOut])
def list_resource_chunks(
    resource_id: int,
    db: Session = Depends(get_db),
) -> list[DocumentChunkOut]:
    _get_resource_or_404(db, resource_id)
    chunks = (
        db.query(SourceChunk)
        .filter(SourceChunk.source_id == resource_id)
        .order_by(SourceChunk.chunk_index)
        .all()
    )
    return [DocumentChunkOut(id=str(c.id), content=c.content, chunkIndex=str(c.chunk_index)) for c in chunks]


@router.patch("/{resource_id}/deactivate", response_model=KnowledgeDocumentOut)
def deactivate_resource(
    resource_id: int,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentOut:
    source = _get_resource_or_404(db, resource_id)
    source.status = SourceStatus.INACTIVE
    db.commit()
    db.refresh(source)

    competition = db.query(Competition).filter(Competition.id == source.competition_id).first()
    if competition:
        vector_store.deactivate_source(competition.slug, str(source.id))

    uploader = db.query(User).filter(User.id == source.uploaded_by_id).first()
    return _to_knowledge_document(source, uploader.full_name if uploader else "")


@router.patch("/{resource_id}/activate", response_model=KnowledgeDocumentOut)
def activate_resource(
    resource_id: int,
    db: Session = Depends(get_db),
) -> KnowledgeDocumentOut:
    source = _get_resource_or_404(db, resource_id)
    source.status = SourceStatus.ACTIVE
    db.commit()
    db.refresh(source)

    competition = db.query(Competition).filter(Competition.id == source.competition_id).first()
    chunks = (
        db.query(SourceChunk)
        .filter(SourceChunk.source_id == source.id)
        .order_by(SourceChunk.chunk_index)
        .all()
    )
    if competition and chunks:
        contents = [c.content for c in chunks]
        embeddings = embed_texts(contents)
        ids = [c.chroma_vector_id for c in chunks]
        metadatas = [
            {"source_id": str(source.id), "source_title": source.title, "chunk_index": c.chunk_index}
            for c in chunks
        ]
        vector_store.add_chunks(competition.slug, ids, embeddings, contents, metadatas)

    uploader = db.query(User).filter(User.id == source.uploaded_by_id).first()
    return _to_knowledge_document(source, uploader.full_name if uploader else "")


@router.delete("/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    db: Session = Depends(get_db),
) -> None:
    source = _get_resource_or_404(db, resource_id)
    competition = db.query(Competition).filter(Competition.id == source.competition_id).first()

    chunk_ids = [c.id for c in db.query(SourceChunk).filter(SourceChunk.source_id == source.id).all()]
    if chunk_ids:
        db.query(QASourceRef).filter(QASourceRef.source_chunk_id.in_(chunk_ids)).delete(synchronize_session=False)
    db.query(SourceChunk).filter(SourceChunk.source_id == source.id).delete()

    if competition:
        vector_store.deactivate_source(competition.slug, str(source.id))

    db.delete(source)
    db.commit()