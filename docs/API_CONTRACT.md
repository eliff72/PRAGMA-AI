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
