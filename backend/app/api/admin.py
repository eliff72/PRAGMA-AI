from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import hash_password
from app.db.session import get_db
from app.models import User
from app.models.enums import UserRole
from app.schemas.auth import AdminCreateUserRequest, UserRead

from .deps import require_role

router = APIRouter(prefix="/api/admin", tags=["admin"])


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
