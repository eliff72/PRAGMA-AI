# API Katmani

## Roller ve Auth

JWT tabanli auth (`app/core/security.py`, bcrypt sifre hash + HS256 JWT).
`app/api/auth.py`:

- `POST /auth/register` — email, password, full_name, role (`competitor`,
  `content_manager`, `support_agent`, `system_admin`) alir; sifreyi hashleyip
  gercek `users` tablosuna kaydeder. Ayni email ile kayit varsa 409 doner.
- `POST /auth/login` — email/password dogrular, basariliysa `sub` (user id) ve
  `role` claim'lerini iceren bir JWT doner.

`app/api/deps.py`:

- `get_current_user` — `Authorization: Bearer <token>` header'indaki JWT'yi
  dogrulayip `sub` claim'inden gercek `User` satirini DB'den okur (bulunamazsa
  veya `is_active=False` ise 401).
- `require_role(*roles: UserRole)` — dependency factory; kullanicinin rolu
  verilenler arasinda degilse 403 doner.

## Korunan endpoint'ler

| Endpoint | Zorunlu rol |
|---|---|
| `POST /competitions/{slug}/ask` | `competitor` |
| `POST /competitions/{slug}/sources/upload` | `content_manager` |

`POST /competitions` (yarisma olusturma) su an icin acik — task kapsaminda rol
kisitlamasi istenmedi.

## Entegrasyon notu

Bu katman artik `feature/database` ve `feature/backend-rag` ile tam entegre
calisir: RAG cagrisi dogrudan `app.rag.pipeline.answer_question` /
`app.rag.ingestion.ingest_document` uzerinden yapilir, kullanicilar gercek
`users` tablosunda tutulur. Erken donemde bu branch'i tek basina
calistirabilmek icin kullanilan gecici in-memory demo kullanicilar ve
`app/services/rag_gateway.py` fallback'i artik gerekli degil (ikincisi
`feature/backend-rag` merge sonrasi kullanilmiyor, ama dokunulmadan birakildi).
