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
