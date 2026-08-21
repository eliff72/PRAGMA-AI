import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./AuthContext";

interface Props {
  allowedRoles?: string[];
}

export default function ProtectedRoute({ allowedRoles }: Props) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/admin/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/admin" replace />;

  return <Outlet />;
}
