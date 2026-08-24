import { createContext, useContext, useState, type ReactNode } from "react";
import { apiClient } from "../api/client";

interface AuthUser {
  id: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function decodeToken(token: string): AuthUser | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const token = localStorage.getItem("access_token");
    return token ? decodeToken(token) : null;
  });

  async function login(email: string, password: string) {
    const { data } = await apiClient.post<{ access_token: string }>("/auth/login", { email, password });
    localStorage.setItem("access_token", data.access_token);
    setUser(decodeToken(data.access_token));
  }

  function logout() {
    localStorage.removeItem("access_token");
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider icinde kullanilmali");
  return ctx;
}
