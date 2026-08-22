# PRAGMA-AI

## TEKNOFEST — Yapay Zeka Destekli SSS ve Chatbot Asistanı

Yarışmacıların sorularını yalnızca doğrulanmış, güncel kaynaklardan (şartname, kılavuz, onaylı
SSS) yanıtlayan, **RAG (Retrieval-Augmented Generation)** tabanlı bir asistan. Sistem serbest
ifadeyle sorulan soruları anlar, ilgili kaynak parçasını bulur, kaynağını göstererek yanıt verir;
yeterli kanıt yoksa yanıt uydurmaz, insana yönlendirir.

## Kullanıcı Rolleri

| Rol | Açıklama |
|---|---|
| **Yarışmacı** | Doğal dille soru sorar, kaynaklı yanıt alır |
| **İçerik Yöneticisi** | Şartname/kılavuz/SSS kaynaklarını sisteme yükler, geçerliliğini yönetir (eski kaynağı pasife alma dahil) |
| **Destek Ekibi** | Sistemin yanıtlayamadığı/insana yönlenen soruları devralır, yanıtlar, tekrarlayan konuları SSS havuzuna ekler |
| **Sistem Yöneticisi** | Yanıt kalitesi, insana yönlendirme oranı, sık sorulan konuları izler |

## MVP Zorunlu Gereksinimler

1. **Doğrulanmış kaynak havuzu** — şartname, kılavuz, SSS yüklenir; kaynak adı ve geçerlilik bilgisi tutulur
2. **RAG tabanlı doğal dil soru-cevap** — serbest ifadeli soru, ilgili kaynak parçalarından yanıtlanır
3. **Kaynak gösterimi ve güven seviyesi** — her yanıt hangi belgeye dayandığını gösterir, yeterli kanıt yoksa kesin yanıt verilmez
4. **Yarışma/kategori bağlamı** — kullanıcı ilgili yarışmayı seçer, arama sadece o kaynaklarda yapılır
5. **İnsana yönlendirme mekanizması** — destek ekibine devir
6. **Kaynak güncelleme akışı** — yeni belge yükleme, eski belgeyi pasife alma

## Temel Akışlar

- **Akış 1 (Yarışmacı):** Yarışma seçer → soru yazar → kaynaklı yanıt görür → gerekirse destek ister
- **Akış 2 (İçerik Yöneticisi):** Yeni şartname yükler → eski kaynağı pasife alır → bilgi havuzunu günceller
- **Akış 3 (Destek Ekibi):** İnsana yönlenen soruları görür → yanıtlar → tekrarlayan yeni konuyu SSS havuzuna ekler

Daha fazla teknik detay için bkz. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Teknoloji Yığını

| Katman | Seçim | Gerekçe |
|---|---|---|
| Backend | **Python + FastAPI** | RAG ekosisteminde (embedding, vektör arama, LLM SDK'ları) en olgun dil; async destek, otomatik Swagger dokümantasyonu ile hızlı demo |
| Veritabanı | **PostgreSQL + SQLAlchemy** | İlişkisel veri (roller, kaynak metadata, loglar, yarışma/kategori) için endüstri standardı, Docker ile 1 komutla ayağa kalkar |
| Vektör arama | **ChromaDB** | Sunucu kurulumu gerektirmez, pip ile 2 dakikada kurulur, dosya tabanlı persist — MVP ve canlı demo için ideal |
| LLM entegrasyonu | **Google Gemini API** (embedding + chat) | Ücretsiz kotası olan tek sağlayıcıdan hem embedding (gemini-embedding-001) hem yanıt üretimi (gemini-3.6-flash), MVP/hackathon bütçesine uygun |
| RAG orkestrasyon | **Custom (LangChain'siz)** | Hackathon temposunda ekip için şeffaf, debug edilebilir, minimal soyutlama — 4 adım (chunk → embed → retrieve → generate) doğrudan kodda |
| Frontend | **React + Vite + TypeScript** | Hızlı kurulum/HMR, geniş ekosistem, ekibin öğrenme eğrisi düşük |
| Stil | **Tailwind CSS** | Hızlı prototipleme, ayrı CSS dosyası yönetimi gerektirmez |
| Veri getirme | **TanStack Query + Axios** | Basit, cache/loading state yönetimini elle yazmaya gerek bırakmaz |
| Auth | **JWT (python-jose) + rol bazlı yetkilendirme** | 4 farklı rolün endpoint bazlı erişim kontrolü için yeterli, ekstra servis gerektirmez |
| Test | **pytest** (backend) / **vitest** (frontend) | Her iki ekosistemin standart, düşük konfigürasyonlu test araçları |
| Konteyner | **Docker Compose** | 4 kişilik ekipte "bende çalışıyor" sorununu ortadan kaldırır, tek komutla (`docker compose up`) tüm sistem ayağa kalkar |

## Proje Yapısı

```
PRAGMA-AI/
├── backend/                # FastAPI uygulaması
│   ├── app/
│   │   ├── main.py         # FastAPI giriş noktası
│   │   ├── core/           # config, güvenlik/auth
│   │   ├── api/            # router'lar (auth, sorular, kaynaklar, admin)
│   │   ├── models/         # SQLAlchemy modelleri
│   │   ├── schemas/        # Pydantic şemaları
│   │   ├── rag/            # ingestion, chunking, embedding, retrieval, generation
│   │   └── db/             # DB session/engine
│   ├── tests/
│   └── requirements.txt
├── frontend/                # React + Vite uygulaması
│   └── src/
│       ├── pages/           # yarışmacı ve admin sayfaları
│       ├── components/
│       └── api/             # API client
├── docs/
│   └── ARCHITECTURE.md
├── docker-compose.yml
└── .env.example
```

## Branch Yapısı

Görev dağılımı branch bazlı yapılır; her branch main'den türetilir ve kendi kapsamındaki
iskelet/özellikleri içerir:

| Branch | Kapsam |
|---|---|
| `feature/backend-rag` | RAG pipeline: kaynak işleme (chunking), embedding, vektör arama, güven skoru |
| `feature/backend-api` | API endpoint'leri, roller, auth (JWT) |
| `feature/frontend-user` | Yarışmacı soru-cevap arayüzü |
| `feature/frontend-admin` | İçerik yöneticisi ve destek ekibi panelleri |
| `feature/database` | Veritabanı şeması: kaynaklar, roller, loglar, yarışma/kategori |
| `feature/testing` | Test altyapısı (pytest + vitest) |

## Hızlı Başlangıç

```bash
cp .env.example .env      # değerleri doldurun (özellikle GEMINI_API_KEY)
docker compose up --build
```

- Backend: http://localhost:8000/health — Swagger: http://localhost:8000/docs
- Frontend: http://localhost:5173

Docker olmadan yerel geliştirme:

```bash
# Backend
cd backend
python -m venv .venv && .venv\Scripts\activate   # Windows
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```
