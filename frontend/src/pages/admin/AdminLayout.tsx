import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { to: "/admin/kaynaklar", label: "Kaynaklar", roles: ["content_manager", "system_admin"] },
  { to: "/admin/destek", label: "Destek Kuyruğu", roles: ["support_agent", "system_admin"] },
  { to: "/admin/izleme", label: "İzleme Paneli", roles: ["system_admin"] },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="w-56 border-r border-slate-200 bg-white p-4">
        <p className="mb-4 text-xs font-medium uppercase text-slate-400">PRAGMA-AI Yönetim</p>
        <nav className="space-y-1">
          {NAV_ITEMS.filter((item) => !user || item.roles.includes(user.role)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm ${
                  isActive ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="mt-6 text-xs text-slate-400 hover:text-slate-600">
          Çıkış yap ({user?.email})
        </button>
      </aside>
      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
