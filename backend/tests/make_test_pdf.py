"""RAG akisi manuel testi icin, harici bir PDF-yazma kutuphanesi olmadan
(gecerli, pypdf ile okunabilen) minimal bir PDF dosyasi uretir.

Kullanim: python tests/make_test_pdf.py <cikis_yolu.pdf>
"""

import sys


def _escape(text: str) -> str:
    return text.replace("\\", r"\\").replace("(", r"\(").replace(")", r"\)")


LINES = [
    "TEKNOFEST Insansi Robot Yarismasi - Sartname (Test Belgesi)",
    "",
    "1. Basvuru son tarihi 15 Eylul 2026'dir.",
    "2. Takim uyelerinin yas sinirlari 18 ile 25 arasindadir.",
    "3. Final yarismasi Ankara'da duzenlenecektir.",
    "4. Robotun agirligi en fazla 15 kilogram olmalidir.",
    "5. Her takim en fazla 6 kisiden olusabilir.",
    "6. Yarisma suresince robotun pil degisimi yapilamaz.",
]


def build_pdf() -> bytes:
    content_lines = ["BT", "/F1 12 Tf", "72 740 Td", "14 TL"]
    for i, line in enumerate(LINES):
        op = "Td" if i == 0 else "T*"
        if i == 0:
            content_lines.append(f"({_escape(line)}) Tj")
        else:
            content_lines.append("T*")
            content_lines.append(f"({_escape(line)}) Tj")
    content_lines.append("ET")
    content_stream = "\n".join(content_lines).encode("latin-1")

    objects: list[bytes] = []
    objects.append(b"<< /Type /Catalog /Pages 2 0 R >>")
    objects.append(b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>")
    objects.append(
        b"<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> "
        b"/MediaBox [0 0 612 792] /Contents 5 0 R >>"
    )
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    objects.append(
        b"<< /Length " + str(len(content_stream)).encode() + b" >>\nstream\n"
        + content_stream
        + b"\nendstream"
    )

    out = bytearray()
    out += b"%PDF-1.4\n"
    offsets = [0]
    for i, obj in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{i} 0 obj\n".encode()
        out += obj
        out += b"\nendobj\n"

    xref_offset = len(out)
    n = len(objects) + 1
    out += f"xref\n0 {n}\n".encode()
    out += b"0000000000 65535 f \n"
    for off in offsets[1:]:
        out += f"{off:010d} 00000 n \n".encode()

    out += b"trailer\n"
    out += f"<< /Size {n} /Root 1 0 R >>\n".encode()
    out += b"startxref\n"
    out += f"{xref_offset}\n".encode()
    out += b"%%EOF"

    return bytes(out)


if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "test_source.pdf"
    with open(out_path, "wb") as f:
        f.write(build_pdf())
    print(f"yazildi: {out_path}")
