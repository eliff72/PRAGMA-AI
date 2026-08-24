"""TEKNOFEST 2026 gercek yarisma kategorileri + 3 ornek sartname seed script'i.

Kategori listesi https://teknofest.org/tr/yarismalar/ sayfasindan (Tum Kategoriler)
dogrudan cekildi (60 isim) - hicbir kategori uydurulmadi.

Calistirmak icin: python -m app.db.seed_teknofest_2026
"""

import re

from app.db.session import SessionLocal
from app.models import Competition, Source, User
from app.models.enums import SourceType
from app.services.source_ingestion import store_and_ingest_source

# https://teknofest.org/tr/yarismalar/ - "Tum Kategoriler" altinda listelenen 60 yarisma.
TEKNOFEST_2026_COMPETITIONS = [
    "5G & Yapay Zeka ile Akıllı Yol Güvenliği Yarışması",
    "Biyoteknoloji İnovasyon Yarışması",
    "Blokzincir Yarışması",
    "Çip Tasarım Yarışması",
    "Dikey İnişli Roket Yarışması",
    "E-Ticaret Yarışması",
    "Yapay Zeka Destekli Lojistik Anahat Optimizasyonu Yarışması",
    "Finansal Teknolojiler Yarışması",
    "Hareketli Uydu Terminali Yarışması",
    "Havacılıkta Yapay Zeka Yarışması",
    "Çelikkubbe Hava Savunma Sistemleri Yarışması",
    "Hyperloop Geliştirme Yarışması",
    "İnsansız Deniz Aracı Yarışması",
    "İnsansız Kara Aracı Yarışması",
    "İnsansız Su Altı Sistemleri Yarışması",
    "İnsansız Su Altı Sistemleri Yıldızlar Yarışması",
    "Jet Motor Tasarım Yarışması",
    "Kuantum Teknolojileri Yarışması",
    "Liseler Arası İnsansız Hava Araçları Yarışması",
    "Lise Öğrencileri İklim Değişikliği Araştırma Projeleri Yarışması",
    "Lise Öğrencileri Kutup Araştırma Projeleri Yarışması",
    "Model Uydu Yarışması",
    "Nükleer Enerji Teknolojileri Tasarım Yarışması",
    "Onkolojide 3T Yarışması",
    "Pardus Hata Yakalama ve Öneri Yarışması",
    "Robotaksi-Binek Otonom Araç Yarışması",
    "Roket Yarışması",
    "Sağlıkta Yapay Zeka Yarışması",
    "Sanayide Robotik Uygulamalar Yarışması",
    "Sürü İHA Yarışması",
    "Savaşan İHA Yıldızlar Yarışması",
    "Savaşan İHA Yarışması",
    "Savaşan İHA Avcı Drone Yarışması",
    "Su Altı Roket Yarışması",
    "Tarım Teknolojileri Yarışması",
    "TEKNOFEST Drone Şampiyonası",
    "TEKNOFEST Mimari ve Görsel Tasarım Yarışması",
    "TEKNOFEST Robolig Yarışması",
    "World Drone Cup",
    "İnsanlık Yararına Teknolojiler Yarışması - İlkokul Seviyesi",
    "İnsanlık Yararına Teknolojiler Yarışması - Ortaokul Seviyesi",
    "İnsanlık Yararına Teknolojiler Yarışması - Lise Seviyesi",
    "Uluslararası Elektrikli Araç Yarışları",
    "Uluslararası İnsansız Hava Aracı Yarışması",
    "Üniversite Öğrencileri Araştırma Proje Yarışmaları",
    "Yapay Zeka Destekli Havayolu Optimizasyonu Yarışması",
    "Yapay Zeka Dil Ajanları Yarışması",
    "TÜBA-TEKNOFEST Doktora Bilim Ödülleri",
    "HackMasters Güneydoğu",
    "NSOSYAL İnovasyon Yarışması",
    "Mavi Vatan Resim Yarışması",
    "Bağımlılıklarla Mücadelede Teknolojik Uygulamalar Yarışması",
    "FPV Drone İzleme (Tracking) Yarışması",
    "KÜRE TEKNOFEST Mavi Vatan Madde Yazım Yarışması",
    "Elektronik Harp Yarışması",
    "TEKNOFEST Yapay Zeka Film Yarışması",
    "Sıfır Atık & Döngüsel Ekonomi Yarışması",
    "Maden Teknolojileri Yarışması",
    "İleri Otonom Sistemler Tasarım ve Operasyon Yarışması",
    "TEKNOFEST Mesleki Yetenek Yarışması",
]

