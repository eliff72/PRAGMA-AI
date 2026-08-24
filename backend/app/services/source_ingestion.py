"""app/api/competitions.py (slug bazli upload) ile app/api/resources.py (flat,
competition_id bazli upload) arasinda paylasilan dosya kaydetme + RAG ingestion
mantigi."""

from pathlib import Path

from sqlalchemy.orm import Session

from app.models import Source, SourceChunk
from app.models.enums import SourceStatus, SourceType
from app.rag.ingestion import ingest_document

UPLOAD_DIR = Path("app/data/uploads")


def store_and_ingest_source(
    db: Session,
    *,
    competition_id: int,
    competition_slug: str,
    filename: str,
    file_bytes: bytes,
    title: str,
    source_type: SourceType,
    version: int,
    uploaded_by_id: int,
    source_url: str | None = None,
) -> Source:
    competition_dir = UPLOAD_DIR / competition_slug
    competition_dir.mkdir(parents=True, exist_ok=True)
    file_path = competition_dir / filename
    file_path.write_bytes(file_bytes)

    source = Source(
        competition_id=competition_id,
        title=title,
        source_type=source_type,
        status=SourceStatus.ACTIVE,
        version=version,
        file_path=str(file_path),
        source_url=source_url,
        uploaded_by_id=uploaded_by_id,
    )
    db.add(source)
    db.flush()  # source.id lazim (henuz commit etme — ingestion basarisiz olursa kayit kalmasin)

    chunks = ingest_document(
        file_path=str(file_path),
        competition_slug=competition_slug,
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
    db.refresh(source)
    return source
