from pathlib import Path

from pypdf import PdfReader


def load_text(file_path: str) -> str:
    """Yuklenen kaynak dosyasindan (pdf veya duz metin) ham metni cikarir."""
    path = Path(file_path)
    if path.suffix.lower() == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return path.read_text(encoding="utf-8")
