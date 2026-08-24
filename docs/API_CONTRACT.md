# API Sözleşmesi (Frontend Entegrasyon Referansı)

Bu dosya, mock veriden gerçek backend'e geçerken kullanılacak referanstır.
Tüm örnekler gerçek çalışan backend'e atılan gerçek istek/yanıtlardan alınmıştır.

**Base URL (yerel geliştirme):** `http://localhost:8000`

## Nasıl kullanılır

1. `POST /auth/register` ile bir hesap oluştur (rolünü seç: `competitor`,
   `content_manager`, `support_agent`, `system_admin`).
2. `POST /auth/login` ile aynı email/şifre ile giriş yap, dönen `access_token`'ı sakla.
3. Bundan sonraki tüm korumalı isteklerde şu header'ı ekle:
   `Authorization: Bearer <access_token>`
4. Token süresi dolarsa (`401` alırsan) `/auth/login`'i tekrar çağır.
5. Roller endpoint bazlı kısıtlanmıştır — yetkisiz bir rolle istek atarsan `403` alırsın
   (aşağıdaki "Erişim" notlarına bak).

Canlı, interaktif dokümantasyon için backend ayaktayken `http://localhost:8000/docs`
adresini de kullanabilirsin (Swagger UI) — buradaki örnekler onunla birebir tutarlıdır.

---

## İçindekiler

