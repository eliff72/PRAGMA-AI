export interface Competition {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
}

export interface SourceCitation {
  source_id: string;
  source_title: string;
  similarity: number;
}

export interface AnswerResponse {
  qa_log_id: number;
  answer: string | null;
  confidence: number;
  needs_human: boolean;
  sources: SourceCitation[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: number;
  sources?: SourceCitation[];
  needsHuman?: boolean;
}
