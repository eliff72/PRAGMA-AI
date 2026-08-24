import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { CompetitorChatPage } from "./pages/CompetitorChatPage";
import { MyEscalationsPage } from "./pages/MyEscalationsPage";
import { RequirementsPage } from "./pages/RequirementsPage";
import { ContentUploadPage } from "./pages/ContentUploadPage";
import { ContentFaqPage } from "./pages/ContentFaqPage";
import { SupportQueuePage } from "./pages/SupportQueuePage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/giris" element={<LoginPage />} />
          <Route path="/kayit" element={<RegisterPage />} />

          <Route
            path="/sohbet"
            element={
              <ProtectedRoute allow={["yarismaci"]}>
                <CompetitorChatPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sorularim"
            element={
              <ProtectedRoute allow={["yarismaci"]}>
                <MyEscalationsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sartname"
            element={
              <ProtectedRoute allow={["yarismaci"]}>
                <RequirementsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/kaynaklar"
            element={
              <ProtectedRoute allow={["icerik_yonetici"]}>
                <ContentUploadPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/content/soru-havuzu"
            element={
              <ProtectedRoute allow={["icerik_yonetici"]}>
                <ContentFaqPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/destek"
            element={
              <ProtectedRoute allow={["destek"]}>
                <SupportQueuePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/panel"
            element={
              <ProtectedRoute allow={["admin"]}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/giris" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
