export interface SourceItem {
  id: string;
  title: string;
  source_type: string;
  status: string;
  version: number;
}

export interface EscalationItem {
  id: string;
  question: string;
  status: string;
  created_at: string;
}

export interface DashboardMetrics {
  escalation_rate: number | null;
  total_questions: number | null;
  top_topics: string[];
}
