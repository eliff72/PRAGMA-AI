from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.competition import CompetitionOut

router = APIRouter(prefix="/competitions", tags=["competitions"])


@router.get("", response_model=list[CompetitionOut])
def list_competitions(current_user: CurrentUser = Depends(get_current_user)) -> list[CompetitionOut]:
    """Akis 1'in ilk adimi: yarismaci hangi yarismalar icin soru sorabilecegini gorur.

    TODO(feature/database): competitions tablosundan is_active=True olanlari getir.
    """
    return []
