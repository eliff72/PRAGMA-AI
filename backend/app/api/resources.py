from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from google.api_core.exceptions import GoogleAPICallError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Competition, QASourceRef, Source, SourceChunk, User
from app.models.enums import SourceStatus, SourceType, UserRole
from app.rag import vector_store
from app.rag.embeddings import embed_texts
from app.schemas.resource import DocumentChunkOut, KnowledgeDocumentOut
from app.services.source_ingestion import store_and_ingest_source

from .deps import require_role

router = APIRouter(prefix="/api/resources", tags=["resources"])


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
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> list[KnowledgeDocumentOut]:
    """frontend/src/api/resources.ts > fetchDocuments — tum yarismalardaki kaynaklari birlestirir."""
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
    current_user: User = Depends(
        require_role(UserRole.COMPETITOR, UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)
    ),
) -> list[KnowledgeDocumentOut]:
    """BOLUM 5 — yarismacinin secili kategorinin 'Yarisma Sartnamesi' referans
    panelinde gorecegi, SADECE o kategorinin AKTIF (pasife alinmamis)
    belgelerinin listesi."""
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
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> KnowledgeDocumentOut:
    """frontend/src/api/resources.ts > uploadDocument (multipart: file, competition_id, version)."""
    competition = _get_competition_by_id_or_404(db, competition_id)
    # Source.version DB'de integer; frontend serbest metin gonderebilir (ornek
    # "v2"), sayisal degilse 1'e (varsayilan) dusuyoruz — bkz. rapor.
    version_int = int(version) if version.strip().isdigit() else 1

    try:
        source = store_and_ingest_source(
            db,
            competition_id=competition.id,
            competition_slug=competition.slug,
            filename=file.filename,
            file_bytes=file.file.read(),
            title=file.filename,
            source_type=SourceType.SPECIFICATION,
            version=version_int,
            uploaded_by_id=current_user.id,
        )
    except GoogleAPICallError as exc:
        # Embedding servisi (Gemini) kota/rate-limit veya gecici bir hata
        # dondurdu — dosyanin kendisiyle ilgisi yok. Genel 500 yerine acik bir
        # 503 donuyoruz ki frontend "dosya bozuk olabilir" gibi yanlis
        # yonlendirici bir mesaj gostermesin (bkz. rapor).
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Kaynak yüklenemedi: AI servisi (embedding) şu anda yanıt vermiyor — kota/oran sınırına takılmış "
            "olabilir. Dosyanızda bir sorun yok, lütfen birkaç dakika sonra tekrar deneyin.",
        ) from exc
    return _to_knowledge_document(source, current_user.full_name)


@router.get("/{resource_id}/chunks", response_model=list[DocumentChunkOut])
def list_resource_chunks(
    resource_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> list[DocumentChunkOut]:
    """frontend/src/api/resources.ts > fetchDocumentChunks — daha once hic olmayan yeni endpoint."""
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
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> KnowledgeDocumentOut:
    """frontend/src/api/resources.ts > deactivateDocument (PATCH) — mevcut deactivate mantiginin tasinmis hali."""
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
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> KnowledgeDocumentOut:
    """Pasife alinan bir kaynagi tekrar aktife alir. Sadece DB durumunu
    cevirmek yetmez: deactivate sirasinda chunk'lar ChromaDB'den SILINMISTI
    (bkz. deactivate_resource), bu yuzden RAG'in tekrar kullanabilmesi icin
    chunk icerikleri yeniden embed edilip vektor deposuna geri eklenir."""
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
    current_user: User = Depends(require_role(UserRole.CONTENT_MANAGER, UserRole.SYSTEM_ADMIN)),
) -> None:
    """Kalici (hard) silme — 'pasife alma'dan farkli olarak geri donusu yoktur.
    DB kaydi (Source + SourceChunk + QASourceRef) ve ChromaDB vektorleri
    tamamen kaldirilir."""
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
