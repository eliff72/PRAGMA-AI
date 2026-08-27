# PRAGMA-AI

**PRAGMA-AI**, TEKNOFEST yarışmacılarının onlarca/yüzlerce sayfalık şartname ve teknik doküman içinde kaybolmadan, doğal dilde soru sorup **kaynağı gösterilen, doğrulanmış yanıtlar** alabilmesini sağlayan bir RAG (Retrieval-Augmented Generation) tabanlı SSS/asistan sistemidir. Sistem emin olmadığı durumlarda yanıt uydurmak yerine talebi insan destek ekibine devreder.

Bu proje T3 Vakfı Bursiyer Yapay Zekâ Creathonu 2026 kapsamında geliştirilmiştir.

---

## İçindekiler

- [Problem](#problem)
- [Çözüm](#çözüm)
- [Özellikler](#özellikler)
- [Mimari](#mimari)
- [Roller ve Yetkilendirme](#roller-ve-yetkilendirme)
- [Kurulum](#kurulum)
- [Ortam Değişkenleri](#ortam-değişkenleri)
- [Veritabanı Migrasyonları](#veritabanı-migrasyonları)
- [API Genel Bakış](#api-genel-bakış)
- [Doğrulama / Test Durumu](#doğrulama--test-durumu)
- [Ekip](#ekip)

---

## Problem

TEKNOFEST yarışmacıları, 100+ sayfalık PDF şartnameler içinde aradıkları spesifik kuralı bulamıyor; aynı sorular destek ekiplerine (KYS üzerinden) tekrar tekrar geliyor ve yanıt süreleri uzuyor.

## Çözüm

PRAGMA-AI, her yarışma/kategori için izole edilmiş bir bilgi tabanı üzerinden çalışan bir yapay zekâ asistanıdır:

1. İçerik yöneticisi, yarışmaya ait kaynak dokümanları (şartname, PDF vb.) sisteme yükler.
2. Sistem bu dokümanları parçalara ayırıp (chunking) vektör temsillerini çıkarır ve yarışmaya özel bir vektör koleksiyonunda saklar.
3. Yarışmacı doğal dilde soru sorduğunda, sistem en alakalı doküman parçalarını bulur ve bu parçalara dayanarak, kaynağını göstererek bir yanıt üretir.
4. Sistem yanıttan emin değilse (düşük güven skoru, API hatası veya "yanıtlayamıyorum" durumu) talebi otomatik reddetmek yerine insana devreder; yarışmacı da isterse "destek iste" butonuyla talebi manuel olarak insana yönlendirebilir.

## Özellikler

- **Rol bazlı kayıt ve giriş:** Herkese açık kayıt ekranından yalnızca *Yarışmacı* rolüyle üye olunabilir. Diğer roller (İçerik Yöneticisi, Destek Uzmanı, Sistem Yöneticisi) yalnızca Sistem Yöneticisi tarafından, ayrı bir yönetim ekranından oluşturulur.
- **Kategori + kaynak birlikte oluşturma:** İçerik yöneticisi yeni bir yarışma/kategori eklerken aynı adımda en az bir kaynak dosyası da yüklemek zorundadır; kaynak yükleme başarısız olursa oluşturulan kategori otomatik olarak geri alınır (rollback). Bu sayede yarışmacı ekranında hiçbir zaman "boş", kaynağı olmayan bir kategori görünmez.
- **Güvenli kullanıcı silme:** Sistem yöneticisi bir kullanıcıyı sildiğinde, sistem önce o kullanıcıya bağlı kayıt (kaynak, soru-cevap, destek talebi, SSS girdisi) olup olmadığını kontrol eder. Bağlı kaydı yoksa kullanıcı tamamen silinir; varsa veri kaybını önlemek için kullanıcı **pasif hale getirilir** (soft delete) — geçmiş kayıtları korunur, sadece o hesapla yeni işlem yapılamaz. Kullanıcı kendi hesabını silemez.
- **Kaynak atıflı, güven skorlu yanıtlar:** Her yanıt, dayandığı kaynak dokümana referans verir ve bir güven seviyesi taşır; düşük güven durumunda otomatik olarak insana devredilir.
- **Yarışma bazında izole bilgi tabanı:** Her yarışmanın/kategorinin belgeleri ayrı bir vektör koleksiyonunda (`competition_{slug}`) tutulur, farklı yarışmaların içerikleri birbirine karışmaz.

## Mimari

```
Frontend (React + Vite)
        │ HTTP / JWT
        ▼
Backend (FastAPI)
        │
        ├──► PostgreSQL      → Kullanıcı, kaynak, soru-cevap, destek talebi verisi
        ├──► ChromaDB        → Yarışma/kategori bazında izole RAG retrieval (vektör deposu)
        └──► Google Gemini   → Embedding üretimi + doğal dilde yanıt üretimi
```

**RAG pipeline (özet):**

1. **Chunking:** Yüklenen dokümanlar karakter bazlı kaydırmalı pencere ile parçalara bölünür (chunk ~800 karakter, ~150 karakter örtüşme).
2. **Embedding:** Her parça Google Gemini embedding modeliyle vektöre çevrilir (doküman ve soru embedding'leri farklı görev tipiyle — `retrieval_document` / `retrieval_query` — üretilir).
3. **Depolama:** Vektörler, yarışmaya özel bir koleksiyonda (`competition_{slug}`) saklanır.
4. **Retrieval:** Gelen soru embedding'i ile kosinüs benzerliğine göre en alakalı parçalar bulunur.
5. **Generation:** Gemini, bulunan parçalara dayanarak yapılandırılmış (JSON) bir yanıt üretir; yanıt "yanıtlanabilir mi", "güven seviyesi" gibi alanlar içerir.
6. **Güvenlik ağı:** API hatası → insana devret; "yanıtlayamıyorum" → insana devret; güven seviyesi düşükse (yanıtlanabilir görünse bile) → yine insana devret.

## Roller ve Yetkilendirme

Kimlik doğrulama JWT (HS256) ile yapılır. Dört rol vardır:

| Rol | Backend değeri | Açıklama |
|---|---|---|
| **Yarışmacı** | `competitor` | Herkese açık kayıtla oluşturulabilen tek rol. Soru sorar, kaynaklı yanıt alır, gerekirse destek talep eder. |
| **İçerik Yöneticisi** | `content_manager` | Yarışma/kategori ve kaynak dokümanları oluşturur ve yönetir. |
| **Destek Uzmanı** | `support_agent` | İnsana devredilen talepleri (escalation) yanıtlar, SSS havuzuna ekler. |
| **Sistem Yöneticisi** | `system_admin` | Her rolden kullanıcı oluşturabilir, kullanıcı silebilir/pasifleştirebilir, analitiklere erişir. |

Kritik uç noktalar `require_role(...)` bağımlılığıyla korunur; yetkisiz erişim `403`, kimliksiz erişim `401` ile reddedilir.

## Kurulum

Docker Compose ile yerel kurulum (`docker-compose.yml`'de tanımlı servisler ve portlar):

| Servis | Container | Yerel port |
|---|---|---|
| Backend (FastAPI) | `backend` | `http://localhost:8000` |
| Frontend (Vite dev server) | `frontend` | `http://localhost:5173` |
| PostgreSQL | `postgres` | `localhost:5432` (kullanıcı: `pragma`, db: `pragma_ai` — `docker-compose.yml` içinde sabit tanımlı) |

```bash
# 1. Repoyu klonlayın
git clone https://github.com/eliff72/PRAGMA-AI.git
cd PRAGMA-AI

# 2. Ortam değişkenlerini ayarlayın
cp .env.example .env
# .env dosyasını açıp GEMINI_API_KEY ve diğer değerleri doldurun

# 3. Servisleri ayağa kaldırın
docker compose up -d

# 4. Veritabanı migrasyonlarını uygulayın (ilk kurulumda / güncelleme sonrası)
docker compose exec backend alembic upgrade head
```

Kurulum tamamlandığında:
- API dokümantasyonu (Swagger): `http://localhost:8000/docs`
- Frontend: `http://localhost:5173`

## Ortam Değişkenleri

`.env.example` dosyasındaki tüm değişkenler:

| Değişken | Açıklama |
|---|---|
| `DATABASE_URL` | Backend'in PostgreSQL bağlantı string'i (`postgresql+psycopg://pragma:pragma@localhost:5432/pragma_ai`). Docker Compose içinde `backend` servisi için host kısmı otomatik olarak `postgres` ile ezilir. |
| `JWT_SECRET` | JWT imzalama anahtarı — **prod'da mutlaka değiştirin**. |
| `JWT_ALGORITHM` | JWT algoritması (`HS256`). |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token geçerlilik süresi (dakika, varsayılan `60`). |
| `GEMINI_API_KEY` | Google Gemini API anahtarı (embedding + generation için zorunlu). |
| `GEMINI_CHAT_MODEL` | Yanıt üretiminde kullanılan Gemini modeli. |
| `GEMINI_EMBEDDING_MODEL` | Embedding üretiminde kullanılan Gemini modeli. |
| `CHROMA_PERSIST_DIR` | ChromaDB'nin diskte kalıcı verisini tuttuğu dizin (`./app/data/chroma`). |
| `RAG_TOP_K` | Retrieval'da getirilecek en alakalı parça (chunk) sayısı. |
| `RAG_MIN_SIMILARITY` | Retrieval için minimum benzerlik eşiği. |
| `VITE_API_URL` | Frontend'in backend'e erişeceği adres (`http://localhost:8000`). |
| `VITE_USE_MOCK` | `true` yapılırsa, backend'e gerçekten ulaşılamadığında (ağ hatası/timeout) arayüz mock veriye düşer. Backend ayakta ama gerçek bir hata dönüyorsa (401/403/404/500) bu bayrak açık olsa bile mock'a düşülmez. Varsayılan `false`. |

> Not: PostgreSQL kullanıcı adı/şifre/veritabanı adı ayrı bir `.env` değişkeni değildir — `docker-compose.yml` içinde `postgres` servisi için sabit (`pragma` / `pragma` / `pragma_ai`) tanımlıdır; backend bu bilgilere sadece `DATABASE_URL` üzerinden erişir.

## Veritabanı Migrasyonları

Şema değişiklikleri Alembic ile yönetilir:

```bash
# Mevcut migrasyonları uygula
docker compose exec backend alembic upgrade head

# Yeni bir migrasyon oluştur (şema değişikliği sonrası)
docker compose exec backend alembic revision --autogenerate -m "açıklama"
```

## API Genel Bakış

Frontend'in fiilen kullandığı uç noktalar aşağıdadır (rol koruması parantez içinde belirtilmiştir). Güncel ve eksiksiz şema için her zaman `/docs` (Swagger UI) esas alınmalıdır.

**Kimlik doğrulama** (`/auth`)
- `POST /auth/register` *(herkese açık)* — Yarışmacı kaydı; rol her zaman `competitor` olur.
- `POST /auth/login` *(herkese açık)* — Giriş, JWT döner.

**Yarışma / kategori** (`/competitions`)
- `GET /competitions` *(herkese açık)* — Aktif yarışma/kategori listesi.
- `POST /competitions` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Yeni yarışma/kategori oluşturur.
- `DELETE /competitions/{id}` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Bağlı kaydı (kaynak/soru/SSS) yoksa siler, varsa `409` döner.

**Kaynak yönetimi** (`/api/resources`)
- `GET /api/resources` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Tüm kaynakların listesi.
- `GET /api/resources/{competitionId}/active` *(Yarışmacı, İçerik Yöneticisi, Sistem Yöneticisi)* — Bir kategorinin sadece aktif kaynakları.
- `POST /api/resources` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Kaynak dosyası yükler (multipart), chunk'lar otomatik embed edilir.
- `GET /api/resources/{id}/chunks` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Bir kaynağın parçalanmış içeriği.
- `PATCH /api/resources/{id}/deactivate` / `PATCH /api/resources/{id}/activate` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Kaynağı pasife/aktife alır (vektör deposundan çıkarır/yeniden ekler).
- `DELETE /api/resources/{id}` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Kalıcı silme.

**Soru-cevap / RAG** (`/api`)
- `POST /api/questions` *(Yarışmacı)* — Doğal dilde soru sorar; önce SSS havuzuyla eşleşmeye bakılır, yoksa RAG pipeline'ı çalışır.
- `POST /api/questions/{qaLogId}/destege-gonder` *(Yarışmacı)* — Kanıt bulunamayan bir soruyu destek ekibine yönlendirir (escalation açar).

**Destek talepleri** (`/escalations`)
- `GET /escalations` *(Destek Uzmanı, Sistem Yöneticisi)* — Açık destek talepleri kuyruğu.
- `GET /escalations/mine` *(Yarışmacı)* — Kendi gönderdiği taleplerin durumu.
- `POST /escalations/{id}/resolve` *(Destek Uzmanı, Sistem Yöneticisi)* — Talebi yanıtlar; otomatik olarak SSS havuzuna eklenir.
- `POST /escalations/{id}/add-to-faq` *(Destek Uzmanı, Sistem Yöneticisi)* — Zaten yanıtlanmış bir talebi SSS havuzuna ekler (tekrar eklemez).

**SSS havuzu** (`/support/faq`)
- `GET /support/faq` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Kategoriye göre filtrelenebilir SSS listesi.
- `POST /support/faq/manual-entry` *(İçerik Yöneticisi, Sistem Yöneticisi)* — Elle SSS kaydı ekler.
- `PATCH /support/faq/{id}/deactivate` *(İçerik Yöneticisi, Sistem Yöneticisi)* — SSS kaydını pasife alır.

**Kullanıcı yönetimi** (`/api/admin`)
- `GET /api/admin/users` *(Sistem Yöneticisi)* — Kullanıcı listesi (aktif/pasif ve bağlı-kayıt durumu dahil).
- `POST /api/admin/users` *(Sistem Yöneticisi)* — Herhangi bir rolde kullanıcı oluşturur.
- `DELETE /api/admin/users/{id}` *(Sistem Yöneticisi)* — Bağlı kaydı yoksa kalıcı siler, varsa hesabı pasifleştirir (soft delete); kendi hesabını silmeye izin vermez.

**Analitik** (`/api/analytics`)
- `GET /api/analytics` *(Sistem Yöneticisi)* — Toplam soru sayısı, escalation oranı, güven dağılımı, kategori bazlı istatistikler.

> Not: `competitions.py` içinde ayrıca `POST/GET /competitions/{slug}/sources/...` ve `POST /competitions/{slug}/ask` gibi eski (legacy) uç noktalar da bulunur; frontend bunların yerine yukarıdaki `/api/resources` ve `/api/questions` (flat) sözleşmesini kullanır.

## Doğrulama / Test Durumu

Proje, Creathon PRD'sindeki 4 zorunlu MVP gereksinimi ve 3 uçtan uca kullanıcı senaryosu için canlı Google Gemini API kullanılarak test edilmiş ve tamamı başarıyla doğrulanmıştır. Ayrıca geliştirme sürecinde tespit edilen kritik bir yetkilendirme açığı (yarışma oluşturma uç noktasında eksik rol kontrolü) kapatılmıştır.

## Ekip

- **Elif Güney** — Backend & API
- **Sümeyye Yoleri** — Yarışmacı Arayüzü
- **Esma Altun** — Yönetim Panelleri
- **Enes Özatak** — Test & Entegrasyon

---

*Bu README, projenin son durumuna (docker-compose.yml, .env.example ve backend route dosyaları) göre doğrulanarak güncellenmiştir.*
