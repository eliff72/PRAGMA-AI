import type { Role } from "../types";

export const ROLE_OPTIONS: { value: Role; label: string; to: string }[] = [
  { value: "yarismaci", label: "Yarışmacı", to: "/sohbet" },
  { value: "icerik_yonetici", label: "İçerik Yöneticisi", to: "/content/kaynaklar" },
  { value: "destek", label: "Destek Ekibi", to: "/destek" },
  { value: "admin", label: "Sistem Yöneticisi", to: "/panel" },
];

/** Backend UserRole enum degerleri (bkz. app/models/enums.py + app/core/roles.py). */
export const ROLE_TO_BACKEND: Record<Role, string> = {
  yarismaci: "competitor",
  icerik_yonetici: "content_manager",
  destek: "support_agent",
  admin: "system_admin",
};

/** ROLE_TO_BACKEND'in tersi — AdminUsersPage kullanici listesinde backend'den
 * gelen role string'ini ("competitor" vb.) okunabilir etikete cevirmek icin. */
export const BACKEND_TO_ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((r) => [ROLE_TO_BACKEND[r.value], r.label])
);
