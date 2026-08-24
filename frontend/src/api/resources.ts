import { apiClient, USE_MOCK } from "./client";
import type { Competition, DocumentChunk, KnowledgeDocument } from "../types";
import { mockCompetitions, mockDocuments } from "../mock/data";

/** Backend: GET /api/competitions */
export async function fetchCompetitions(): Promise<Competition[]> {
  if (USE_MOCK) return mockCompetitions;
  const { data } = await apiClient.get<Competition[]>("/api/competitions");
  return data;
}

/** Backend: GET /api/resources */
export async function fetchDocuments(): Promise<KnowledgeDocument[]> {
  if (USE_MOCK) return mockDocuments;
  const { data } = await apiClient.get<KnowledgeDocument[]>("/api/resources");
  return data;
}

/** Backend: GET /api/resources/{competitionId}/active — BOLUM 5: yarismacinin
 * secili kategorinin sadece AKTIF belgelerini gordugu referans paneli icin. */
export async function fetchActiveDocuments(competitionId: string): Promise<KnowledgeDocument[]> {
  if (USE_MOCK) return mockDocuments.filter((d) => d.competitionId === competitionId && d.isActive);
  const { data } = await apiClient.get<KnowledgeDocument[]>(`/api/resources/${competitionId}/active`);
  return data;
}

/** Backend: POST /api/resources (multipart/form-data) */
export async function uploadDocument(
  file: File,
  competitionId: string,
  version: string
): Promise<KnowledgeDocument> {
  if (USE_MOCK) {
    const doc: KnowledgeDocument = {
      id: crypto.randomUUID(),
      title: file.name,
      competitionId,
      version,
      isActive: true,
      uploadedAt: new Date().toISOString().slice(0, 10),
      uploadedBy: "Sen (demo)",
    };
    mockDocuments.unshift(doc);
    return doc;
  }
  const form = new FormData();
  form.append("file", file);
  form.append("competition_id", competitionId);
  form.append("version", version);
  // Content-Type kasitli olarak verilmiyor: tarayici FormData'yi gorunce
  // boundary'li dogru header'i kendisi ekler (bkz. client.ts notu).
  const { data } = await apiClient.post<KnowledgeDocument>("/api/resources", form);
  return data;
}

/** Backend: GET /api/resources/{id}/chunks */
export async function fetchDocumentChunks(documentId: string): Promise<DocumentChunk[]> {
  if (USE_MOCK) return [];
  const { data } = await apiClient.get<DocumentChunk[]>(`/api/resources/${documentId}/chunks`);
  return data;
}

/** Backend: PATCH /api/resources/{id}/deactivate */
export async function deactivateDocument(id: string): Promise<void> {
  if (USE_MOCK) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) doc.isActive = false;
    return;
  }
  await apiClient.patch(`/api/resources/${id}/deactivate`);
}

/** Backend: PATCH /api/resources/{id}/activate */
export async function activateDocument(id: string): Promise<void> {
  if (USE_MOCK) {
    const doc = mockDocuments.find((d) => d.id === id);
    if (doc) doc.isActive = true;
    return;
  }
  await apiClient.patch(`/api/resources/${id}/activate`);
}

/** Backend: DELETE /api/resources/{id} — kalici silme (geri donusu yok). */
export async function deleteDocument(id: string): Promise<void> {
  if (USE_MOCK) {
    const idx = mockDocuments.findIndex((d) => d.id === id);
    if (idx !== -1) mockDocuments.splice(idx, 1);
    return;
  }
  await apiClient.delete(`/api/resources/${id}`);
}
