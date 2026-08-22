"""feature/backend-api henuz auth/JWT eklemedigi icin, bu MVP endpoint'leri
gercek bir kullanici oturumu varmis gibi calismasi icin sabit e-postali birer
"demo" kullanici kullanir. Auth branch'i entegre olduginda bu fonksiyon ve
cagiran endpoint'lerdeki user_id parametreleri kaldirilip gercek
`Depends(get_current_user)` ile degistirilecek."""

from sqlalchemy.orm import Session

from app.models import User
from app.models.enums import UserRole

DEMO_USERS: dict[UserRole, tuple[str, str]] = {
    UserRole.CONTENT_MANAGER: ("demo-content-manager@pragma.ai", "Demo Icerik Yoneticisi"),
    UserRole.COMPETITOR: ("demo-competitor@pragma.ai", "Demo Yarismaci"),
}


def get_or_create_demo_user(db: Session, role: UserRole) -> User:
    email, full_name = DEMO_USERS[role]
    user = db.query(User).filter(User.email == email).first()
    if user:
        return user

    user = User(email=email, full_name=full_name, hashed_password="demo-no-auth", role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user
