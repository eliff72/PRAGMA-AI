from fastapi import APIRouter, Depends

from app.api.deps import get_current_user
from app.schemas.auth import CurrentUser
from app.schemas.qa import AnswerResponse, QuestionRequest
from app.services.rag_gateway import get_answer

router = APIRouter(prefix="/competitions/{competition_slug}/questions", tags=["questions"])


@router.post("", response_model=AnswerResponse)
def ask_question(
    competition_slug: str,
    payload: QuestionRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> AnswerResponse:
    """Akis 1: yarismaci soru sorar, kaynakli yanit alir, yeterli kanit yoksa
    needs_human=True doner (destek ekibine devir feature/backend-api icinde
    ayrica bir escalation kaydi olusturarak tamamlanacak, bkz. TODO).

    TODO(feature/database): yanit qa_logs tablosuna loglanacak; needs_human ise
    escalations tablosunda acik bir kayit olusturulacak.
    """
    result = get_answer(competition_slug, payload.question)
    return AnswerResponse(**result)
