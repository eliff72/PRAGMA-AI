from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class FrontendUser(BaseModel):
    """frontend/src/types/index.ts > User ile birebir uyumlu (bkz. app/core/roles.py)."""

    id: str
    name: str
    email: str
    role: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # frontend/src/api/auth.ts { token, user } bekliyor; eski access_token/token_type
    # alanlari da geriye donuk uyumluluk icin korunuyor.
    token: str
    user: FrontendUser


class UserRead(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
