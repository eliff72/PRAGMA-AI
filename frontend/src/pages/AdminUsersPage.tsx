import { useState } from "react";
import axios from "axios";
import { AppShell } from "../components/AppShell";
import { createUser } from "../api/admin";
import { ROLE_OPTIONS } from "../constants/roles";
import type { Role } from "../types";

export function AdminUsersPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("yarismaci");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      const user = await createUser(email, password, fullName, role);
      setSuccess(`"${user.name}" (${ROLE_OPTIONS.find((r) => r.value === role)?.label}) oluşturuldu.`);
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("yarismaci");
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(typeof detail === "string" ? detail : "Kullanıcı oluşturulamadı. Bilgileri kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Kullanıcı Oluştur
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          İstediğiniz rolde yeni bir kullanıcı hesabı açın. Genel "Üye Ol" formu
          sadece Yarışmacı kaydı açar — diğer roller yalnızca buradan oluşturulabilir.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-6 flex flex-col gap-4 rounded-xl border border-[var(--color-border)] bg-white p-6"
        >
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
          {success && <p className="text-xs font-semibold text-[var(--color-success)]">{success}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="mt-1 rounded-md bg-[var(--color-navy-900)] px-4 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Oluşturuluyor..." : "Kullanıcı Oluştur"}
          </button>
        </form>
      </div>
    </AppShell>
  );
}
