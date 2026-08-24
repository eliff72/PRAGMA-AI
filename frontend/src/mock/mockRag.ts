import type { ChatMessage, SourceCitation } from "../types";
import { mockDocuments } from "./data";

const CONFIDENCE_THRESHOLD = 0.62;

// Basit anahtar kelime tabanlı sahte "retrieval" — gerçek backend'de
// bunun yerine embedding + ChromaDB benzerlik araması kullanılacak
// (bkz. backend/app/rag/retrieval.py, README > RAG orkestrasyon).
const KNOWLEDGE_SNIPPETS: Record<string, { text: string; section: string }[]> = {
  "insansiz-hava-araci": [
    {
      text: "İHA'ların azami kalkış ağırlığı 25 kg'ı geçemez; bu sınırı aşan araçlar ön elemeye kabul edilmez.",
      section: "Madde 4.2 — Teknik Sınırlamalar",
    },
    {
      text: "Görev alanına giriş öncesi otonom irtifa tutma testi başarıyla tamamlanmalıdır.",
      section: "Madde 6.1 — Uçuş Güvenliği",
    },
  ],
  roket: [
    {
      text: "Roketin hedef irtifası 3048 metre (10.000 fit) olarak belirlenmiştir; %10 sapma toleransı uygulanır.",
      section: "Madde 3.4 — Uçuş Hedefleri",
    },
    {
      text: "Teknik rapor, ön tasarım incelemesinden (PDR) en az 10 gün önce sisteme yüklenmelidir.",
      section: "Madde 7.1 — Rapor Takvimi",
    },
  ],
  "saglikta-yapay-zeka": [
    {
      text: "Kullanılan veri setleri KVKK ve ilgili etik kurul onayına uygun şekilde anonimleştirilmelidir.",
      section: "Madde 5.3 — Veri Etiği",
    },
  ],
  "egitim-teknolojileri": [
    {
      text: "Final sunumları jüri önünde en fazla 12 dakika sürebilir, soru-cevap bölümü hariçtir.",
      section: "Madde 8.2 — Final Aşaması",
    },
  ],
};

function pseudoScore(question: string, snippetText: string): number {
  const qWords = question.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  const overlap = qWords.filter((w) => snippetText.toLowerCase().includes(w)).length;
  const base = overlap / Math.max(qWords.length, 1);
  // Demo amaçlı: hiç örtüşme yoksa da düşük ama sıfır olmayan bir skor ver
  return Math.min(0.95, Math.max(0.25, base * 1.3 + 0.35));
}

export function mockAskQuestion(
  question: string,
  competitionId: string
): ChatMessage {
  const snippets = KNOWLEDGE_SNIPPETS[competitionId] ?? [];
  const scored = snippets
    .map((s) => ({ ...s, score: pseudoScore(question, s.text) }))
    .sort((a, b) => b.score - a.score);

  const best = scored[0];

  if (!best || best.score < CONFIDENCE_THRESHOLD) {
    const mesaj = "Bu bilgi mevcut kaynaklarda yer almamaktadır.";
    return {
      id: crypto.randomUUID(),
      role: "assistant",
      content: mesaj,
      durum: "kanit_bulunamadi",
      mesaj,
      destegeYonlendirilebilir: true,
      createdAt: new Date().toISOString(),
    };
  }

  const doc = mockDocuments.find((d) => d.competitionId === competitionId && d.isActive);

  const source: SourceCitation = {
    documentId: doc?.id ?? "doc-unknown",
    documentTitle: doc?.title ?? "Bilinmeyen kaynak",
    section: best.section,
    version: doc?.version ?? "-",
    confidence: best.score,
  };

  return {
    id: crypto.randomUUID(),
    role: "assistant",
    content: best.text,
    sources: [source],
    createdAt: new Date().toISOString(),
  };
}
