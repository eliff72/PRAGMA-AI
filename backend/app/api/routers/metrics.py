from fastapi import APIRouter, Depends

from app.api.deps import require_role
from app.schemas.auth import CurrentUser

router = APIRouter(prefix="/metrics", tags=["metrics"])


@router.get("/dashboard")
def get_dashboard(current_user: CurrentUser = Depends(require_role("system_admin"))) -> dict:
    """Sistem Yoneticisi izleme paneli: yanit kalitesi, insana yonlendirme
    orani, sik sorulan konular.

    TODO(feature/database): qa_logs uzerinden agregasyon (escalation_rate =
    was_escalated=True oranı, top_topics = en sik sorulan sorular kumelemesi).
    """
    return {"escalation_rate": None, "total_questions": None, "top_topics": []}
