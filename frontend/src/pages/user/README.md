# Yarışmacı Arayüzü (Akış 1)

`CompetitionSelectPage` → `ChatPage` akışını uygular, gerçek backend'e bağlıdır
(bkz. kök `docs/API_CONTRACT.md`):

1. Yarışmacı `/` üzerinde bir yarışma seçer (`GET /competitions`)
2. `/sorular/:competitionSlug` üzerinde serbest metinle soru yazar
   (`POST /competitions/{slug}/ask`)
3. Yanıt geldiğinde:
   - `needs_human=false` ise: yanıt metni + güven seviyesi rozeti + kaynak
     etiketleri (`ConfidenceBadge`, `SourceList`) gösterilir
   - `needs_human=true` ise: "yeterli kaynak yok" uyarısı gösterilir — destek
     ekibine yönlendirme backend tarafında otomatik yapılır (ayrı bir "destek
     iste" butonuna gerek yok)

## Auth

`/ask` endpoint'i sadece `competitor` rolüyle çağrılabilir. Bu branch'te henüz
gerçek bir login ekranı yok; `api/auth.ts` sabit bir demo competitor hesabıyla
(`demo.competitor@pragma.ai`) otomatik login yapar — yoksa önce register eder,
sonra login olup token'ı `localStorage`'a (`access_token`) yazar.
`api/client.ts`'teki axios interceptor'ı her istekte bu token'ı otomatik
`Authorization: Bearer <token>` header'ı olarak ekler. Gerçek bir login/kayıt
ekranı eklendiğinde `api/auth.ts`'teki `DEMO_CREDENTIALS` ve
`registerDemoUser` kaldırılıp gerçek kullanıcı girişine bağlanabilir.

## Bağımlılık

Backend ayakta değilse veya `.env`'de `GEMINI_API_KEY` geçersizse istekler
hata döner; `CompetitionSelectPage` ve `ChatPage` bu durumu kullanıcıya
gösterir (`isError`/`notFound` durumları ele alınıyor).
