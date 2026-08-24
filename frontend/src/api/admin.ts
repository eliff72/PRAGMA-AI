import { apiClient, USE_MOCK } from "./client";
import type { Escalation, AnalyticsSummary } from "../types";
import { mockEscalations, mockAnalytics } from "../mock/data";

/** Backend: GET /api/escalations */
export async function fetchEscalations(): Promise<Escalation[]> {
  if (USE_MOCK) return mockEscalations;
  const { data } = await apiClient.get<Escalation[]>("/api/escalations");
  return data;
}

/** Backend: POST /api/escalations/{id}/resolve  { answer: string } */
export async function resolveEscalation(id: string, answer: string): Promise<void> {
  if (USE_MOCK) {
    const esc = mockEscalations.find((e) => e.id === id);
    if (esc) {
      esc.status = "cozuldu";
      esc.answer = answer;
    }
    return;
  }
  await apiClient.post(`/api/escalations/${id}/resolve`, { answer });
}

/** Backend: POST /api/escalations/{id}/add-to-faq */
export async function addEscalationToFaq(id: string): Promise<void> {
  if (USE_MOCK) return;
  await apiClient.post(`/api/escalations/${id}/add-to-faq`);
}

/** Backend: GET /api/analytics */
export async function fetchAnalytics(): Promise<AnalyticsSummary> {
  if (USE_MOCK) return mockAnalytics;
  const { data } = await apiClient.get<AnalyticsSummary>("/api/analytics");
  return data;
}
