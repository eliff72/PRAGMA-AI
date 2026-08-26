# PRAGMA-AI

## TEKNOFEST — Yapay Zeka Destekli SSS ve Chatbot Asistanı

> Yarışmacıların sorularını **yalnızca doğrulanmış, güncel kaynaklardan** (şartname, kılavuz,
> onaylı SSS) yanıtlayan **RAG (Retrieval-Augmented Generation)** tabanlı asistan.
> Serbest ifadeyle sorulan soruyu anlar, ilgili kaynak parçasını bulur, **kaynağını göstererek**
> yanıtlar; yeterli kanıt yoksa **yanıt uydurmaz**, soruyu destek ekibine yönlendirir.

| | |
|---|---|
| **Canlı Backend** | `https://<render-servis-adiniz>.onrender.com` — sağlık: `/health`, API dokümanı: `/docs` |
| **Canlı Frontend** | `https://<frontend-domaininiz>` |
| **Yerel** | Backend `http://localhost:8000/docs` · Frontend `http://localhost:5173` |
| **Demo şifresi** | `demo1234` (tüm demo hesaplar — bkz. Test Kullanıcı Hesapları) |

> Canlı URL'ler ilk dağıtımdan sonra doldurulmalıdır; adımlar için bkz. **Production Dağıtım**.

---

## İçindekiler

