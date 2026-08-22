// Mock veri ve API çağrı mantığı — gerçek backend hazır olunca burası değişecek

export interface Competition {
  id: string;
  name: string;
  description: string;
}

export interface Source {
  name: string;
  section?: string;
}

export interface AskResult {
  answer: string;
  sources: Source[];
  confidence: number; // 0-1 arası
  needsHuman: boolean;
}

interface MockQA {
  keywords: string[];
  answer: string;
  sources: Source[];
  confidence: number;
}

// --- Mock yarışmalar ---
export const mockCompetitions: Competition[] = [
  {
    id: "iha",
    name: "İnsansız Hava Aracı (İHA)",
    description: "Otonom görev yapabilen insansız hava araçları yarışması.",
  },
  {
    id: "roket",
    name: "Roket Yarışması",
    description: "Model roket tasarım ve fırlatma yarışması.",
  },
  {
    id: "saglik-ai",
    name: "Sağlıkta Yapay Zeka",
    description: "Sağlık verileriyle çalışan yapay zeka çözümleri yarışması.",
  },
  {
    id: "su-alti",
    name: "Su Altı Sistemleri",
    description: "Otonom su altı araçları tasarım yarışması.",
  },
];

// --- Mock soru-cevap veri seti (kategoriye göre) ---
const mockQA: Record<string, MockQA[]> = {
  iha: [
    {
      keywords: ["ağırlık", "kilo", "kg"],
      answer: "Şartnameye göre İHA'nın azami kalkış ağırlığı 25 kg'dır.",
      sources: [{ name: "İHA Şartnamesi v3", section: "Madde 4.2" }],
      confidence: 0.92,
    },
    {
      keywords: ["takım", "üye", "kaç kişi"],
      answer:
        "Bir takım en fazla 6 üyeden oluşabilir, en az 1 danışman zorunludur.",
      sources: [{ name: "İHA Şartnamesi v3", section: "Madde 2.1" }],
      confidence: 0.88,
    },
    {
      keywords: ["başvuru", "tarih", "son gün"],
      answer:
        "Başvurular ilgili yarışma takviminde belirtilen son tarihe kadar sistem üzerinden yapılmalıdır.",
      sources: [{ name: "İHA Kılavuzu", section: "Takvim" }],
      confidence: 0.8,
    },
  ],
  roket: [
    {
      keywords: ["irtifa", "yükseklik", "metre"],
      answer:
        "Roketin hedef irtifası kategoriye göre değişmekle birlikte genellikle 3000 metredir.",
      sources: [{ name: "Roket Şartnamesi", section: "Madde 3.1" }],
      confidence: 0.85,
    },
    {
      keywords: ["motor", "yakıt"],
      answer:
        "Sadece onaylı motor listesindeki katı yakıtlı motorlar kullanılabilir.",
      sources: [{ name: "Roket Şartnamesi", section: "Madde 5.4" }],
      confidence: 0.9,
    },
  ],
  "saglik-ai": [
    {
      keywords: ["veri seti", "dataset"],
      answer:
        "Yarışma sırasında sağlanan anonimleştirilmiş veri seti dışında veri kullanılamaz.",
      sources: [{ name: "Sağlıkta YZ Şartnamesi", section: "Madde 6" }],
      confidence: 0.87,
    },
  ],
  "su-alti": [
    {
      keywords: ["derinlik", "metre"],
      answer: "Araç en az 2 metre derinlikte otonom görev tamamlayabilmelidir.",
      sources: [{ name: "Su Altı Şartnamesi", section: "Madde 4" }],
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
  competitionId: string,
  question: string,
): Promise<AskResult> {
  await delay(700);

  const qaList = mockQA[competitionId] ?? [];
  const lowerQuestion = question.toLowerCase();

  const match = qaList.find((qa) =>
    qa.keywords.some((kw) => lowerQuestion.includes(kw)),
  );

  if (match) {
    return {
      answer: match.answer,
      sources: match.sources,
      confidence: match.confidence,
      needsHuman: false,
    };
  }

  // Eşleşme bulunamadı — insana yönlendir
  return {
    answer:
      "Bu konuda kaynaklarımda kesin bir bilgi bulamadım. Sorunuzu destek ekibimize yönlendiriyorum.",
    sources: [],
    confidence: 0.2,
    needsHuman: true,
  };
}
