def chunk_text(text: str, chunk_size: int = 800, overlap: int = 150) -> list[str]:
    """Metni kaba karakter tabanli, kaydirmali pencere ile parcalara ayirir.

    Basit tutuldu: token-bazli/semantik chunking yerine karakter penceresi kullanildi
    (harici tokenizer bagimliligi olmadan hizli MVP). Gerekirse ileride
    (paragraf/baslik farkinali) daha akilli bir splitter ile degistirilebilir.
    """
    text = text.strip()
    if not text:
        return []

    chunks: list[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        if end == len(text):
            break
        start = end - overlap
    return chunks
