"""Gelistirme ortami icin ornek yarisma/kategori verisi.

Calistirmak icin: python -m app.db.seed
"""

from app.core.security import hash_password
from app.db.session import Base, SessionLocal, engine
from app.models import Competition, User
from app.models.enums import UserRole

DEMO_PASSWORD = "demo1234"

DEMO_USERS = [
    ("competitor@demo.ai", "Demo Yarismaci", UserRole.COMPETITOR),
    ("content-manager@demo.ai", "Demo Icerik Yoneticisi", UserRole.CONTENT_MANAGER),
    ("support-agent@demo.ai", "Demo Destek Uzmani", UserRole.SUPPORT_AGENT),
    ("system-admin@demo.ai", "Demo Sistem Yoneticisi", UserRole.SYSTEM_ADMIN),
]


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Competition).count() > 0:
            print("Yarisma verisi zaten mevcut, seed atlaniyor.")
        else:
            db.add_all(
                [
                    Competition(name="Teknofest Insansi Robot", slug="insansi-robot"),
                    Competition(name="Teknofest Saglikta Yapay Zeka", slug="saglikta-yapay-zeka"),
                ]
            )
            db.commit()
            print("Ornek yarisma verisi eklendi.")

        if db.query(User).count() > 0:
            print("Kullanici verisi zaten mevcut, seed atlaniyor.")
        else:
            db.add_all(
                [
                    User(
                        email=email,
                        full_name=full_name,
                        hashed_password=hash_password(DEMO_PASSWORD),
                        role=role,
                    )
                    for email, full_name, role in DEMO_USERS
                ]
            )
            db.commit()
            print(f"Demo kullanicilar eklendi (sifre: {DEMO_PASSWORD}).")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
