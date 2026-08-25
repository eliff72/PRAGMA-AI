# Changelog

## [2026-08-25]

### Düzeltildi
- FAQ eşleştirmede yanlış-pozitif sorunu giderildi (eşik kalibrasyonu:
  char_ratio ve token_overlap birlikte değerlendiriliyor)
- sources tablosunda status/superseded_by_id tutarsızlığı DB seviyesinde
  CHECK constraint ile engellendi

### Eklendi
- İçerik yöneticisi artık kategori seçip doğrudan soru havuzuna manuel
  soru-cevap ekleyebiliyor (POST /api/support/faq/manual-entry)
- SSS kayıtları pasife alınabiliyor (PATCH /api/support/faq/{id}/deactivate)

### Bilinen Eksik
- Kaynak gösterimi + güven seviyesi (can_answer/güven_seviyesi) mantığı
  Gemini API kota kısıtı nedeniyle canlı test edilemedi. Yeni key
  sağlandığında öncelikli olarak doğrulanmalı.
- Bir kaynağı yeni versiyonla "supersede etme" (superseded_by_id set eden)
  bir API endpoint'i henüz yazılmadı; sadece DB seviyesinde tutarlılık
  garantisi (CHECK constraint) var.
