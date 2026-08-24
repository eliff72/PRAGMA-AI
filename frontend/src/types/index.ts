export type Role = "yarismaci" | "icerik_yonetici" | "destek" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface Competition {
  id: string;
  name: string;
  description: string;
}

export interface SourceCitation {
  documentId: string;
  documentTitle: string;
  section: string;
  version: string;
  confidence: number; // 0-1
  documentUrl?: string | null;
}

export type ConfidenceLevel = "yuksek" | "orta" | "dusuk";

export type AnswerStatus = "cevaplandi" | "kanit_bulunamadi";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  createdAt: string;
  confidenceLevel?: ConfidenceLevel | null;
  durum?: AnswerStatus;
  mesaj?: string | null;
  destegeYonlendirilebilir?: boolean;
  // Frontend-only: backend'den gelmez, mesaj olusturulurken (o an secili
  // kategori) client tarafinda eklenir — "Sartnameyi Gor" linkinin dogru
  // kategoriye gitmesi icin (bkz. ChatBubble.tsx).
  competitionId?: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  competitionId: string;
  version: string;
  isActive: boolean;
  uploadedAt: string;
  uploadedBy: string;
  sourceUrl?: string | null;
}

export interface DocumentChunk {
  id: string;
  content: string;
  chunkIndex: string;
}

export interface Escalation {
  id: string;
  question: string;
  competitionName: string;
  askedBy: string;
  status: "bekliyor" | "cozuldu";
  createdAt: string;
  answer?: string;
}

export interface FAQEntry {
  id: string;
  competitionId: string;
  competitionName: string;
  question: string;
  answer: string;
  source: string;
  createdAt: string;
}

export interface ConfidenceDistribution {
  yuksek: number;
  orta: number;
  dusuk: number;
}

export interface CategoryEscalation {
  competitionName: string;
  totalQuestions: number;
  escalatedCount: number;
  escalationRate: number; // 0-1
}

export interface AnalyticsSummary {
  totalQuestions: number;
  escalationRate: number; // 0-1
  avgConfidence: number; // 0-1
  topTopics: { topic: string; count: number }[];
  dbStatus: "ok" | "down";
  aiServiceStatus: "ok" | "not_configured";
  questionsLast24h: number;
  openTicketsCount: number;
  totalCompetitions: number;
  totalSpecifications: number;
  confidenceDistribution: ConfidenceDistribution;
  escalationByCategory: CategoryEscalation[];
}
