import { apiClient, USE_MOCK } from "./client";
import type { ChatMessage, Escalation } from "../types";
import { mockAskQuestion } from "../mock/mockRag";

/**
 * Backend karşılığı: POST /api/questions  (api/questions.py, README > api/)
 * Beklenen istek gövdesi:  { question: string, competition_id: string }
 * Beklenen yanıt şeması:   ChatMessage (bkz. src/types) — kanıt bulunamazsa
 * backend `durum: "kanit_bulunamadi"` ile döner. Escalation OTOMATİK
 * OLUŞMAZ — kullanıcı onaylarsa sendToSupport() çağrılmalı.
 */
export async function askQuestion(
  question: string,
  competitionId: string
): Promise<ChatMessage> {
  if (USE_MOCK) {
    await delay(500);
    return mockAskQuestion(question, competitionId);
  }

  const { data } = await apiClient.post<ChatMessage>("/api/questions", {
    question,
    competition_id: competitionId,
  });
  return data;
}

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Backend: GET /api/escalations/mine — yarismacinin insana yonlendirilen sorulari + varsa destek cevabi. */
export async function fetchMyEscalations(): Promise<Escalation[]> {
  if (USE_MOCK) return [];
  const { data } = await apiClient.get<Escalation[]>("/api/escalations/mine");
  return data;
}

/** Backend: POST /api/questions/{qaLogId}/destege-gonder — kullanici "kanit_bulunamadi"
 * durumundaki soruyu ONAYLADIGINDA cagrilir; Escalation kaydi BURADA olusur. */
export async function sendToSupport(qaLogId: string): Promise<{ durum: string }> {
  if (USE_MOCK) return { durum: "gonderildi" };
  const { data } = await apiClient.post<{ durum: string }>(`/api/questions/${qaLogId}/destege-gonder`);
  return data;
}
