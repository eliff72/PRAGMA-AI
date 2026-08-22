"""Gelistirme ortami icin ornek yarisma/kategori verisi.

Calistirmak icin: python -m app.db.seed
"""

from app.db.session import Base, SessionLocal, engine
from app.models import Competition


def seed() -> None:
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if db.query(Competition).count() > 0:
            print("Yarisma verisi zaten mevcut, seed atlaniyor.")
            return

        db.add_all(
            [
                Competition(name="Teknofest Insansi Robot", slug="insansi-robot"),
                Competition(name="Teknofest Saglikta Yapay Zeka", slug="saglikta-yapay-zeka"),
            ]
        )
        db.commit()
        print("Ornek yarisma verisi eklendi.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
