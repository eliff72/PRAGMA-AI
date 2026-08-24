import { apiClient } from "./client";
import type { AnswerResponse } from "../types";
import { mockAnswer, mockDelay } from "./mockData";
import { isBackendUnreachable, isMockFallbackEnabled } from "./fallbackGuard";
import { setUsingMock } from "./mockFallbackState";

/**
 * Soruyu backend'e sorar. VITE_ENABLE_MOCK_FALLBACK=true ise ve backend'e
 * GERCEKTEN ulasilamiyorsa (ag hatasi/timeout) mock soru-cevap veri
 * setinden yanit uretir. Backend ayakta ama gercek bir hata donuyorsa
 * (401/403/404/500 — orn. token suresi dolmus, yarisma bulunamadi, Gemini
 * kota hatasi) bu sessizce maskelenmez; hata oldugu gibi yukari firlatilir.
 */
export async function askQuestion(
  competitionSlug: string,
  question: string,
): Promise<AnswerResponse> {
  try {
    const { data } = await apiClient.post<AnswerResponse>(
      `/competitions/${competitionSlug}/ask`,
      { question },
    );
    setUsingMock(false);
    return data;
  } catch (error) {
    if (isMockFallbackEnabled() && isBackendUnreachable(error)) {
      console.warn(
        "[api] /ask'a ulaşılamadı (backend kapalı olabilir) — VITE_ENABLE_MOCK_FALLBACK=true olduğu için mock yanıt kullanılıyor.",
      );
      setUsingMock(true);
      await mockDelay(700);
      return mockAnswer(competitionSlug, question);
    }
    throw error;
  }
}
