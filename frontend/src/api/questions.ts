import { apiClient } from "./client";
import type { AnswerResponse } from "../types";
import { mockAnswer, mockDelay } from "./mockData";

/**
 * Soruyu backend'e sorar. Backend kapaliysa veya hata verirse mock soru-cevap
 * veri setinden yanit uretir (eslesme yoksa needs_human=true doner).
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
    return data;
  } catch {
    console.warn("[api] /ask erisilemedi — mock yanit kullaniliyor.");
    await mockDelay(700);
    return mockAnswer(competitionSlug, question);
  }
}
