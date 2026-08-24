import { useState } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";
import { ROLE_OPTIONS } from "../constants/roles";

export function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("yarismaci");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await register(email, password, fullName, role);
      const target = ROLE_OPTIONS.find((r) => r.value === role)?.to ?? "/sohbet";
      navigate(target);
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(typeof detail === "string" ? detail : "Kayıt başarısız. Bilgilerinizi kontrol edin.");
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
          <h2 className="mb-5 text-center text-base font-bold text-[var(--color-ink-900)]">Üye Ol</h2>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                Ad Soyad
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Ad Soyad"
                required
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3 py-2.5 text-sm text-[var(--color-ink-900)] outline-none transition-colors placeholder:text-[var(--color-ink-300)] focus:border-[var(--color-navy-700)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                E-Posta
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-posta adresi"
                required
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
                required
                minLength={8}
                className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-3 py-2.5 text-sm text-[var(--color-ink-900)] outline-none transition-colors placeholder:text-[var(--color-ink-300)] focus:border-[var(--color-navy-700)]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                Rol
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
              {submitting ? "Lütfen bekleyiniz..." : "Üye Ol"}
            </button>

            <p className="text-center text-sm text-[var(--color-ink-500)]">
              Zaten hesabınız var mı?{" "}
              <Link to="/giris" className="font-bold text-[var(--color-navy-700)] hover:underline">
                Giriş yapın
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
