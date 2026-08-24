import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import LoginPage from "./pages/admin/LoginPage";
import AdminLayout from "./pages/admin/AdminLayout";
import SourcesPage from "./pages/admin/SourcesPage";
import EscalationsPage from "./pages/admin/EscalationsPage";
import DashboardPage from "./pages/admin/DashboardPage";

// NOT: Yarismaci sayfalari feature/frontend-user branch'inde "/" ve "/sorular/*" altinda eklenecek.
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/admin/login" element={<LoginPage />} />

        <Route path="/admin" element={<ProtectedRoute />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="kaynaklar" replace />} />

            <Route element={<ProtectedRoute allowedRoles={["content_manager", "system_admin"]} />}>
              <Route path="kaynaklar" element={<SourcesPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["support_agent", "system_admin"]} />}>
              <Route path="destek" element={<EscalationsPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["system_admin"]} />}>
              <Route path="izleme" element={<DashboardPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
