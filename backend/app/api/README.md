# API Katmani

## Roller ve Auth

JWT tabanli auth (`app/core/security.py`). Token'daki `role` claim'i ile
`app/api/deps.py` icindeki `require_role(*roles)` dependency'si endpoint bazli
yetkilendirme yapar. Roller: `competitor`, `content_manager`, `support_agent`,
`system_admin` (bkz. `feature/database` -> `app/models/enums.py::UserRole`).

`/auth/login` su an icin in-memory demo kullanicilar uzerinden calisir (4 rol
icin birer hesap, sifre: `demo1234`) — `feature/database` merge edildiginde
gercek `User` tablosuna baglanacak (bkz. dosyadaki TODO).

## Router'lar → Akislarla eslesme

| Router | Akis | Roller |
|---|---|---|
| `competitions.py` | Akis 1 (yarisma secimi) | tum roller |
| `questions.py` | Akis 1 (soru-cevap) | tum roller |
| `sources.py` | Akis 2 (kaynak yukleme/pasife alma) | content_manager, system_admin |
| `escalations.py` | Akis 3 (destek devri) | support_agent, system_admin |
| `metrics.py` | Sistem Yoneticisi izleme | system_admin |

## Entegrasyon noktalari

Bu branch, henuz merge edilmemis `feature/database` ve `feature/backend-rag`
branch'lerine dogrudan bagimli degil:

- Veritabani islemleri her router'da `TODO(feature/database)` ile isaretlendi.
- RAG cagrisi `app/services/rag_gateway.py` uzerinden yapiliyor; bu dosya
  `app.rag.pipeline` mevcut degilse (merge edilmediyse) guvenli bir fallback
  donuyor, merge sonrasi otomatik gercek pipeline'a gecer.

Boylece branch tek basina calisir/test edilir, merge sirasinda sadece TODO'lar
gercek DB sorgulariyla degistirilir.
