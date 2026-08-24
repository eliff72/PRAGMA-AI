import axios from "axios";

/** VITE_ENABLE_MOCK_FALLBACK varsayilan KAPALI; sadece bilincli olarak
 * "true" string'ine set edildiginde (offline prova icin) mock fallback
 * devreye girer. */
export function isMockFallbackEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_MOCK_FALLBACK === "true";
}

/** Backend'e gercekten ulasilamadi mi (ag hatasi/timeout — axios'ta
 * error.response yok) yoksa backend ayakta ama gercek bir hata mi dondu
 * (401/403/404/500... — error.response var) ayirt eder. Sadece ilkinde
 * mock'a dusulmeli; ikincisi gercek bir hatadir, UI'da gosterilmeli,
 * sessizce mock'a maskelenmemelidir. */
export function isBackendUnreachable(error: unknown): boolean {
  return axios.isAxiosError(error) && !error.response;
}