# Eski seed.py'deki "Teknofest Saglikta Yapay Zeka" kaydi ayni yarismanin resmi
# adiyla eslesiyor; duplike olusturmak yerine bu kaydi resmi isme guncelliyoruz.
LEGACY_NAME_TO_OFFICIAL = {
    "Teknofest Saglikta Yapay Zeka": "Sağlıkta Yapay Zeka Yarışması",
}

_TR_MAP = str.maketrans(
    {"İ": "i", "I": "i", "ı": "i", "Ş": "s", "ş": "s", "Ğ": "g", "ğ": "g", "Ü": "u", "ü": "u", "Ö": "o", "ö": "o", "Ç": "c", "ç": "c"}
)


def slugify(name: str) -> str:
    ascii_name = name.translate(_TR_MAP).lower()
    return re.sub(r"[^a-z0-9]+", "-", ascii_name).strip("-")


def seed_competitions() -> None:
    db = SessionLocal()
    try:
        for legacy_name, official_name in LEGACY_NAME_TO_OFFICIAL.items():
            legacy = db.query(Competition).filter(Competition.name == legacy_name).first()
            if legacy and legacy.name != official_name:
                legacy.name = official_name
                legacy.slug = slugify(official_name)
                db.commit()
                print(f"Guncellendi: '{legacy_name}' -> '{official_name}'")

        created, skipped = 0, 0
        for name in TEKNOFEST_2026_COMPETITIONS:
            existing = db.query(Competition).filter(Competition.name == name).first()
            if existing:
                skipped += 1
                continue
            competition = Competition(
                name=name,
                slug=slugify(name),
                description=f"TEKNOFEST 2026 kapsamindaki '{name}' kategorisi.",
            )
            db.add(competition)
            db.commit()
            created += 1

        print(f"Kategoriler: {created} yeni eklendi, {skipped} zaten mevcuttu (toplam {len(TEKNOFEST_2026_COMPETITIONS)}).")
    finally:
        db.close()


