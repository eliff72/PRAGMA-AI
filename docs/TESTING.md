# Test Altyapısı

## Backend — pytest

```bash
cd backend
pytest
```

- `tests/conftest.py` — ortak `client` fixture'ı (`TestClient(app)`)
- Dosya adlandırma: `test_<modül>.py`
- OpenAI/ChromaDB'ye gerçek ağ çağrısı yapan kodun (embedding, generation)
  birim testleri, API'yi gerçekten çağırmadan test edilebilecek şekilde
  yazılmalı (ör. sadece saf fonksiyonları test et — `chunking.py` örneği gibi —
  ya da `unittest.mock` ile `_client` nesnesini mockla). CI'da `OPENAI_API_KEY`
  sahte bir değerle set edilir, gerçek istek atılmaz.

## Frontend — Vitest + React Testing Library

```bash
cd frontend
npm run test
```

- Konfigürasyon `vite.config.ts` içindeki `test` bloğunda; kurulum dosyası
  `src/test/setup.ts` (jest-dom matcher'ları)
- Dosya adlandırma: `<Bileşen>.test.tsx`, bileşenin yanına konur
- Örnek: `src/App.test.tsx`

## CI

`.github/workflows/ci.yml` — her push/PR'da backend (`pytest`) ve frontend
(`vitest`) testlerini paralel job'larda çalıştırır. Bir PR, ilgili testler
geçmeden main'e alınmamalı.

## Branch bazlı sorumluluk

Her feature branch kendi eklediği kodun testini kendi içinde taşır
(`feature/backend-rag` → chunking testi, `feature/backend-api` → auth/rol
testleri). Bu branch (`feature/testing`) yalnızca ortak altyapıyı
(fixture, config, CI) kurar.
