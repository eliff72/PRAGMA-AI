import { apiClient, USE_MOCK } from "./client";
import type { Escalation, AnalyticsSummary, Role, User } from "../types";
import { mockEscalations, mockAnalytics } from "../mock/data";
import { ROLE_TO_BACKEND } from "../constants/roles";

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

/** Backend: POST /api/admin/users  { email, password, full_name, role } -> UserRead
 * SADECE system_admin cagirabilir (bkz. app/api/admin.py > require_role). Public
 * /api/auth/register'dan farki: role serbestce secilebilir (4 rolden biri). */
export async function createUser(
  email: string,
  password: string,
  fullName: string,
  role: Role
): Promise<User> {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    return { id: `mock-${Date.now()}`, name: fullName, email, role };
  }
  const { data } = await apiClient.post("/api/admin/users", {
    email,
    password,
    full_name: fullName,
    role: ROLE_TO_BACKEND[role],
  });
  return { id: String(data.id), name: data.full_name, email: data.email, role };
}
