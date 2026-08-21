from app.rag.chunking import chunk_text


def test_empty_text_returns_no_chunks():
    assert chunk_text("") == []


def test_short_text_returns_single_chunk():
    chunks = chunk_text("Kisa bir sartname metni.", chunk_size=800, overlap=150)
    assert chunks == ["Kisa bir sartname metni."]


def test_long_text_splits_with_overlap():
    text = "".join(str(i % 10) for i in range(2000))  # her karakter konumuna gore benzersiz desen
    chunks = chunk_text(text, chunk_size=800, overlap=150)
    assert len(chunks) > 1
    # ilk chunk'in sonu ile ikinci chunk'in basi ortusmeli (overlap)
    assert chunks[0][-150:] == chunks[1][:150]
