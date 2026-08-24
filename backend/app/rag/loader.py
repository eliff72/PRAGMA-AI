from pathlib import Path

from docx import Document
from pypdf import PdfReader


def load_text(file_path: str) -> str:
    """Yuklenen kaynak dosyasindan (pdf, docx veya duz metin) ham metni cikarir."""
    path = Path(file_path)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    if suffix == ".docx":
        document = Document(str(path))
        return "\n".join(paragraph.text for paragraph in document.paragraphs)
    return path.read_text(encoding="utf-8")
