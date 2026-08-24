import { apiClient, USE_MOCK } from "./client";
import type { User, Role } from "../types";
import { ROLE_TO_BACKEND } from "../constants/roles";

const MOCK_USERS: Record<Role, User> = {
  yarismaci: {
    id: "u-1",
    name: "Elif Aydın",
    email: "elif@takim.dev",
    role: "yarismaci",
  },
  icerik_yonetici: {
    id: "u-2",
    name: "Ahmet Yılmaz",
    email: "ahmet@t3vakfi.org",
    role: "icerik_yonetici",
  },
  destek: {
    id: "u-3",
    name: "Zeynep Kara",
    email: "zeynep@t3vakfi.org",
    role: "destek",
  },
  admin: {
    id: "u-4",
    name: "Mert Çelik",
    email: "mert@t3vakfi.org",
    role: "admin",
  },
};

/** Backend: POST /api/auth/login  { email, password } -> { token, user } */
export async function login(email: string, password: string, demoRole?: Role) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const user = demoRole ? MOCK_USERS[demoRole] : MOCK_USERS.yarismaci;
    const token = `mock-token-${user.role}`;
    localStorage.setItem("pragma_token", token);
    return { token, user };
  }
  const { data } = await apiClient.post<{ token: string; user: User }>(
    "/api/auth/login",
    { email, password }
  );
  localStorage.setItem("pragma_token", data.token);
  return data;
}

/** Backend: POST /api/auth/register  { email, password, full_name, role } -> UserRead (token yok) */
export async function register(email: string, password: string, fullName: string, role: Role) {
  if (USE_MOCK) {
    await new Promise((r) => setTimeout(r, 300));
    const user = MOCK_USERS[role];
    const token = `mock-token-${user.role}`;
    localStorage.setItem("pragma_token", token);
    return { token, user };
  }
  await apiClient.post("/api/auth/register", {
    email,
    password,
    full_name: fullName,
    role: ROLE_TO_BACKEND[role],
  });
  // Register endpoint token dondurmuyor; kayittan sonra ayni bilgilerle giris yapiyoruz.
  return login(email, password, role);
}

export function logout() {
  localStorage.removeItem("pragma_token");
  localStorage.removeItem("pragma_user");
}