1. [Jüri İçin 5 Dakikalık Demo Senaryosu](#jüri-için-5-dakikalık-demo-senaryosu)
2. [Test Kullanıcı Hesapları](#test-kullanıcı-hesapları)
3. [Örnek Jüri Soruları](#örnek-jüri-soruları)
4. [Sistem Mimarisi](#sistem-mimarisi)
5. [RAG Akışı](#rag-akışı)
6. [API Yüzeyi](#api-yüzeyi)
7. [Hızlı Başlangıç (Yerel)](#hızlı-başlangıç-yerel)
8. [Production Dağıtım (Render / Railway)](#production-dağıtım-render--railway)
9. [Ortam Değişkenleri](#ortam-değişkenleri)
10. [Kullanıcı Rolleri ve MVP Gereksinimleri](#kullanıcı-rolleri-ve-mvp-gereksinimleri)
11. [Teknoloji Yığını ve Gerekçeleri](#teknoloji-yığını-ve-gerekçeleri)
12. [Proje Yapısı](#proje-yapısı)
13. [Test ve Kalite](#test-ve-kalite)
14. [Bilinen Sınırlar](#bilinen-sınırlar)

---

## Jüri İçin 5 Dakikalık Demo Senaryosu

| # | Adım | Hesap | Gösterilen MVP gereksinimi |
|---|---|---|---|
| 1 | Yarışma seç → "Sürü İHA takımı en fazla kaç kişi olabilir?" sor → **kaynaklı yanıt** ve güven seviyesi görünür | `competitor@demo.ai` | #2 doğal dil Q&A, #3 kaynak gösterimi, #4 yarışma bağlamı |
| 2 | Kaynakta olmayan bir soru sor ("Başvuru ücreti ne kadar?") → sistem **uydurmaz**, "insana yönlendir" seçeneği çıkar | `competitor@demo.ai` | #3 güven seviyesi, #5 insana yönlendirme |
| 3 | Destek panelinde aynı soru görünür → yanıtla → **SSS havuzuna ekle** | `support-agent@demo.ai` | #5 devir akışı, SSS büyütme |
| 4 | Yeni şartname yükle → eski sürümü **pasife al** → aynı soru artık yeni kaynaktan yanıtlanır | `content-manager@demo.ai` | #1 kaynak havuzu, #6 kaynak güncelleme |
| 5 | Panoda yanıt kalitesi / insana yönlendirme oranı / sık sorulan konular | `system-admin@demo.ai` | Yönetici izleme |

> **Demo öncesi kontrol listesi:** `/health` 200 dönüyor mu · `GEMINI_API_KEY` tanımlı mı ·
> seed script'leri çalıştırıldı mı · frontend `VITE_API_URL` canlı backend'i gösteriyor mu ·
> `VITE_USE_MOCK=false` mı (açıksa arayüz ağ hatasında sahte veri gösterir).

---

## Test Kullanıcı Hesapları

`python -m app.db.seed` çalıştırıldığında oluşan demo hesaplar. **Şifre (hepsi): `demo1234`**

| E-posta | Rol | Neler yapabilir |
|---|---|---|
| `competitor@demo.ai` | Yarışmacı | Soru sorar, kaynaklı yanıt alır, destek ekibine yönlendirir |
| `content-manager@demo.ai` | İçerik Yöneticisi | Şartname/kılavuz yükler, sürüm yönetir, eski kaynağı pasife alır |
| `support-agent@demo.ai` | Destek Uzmanı | İnsana yönlenen soruları yanıtlar, SSS havuzuna ekler |
| `system-admin@demo.ai` | Sistem Yöneticisi | Metrik panosu, kullanıcı yönetimi |

> Bu hesaplar **yalnızca demo/geliştirme** içindir. Canlı ortamda `demo1234` şifresiyle
> bırakılmamalı; jüri sunumu sonrası seed hesapları silin veya şifrelerini değiştirin.

`python -m app.db.seed_teknofest_2026` ayrıca TEKNOFEST 2026'nın **60 resmî yarışma kategorisini**
ve 3 örnek şartnameyi (Sürü İHA, Savaşan İHA, Uluslararası İHA) yükleyip vektör indeksine işler —
demo bu veriyle yapılır.

---

## Örnek Jüri Soruları

### A) Sisteme sorulacak demo soruları (yüklü şartnamelerden yanıtlanır)

| Soru | Beklenen davranış |
|---|---|
| "Sürü İHA yarışmasında bir takım en fazla kaç kişiden oluşabilir?" | Kaynaklı yanıt (**en fazla 10 kişi**), madde 2.2 atfı, güven: yüksek |
| "Savaşan İHA'da otonom olarak neler yapılabilmeli?" | Kalkış / uçuş / iniş / hedef kilitlenmesi maddeleri (2.1–2.4), kaynak atfı |
| "Değerlendirme kaç aşamalı ve son aşama nedir?" | Çok aşamalı süreç, son aşama **final** (madde 3.x) |
| "Mezun öğrenciler başvurabilir mi?" | Parafraz edilmiş soru; madde 2.1'den **evet** yanıtı — anahtar kelime değil anlam eşleşmesi |
| "Yarışmaya kayıt ücreti ne kadar?" | Kaynakta yok → **yanıt üretilmez**, insana yönlendirme önerilir |
| "Bugün hava nasıl?" | Alan dışı → yanıt üretilmez (halüsinasyon karşıtı davranış) |

> Son iki satır sunumun en kritik kısmıdır: **sistemin bilmediğini bilmesi** MVP gereksinim #3'ün
> doğrudan kanıtıdır.

### B) Jürinin ekibe sorması muhtemel sorular ve kısa yanıtlar

**"Model neden uydurmuyor?"**
İki katmanlı koruma var: (1) İlgili yarışmada hiç kaynak yoksa LLM'e **hiç gidilmez**,
doğrudan insana yönlendirilir. (2) LLM'e yalnızca getirilen kaynak parçaları verilir ve
yapılandırılmış çıktı şemasında `can_answer` alanı zorunludur; model bağlamı yetersiz bulursa
`can_answer=false` döner, arayüz yanıt yerine "destek ekibine gönder" akışını gösterir.

**"Kaynak gösterimi gerçek mi, sonradan mı uyduruluyor?"**
Yanıt üreten çağrının kendisi `kaynak_belge_id` döndürür; bu ID retrieval'dan gelen gerçek
chunk metadata'sıyla eşleştirilir ve veritabanındaki `Source` kaydına bağlanır
(`/api/resources/{id}/download` ile belgenin kendisi indirilebilir).

**"Neden sabit benzerlik eşiği yerine modelin kararı?"**
Başlangıçta `RAG_MIN_SIMILARITY` ön filtre olarak kullanıldı; kısa şartnamelerde bu eşik
**parafraz edilmiş ama geçerli** soruları da eliyordu. Karar modelin yapılandırılmış
`can_answer` çıktısına taşındı; eşik değeri güven skoru raporlaması için korunuyor.

**"Yarışmalar birbirine karışır mı?"**
Hayır. Her yarışma **kendi ChromaDB koleksiyonunda** (`competition_<slug>`) tutulur ve
`retrieve()` yalnızca seçili yarışmanın koleksiyonunda arama yapar (MVP #4).

**"Şartname güncellenince eski bilgi yanıtlanmaya devam eder mi?"**
Hayır. Kaynak pasife alındığında `vector_store.deactivate_source(...)` o kaynağın tüm
chunk'larını koleksiyondan siler; artık retrieval'a hiç girmez (MVP #6).

**"Neden LangChain kullanmadınız?"**
Akış 4 adım: chunk → embed → retrieve → generate. Bu ölçekte doğrudan kod, hackathon
temposunda framework soyutlamasından daha hızlı debug edilir ve jüriye satır satır gösterilebilir.

**"Neden Gemini?"**
Ücretsiz kotayla hem embedding (`gemini-embedding-001`) hem yanıt üretimi (`gemini-3.6-flash`)
tek sağlayıcıdan alınıyor. Sağlayıcı bağımlılığı `app/rag/embeddings.py` ve
`app/rag/generation.py` ile sınırlı; değiştirilebilir.

**"Ölçeklenir mi?"**
Mevcut kurulum tek instance + dosya tabanlı Chroma. Ölçek gerektiğinde vektör katmanı
pgvector/Qdrant'a taşınabilir; API sözleşmesi ve veri modeli değişmez.

---

## Sistem Mimarisi

```
                     ┌──────────────────────────────────────────┐
  Yarışmacı  ─────►  │  React + Vite + TS (Tailwind)            │
  İçerik Yön.        │  TanStack Query · Axios · JWT (Bearer)   │
  Destek · Admin     └───────────────┬──────────────────────────┘
                                     │  HTTPS / JSON  (VITE_API_URL)
                     ┌───────────────▼──────────────────────────┐
                     │  FastAPI  (CORS · JWT · rol bazlı yetki) │
                     │  /auth  /competitions  /questions        │
                     │  /resources  /escalations  /support/faq  │
                     │  /analytics  /metrics  /admin            │
                     └───┬────────────────────────┬─────────────┘
                         │                        │
         ┌───────────────▼──────────┐   ┌─────────▼──────────────────┐
         │ PostgreSQL + SQLAlchemy  │   │ RAG katmanı (app/rag)      │
         │ users · competitions     │   │ loader → chunking →        │
         │ sources · qa_logs        │   │ embeddings → vector_store  │
         │ escalations · faq_entries│   │ retrieval → generation     │
         └──────────────────────────┘   └────┬─────────────┬─────────┘
                                             │             │
                                  ┌──────────▼──┐   ┌──────▼─────────┐
                                  │  ChromaDB   │   │ Google Gemini  │
                                  │ yarışma     │   │ embedding+chat │
                                  │ başına      │   │                │
                                  │ koleksiyon  │   │                │
                                  └─────────────┘   └────────────────┘
```

**Katman sorumlulukları**

| Katman | Dizin | Sorumluluk |
|---|---|---|
| API | `backend/app/api/` | HTTP sözleşmesi, doğrulama, rol bazlı yetkilendirme |
| Servis | `backend/app/services/` | Kaynak yükleme + ingestion orkestrasyonu, RAG geçidi |
| RAG | `backend/app/rag/` | Chunking, embedding, vektör arama, yanıt üretimi |
| Veri | `backend/app/models/`, `backend/app/db/` | SQLAlchemy modelleri, oturum, seed |
| İstemci | `frontend/src/` | Rol bazlı sayfalar, API istemcisi, durum yönetimi |

Detaylı teknik doküman: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) ·
RAG modül notları: [`backend/app/rag/README.md`](backend/app/rag/README.md)

---

## RAG Akışı

### 1) Yazma yolu — kaynak yükleme (İçerik Yöneticisi)

```
PDF / DOCX / TXT yükleme
   └─► loader.py        belgeyi düz metne çevirir (pypdf / python-docx)
   └─► chunking.py      anlamlı parçalara böler (madde bütünlüğünü korur)
   └─► embeddings.py    her parçayı Gemini gemini-embedding-001 ile vektöre çevirir
   └─► vector_store.py  competition_<slug> koleksiyonuna metadata ile yazar
                        (source_id, source_title → atıf bu metadata'dan üretilir)
   └─► PostgreSQL       Source kaydı: başlık, tür, sürüm, yükleyen, geçerlilik durumu
```

Eski sürüm pasife alındığında chunk'lar koleksiyondan **silinir** — güncel olmayan bilgi
bir daha yanıtlanamaz.

### 2) Okuma yolu — soru sorma (Yarışmacı)

```
Soru + seçili yarışma
   └─► embeddings.py    soru vektöre çevrilir
   └─► retrieval.py     SADECE o yarışmanın koleksiyonunda top-K (RAG_TOP_K=5) arama
                        cosine distance → similarity (1 - distance), skora göre sıralanır
   └─► generation.py    kaynak parçaları bağlam olarak Gemini'ye verilir
                        sistem promptu: "yalnızca verilen kaynağa dayan, uydurma"
                        yapılandırılmış çıktı: can_answer · answer · kaynak_belge_id
                                               · guven_seviyesi (yüksek / orta / düşük)
   └─► Sonuç
        ├── can_answer = true  → yanıt + kaynak atfı + güven seviyesi
        └── can_answer = false → yanıt YOK, needs_human = true → destek ekibine yönlendirme
             (kaynak hiç yoksa LLM'e çağrı bile yapılmaz)
```

Uçtan uca giriş noktaları: `app/rag/pipeline.py` → `ingest_document(...)` ve
`answer_question(competition_slug, question)`.

### 3) Öğrenme döngüsü

İnsana yönlenen soru → destek uzmanı yanıtlar → tekrarlayan konu **SSS havuzuna** eklenir →
sonraki benzer sorular otomatik yanıtlanır (`app/rag/faq_matching.py`).

---

## API Yüzeyi

Tüm endpoint'ler hem kök (`/auth/login`) hem `/api` ön ekiyle (`/api/auth/login`) yayında —
geriye dönük uyumluluk için bilinçli tercih. İnteraktif liste: `/docs`.

| Alan | Endpoint'ler |
|---|---|
| Kimlik | `POST /auth/register` · `POST /auth/login` |
| Yarışmalar | `GET /competitions` · `POST /competitions` |
| Soru-cevap | `POST /competitions/{slug}/ask` · `POST /api/questions` · `POST /api/questions/{id}/destege-gonder` |
| Kaynaklar | `POST /competitions/{slug}/sources/upload` · `GET /api/resources` · `GET /api/resources/{id}/download` · `GET /api/resources/{id}/chunks` · `PATCH /api/resources/{id}/deactivate` · `PATCH /api/resources/{id}/activate` |
| Destek | `GET /escalations` · `POST /escalations/{id}/answer` · `POST /escalations/{id}/resolve` · `POST /escalations/{id}/add-to-faq` |
| SSS | `GET /support/faq` · `POST /support/faq/manual-entry` · `PATCH /support/faq/{id}/deactivate` |
| İzleme | `GET /metrics/dashboard` · `GET /api/analytics` |
| Sistem | `GET /health` |

---

## Hızlı Başlangıç (Yerel)

```bash
cp .env.example .env      # değerleri doldurun (özellikle GEMINI_API_KEY)
docker compose up --build
docker compose exec backend alembic upgrade head                  # tabloları oluştur
docker compose exec backend python -m app.db.seed                 # demo kullanıcılar + kategoriler
docker compose exec backend python -m app.db.seed_teknofest_2026  # 60 kategori + örnek şartnameler
```

- Backend: http://localhost:8000/health — Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173

Docker olmadan:

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload

# Frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

### Önemli: yerel veritabanı herkeste ayrı ve boştur

`DATABASE_URL` varsayılan olarak `localhost`'a işaret eder (bkz. `backend/app/core/config.py`)
ve Docker Compose kendi Postgres container'ını (boş bir volume ile) ayağa kaldırır. Bu yüzden
**her geliştiricinin veritabanı fiziksel olarak ayrıdır**.

- `python -m app.db.seed` yalnızca o an bağlı olunan veritabanına demo kullanıcı/kategori ekler.
  Bunu çalıştıran herkes aynı demo giriş bilgilerini görür ama **paylaşılan gerçek içeriği görmez**.
- Gerçek/paylaşılan veriyi aktarmak için seed değil `pg_dump` / `pg_restore` kullanın:

  ```bash
  pg_dump -h localhost -U pragma -d pragma_ai -Fc -f pragma_ai.dump
  pg_restore -h localhost -U pragma -d pragma_ai --clean --if-exists pragma_ai.dump
  ```

  `pragma_ai.dump` dosyasını **git'e commit etmeyin** — gerçek kullanıcı verisi içerir.

---

## Production Dağıtım (Render / Railway)

Backend imajı `backend/Dockerfile` ile üretilir: `--reload` kapalı, `$PORT` ortam değişkenine
saygılı, `/health` üzerinden HEALTHCHECK tanımlı. (Yerel `docker compose` hot-reload'u kendi
`command` satırıyla geri açar.)

### Render (Blueprint)

```bash
cp backend/render.yaml render.yaml   # Render blueprint'leri depo KÖKÜNDE arar
git add render.yaml && git commit -m "chore: render blueprint" && git push
```

Render panelinde **New → Blueprint** ile depoyu bağlayın. Blueprint şunları kurar: Docker
tabanlı web servisi, `pragma-ai-db` PostgreSQL, başlangıçta `alembic upgrade head`,
`/health` sağlık kontrolü, `JWT_SECRET` otomatik üretimi.

Dağıtımdan sonra elle yapılacaklar:

1. **`GEMINI_API_KEY`** değerini panelden girin (`sync: false` — repoya yazılmaz).
2. **`DATABASE_URL`** şemasını kontrol edin: Render `postgresql://...` üretir; SQLAlchemy +
   psycopg3 için **`postgresql+psycopg://...`** olmalıdır.
3. **`CORS_ORIGINS`** değerini frontend domaininize daraltın (varsayılan `*`).
4. Shell'den seed: `python -m app.db.seed && python -m app.db.seed_teknofest_2026`

> Render free plan'da disk kalıcı değildir: her deploy'da `CHROMA_PERSIST_DIR` sıfırlanır ve
> kaynakların yeniden yüklenmesi gerekir. Kalıcılık için `render.yaml` içindeki yorumlu `disk:`
> bloğunu açın (ücretli plan).

### Railway

`backend/railway.json` hazır (Dockerfile builder, `/health` healthcheck, migrasyonlu start
komutu). Railway'de: yeni servis → repoyu bağla → **Root Directory = `backend`** → PostgreSQL
eklentisini ekle → `DATABASE_URL`, `GEMINI_API_KEY`, `JWT_SECRET`, `CORS_ORIGINS` değişkenlerini
tanımla.

### Frontend (Vercel / Netlify / statik host)

```bash
cd frontend
npm ci
VITE_API_URL=https://<backend-domaininiz> npm run build   # çıktı: frontend/dist
```

> **Kritik:** Vite ortam değişkenleri **build sırasında** paketin içine gömülür. Dağıtım
> platformunda `VITE_API_URL` tanımlandıktan sonra **yeniden build** gerekir; sonradan
> değiştirmek çalışan siteyi etkilemez. `VITE_USE_MOCK` production'da mutlaka `false` olmalıdır.

---

## Ortam Değişkenleri

### Backend (`.env` — şablon: `.env.example`)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `ENVIRONMENT` | `development` | Ortam etiketi |
| `CORS_ORIGINS` | `*` | Virgülle ayrılmış origin listesi ya da `*`. `*` iken tarayıcı spesifikasyonu gereği `allow_credentials` kapatılır; auth cookie değil `Authorization: Bearer` kullandığından bu arayüzü etkilemez |
| `DATABASE_URL` | yerel Postgres | **`postgresql+psycopg://`** şeması gerekir |
| `JWT_SECRET` | `change-me-in-production` | Production'da mutlaka değiştirin |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `60` | Token ömrü |
| `GEMINI_API_KEY` | — | **Zorunlu.** Boşsa RAG yanıt üretemez |
| `GEMINI_CHAT_MODEL` | `gemini-3.6-flash` | Yanıt üretimi |
| `GEMINI_EMBEDDING_MODEL` | `gemini-embedding-001` | Vektörleştirme |
| `CHROMA_PERSIST_DIR` | `./app/data/chroma` | Vektör indeksi dizini |
| `RAG_TOP_K` | `5` | Getirilecek parça sayısı |
| `RAG_MIN_SIMILARITY` | `0.35` | Güven skoru raporlaması için eşik |

### Frontend (`frontend/.env` — şablon: `frontend/.env.example`)

| Değişken | Varsayılan | Açıklama |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Backend'in tam URL'i; build sırasında gömülür |
| `VITE_USE_MOCK` | `false` | Yalnızca bilinçli offline prova için `true`. Açıkken **ağ hatası/timeout** durumunda mock veriye düşer ve ekranda "Demo/mock veri gösteriliyor" uyarısı çıkar; backend gerçek hata (401/403/404/500) dönüyorsa mock'a düşülmez |

---

## Kullanıcı Rolleri ve MVP Gereksinimleri

| Rol | Açıklama |
|---|---|
| **Yarışmacı** | Doğal dille soru sorar, kaynaklı yanıt alır |
| **İçerik Yöneticisi** | Şartname/kılavuz/SSS kaynaklarını yükler, geçerliliğini yönetir (pasife alma dahil) |
| **Destek Ekibi** | İnsana yönlenen soruları devralır, yanıtlar, tekrarlayan konuları SSS havuzuna ekler |
| **Sistem Yöneticisi** | Yanıt kalitesi, insana yönlendirme oranı, sık sorulan konuları izler |

| # | MVP gereksinimi | Karşılandığı yer |
|---|---|---|
| 1 | Doğrulanmış kaynak havuzu | `POST /competitions/{slug}/sources/upload`, `Source` modeli (tür, sürüm, geçerlilik) |
| 2 | RAG tabanlı doğal dil soru-cevap | `app/rag/pipeline.py::answer_question` |
| 3 | Kaynak gösterimi + güven seviyesi | `generation.py` yapılandırılmış çıktısı (`kaynak_belge_id`, `guven_seviyesi`, `can_answer`) |
| 4 | Yarışma/kategori bağlamı | Yarışma başına ayrı Chroma koleksiyonu (`competition_<slug>`) |
| 5 | İnsana yönlendirme | `needs_human` → `POST /api/questions/{id}/destege-gonder` → `/escalations` |
| 6 | Kaynak güncelleme akışı | `PATCH /api/resources/{id}/deactivate` + `vector_store.deactivate_source` |

**Temel akışlar**

- **Akış 1 (Yarışmacı):** Yarışma seçer → soru yazar → kaynaklı yanıt görür → gerekirse destek ister
- **Akış 2 (İçerik Yöneticisi):** Yeni şartname yükler → eski kaynağı pasife alır → bilgi havuzunu günceller
- **Akış 3 (Destek Ekibi):** İnsana yönlenen soruları görür → yanıtlar → tekrarlayan konuyu SSS havuzuna ekler

---

## Teknoloji Yığını ve Gerekçeleri

| Katman | Seçim | Gerekçe |
|---|---|---|
| Backend | **Python + FastAPI** | RAG ekosisteminde (embedding, vektör arama, LLM SDK'ları) en olgun dil; async destek, otomatik Swagger ile hızlı demo |
| Veritabanı | **PostgreSQL + SQLAlchemy** | İlişkisel veri (roller, kaynak metadata, loglar, yarışma/kategori) için endüstri standardı |
| Vektör arama | **ChromaDB** | Sunucu kurulumu gerektirmez, dosya tabanlı persist — MVP ve canlı demo için ideal |
| LLM entegrasyonu | **Google Gemini API** | Ücretsiz kotayla hem embedding hem yanıt üretimi tek sağlayıcıdan |
| RAG orkestrasyon | **Custom (LangChain'siz)** | 4 adımlık akış doğrudan kodda; şeffaf ve hızlı debug |
| Frontend | **React + Vite + TypeScript** | Hızlı kurulum/HMR, geniş ekosistem, düşük öğrenme eğrisi |
| Stil | **Tailwind CSS** | Hızlı prototipleme |
| Veri getirme | **TanStack Query + Axios** | Cache/loading state yönetimi hazır gelir |
| Auth | **JWT (python-jose) + rol bazlı yetkilendirme** | 4 rolün endpoint bazlı erişim kontrolü için yeterli |
| Test | **pytest** (backend) / **vitest** (frontend) | Standart, düşük konfigürasyonlu test araçları |
| Konteyner | **Docker Compose** | Tek komutla tüm sistem; "bende çalışıyor" sorununu ortadan kaldırır |

---

## Proje Yapısı

```
PRAGMA-AI/
├── backend/                  # FastAPI uygulaması
│   ├── app/
│   │   ├── main.py           # FastAPI giriş noktası + CORS
│   │   ├── core/             # config, güvenlik/auth
│   │   ├── api/              # router'lar (auth, sorular, kaynaklar, destek, admin)
│   │   ├── models/           # SQLAlchemy modelleri
│   │   ├── schemas/          # Pydantic şemaları
│   │   ├── services/         # kaynak ingestion, RAG geçidi
│   │   ├── rag/              # loader, chunking, embeddings, retrieval, generation
│   │   └── db/               # session, seed script'leri
│   ├── alembic/              # migrasyonlar
│   ├── tests/
│   ├── Dockerfile            # production imajı (Render/Railway)
│   ├── render.yaml           # Render blueprint (kök dizine kopyalanır)
│   ├── railway.json          # Railway servis yapılandırması
│   └── requirements.txt
├── frontend/                 # React + Vite uygulaması
│   ├── src/
│   │   ├── pages/            # yarışmacı, içerik yöneticisi, destek, admin sayfaları
│   │   ├── components/
│   │   └── api/              # API client (VITE_API_URL)
│   └── .env.example
├── docs/ARCHITECTURE.md
├── docker-compose.yml
├── CHANGELOG.md
└── .env.example
```

---

## Test ve Kalite

```bash
# Backend
cd backend && pytest

# Frontend — tip kontrolü + production build
cd frontend && npm run build
cd frontend && npm run lint
```

`npm run build` önce `tsc -b` (tip kontrolü) sonra `vite build` çalıştırır; dağıtımdan önce
tip hatası olmadığının kanıtı budur.

---

## Bilinen Sınırlar

- **Vektör indeksi kalıcılığı:** Render free plan'da disk kalıcı değil; her deploy'dan sonra
  kaynakların yeniden yüklenmesi gerekir (çözüm: kalıcı disk veya pgvector'a taşıma).
- **Tek instance varsayımı:** Dosya tabanlı Chroma yatay ölçeklemeye uygun değil.
- **Demo hesapları:** `demo1234` şifreli seed hesapları canlı ortamda bırakılmamalı.
- **Güven eşiği kalibrasyonu:** `RAG_MIN_SIMILARITY` küçük bir örneklem üzerinde ayarlandı;
  daha fazla gerçek soru/kaynak çiftiyle yeniden kalibre edilmeli.
- **Gemini kota limiti:** Ücretsiz kotada yoğun demo trafiğinde hız sınırına takılınabilir.

Güncel değişiklik listesi: [`CHANGELOG.md`](CHANGELOG.md)
