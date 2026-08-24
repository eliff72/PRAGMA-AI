import { apiClient } from "./client";
import type { EscalationItem } from "../types/admin";

export async function fetchOpenEscalations(): Promise<EscalationItem[]> {
  const { data } = await apiClient.get<EscalationItem[]>("/escalations");
  return data;
}

export async function answerEscalation(escalationId: string, answer: string, addToFaq: boolean): Promise<void> {
  await apiClient.post(`/escalations/${escalationId}/answer`, { answer, add_to_faq: addToFaq });
}
