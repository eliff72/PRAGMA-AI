# Yönetim Panelleri

## İçerik Yöneticisi — `SourcesPage` (Akış 2)

Yarışma slug'ı girilir → o yarışmaya ait kaynaklar listelenir
(`GET /competitions/{slug}/sources`) → yeni kaynak yüklenir
(`POST /.../sources/upload`) → eski kaynak "Pasife al" ile
(`POST /.../sources/{id}/deactivate`) pasife alınır.

## Destek Ekibi — `EscalationsPage` (Akış 3)

Açık escalation'lar listelenir (`GET /escalations`), her kart kendi yanıt
taslağını tutar (`EscalationCard`), yanıtlanınca "SSS havuzuna ekle"
işaretliyse backend tarafında `FAQEntry` oluşturulması beklenir
(`POST /escalations/{id}/answer`, `add_to_faq`).

## Sistem Yöneticisi — `DashboardPage`

`GET /metrics/dashboard`'dan insana yönlendirme oranı, toplam soru sayısı ve
sık sorulan konular gösterilir.

## Auth ve rol koruması

`src/auth/AuthContext.tsx` — JWT'yi `localStorage`'da tutar, `role` claim'ini
token'dan (imza doğrulaması yapmadan, sadece UI gösterimi için) çözer. Gerçek
yetkilendirme her zaman backend'de (`require_role`) yapılır — frontend'deki
`ProtectedRoute` sadece kullanıcı deneyimini iyileştirir (yetkisiz sayfaya
girmeye çalışan kullanıcıyı yönlendirir).

## Bağımlılık

`feature/backend-api` merge edilmeden `/auth/login` ve panel endpoint'leri
çalışmaz — bu normaldir, backend merge sonrası aktif olur.
