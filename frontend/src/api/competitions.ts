import { apiClient } from "./client";
import type { Competition } from "../types";
import { mockCompetitions, mockDelay } from "./mockData";
import { isBackendUnreachable, isMockFallbackEnabled } from "./fallbackGuard";
import { setUsingMock } from "./mockFallbackState";

/**
 * Backend'den yarisma listesini ceker. VITE_ENABLE_MOCK_FALLBACK=true ise ve
 * backend'e GERCEKTEN ulasilamiyorsa (ag hatasi/timeout) mock veriye duser.
 * Backend ayakta ama hata donuyorsa (401/403/404/500) veya bos liste
 * donuyorsa bu GERCEK bir durumdur — mock'a dusulmez, hata/bos liste oldugu
 * gibi UI'ya yansitilir.
 */
export async function fetchCompetitions(): Promise<Competition[]> {
  try {
    const { data } = await apiClient.get<Competition[]>("/competitions");
    setUsingMock(false);
    return data;
  } catch (error) {
    if (isMockFallbackEnabled() && isBackendUnreachable(error)) {
      console.warn(
        "[api] /competitions'a ulaşılamadı (backend kapalı olabilir) — VITE_ENABLE_MOCK_FALLBACK=true olduğu için mock veri kullanılıyor.",
      );
      setUsingMock(true);
      await mockDelay(300);
      return mockCompetitions;
    }
    throw error;
  }
}
