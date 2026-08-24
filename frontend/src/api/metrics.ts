import { apiClient } from "./client";
import type { DashboardMetrics } from "../types/admin";

export async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const { data } = await apiClient.get<DashboardMetrics>("/metrics/dashboard");
  return data;
}
