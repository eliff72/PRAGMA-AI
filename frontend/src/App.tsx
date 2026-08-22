import { Route, Routes } from "react-router-dom";
import CompetitionSelectPage from "./pages/user/CompetitionSelectPage";
import ChatPage from "./pages/user/ChatPage";

// NOT: Yonetim panelleri feature/frontend-admin branch'inde "/admin/*" altinda eklenecek.

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<CompetitionSelectPage />} />
      <Route path="/sorular" element={<CompetitionSelectPage />} />
      <Route path="/sorular/:competitionSlug" element={<ChatPage />} />
    </Routes>
  );
}