| Endpoint | Method | Erişim |
|---|---|---|
| [`/auth/register`](#post-authregister) | POST | Herkese açık |
| [`/auth/login`](#post-authlogin) | POST | Herkese açık |
| [`/competitions`](#get-competitions) | GET | Herkese açık |
| [`/competitions`](#post-competitions) | POST | Herkese açık (henüz rol kısıtı yok) |
| [`/competitions/{slug}/ask`](#post-competitionsslugask) | POST | Sadece `competitor` |
| [`/competitions/{slug}/sources/upload`](#post-competitionsslugsourcesupload) | POST | Sadece `content_manager` |
| [`/competitions/{slug}/sources`](#get-competitionsslugsources) | GET | `content_manager`, `system_admin` |
| [`/competitions/{slug}/sources/{source_id}/deactivate`](#post-competitionsslugsourcessource_iddeactivate) | POST | `content_manager`, `system_admin` |
| [`/escalations`](#get-escalations) | GET | `support_agent`, `system_admin` |
| [`/escalations/{escalation_id}/answer`](#post-escalationsescalation_idanswer) | POST | `support_agent`, `system_admin` |
| [`/metrics/dashboard`](#get-metricsdashboard) | GET | Sadece `system_admin` |

---

## Bilinen sorun: `sources/upload`'da `title`

`feature/frontend-admin`'in `api/sources.ts`'i `title`'ı multipart form alanı
olarak değil, **query string parametresi** olarak gönderiyor
(`axios.post(url, formData, { params: { title } })`). Bu frontend tarafında
düzeltilmesi gereken bir sorundu, ama backend'i buna göre esnettik: `title`
artık hem form alanından hem query string'den kabul ediliyor (hangisi
doluysa o kullanılır, ikisi de boşsa dosya adı kullanılır). Yani mevcut
frontend-admin kodu **değiştirilmeden** çalışır; yine de yeni kod yazarken
`title`'ı form alanı olarak göndermek (diğer örneklerdeki gibi) önerilir.

---

## `POST /auth/register`

Yeni kullanıcı hesabı oluşturur. Şifre backend'de bcrypt ile hashlenip saklanır.

**URL:** `POST http://localhost:8000/auth/register`

**Header'lar:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "ayse.yilmaz@example.com",
  "password": "GucluSifre123",
  "full_name": "Ayse Yilmaz",
  "role": "competitor"
}
```
`role` şu değerlerden biri olmalı: `competitor`, `content_manager`, `support_agent`, `system_admin`.

**Başarılı response — `201 Created`:**
```json
{
  "id": 7,
  "email": "ayse.yilmaz@example.com",
  "full_name": "Ayse Yilmaz",
  "role": "competitor"
}
```

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Email zaten kayıtlı | `409` | `{"detail": "Bu e-posta ile zaten bir kullanici kayitli"}` | Aynı email ile ikinci kez register denendi |
| Geçersiz `role` değeri | `422` | `{"detail": [{"type": "enum", "loc": ["body", "role"], "msg": "Input should be 'competitor', 'content_manager', 'support_agent' or 'system_admin'", "input": "admin", "ctx": {"expected": "'competitor', 'content_manager', 'support_agent' or 'system_admin'"}}]}` | `role` alanına tanımsız bir string gönderildi |

**Erişim:** Herkese açık, token gerekmez.

---

## `POST /auth/login`

Email/şifre doğrular, JWT access token döner. Token içinde `sub` (user id) ve
`role` claim'leri taşınır — diğer tüm endpoint'lerin yetkilendirmesi bu token'a dayanır.

**URL:** `POST http://localhost:8000/auth/login`

**Header'lar:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "email": "ayse.yilmaz@example.com",
  "password": "GucluSifre123"
}
```

**Başarılı response — `200 OK`:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3IiwiZW1haWwiOiJheXNlLnlpbG1hekBleGFtcGxlLmNvbSIsInJvbGUiOiJjb21wZXRpdG9yIiwiZXhwIjoxNzg3NDMyNjQ4fQ.oV3qBBNJ7jcJqaXkKc_ICt_CusKq54IO5R2q0O-7Pnc",
  "token_type": "bearer"
}
```
Bu token'ı `Authorization: Bearer <access_token>` olarak sakla. Süresi
(`ACCESS_TOKEN_EXPIRE_MINUTES`, varsayılan 60 dakika) dolunca yeniden login gerekir.

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Hatalı email veya şifre | `401` | `{"detail": "Hatali e-posta veya sifre"}` | Kayıt yok veya şifre yanlış |
| Kullanıcı pasif | `401` | `{"detail": "Kullanici pasif durumda"}` | `is_active=false` olan bir hesap |

**Erişim:** Herkese açık, token gerekmez.

---

## `GET /competitions`

Aktif (`is_active=true`) yarışma/kategori listesini döner. Yarışmacının hangi
yarışma için soru sorabileceğini seçtiği ilk ekranda kullanılır.

**URL:** `GET http://localhost:8000/competitions`

**Header'lar:** Yok (public).

**Request body:** Yok.

**Başarılı response — `200 OK`:**
```json
[
  {
    "id": 4,
    "name": "Teknofest Insansi Robot Yarismasi",
    "slug": "insansi-robot",
    "description": "Insansi robot kategorisi sartname ve SSS kaynaklari",
    "is_active": true
  }
]
```
Kayıt yoksa boş dizi (`[]`) döner, hata durumu yoktur.

**Erişim:** Herkese açık, token gerekmez.

---

## `POST /competitions`

Yeni bir yarışma/kategori oluşturur (İçerik Yöneticisi'nin kaynak yükleyebilmesi
için önce bir yarışmanın var olması gerekir).

**URL:** `POST http://localhost:8000/competitions`

**Header'lar:**
```
Content-Type: application/json
```

**Request body:**
```json
{
  "name": "Teknofest Insansi Robot Yarismasi",
  "slug": "insansi-robot",
  "description": "Insansi robot kategorisi sartname ve SSS kaynaklari"
}
```
`description` opsiyoneldir (`null` gönderilebilir veya alan hiç gönderilmeyebilir).

**Başarılı response — `201 Created`:**
```json
{
  "id": 4,
  "name": "Teknofest Insansi Robot Yarismasi",
  "slug": "insansi-robot",
  "description": "Insansi robot kategorisi sartname ve SSS kaynaklari",
  "is_active": true
}
```

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Slug zaten kullanımda | `409` | `{"detail": "Bu slug zaten kullanımda"}` | Aynı `slug` ile ikinci yarışma oluşturulmaya çalışıldı |

**Erişim:** Şu an için herkese açık — task kapsamında bu endpoint için rol kısıtı
istenmedi. İleride muhtemelen `content_manager`/`system_admin` ile sınırlanacaktır,
frontend'in bunu sabit/varsayım olarak kodlamaması önerilir.

---

## `POST /competitions/{slug}/ask`

Yarışmacının serbest metinli sorusunu RAG pipeline'ına (embed → ChromaDB'de en
yakın kaynak parçalarını bul → yeterli benzerlik varsa Gemini ile kaynaklı yanıt
üret) gönderir. Yeterli kanıt yoksa `needs_human=true` döner ve otomatik olarak
destek ekibine bir escalation kaydı açılır.

**URL:** `POST http://localhost:8000/competitions/{slug}/ask`
(örnek: `POST http://localhost:8000/competitions/insansi-robot/ask`)

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: competitor)
Content-Type: application/json
```

**Request body:**
```json
{
  "question": "Robotun agirlik siniri kac kilogramdir?"
}
```

**Başarılı response — `201 Created` (yeterli kanıt var, yanıt üretildi):**
```json
{
  "qa_log_id": 12,
  "answer": "Robotun ağırlık sınırı en fazla **15 kilogram** olmalıdır.\n\n**Kaynak:** Insansi Robot Sartnamesi v1",
  "confidence": 0.5110753235497061,
  "needs_human": false,
  "sources": [
    {
      "source_id": 8,
      "source_title": "Insansi Robot Sartnamesi v1",
      "similarity": 0.5110753235497061
    }
  ]
}
```

**Başarılı response — `201 Created` (yetersiz kanıt, insana yönlendirme):**
```json
{
  "qa_log_id": 13,
  "answer": null,
  "confidence": 0.11222928656359632,
  "needs_human": true,
  "sources": []
}
```
`needs_human=true` olduğunda frontend, kullanıcıya "sorunuz destek ekibine
yönlendirildi" gibi bir mesaj göstermeli; `answer` her zaman `null` olur.

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Token geçerli ama rol `competitor` değil (örn. `content_manager` bu endpoint'i çağırdı) |
| Yarışma bulunamadı | `404` | `{"detail": "Yarışma bulunamadı: olmayan-yarisma"}` | `{slug}` yolundaki yarışma DB'de yok |

**Erişim:** Sadece `competitor` rolü.

---

## `POST /competitions/{slug}/sources/upload`

İçerik Yöneticisi'nin bir kaynak (şartname/kılavuz/SSS) PDF'ini yüklemesini
sağlar. Dosya metne çevrilir, parçalanır (chunk), embed edilip ChromaDB'ye ve
PostgreSQL'e (`sources` + `source_chunks`) kaydedilir.

**URL:** `POST http://localhost:8000/competitions/{slug}/sources/upload`
(örnek: `POST http://localhost:8000/competitions/insansi-robot/sources/upload`)

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: content_manager)
Content-Type: multipart/form-data
```

**Request body (`multipart/form-data` alanları):**

| Alan | Tip | Zorunlu | Açıklama |
|---|---|---|---|
| `file` | dosya (PDF) | Evet | Yüklenecek kaynak dosyası |
| `title` | string | Hayır | Kaynağın görünen adı; boş bırakılırsa dosya adı kullanılır |
| `source_type` | string | Hayır | `specification` (varsayılan), `guide` veya `faq` |

Örnek (`curl` ile, tarayıcıda bu bir `<form>` / `FormData` gönderimine denk gelir):
```
POST /competitions/insansi-robot/sources/upload
Content-Type: multipart/form-data; boundary=...

--...
Content-Disposition: form-data; name="file"; filename="sartname.pdf"
Content-Type: application/pdf

<binary pdf içeriği>
--...
Content-Disposition: form-data; name="title"

Insansi Robot Sartnamesi v1
--...--
```

**Başarılı response — `201 Created`:**
```json
{
  "source_id": 8,
  "title": "Insansi Robot Sartnamesi v1",
  "chunk_count": 1
}
```
`chunk_count`, belgenin kaç parçaya bölünüp embed edildiğini gösterir (kısa
belgelerde 1 olması normaldir).

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Token geçerli ama rol `content_manager` değil (örn. `competitor` bu endpoint'i çağırdı) |
| Yarışma bulunamadı | `404` | `{"detail": "Yarışma bulunamadı: olmayan-yarisma"}` | `{slug}` yolundaki yarışma DB'de yok |

**Erişim:** Sadece `content_manager` rolü.

---

## `GET /competitions/{slug}/sources`

Bir yarışmaya yüklenmiş tüm kaynakları (aktif + pasif) listeler.

**URL:** `GET http://localhost:8000/competitions/{slug}/sources`
(örnek: `GET http://localhost:8000/competitions/insansi-robot/sources`)

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: content_manager veya system_admin)
```

**Request body:** Yok.

**Başarılı response — `200 OK`:**
```json
[
  {
    "id": 8,
    "title": "Insansi Robot Sartnamesi v1",
    "source_type": "specification",
    "status": "active",
    "version": 1,
    "uploaded_by": "Mehmet Kaya",
    "uploaded_at": "2026-08-22T20:04:26.680297Z"
  },
  {
    "id": 10,
    "title": "Query Param Testi",
    "source_type": "specification",
    "status": "inactive",
    "version": 1,
    "uploaded_by": "Main Test CM",
    "uploaded_at": "2026-08-24T05:29:27.566181Z"
  }
]
```
Kaynak yoksa boş dizi (`[]`) döner.

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Rol `content_manager`/`system_admin` değil |
| Yarışma bulunamadı | `404` | `{"detail": "Yarışma bulunamadı: olmayan-yarisma"}` | `{slug}` yolundaki yarışma DB'de yok |

**Erişim:** `content_manager`, `system_admin`.

---

## `POST /competitions/{slug}/sources/{source_id}/deactivate`

Bir kaynağı pasife alır (`status=inactive`) — silinmez, denetlenebilirlik için
DB'de kalır. Aynı zamanda o kaynağın chunk'larını ChromaDB koleksiyonundan
siler, böylece bundan sonraki sorularda kaynak olarak kullanılmaz.

**URL:** `POST http://localhost:8000/competitions/{slug}/sources/{source_id}/deactivate`
(örnek: `POST http://localhost:8000/competitions/insansi-robot/sources/10/deactivate`)

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: content_manager veya system_admin)
```

**Request body:** Yok.

**Başarılı response — `200 OK`:**
```json
{
  "id": 10,
  "title": "Query Param Testi",
  "source_type": "specification",
  "status": "inactive",
  "version": 1,
  "uploaded_by": "Main Test CM",
  "uploaded_at": "2026-08-24T05:29:27.566181Z"
}
```

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Rol `content_manager`/`system_admin` değil |
| Kaynak veya yarışma bulunamadı | `404` | `{"detail": "Kaynak bulunamadı: 999"}` / `{"detail": "Yarışma bulunamadı: olmayan-yarisma"}` | `{slug}` veya `{source_id}` geçersiz |

**Erişim:** `content_manager`, `system_admin`.

---

## `GET /escalations`

Henüz yanıtlanmamış (`status=open`) tüm escalation'ları (insana yönlenen
sorular) yarışma adı ve tarihle birlikte listeler.

**URL:** `GET http://localhost:8000/escalations`

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: support_agent veya system_admin)
```

**Request body:** Yok.

**Başarılı response — `200 OK`:**
```json
[
  {
    "id": 9,
    "question": "Dunyanin nufusu kactir?",
    "competition_name": "Teknofest Insansi Robot Yarismasi",
    "status": "open",
    "created_at": "2026-08-24T05:30:03.181313Z"
  }
]
```
Bekleyen soru yoksa boş dizi (`[]`) döner.

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Rol `support_agent`/`system_admin` değil |

**Erişim:** `support_agent`, `system_admin`.

---

## `POST /escalations/{escalation_id}/answer`

Destek ekibinin bir escalation'ı yanıtlamasını sağlar — `status=resolved`
yapılır, yanıtlayan kullanıcı `assigned_to_id` olarak kaydedilir.
`add_to_faq=true` gönderilirse aynı soru/cevap `faq_entries` tablosuna da
eklenir (SSS havuzuna terfi — kaynak havuzuna embed edilmesi ayrı, ileride
yapılacak bir adımdır, bkz. `FAQEntry` model docstring'i).

**URL:** `POST http://localhost:8000/escalations/{escalation_id}/answer`
(örnek: `POST http://localhost:8000/escalations/9/answer`)

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: support_agent veya system_admin)
Content-Type: application/json
```

**Request body:**
```json
{
  "answer": "Bu soru yarismayla ilgili degil, dunya nufusu guncel kaynaklardan takip edilebilir.",
  "add_to_faq": true
}
```
`add_to_faq` opsiyoneldir, varsayılan `false`'tur.

**Başarılı response — `200 OK`:**
```json
{
  "id": 9,
  "question": "Dunyanin nufusu kactir?",
  "competition_name": "Teknofest Insansi Robot Yarismasi",
  "status": "resolved",
  "created_at": "2026-08-24T05:30:03.181313Z"
}
```

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Rol `support_agent`/`system_admin` değil |
| Escalation bulunamadı | `404` | `{"detail": "Escalation bulunamadı: 999"}` | `{escalation_id}` geçersiz |

**Erişim:** `support_agent`, `system_admin`.

---

## `GET /metrics/dashboard`

Sistem Yöneticisi izleme paneli: toplam soru sayısı, insana yönlendirme
oranı (0-1 arası kesir — yüzdeye çevirmek için `×100`), ve en sık soru
sorulan yarışma kategorileri (azalan sırada, soru sayısına göre).

**URL:** `GET http://localhost:8000/metrics/dashboard`

**Header'lar:**
```
Authorization: Bearer <access_token>   (rol: system_admin)
```

**Request body:** Yok.

**Başarılı response — `200 OK`:**
```json
{
  "total_questions": 13,
  "escalation_rate": 0.46153846153846156,
  "top_topics": [
    "Teknofest Insansi Robot Yarismasi",
    "Main Dogrulama Yarismasi 2",
    "Teknofest Test Yarismasi",
    "Main Dogrulama Yarismasi"
  ]
}
```
Hiç soru sorulmamışsa `escalation_rate: null`, `total_questions: 0`,
`top_topics: []` döner.

**Hata durumları:**

| Durum | Kod | Örnek body | Sebep |
|---|---|---|---|
| Token yok/geçersiz | `401` | `{"detail": "Not authenticated"}` | `Authorization` header'ı eksik veya token bozuk/süresi dolmuş |
| Yetkisiz rol | `403` | `{"detail": "Bu islem icin yetkiniz yok"}` | Rol `system_admin` değil |

**Erişim:** Sadece `system_admin` rolü.
