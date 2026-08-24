import enum


class UserRole(str, enum.Enum):
    COMPETITOR = "competitor"           # Yarışmacı
    CONTENT_MANAGER = "content_manager"  # İçerik Yöneticisi
    SUPPORT_AGENT = "support_agent"      # Destek Ekibi
    SYSTEM_ADMIN = "system_admin"        # Sistem Yöneticisi


class SourceType(str, enum.Enum):
    SPECIFICATION = "specification"  # şartname
    GUIDE = "guide"                  # kılavuz
    FAQ = "faq"                      # onaylı SSS


class SourceStatus(str, enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"


class EscalationStatus(str, enum.Enum):
    OPEN = "open"              # destek ekibine düştü, henüz alınmadı
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
