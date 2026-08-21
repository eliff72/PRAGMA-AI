from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from app.core.security import decode_access_token
from app.schemas.auth import CurrentUser

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def get_current_user(token: str = Depends(oauth2_scheme)) -> CurrentUser:
    payload = decode_access_token(token)
    if payload is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Gecersiz veya suresi dolmus token")
    return CurrentUser(id=payload["sub"], email=payload["email"], role=payload["role"])


def require_role(*allowed_roles: str):
    """Rol bazli yetkilendirme icin dependency factory.

    Kullanim: Depends(require_role("content_manager", "system_admin"))
    """

    def _dependency(current_user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
        if current_user.role not in allowed_roles:
            raise HTTPException(status.HTTP_403_FORBIDDEN, "Bu islem icin yetkiniz yok")
        return current_user

    return _dependency