SPECIFICATIONS = [
    {
        "competition_name": "Sürü İHA Yarışması",
        "title": "Sürü İHA Yarışması Şartnamesi",
        "source_url": "https://teknofest.org/tr/yarismalar/suru-iha-yarismasi/",
        "content": """1. Amac ve Kapsam
1.1. Yarismanin amaci, katilimci takimlarin kendi urettikleri Insansiz Hava Araclari (IHA) icin suru halinde gorev icra edebilen yazilim ve algoritmalarin gelistirilmesini tesvik etmektir.
1.2. Takimlarin gelistirdigi suru davranisi algoritmalarinin basarimi, gercek dunya kosullarinda birden fazla IHA'nin es zamanli ucusu ile gosterilir.

2. Katilim Sartlari
2.1. Yarismaya, Turkiye'deki veya yurt disindaki universitelerin on lisans, lisans, yuksek lisans veya doktora programlarinda kayitli ogrenciler ile bu programlardan mezun olmus kisiler takim halinde basvurabilir.
2.2. Bir takim en az 3 (uc), en fazla 10 (on) kisiden olusur.

3. Degerlendirme Sureci
3.1. Degerlendirme birden fazla asamadan olusur.
3.2. Ilk asamada takimlarin sunduklari proje raporu degerlendirilir.
3.3. Bir sonraki asamada takimlarin gorev icrasini gosteren video degerlendirmesi yapilir.
3.4. Degerlendirme surecinin son asamasi finaldir.""",
    },
    {
        "competition_name": "Savaşan İHA Yarışması",
        "title": "Savaşan İHA Yarışması Şartnamesi",
        "source_url": "https://teknofest.org/tr/yarismalar/savasan-iha-yarismasi/",
        "content": """1. Amac ve Kapsam
1.1. Yarismanin amaci, Insansiz Hava Araclari (IHA) arasinda hava-hava ve hava-kara muharebe senaryolarinin kontrollu bir ortamda gerceklestirilmesini saglamaktir.
1.2. Yarisma iki ayri gorevden olusur: "Savasan IHA" gorevi ve "Kamikaze IHA" gorevi.

2. Gorev Gereksinimleri
2.1. Takimlarin IHA'lari otonom kalkis gerceklestirebilmelidir.
2.2. Takimlarin IHA'lari otonom ucus gerceklestirebilmelidir.
2.3. Takimlarin IHA'lari otonom inis gerceklestirebilmelidir.
2.4. Takimlarin IHA'lari otonom hedef kilitlenmesi gerceklestirebilmelidir.
2.5. Kamikaze IHA gorevinde takimlarin IHA'lari kamikaze gorevini otonom olarak icra edebilmelidir.

3. Katilim Sartlari
3.1. Yarismaya lise ve universite ogrencileri ile bu seviyelerden mezun olmus kisiler takim halinde katilabilir.
3.2. Mezun seviyesinde, firma veya girisimler de takim olarak basvuruda bulunabilir.""",
    },
    {
        "competition_name": "Uluslararası İnsansız Hava Aracı Yarışması",
        "title": "Uluslararası İnsansız Hava Aracı Yarışması Şartnamesi",
        "source_url": "https://teknofest.org/tr/yarismalar/uluslararasi-insansiz-hava-araci-yarismasi/",
        "content": """1. Yarisma Kategorileri
1.1. Yarisma uc kategoriden olusur: Sabit Kanat kategorisi, Doner Kanat kategorisi ve Serbest Gorev kategorisi.

2. Katilim Sartlari
2.1. Yarismaya ulusal ve uluslararasi universitelerin on lisans, lisans ve lisansustu ogrencileri katilabilir.
2.2. Lise seviyesindeki ogrenciler, karma takim kurali cercevesinde yarismaya katilabilir.

3. Degerlendirme Sureci
3.1. Takimlar Proje Sunum Raporu hazirlar ve degerlendirmeye sunar.
3.2. Takimlar Hazirlik ve Gorev Videosu hazirlar ve degerlendirmeye sunar.""",
    },
]


def seed_specifications() -> None:
    db = SessionLocal()
    try:
        uploader = db.query(User).filter(User.email == "content-manager@demo.ai").first()
        if uploader is None:
            print("content-manager@demo.ai bulunamadi; once 'python -m app.db.seed' calistirin.")
            return

        for spec in SPECIFICATIONS:
            competition = db.query(Competition).filter(
                Competition.name == spec["competition_name"]
            ).first()
            if competition is None:
                print(f"Atlandi (kategori bulunamadi): {spec['competition_name']}")
                continue

            already = db.query(Source).filter(
                Source.competition_id == competition.id, Source.title == spec["title"]
            ).first()
            if already:
                print(f"Atlandi (zaten yuklu): {spec['title']}")
                continue

            filename = f"{slugify(spec['title'])}.txt"
            store_and_ingest_source(
                db,
                competition_id=competition.id,
                competition_slug=competition.slug,
                filename=filename,
                file_bytes=spec["content"].encode("utf-8"),
                title=spec["title"],
                source_type=SourceType.SPECIFICATION,
                version=1,
                uploaded_by_id=uploader.id,
                source_url=spec["source_url"],
            )
            print(f"Yuklendi: {spec['title']} -> {competition.name} ({competition.slug})")
    finally:
        db.close()


if __name__ == "__main__":
    seed_competitions()
    seed_specifications()
