// Backend kapaliyken/hata verdiginde arayuzun uctan uca test edilebilmesi icin
// kullanilan fallback veri seti. Gercek backend ayaktaysa bu dosya devreye girmez.

import type { AnswerResponse, Competition, SourceCitation } from "../types";

export const mockCompetitions: Competition[] = [
  {
    id: 1,
    name: "İnsansız Hava Aracı (İHA)",
    slug: "iha",
    description: "Otonom görev yapabilen insansız hava araçları yarışması.",
    is_active: true,
  },
  {
    id: 2,
    name: "Roket Yarışması",
    slug: "roket",
    description: "Model roket tasarım ve fırlatma yarışması.",
    is_active: true,
  },
  {
    id: 3,
    name: "Sağlıkta Yapay Zeka",
    slug: "saglik-ai",
    description: "Sağlık verileriyle çalışan yapay zeka çözümleri yarışması.",
    is_active: true,
  },
  {
    id: 4,
    name: "Su Altı Sistemleri",
    slug: "su-alti",
    description: "Otonom su altı araçları tasarım yarışması.",
    is_active: true,
  },
];

interface MockQA {
  keywords: string[];
  answer: string;
  confidence: number;
  sources: SourceCitation[];
}

const mockQA: Record<string, MockQA[]> = {
  iha: [
    {
      keywords: ["ağırlık", "kilo", "kg", "azami"],
      answer: "Şartnameye göre İHA'nın azami kalkış ağırlığı 25 kg'dır.",
      confidence: 0.92,
      sources: [
        {
          source_id: "iha-sartname-v3",
          source_title: "İHA Şartnamesi v3 — Madde 4.2",
          similarity: 0.94,
        },
      ],
    },
    {
      keywords: ["takım", "üye", "kaç kişi", "danışman"],
      answer:
        "Bir takım en fazla 6 üyeden oluşabilir ve en az 1 danışman zorunludur.",
      confidence: 0.88,
      sources: [
        {
          source_id: "iha-sartname-v3",
          source_title: "İHA Şartnamesi v3 — Madde 2.1",
          similarity: 0.9,
        },
      ],
    },
    {
      keywords: ["başvuru", "tarih", "son gün", "takvim"],
      answer:
        "Başvurular yarışma takviminde belirtilen son tarihe kadar sistem üzerinden yapılmalıdır.",
      confidence: 0.72,
      sources: [
        {
          source_id: "iha-kilavuz",
          source_title: "İHA Kılavuzu — Takvim",
          similarity: 0.76,
        },
      ],
    },
  ],
  roket: [
    {
      keywords: ["irtifa", "yükseklik", "metre", "hedef"],
      answer:
        "Roketin hedef irtifası kategoriye göre değişmekle birlikte genellikle 3000 metredir.",
      confidence: 0.85,
      sources: [
        {
          source_id: "roket-sartname",
          source_title: "Roket Şartnamesi — Madde 3.1",
          similarity: 0.88,
        },
      ],
    },
    {
      keywords: ["motor", "yakıt", "teknik", "sınır"],
      answer:
        "Sadece onaylı motor listesindeki katı yakıtlı motorlar kullanılabilir.",
      confidence: 0.9,
      sources: [
        {
          source_id: "roket-sartname",
          source_title: "Roket Şartnamesi — Madde 5.4",
          similarity: 0.91,
        },
      ],
    },
    {
      keywords: ["takım", "üye", "kaç kişi"],
      answer: "Roket takımları en fazla 8 üye ve 1 danışmandan oluşabilir.",
      confidence: 0.83,
      sources: [
        {
          source_id: "roket-sartname",
          source_title: "Roket Şartnamesi — Madde 2.2",
          similarity: 0.85,
        },
      ],
    },
  ],
  "saglik-ai": [
    {
      keywords: ["veri seti", "dataset", "veri"],
      answer:
        "Yarışma sırasında sağlanan anonimleştirilmiş veri seti dışında harici veri kullanılamaz.",
      confidence: 0.87,
      sources: [
        {
          source_id: "saglik-sartname",
          source_title: "Sağlıkta YZ Şartnamesi — Madde 6",
          similarity: 0.89,
        },
      ],
    },
    {
      keywords: ["model", "lisans", "açık kaynak", "teknik", "sınır"],
      answer:
        "Açık kaynak modeller, lisansları belgelenmek kaydıyla kullanılabilir.",
      confidence: 0.64,
      sources: [
        {
          source_id: "saglik-sartname",
          source_title: "Sağlıkta YZ Şartnamesi — Madde 7.3",
          similarity: 0.68,
        },
      ],
    },
  ],
  "su-alti": [
    {
      keywords: ["derinlik", "metre", "görev"],
      answer:
        "Araç en az 2 metre derinlikte otonom görev tamamlayabilmelidir.",
      confidence: 0.83,
      sources: [
        {
          source_id: "sualti-sartname",
          source_title: "Su Altı Şartnamesi — Madde 4",
          similarity: 0.86,
        },
      ],
    },
    {
      keywords: ["takım", "üye", "kaç kişi"],
      answer: "Su altı takımları en fazla 10 üyeden oluşabilir.",
      confidence: 0.79,
      sources: [
        {
          source_id: "sualti-sartname",
          source_title: "Su Altı Şartnamesi — Madde 2.1",
          similarity: 0.81,
        },
      ],
    },
  ],
};

let mockLogId = 1;

export function mockAnswer(
  competitionSlug: string,
  question: string,
): AnswerResponse {
  const list = mockQA[competitionSlug] ?? [];
  const lower = question.toLocaleLowerCase("tr");
  const match = list.find((qa) => qa.keywords.some((kw) => lower.includes(kw)));

  if (match) {
    return {
      qa_log_id: mockLogId++,
      answer: match.answer,
      confidence: match.confidence,
      needs_human: false,
      sources: match.sources,
    };
  }

  return {
    qa_log_id: mockLogId++,
    answer: null,
    confidence: 0.2,
    needs_human: true,
    sources: [],
  };
}

export function mockDelay(ms = 500): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
