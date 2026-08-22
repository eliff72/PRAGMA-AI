# Yarışmacı Arayüzü (Akış 1)

`CompetitionSelectPage` → `ChatPage` akışını uygular:

1. Yarışmacı `/` üzerinde bir yarışma seçer (`GET /competitions`)
2. `/sorular/:competitionSlug` üzerinde serbest metinle soru yazar
   (`POST /competitions/{slug}/questions`)
3. Yanıt geldiğinde:
   - `needs_human=false` ise: yanıt metni + güven seviyesi rozeti + kaynak
     etiketleri (`ConfidenceBadge`, `SourceList`) gösterilir
   - `needs_human=true` ise: "yeterli kaynak yok" uyarısı gösterilir — destek
     ekibine yönlendirme backend tarafında otomatik yapılır (kullanıcının ayrı
     bir "destek iste" butonuna basmasına gerek yok, bkz. `feature/backend-api`
     `questions.py` TODO)

## Bağımlılık

`feature/backend-api` merge edilmeden `GET /competitions` ve
`POST /.../questions` 404/bağlantı hatası verir — bu normal, backend merge
sonrası çalışır hale gelir. UI, `isError` durumunu zaten ele alıyor.
