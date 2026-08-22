# RAG Pipeline

Akış: `loader` → `chunking` → `embeddings` → `vector_store` (yazma) ve
`retrieval` → `generation` (okuma). Uçtan uca giriş noktaları `pipeline.py`
içinde: `ingest_document(...)` ve `answer_question(...)`.

Bilinçli olarak LangChain gibi bir orkestrasyon kütüphanesi kullanılmadı —
4 adımlık akış (chunk → embed → retrieve → generate) küçük ve doğrudan kodda
okunabilir olduğunda, hackathon temposunda debug etmek framework soyutlamasından
daha hızlı. Bkz. kök `README.md` teknoloji tablosu.

## Yarışma bazlı izolasyon (MVP #4)

Her yarışma kendi ChromaDB koleksiyonunda (`competition_<slug>`) tutulur;
`retrieve()` yalnızca ilgili koleksiyonda arama yapar.

## Güven eşiği (MVP #3)

`RAG_MIN_SIMILARITY` (bkz. `.env.example`) altında kalan sorgularda LLM'e hiç
gidilmez; `RAGAnswer.needs_human=True` döner ve `answer=None` olur.

Gemini `gemini-embedding-001` ile yapılan gerçek testte (bkz. commit mesajı /
PR açıklaması) alakalı bir soru ~0.51, alakasız bir soru ~0.11 benzerlik skoru
aldı — bu yüzden varsayılan `0.35` yapıldı. Bu ilk kalibrasyon küçük bir örnek
üzerinde; `feature/backend-api` ve `feature/frontend-user` ile birlikte daha
fazla gerçek soru/kaynak çiftiyle yeniden ayarlanmalı.

## Kaynak pasife alma (MVP #6)

`vector_store.deactivate_source(competition_slug, source_id)` — İçerik
Yöneticisi eski kaynağı pasife aldığında çağrılır, o kaynağın chunk'larını
koleksiyondan siler.

## Bağımlılıklar

Bu modül kasıtlı olarak `feature/database` branch'indeki SQLAlchemy
modellerine bağımlı değil (dataclass tabanlı kendi `schemas.py`'ı var) —
böylece iki branch birbirini beklemeden paralel geliştirilebilir. Entegrasyon
`feature/backend-api`'de: DB'den `Source` okunur → `ingest_document` çağrılır.
