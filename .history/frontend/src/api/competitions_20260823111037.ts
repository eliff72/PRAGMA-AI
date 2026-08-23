import { apiClient } from "./client";
import type { Competition } from "../types";

export async function fetchCompetitions(): Promise<Competition[]> {
  const { data } = await apiClient.get<Competition[]>("/competitions");
  return data;
}
