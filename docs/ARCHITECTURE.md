# Mimari Notları

## RAG Akışı

```
[Yarışma/Kategori seç] → [Soru (serbest metin)]
        │
        ▼
  Embedding (OpenAI)
        │
        ▼
  ChromaDB'de benzerlik araması
  (yalnızca seçili yarışmanın koleksiyonu/filtresi içinde)
        │
        ▼
  En iyi eşleşme(ler) eşik değerin (RAG_MIN_SIMILARITY) üstünde mi?
        │
   ┌────┴────┐
  Hayır      Evet
   │          │
   ▼          ▼
"İnsana     LLM ile kaynak parçalarına dayalı yanıt üret
yönlendir"  + kaynak adı/bölümü + güven seviyesi döndür
```

Kanıt yetersizse LLM'e serbest yanıt ürettirilmez; doğrudan destek ekibine
yönlendirme akışı tetiklenir (MVP gereksinim #3 ve #5).

## Kaynak Yaşam Döngüsü (İçerik Yöneticisi)

1. Yeni belge yüklenir (şartname/kılavuz/SSS) → `status=active`, `version` atanır
2. Belge chunk'lanır, embed edilir, ilgili yarışma/kategoriye bağlı koleksiyona yazılır
3. Güncelleme geldiğinde eski belge `status=inactive` yapılır (silinmez — denetlenebilirlik için)
4. Arama ve yanıt üretimi yalnızca `status=active` kaynaklar üzerinden çalışır

## Rol Bazlı Erişim

Roller (`competitor`, `content_manager`, `support_agent`, `system_admin`) JWT içindeki
`role` claim'i ile taşınır; `feature/backend-api` branch'inde FastAPI dependency'leri
(`Depends(require_role(...))`) ile endpoint bazlı yetkilendirme yapılır.

## Veri Modeli (özet — detay `feature/database` branch'inde)

- `competitions` — yarışma/kategori tanımları
- `sources` — kaynak dosyaları (ad, tür, versiyon, status: active/inactive)
- `source_chunks` — kaynağın parçalanmış metinleri + vektör referansı
- `users` — rol bilgisiyle birlikte
- `qa_logs` — sorulan soru, verilen yanıt, güven skoru, kaynak referansları
- `escalations` — insana yönlendirilen sorular, destek ekibi yanıtı, durum
- `faq_entries` — destek ekibinin tekrarlayan konulardan ürettiği onaylı SSS
