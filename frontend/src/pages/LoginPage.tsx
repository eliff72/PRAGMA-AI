import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { ROLE_OPTIONS } from "../constants/roles";

export function LoginPage() {
  const [tab, setTab] = useState<"eposta" | "telefon">("eposta");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [role, setRole] = useState<Role>("yarismaci");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email || "demo@t3vakfi.org", password || "demo", role);
      const target = ROLE_OPTIONS.find((r) => r.value === role)?.to ?? "/sohbet";
      navigate(target);
    } catch {
      setError("Giriş başarısız. Bilgilerinizi kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 flex flex-col items-center text-center">
          <img
            src="https://cdn.t3kys.com/static/assets/media/logos/favicon.png"
            alt="T3 KYS Logo"
            className="mb-3 h-16 w-auto object-contain"
          />
          <h1 className="font-display text-lg font-semibold text-[var(--color-ink-900)]">
            Kurumsal Yönetim Sistemi
          </h1>
          <p className="mt-1 text-sm text-[var(--color-ink-500)]">Türkiye Teknoloji Takımı</p>
        </div>

        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7 shadow-sm">
          <div className="mb-5 text-center">
            <Link
              to="/kayit"
              className="inline-block rounded-md bg-[var(--color-navy-900)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            >
              Uye Ol
            </Link>
          </div>

          <div className="flex gap-1 rounded-lg bg-[var(--color-flag-50)] p-1 text-sm">
            <button
              type="button"
              onClick={() => setTab("eposta")}
              className={`flex-1 rounded-md py-2 font-semibold transition-colors ${
                tab === "eposta"
                  ? "bg-[var(--color-flag-600)] text-white"
                  : "text-[var(--color-flag-700)] hover:bg-white/50"
              }`}
            >
              E-Posta ile Giris
            </button>
            <button
              type="button"
              onClick={() => setTab("telefon")}
              className={`flex-1 rounded-md py-2 font-semibold transition-colors ${
                tab === "telefon"
                  ? "bg-[var(--color-flag-600)] text-white"
                  : "text-[var(--color-flag-700)] hover:bg-white/50"
              }`}
            >
              Telefon ile Giris
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                {tab === "eposta" ? "E-Posta" : "Telefon Numarasi"}
              </label>
              <input
                type={tab === "eposta" ? "email" : "tel"}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={tab === "eposta" ? "E-posta adresi" : "05xx xxx xx xx"}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3 py-2.5 text-sm text-[var(--color-ink-900)] outline-none transition-colors placeholder:text-[var(--color-ink-300)] focus:border-[var(--color-navy-700)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                Parola
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Parola"
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3 py-2.5 text-sm text-[var(--color-ink-900)] outline-none transition-colors placeholder:text-[var(--color-ink-300)] focus:border-[var(--color-navy-700)]"
              />
            </div>

            <div className="flex items-center justify-between">
              <a href="#" className="text-sm font-bold text-[var(--color-success)] hover:underline">
                Sifremi unuttum
              </a>
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-ink-700)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[var(--color-border)] accent-[var(--color-flag-600)]"
                />
                Beni Hatirla
              </label>
            </div>

            <div className="rounded-md border border-dashed border-[var(--color-border)] bg-[var(--color-bg-panel)] p-3">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-500)]">
                Demo Rolu (yalnizca mock mod)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink-900)] outline-none focus:border-[var(--color-navy-700)]"
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-xs text-[var(--color-flag-600)]">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="mt-1 rounded-md bg-[var(--color-flag-600)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 hover:bg-[var(--color-flag-700)] disabled:opacity-50"
            >
              {submitting ? "Lutfen bekleyiniz..." : "Giris Yap"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
