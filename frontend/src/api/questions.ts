import { apiClient } from "./client";
import type { AnswerResponse } from "../types";

export async function askQuestion(competitionSlug: string, question: string): Promise<AnswerResponse> {
  const { data } = await apiClient.post<AnswerResponse>(`/competitions/${competitionSlug}/questions`, {
    question,
  });
  return data;
}
