import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function ProtectedRoute({
  allow,
  children,
}: {
  allow: Role[];
  children: ReactNode;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) return null;
  if (!user) return <Navigate to="/giris" replace />;
  if (!allow.includes(user.role)) return <Navigate to="/giris" replace />;

  return <>{children}</>;
}
