import type {
  Competition,
  KnowledgeDocument,
  Escalation,
  AnalyticsSummary,
} from "../types";

export const mockCompetitions: Competition[] = [
  {
    id: "insansiz-hava-araci",
    name: "İnsansız Hava Aracı Yarışması",
    description: "Otonom görev, menzil ve güvenlik şartnamesi kapsamındaki sorular.",
  },
  {
    id: "roket",
    name: "Roket Yarışması",
    description: "Uçuş güvenliği, irtifa hedefi ve teknik rapor kuralları.",
  },
  {
    id: "saglikta-yapay-zeka",
    name: "Sağlıkta Yapay Zeka Yarışması",
    description: "Veri seti, etik kurul ve değerlendirme kriterleri.",
  },
  {
    id: "egitim-teknolojileri",
    name: "Eğitim Teknolojileri Yarışması",
    description: "Başvuru takvimi, jüri kriterleri ve final aşaması kuralları.",
  },
];

export const mockDocuments: KnowledgeDocument[] = [
  {
    id: "doc-1",
    title: "İHA Yarışması Şartnamesi v3.2",
    competitionId: "insansiz-hava-araci",
    version: "3.2",
    isActive: true,
    uploadedAt: "2026-06-02",
    uploadedBy: "İçerik Yöneticisi - A. Yılmaz",
  },
  {
    id: "doc-2",
    title: "İHA Yarışması Şartnamesi v3.1",
    competitionId: "insansiz-hava-araci",
    version: "3.1",
    isActive: false,
    uploadedAt: "2026-02-10",
    uploadedBy: "İçerik Yöneticisi - A. Yılmaz",
  },
  {
    id: "doc-3",
    title: "Roket Yarışması Kılavuzu v2.0",
    competitionId: "roket",
    version: "2.0",
    isActive: true,
    uploadedAt: "2026-05-20",
    uploadedBy: "İçerik Yöneticisi - B. Demir",
  },
  {
    id: "doc-4",
    title: "Sağlıkta YZ Onaylı SSS v1.4",
    competitionId: "saglikta-yapay-zeka",
    version: "1.4",
    isActive: true,
    uploadedAt: "2026-07-01",
    uploadedBy: "İçerik Yöneticisi - C. Kaya",
  },
];

export const mockEscalations: Escalation[] = [
  {
    id: "esc-1",
    question: "Takım değişikliği başvuru sonrası yapılabilir mi?",
    competitionName: "İnsansız Hava Aracı Yarışması",
    askedBy: "Yarışmacı - Deneyap Ekip 12",
    status: "bekliyor",
    createdAt: "2026-08-19 14:22",
  },
  {
    id: "esc-2",
    question: "Final aşamasına yedek takımlar davet ediliyor mu?",
    competitionName: "Eğitim Teknolojileri Yarışması",
    askedBy: "Yarışmacı - Kodleon",
    status: "bekliyor",
    createdAt: "2026-08-20 09:05",
  },
  {
    id: "esc-3",
    question: "Rapor teslim formatı LaTeX şablonuyla uyumlu mu?",
    competitionName: "Roket Yarışması",
    askedBy: "Yarışmacı - AtmosferX",
    status: "cozuldu",
    createdAt: "2026-08-15 11:40",
    answer:
      "Evet, LaTeX şablonu kabul edilir; PDF çıktısı 20 sayfayı geçmemelidir.",
  },
];

export const mockAnalytics: AnalyticsSummary = {
  totalQuestions: 482,
  escalationRate: 0.14,
  avgConfidence: 0.81,
  topTopics: [
    { topic: "Başvuru ve takvim", count: 132 },
    { topic: "Teknik şartname detayları", count: 98 },
    { topic: "Rapor teslim kuralları", count: 76 },
    { topic: "Jüri değerlendirme kriterleri", count: 54 },
    { topic: "Takım değişikliği", count: 31 },
  ],
  dbStatus: "ok",
  aiServiceStatus: "ok",
  questionsLast24h: 37,
  openTicketsCount: 2,
  totalCompetitions: 61,
  totalSpecifications: 3,
  confidenceDistribution: { yuksek: 320, orta: 98, dusuk: 12 },
  escalationByCategory: [
    { competitionName: "Sürü İHA Yarışması", totalQuestions: 40, escalatedCount: 6, escalationRate: 0.15 },
    { competitionName: "Savaşan İHA Yarışması", totalQuestions: 25, escalatedCount: 2, escalationRate: 0.08 },
  ],
};
