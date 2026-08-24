import { apiClient } from "./client";
import type { SourceItem } from "../types/admin";

export async function fetchSources(competitionSlug: string): Promise<SourceItem[]> {
  const { data } = await apiClient.get<SourceItem[]>(`/competitions/${competitionSlug}/sources`);
  return data;
}

export async function uploadSource(competitionSlug: string, title: string, file: File): Promise<void> {
  const formData = new FormData();
  formData.append("file", file);
  await apiClient.post(`/competitions/${competitionSlug}/sources/upload`, formData, {
    params: { title },
    headers: { "Content-Type": "multipart/form-data" },
  });
}

export async function deactivateSource(competitionSlug: string, sourceId: string): Promise<void> {
  await apiClient.post(`/competitions/${competitionSlug}/sources/${sourceId}/deactivate`);
}
