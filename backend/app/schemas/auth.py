from pydantic import BaseModel, EmailStr

from app.models.enums import UserRole


class RegisterRequest(BaseModel):
    """Public /auth/register icin — role KASITLI OLARAK YOK: bu endpoint'ten
    acilan her hesap sunucu tarafinda daima UserRole.COMPETITOR olur (bkz.
    app/api/auth.py > register). content_manager/support_agent/system_admin
    hesaplari SADECE admin-only POST /api/admin/users ile acilabilir (bkz.
    AdminCreateUserRequest) — client'in burada rol secme SECENEGI bile yok,
    sadece frontend'de gizlenmis degil (guvenlik acigi: onceden payload.role
    dogrudan kabul ediliyordu, kim isterse curl ile system_admin acabilirdi)."""

    email: EmailStr
    password: str
    full_name: str


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


class AdminCreateUserRequest(BaseModel):
    """Sistem Yoneticisi panelinden rol secilerek kullanici olusturma (bkz.
    app/api/admin.py) — public RegisterRequest'ten farki: role SERBEST secilebilir
    (public kayit formu sadece competitor acar, bkz. app/api/auth.py)."""

    email: EmailStr
    password: str
    full_name: str
    role: UserRole
