import { apiClient } from "./client";
import type { Competition } from "../types";
import { mockCompetitions, mockDelay } from "./mockData";

/**
 * Backend'den yarisma listesini ceker. Backend kapaliysa, hata verirse veya
 * bos liste donerse mock veriye duser; boylece arayuz her kosulda test edilebilir.
 */
export async function fetchCompetitions(): Promise<Competition[]> {
  try {
    const { data } = await apiClient.get<Competition[]>("/competitions");
    if (Array.isArray(data) && data.length > 0) return data;
    console.warn("[api] /competitions bos dondu — mock veri kullaniliyor.");
  } catch {
    console.warn("[api] /competitions erisilemedi — mock veri kullaniliyor.");
  }

  await mockDelay(300);
  return mockCompetitions;
}
