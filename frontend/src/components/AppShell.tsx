import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

const ROLE_LABEL: Record<Role, string> = {
  yarismaci: "Yarışmacı",
  icerik_yonetici: "İçerik Yöneticisi",
  destek: "Destek Ekibi",
  admin: "Sistem Yöneticisi",
};

const NAV_BY_ROLE: Record<Role, { to: string; label: string }[]> = {
  yarismaci: [
    { to: "/sohbet", label: "Soru Sor" },
    { to: "/sorularim", label: "Yönlendirilen Sorularım" },
    { to: "/sartname", label: "Yarışma Şartnamesi" },
  ],
  icerik_yonetici: [
    { to: "/content/kaynaklar", label: "Kaynak Ekleme" },
    { to: "/content/soru-havuzu", label: "Soru Havuzu" },
  ],
  destek: [{ to: "/destek", label: "Yönlendirilen Sorular" }],
  admin: [
    { to: "/panel", label: "Analitik Panel" },
    { to: "/panel/kullanicilar", label: "Kullanıcı Oluştur" },
  ],
};

export function AppShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      <aside className="flex h-full w-64 shrink-0 flex-col justify-between overflow-y-auto border-r border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-6">
        <div>
          <div className="mb-8 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-bg-panel)] p-1">
              <img
                src="https://cdn.t3kys.com/static/assets/media/logos/favicon.png"
                alt="T3"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <p className="font-display text-[15px] font-semibold leading-none text-[var(--color-ink-900)]">
                PRAGMA-AI
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-widest text-[var(--color-ink-500)]">
                TEKNOFEST SSS Asistanı
              </p>
            </div>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_BY_ROLE[user.role].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${isActive
                    ? "bg-[var(--color-flag-50)] text-[var(--color-flag-700)]"
                    : "text-[var(--color-ink-700)] hover:bg-[var(--color-bg-panel)]"
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="border-t border-[var(--color-border)] pt-4">
          <p className="text-sm font-medium text-[var(--color-ink-900)]">{user.name}</p>
          <p className="text-[11px] text-[var(--color-ink-500)]">{ROLE_LABEL[user.role]}</p>
          <button
            onClick={logout}
            className="mt-3 w-full rounded-md border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-ink-700)] transition-colors hover:bg-[var(--color-bg-panel)]"
          >
            Çıkış yap
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}


