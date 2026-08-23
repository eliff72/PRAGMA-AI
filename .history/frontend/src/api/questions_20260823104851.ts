// Mock veri ve API çağrı mantığı — gerçek backend hazır olunca burası değişecek

import type { Competition, SourceCitation, AnswerResponse } from "../types";

interface MockQA {
  keywords: string[];
  answer: string;
  sources: SourceCitation[];
  confidence: number;
}

// --- Mock yarışmalar ---
export const mockCompetitions: Competition[] = [
  {
    id: "iha",
    slug: "iha",
    name: "İnsansız Hava Aracı (İHA)",
    description: "Otonom görev yapabilen insansız hava araçları yarışması.",
  },
  {
    id: "roket",
    slug: "roket",
    name: "Roket Yarışması",
    description: "Model roket tasarım ve fırlatma yarışması.",
  },
  {
    id: "saglik-ai",
    slug: "saglik-ai",
    name: "Sağlıkta Yapay Zeka",
    description: "Sağlık verileriyle çalışan yapay zeka çözümleri yarışması.",
  },
  {
    id: "su-alti",
    slug: "su-alti",
    name: "Su Altı Sistemleri",
    description: "Otonom su altı araçları tasarım yarışması.",
  },
];

// --- Mock soru-cevap veri seti (slug'a göre) ---
const mockQA: Record<string, MockQA[]> = {
  iha: [
    {
      keywords: ["ağırlık", "kilo", "kg"],
      answer: "Şartnameye göre İHA'nın azami kalkış ağırlığı 25 kg'dır.",
      sources: [
        {
          source_id: "iha-sartname-v3-4.2",
          source_title: "İHA Şartnamesi v3 — Madde 4.2",
          similarity: 0.92,
        },
      ],
      confidence: 0.92,
    },
    {
      keywords: ["takım", "üye", "kaç kişi"],
      answer:
        "Bir takım en fazla 6 üyeden oluşabilir, en az 1 danışman zorunludur.",
      sources: [
        {
          source_id: "iha-sartname-v3-2.1",
          source_title: "İHA Şartnamesi v3 — Madde 2.1",
          similarity: 0.88,
        },
      ],
      confidence: 0.88,
    },
    {
      keywords: ["başvuru", "tarih", "son gün"],
      answer:
        "Başvurular ilgili yarışma takviminde belirtilen son tarihe kadar sistem üzerinden yapılmalıdır.",
      sources: [
        {
          source_id: "iha-kilavuz-takvim",
          source_title: "İHA Kılavuzu — Takvim",
          similarity: 0.8,
        },
      ],
      confidence: 0.8,
    },
  ],
  roket: [
    {
      keywords: ["irtifa", "yükseklik", "metre"],
      answer:
        "Roketin hedef irtifası kategoriye göre değişmekle birlikte genellikle 3000 metredir.",
      sources: [
        {
          source_id: "roket-sartname-3.1",
          source_title: "Roket Şartnamesi — Madde 3.1",
          similarity: 0.85,
        },
      ],
      confidence: 0.85,
    },
    {
      keywords: ["motor", "yakıt"],
      answer:
        "Sadece onaylı motor listesindeki katı yakıtlı motorlar kullanılabilir.",
      sources: [
        {
          source_id: "roket-sartname-5.4",
          source_title: "Roket Şartnamesi — Madde 5.4",
          similarity: 0.9,
        },
      ],
      confidence: 0.9,
    },
  ],
  "saglik-ai": [
    {
      keywords: ["veri seti", "dataset"],
      answer:
        "Yarışma sırasında sağlanan anonimleştirilmiş veri seti dışında veri kullanılamaz.",
      sources: [
        {
          source_id: "saglik-yz-sartname-6",
          source_title: "Sağlıkta YZ Şartnamesi — Madde 6",
          similarity: 0.87,
        },
      ],
      confidence: 0.87,
    },
  ],
  "su-alti": [
    {
      keywords: ["derinlik", "metre"],
      answer: "Araç en az 2 metre derinlikte otonom görev tamamlayabilmelidir.",
      sources: [
        {
          source_id: "su-alti-sartname-4",
          source_title: "Su Altı Şartnamesi — Madde 4",
          similarity: 0.83,
        },
      ],
      confidence: 0.83,
    },
  ],
};

// Basit gecikme simülasyonu (gerçek API çağrısı gibi hissettirmek için)
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function getCompetitions(): Promise<Competition[]> {
  await delay(300);
  return mockCompetitions;
}

export async function askQuestion(
  competitionSlug: string,
  question: string,
): Promise<AnswerResponse> {
  await delay(700);

  const qaList = mockQA[competitionSlug] ?? [];
  const lowerQuestion = question.toLowerCase();

  const match = qaList.find((qa) =>
    qa.keywords.some((kw) => lowerQuestion.includes(kw)),
  );

  if (match) {
    return {
      answer: match.answer,
      sources: match.sources,
      confidence: match.confidence,
      needs_human: false,
    };
  }

  // Eşleşme bulunamadı — insana yönlendir
  return {
    answer: null,
    sources: [],
    confidence: 0.2,
    needs_human: true,
  };
}
