import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";

// NOT: Kullanici (yarisci) sayfalari feature/frontend-user, yonetim panelleri
// feature/frontend-admin branch'lerinde "/sorular" ve "/admin/*" altinda eklenecek.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
    </Routes>
  );
}
