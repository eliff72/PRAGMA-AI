from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.roles import to_frontend_role
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import FrontendUser, LoginRequest, RegisterRequest, TokenResponse, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> User:
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


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> TokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Hatali e-posta veya sifre")
    if not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Kullanici pasif durumda")

    token = create_access_token(subject=str(user.id), email=user.email, role=user.role.value)
    frontend_user = FrontendUser(
        id=str(user.id),
        name=user.full_name,
        email=user.email,
        role=to_frontend_role(user.role),
    )
    return TokenResponse(access_token=token, token=token, user=frontend_user)
