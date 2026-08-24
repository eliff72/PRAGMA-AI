import { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import type { User, Role } from "../types";
import { login as apiLogin, logout as apiLogout, register as apiRegister } from "../api/auth";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, demoRole?: Role) => Promise<void>;
  register: (email: string, password: string, fullName: string, role: Role) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("pragma_user");
    if (stored) setUser(JSON.parse(stored));
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string, demoRole?: Role) {
    const { user: u } = await apiLogin(email, password, demoRole);
    localStorage.setItem("pragma_user", JSON.stringify(u));
    setUser(u);
  }

  async function register(email: string, password: string, fullName: string, role: Role) {
    const { user: u } = await apiRegister(email, password, fullName, role);
    localStorage.setItem("pragma_user", JSON.stringify(u));
    setUser(u);
  }

  function logout() {
    apiLogout();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth, AuthProvider içinde kullanılmalı");
  return ctx;
}
