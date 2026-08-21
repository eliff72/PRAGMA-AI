from fastapi import APIRouter, Depends

from app.api.deps import require_role
from app.schemas.auth import CurrentUser
from app.schemas.escalation import EscalationAnswerRequest, EscalationOut

router = APIRouter(prefix="/escalations", tags=["escalations"])


@router.get("", response_model=list[EscalationOut])
def list_open_escalations(
    current_user: CurrentUser = Depends(require_role("support_agent", "system_admin")),
) -> list[EscalationOut]:
    """Akis 3: destek ekibi insana yonlenen sorulari gorur.

    TODO(feature/database): escalations tablosundan status=open olanlari getir.
    """
    return []


@router.post("/{escalation_id}/answer")
def answer_escalation(
    escalation_id: str,
    payload: EscalationAnswerRequest,
    current_user: CurrentUser = Depends(require_role("support_agent", "system_admin")),
) -> dict:
    """Akis 3: destek ekibi yanitlar; tekrarlayan konu ise SSS havuzuna eklenir.

    TODO(feature/database): Escalation.support_answer + status=resolved kaydet.
    TODO(feature/database): payload.add_to_faq=True ise FAQEntry olustur, sonra
    TODO(feature/backend-rag): onaylanan SSS'i kaynak havuzuna (Source) ekleyip
    ingest_document ile embed et — boylece ayni soru bir dahaki sefere otomatik yanitlanir.
    """
    return {"escalation_id": escalation_id, "status": "resolved_pending_integration"}
