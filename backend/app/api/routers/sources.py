from fastapi import APIRouter, Depends, UploadFile

from app.api.deps import require_role
from app.schemas.auth import CurrentUser
from app.schemas.source import SourceOut

router = APIRouter(prefix="/competitions/{competition_slug}/sources", tags=["sources"])


@router.get("", response_model=list[SourceOut])
def list_sources(
    competition_slug: str,
    current_user: CurrentUser = Depends(require_role("content_manager", "system_admin")),
) -> list[SourceOut]:
    """TODO(feature/database): sources tablosundan competition_slug'a ait kayitlari getir."""
    return []


@router.post("/upload", status_code=201)
async def upload_source(
    competition_slug: str,
    title: str,
    file: UploadFile,
    current_user: CurrentUser = Depends(require_role("content_manager", "system_admin")),
) -> dict:
    """Akis 2: Icerik Yoneticisi yeni bir sartname/kilavuz/SSS yukler.

    TODO(feature/database): Source(status=active, version=n) kaydi olustur.
    TODO(feature/backend-rag): dosya diske yazildiktan sonra
    app.rag.ingestion.ingest_document(...) cagrilarak kaynak embed edilecek.
    """
    return {"title": title, "competition_slug": competition_slug, "status": "pending_integration"}


@router.post("/{source_id}/deactivate")
def deactivate_source(
    competition_slug: str,
    source_id: str,
    current_user: CurrentUser = Depends(require_role("content_manager", "system_admin")),
) -> dict:
    """Akis 2: eski kaynagi pasife alma (MVP gereksinim #6).

    TODO(feature/database): Source.status = inactive.
    TODO(feature/backend-rag): app.rag.vector_store.deactivate_source(...) cagir.
    """
    return {"source_id": source_id, "status": "inactive_pending_integration"}
