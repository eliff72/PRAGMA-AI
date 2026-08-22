# Veritabanı Şeması

Bkz. `docs/ARCHITECTURE.md` (main) — "Veri Modeli" bölümü için genel özet.

## Kurulum

```bash
cd backend
alembic revision --autogenerate -m "init schema"
alembic upgrade head
python -m app.db.seed   # örnek yarışma verisi
```

## Tablolar

- `users` — rol bilgisiyle (`UserRole`: competitor / content_manager / support_agent / system_admin)
- `competitions` — yarışma/kategori bağlamı
- `sources` / `source_chunks` — kaynak belgeleri ve embed edilmiş parçaları (vektörün kendisi ChromaDB'de)
- `qa_logs` / `qa_source_refs` — soru-cevap kayıtları ve dayandıkları kaynak referansları
- `escalations` — insana yönlendirilen sorular
- `faq_entries` — destek ekibinin onayladığı yeni SSS girdileri
