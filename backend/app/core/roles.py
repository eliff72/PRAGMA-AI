from app.models.enums import UserRole

# Frontend (feature/backend-frontend-uyumu) Turkce rol isimleri bekliyor;
# backend'in ic yetkilendirme mantigi (require_role) Ingilizce UserRole enum'ini
# kullanmaya devam eder. Bu, sadece response serialize ederken kullanilan bir
# goruntu katmanidir.
ROLE_TO_FRONTEND: dict[UserRole, str] = {
    UserRole.COMPETITOR: "yarismaci",
    UserRole.CONTENT_MANAGER: "icerik_yonetici",
    UserRole.SUPPORT_AGENT: "destek",
    UserRole.SYSTEM_ADMIN: "admin",
}


def to_frontend_role(role: UserRole) -> str:
    return ROLE_TO_FRONTEND[role]
