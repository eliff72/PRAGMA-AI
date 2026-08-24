import { apiClient, USE_MOCK } from "./client";
import type { FAQEntry } from "../types";

/** Backend: GET /api/support/faq?kategori_id=&arama= — icerik yoneticisinin
 * soru-cevap havuzu (category_faq / FAQEntry) ekrani icin. */
export async function fetchFaq(kategoriId?: string, arama?: string): Promise<FAQEntry[]> {
  if (USE_MOCK) return [];
  const { data } = await apiClient.get<FAQEntry[]>("/api/support/faq", {
    params: {
      kategori_id: kategoriId || undefined,
      arama: arama || undefined,
    },
  });
  return data;
}
