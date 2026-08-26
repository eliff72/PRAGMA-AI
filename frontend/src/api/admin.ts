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

/** AdminUsersPage'in listede gosterdigi zenginlestirilmis kullanici — temel
 * User'a is_active ve has_linked_records eklenir (bkz. app/schemas/auth.py > UserRead). */
export interface AdminUser extends User {
  isActive: boolean;
  hasLinkedRecords: boolean;
}

function backendRoleToRole(role: string): Role {
  return (Object.entries(ROLE_TO_BACKEND).find(([, backend]) => backend === role)?.[0] ?? "yarismaci") as Role;
}

/** Backend: GET /api/admin/users -> UserRead[]. SADECE system_admin cagirabilir. */
export async function fetchUsers(): Promise<AdminUser[]> {
  if (USE_MOCK) return [];
  const { data } = await apiClient.get<
    { id: number; email: string; full_name: string; role: string; is_active: boolean; has_linked_records: boolean }[]
  >("/api/admin/users");
  return data.map((u) => ({
    id: String(u.id),
    name: u.full_name,
    email: u.email,
    role: backendRoleToRole(u.role),
    isActive: u.is_active,
    hasLinkedRecords: u.has_linked_records,
  }));
}

/** DELETE /api/admin/users/{id}'in gercekte ne yaptigini anlatir — bagli kaydi
 * olmayan kullanici kalici silinir (204), bagli kaydi olan kullanici sadece
 * devre disi birakilir (200 + aciklama), gecmis kayitlari korunur (bkz.
 * app/api/admin.py > delete_user, "isten ayrilma" benzetmesi). */
export interface DeleteUserResult {
  mode: "deleted" | "deactivated";
  detail?: string;
}

export async function deleteUser(id: string): Promise<DeleteUserResult> {
  if (USE_MOCK) return { mode: "deleted" };
  const res = await apiClient.delete(`/api/admin/users/${id}`);
  if (res.status === 204) return { mode: "deleted" };
  return { mode: "deactivated", detail: res.data?.detail };
}
