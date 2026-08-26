from fastapi import APIRouter, Depends, HTTPException, Response, status
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_db
from app.models import Escalation, FAQEntry, QALog, Source, User
from app.models.enums import UserRole
from app.schemas.auth import AdminCreateUserRequest, UserRead

from .deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


def _get_user_blockers(db: Session, user_id: int) -> list[str]:
    """Bir kullaniciya baglanan bagimli kayitlarin (varsa) okunabilir
    aciklamalarini dondurur. list_users (onizleme icin) ve delete_user
    (hard delete mi yoksa devre disi mi birakilacagina karar vermek icin)
    tarafindan paylasilir."""
    blockers: list[str] = []
    if db.query(QALog).filter(QALog.user_id == user_id).count():
        blockers.append("soru gecmisi (qa_logs)")
    if db.query(Escalation).filter(Escalation.assigned_to_id == user_id).count():
        blockers.append("cozdugu destek talepleri (escalations)")
    if db.query(Source).filter(Source.uploaded_by_id == user_id).count():
        blockers.append("yukledigi kaynaklar (sources)")
    if db.query(FAQEntry).filter(FAQEntry.created_by_id == user_id).count():
        blockers.append("olusturdugu SSS kayitlari (faq_entries)")
    return blockers


@router.get("/users", response_model=list[UserRead])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SYSTEM_ADMIN)),
) -> list[UserRead]:
    users = db.query(User).order_by(User.id).all()
    return [
        UserRead(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            is_active=u.is_active,
            has_linked_records=bool(_get_user_blockers(db, u.id)),
        )
        for u in users
    ]


@router.post("/users", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUserRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SYSTEM_ADMIN)),
) -> User:
    """Sistem Yoneticisinin herhangi bir rolde (competitor/content_manager/
    support_agent/system_admin) kullanici acabilecegi tek endpoint — public
    /auth/register'in aksine role serbestce secilebilir. Mevcut register
    mantigiyla ayni (email benzersizligi + hash_password), bkz. app/api/auth.py."""
    if db.query(User).filter(User.email == payload.email).first():
        raise HTTPException(status.HTTP_409_CONFLICT, "Bu e-posta ile zaten bir kullanici kayitli")

    user = User(
        email=payload.email,
        full_name=payload.full_name,
        hashed_password=hash_password(payload.password),
        role=payload.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.SYSTEM_ADMIN)),
) -> Response:
    """Biri 'isten ayrilinca' yaptigi isler silinmez, sadece o kisi artik
    islem yapamaz hale gelir — gercek hayattaki gibi:

    - Bagli kaydi (qa_logs/escalations/sources/faq_entries) YOKSA: kaybedilecek
      gercek veri olmadigi icin kalici (hard) silme yapilir -> 204.
    - Bagli kaydi VARSA: kalici silmek ya FK ihlaliyle patlar ya da gecmis
      escalation/faq/source kayitlarinin "kim yapti" bilgisini yok eder — bunun
      yerine is_active=False yapilir (soft delete). Kullanici artik login
      olamaz (bkz. app/api/auth.py > login, is_active kontrolu zaten var),
      ama gecmis kayitlari user_id/created_by_id/uploaded_by_id ile dogru
      sekilde atifli kalir -> 200 + ne yapildigini aciklayan govde."""
    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(status.HTTP_404_NOT_FOUND, f"Kullanici bulunamadi: {user_id}")

    if target.id == current_user.id:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Kendi hesabinizi silemezsiniz")

    blockers = _get_user_blockers(db, user_id)

    if blockers:
        target.is_active = False
        db.commit()
        db.refresh(target)
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content={
                "mode": "deactivated",
                "detail": (
                    f"Bagli kayitlar oldugu icin kalici silinmedi, hesap devre disi birakildi: "
                    f"{', '.join(blockers)}. Gecmis kayitlar korundu."
                ),
                "user": {
                    "id": target.id,
                    "email": target.email,
                    "full_name": target.full_name,
                    "role": target.role.value,
                    "is_active": target.is_active,
                },
            },
        )

    db.delete(target)
    db.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)
