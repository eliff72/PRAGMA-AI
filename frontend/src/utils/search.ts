const TR_MAP: Record<string, string> = {
  İ: "i",
  I: "i",
  ı: "i",
  Ş: "s",
  ş: "s",
  Ğ: "g",
  ğ: "g",
  Ü: "u",
  ü: "u",
  Ö: "o",
  ö: "o",
  Ç: "c",
  ç: "c",
};

/** Turkce karakterleri (buyuk/kucuk fark etmeksizin) ASCII karsiliklarina indirger,
 * boylece "iha" araması "İHA" gecen metinlerle de eslesir. */
export function normalizeTr(text: string): string {
  return text
    .split("")
    .map((ch) => TR_MAP[ch] ?? ch)
    .join("")
    .toLowerCase();
}

export function matchesSearch(text: string, query: string): boolean {
  if (!query.trim()) return true;
  return normalizeTr(text).includes(normalizeTr(query));
}

/** Yarışma adından URL-güvenli slug türetir (ör. "Teknofest İHA" -> "teknofest-iha").
 * Sadece varsayılan değer üretir; kullanıcı formda serbestçe düzenleyebilir. */
export function slugify(text: string): string {
  return normalizeTr(text)
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
