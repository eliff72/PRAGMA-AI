export interface Competition {
  id: string;
  name: string;
  slug: string;
}

export interface SourceCitation {
  source_id: string;
  source_title: string;
  similarity: number;
}

export interface AnswerResponse {
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
