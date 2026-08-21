from fastapi import APIRouter, HTTPException, status

from app.core.security import create_access_token, hash_password, verify_password
from app.schemas.auth import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# TODO(feature/database): asagidaki in-memory kullanicilar, User modeli + gercek
# DB sorgusuyla degistirilecek. Sadece yerel gelistirme/demo icin 4 rolu temsil eder.
_DEMO_USERS = {
    "yarismaci@demo.local": {"id": "1", "password_hash": hash_password("demo1234"), "role": "competitor"},
    "icerik@demo.local": {"id": "2", "password_hash": hash_password("demo1234"), "role": "content_manager"},
    "destek@demo.local": {"id": "3", "password_hash": hash_password("demo1234"), "role": "support_agent"},
    "admin@demo.local": {"id": "4", "password_hash": hash_password("demo1234"), "role": "system_admin"},
}


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest) -> TokenResponse:
    user = _DEMO_USERS.get(payload.email)
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Hatali e-posta veya sifre")
    token = create_access_token(subject=user["id"], email=payload.email, role=user["role"])
    return TokenResponse(access_token=token)
