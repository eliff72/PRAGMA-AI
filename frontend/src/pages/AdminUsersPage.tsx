import { useEffect, useState } from "react";
import axios from "axios";
import { AppShell } from "../components/AppShell";
import { createUser, fetchUsers, deleteUser } from "../api/admin";
import type { AdminUser } from "../api/admin";
import { ROLE_OPTIONS, BACKEND_TO_ROLE_LABEL } from "../constants/roles";
import { useAuth } from "../context/AuthContext";
import type { Role } from "../types";

export function AdminUsersPage() {
  const { user: currentUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("yarismaci");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function loadUsers() {
    setUsersLoading(true);
    try {
      const list = await fetchUsers();
      setUsers(list);
    } finally {
      setUsersLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

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
      await loadUsers();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setError(typeof detail === "string" ? detail : "Kullanıcı oluşturulamadı. Bilgileri kontrol edin.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(target: AdminUser) {
    setDeleteError(null);
    setDeleteNotice(null);

    // Bagli kaydi olup olmamasina gore FARKLI onay metni — kullanici "Sil"e
    // basmadan once ne olacagini bilmeli (kalici silme mi, devre disi mi
    // birakilacak). Bu bilgi GET /api/admin/users > has_linked_records'tan gelir.
    const confirmMessage = target.hasLinkedRecords
      ? `"${target.name}" (${target.email}) kalıcı olarak silinemez — geçmişte oluşturduğu kayıtlar (soru, destek talebi, kaynak veya SSS) var. Bunun yerine bu hesap DEVRE DIŞI bırakılacak: artık giriş yapamayacak, ama geçmiş kayıtları korunacak. Devam edilsin mi?`
      : `"${target.name}" (${target.email}) kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?`;
    const confirmed = window.confirm(confirmMessage);
    if (!confirmed) return;

    setDeletingId(target.id);
    try {
      const result = await deleteUser(target.id);
      setDeleteNotice(
        result.mode === "deactivated"
          ? (result.detail ?? `"${target.name}" devre dışı bırakıldı.`)
          : `"${target.name}" kalıcı olarak silindi.`
      );
      await loadUsers();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setDeleteError(typeof detail === "string" ? detail : "Kullanıcı silinemedi.");
    } finally {
      setDeletingId(null);
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

        <h2 className="mt-10 font-display text-lg font-semibold text-[var(--color-ink-900)]">
          Kullanıcılar
        </h2>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Sistemdeki tüm hesaplar. Kendi hesabınızı ve bağlı kaydı olan (soru
          geçmişi, çözdüğü destek talepleri, yüklediği kaynak veya SSS)
          kullanıcıları silemezsiniz.
        </p>

        {deleteError && (
          <p className="mt-3 rounded-md border border-[var(--color-flag-600)]/30 bg-[var(--color-flag-600)]/5 px-3 py-2 text-xs text-[var(--color-flag-600)]">
            {deleteError}
          </p>
        )}
        {deleteNotice && (
          <p className="mt-3 rounded-md border border-[var(--color-success)]/30 bg-[var(--color-success-bg)] px-3 py-2 text-xs font-medium text-[var(--color-success)]">
            {deleteNotice}
          </p>
        )}

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--color-border)] bg-white">
          {usersLoading ? (
            <p className="px-4 py-4 text-sm text-[var(--color-ink-500)]">Yükleniyor...</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-panel)] text-left text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-500)]">
                  <th className="px-4 py-2.5">Ad Soyad</th>
                  <th className="px-4 py-2.5">E-Posta</th>
                  <th className="px-4 py-2.5">Rol</th>
                  <th className="px-4 py-2.5 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  return (
                    <tr key={u.id} className="border-b border-[var(--color-border)] last:border-b-0">
                      <td className="px-4 py-2.5 font-medium text-[var(--color-ink-900)]">
                        {u.name}
                        {isSelf && (
                          <span className="ml-2 rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-ink-500)]">
                            Siz
                          </span>
                        )}
                        {!u.isActive && (
                          <span className="ml-2 rounded-full bg-[var(--color-flag-600)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-flag-700)]">
                            Pasif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-700)]">{u.email}</td>
                      <td className="px-4 py-2.5 text-[var(--color-ink-700)]">
                        {BACKEND_TO_ROLE_LABEL[u.role] ?? u.role}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          disabled={isSelf || deletingId === u.id}
                          onClick={() => handleDelete(u)}
                          title={isSelf ? "Kendi hesabınızı silemezsiniz" : "Kullanıcıyı sil"}
                          className="text-xs font-medium text-[var(--color-flag-600)] hover:underline disabled:cursor-not-allowed disabled:text-[var(--color-ink-300)] disabled:no-underline"
                        >
                          {deletingId === u.id ? "Siliniyor..." : "Sil"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AppShell>
  );
}
