import type { Competition } from "../types";
import { mockCompetitions } from "./questions";

// NOT: API_CONTRACT.md hazır olunca gerçek endpoint'e (apiClient.get("/competitions"))
// geri dönülecek — Rol 1 ile birlikte.
export async function fetchCompetitions(): Promise<Competition[]> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return mockCompetitions;
}
