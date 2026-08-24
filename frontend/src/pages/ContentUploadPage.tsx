import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CategoryPicker } from "../components/CategoryPicker";
import {
  fetchCompetitions,
  fetchDocuments,
  fetchDocumentChunks,
  uploadDocument,
  deactivateDocument,
  activateDocument,
  deleteDocument,
} from "../api/resources";
import type { Competition, DocumentChunk, KnowledgeDocument } from "../types";

export function ContentUploadPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chunksByDoc, setChunksByDoc] = useState<Record<string, DocumentChunk[]>>({});
  const [loadingChunksId, setLoadingChunksId] = useState<string | null>(null);

  async function load() {
    const [docs, comps] = await Promise.all([fetchDocuments(), fetchCompetitions()]);
    setDocuments(docs);
    setCompetitions(comps);
    if (comps.length > 0 && !categoryId) {
      setCategoryId(comps[0].id);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadFile || !categoryId || !uploadVersion) return;
    setIsUploading(true);
    try {
      await uploadDocument(uploadFile, categoryId, uploadVersion);
      setUploadFile(null);
      setUploadVersion("");
      await load();
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDeactivate(id: string) {
    await deactivateDocument(id);
    await load();
  }

  async function handleActivate(id: string) {
    await activateDocument(id);
    await load();
  }

  async function handleDelete(id: string, title: string) {
    const confirmed = window.confirm(`"${title}" kalıcı olarak silinecek. Bu işlem geri alınamaz. Emin misiniz?`);
    if (!confirmed) return;
    await deleteDocument(id);
    await load();
  }

  async function handleToggleChunks(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setExpandedId(id);
    if (chunksByDoc[id]) return;
    setLoadingChunksId(id);
    try {
      const chunks = await fetchDocumentChunks(id);
      setChunksByDoc((prev) => ({ ...prev, [id]: chunks }));
    } finally {
      setLoadingChunksId(null);
    }
  }

  const categoryDocuments = documents.filter((d) => d.competitionId === categoryId);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Kaynak Ekleme
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Bir yarışma kategorisi seç; şartname/kılavuz yükle, pasife/aktife al
          veya kalıcı olarak sil.
        </p>

        <div className="mt-4">
          <CategoryPicker competitions={competitions} value={categoryId} onChange={setCategoryId} />
        </div>

        <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <form
            onSubmit={handleUploadSubmit}
            className="grid grid-cols-1 gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4 sm:grid-cols-3"
          >
            <input
              value={uploadVersion}
              onChange={(e) => setUploadVersion(e.target.value)}
              placeholder="Versiyon (örn. 1)"
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
            />
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="text-xs sm:col-span-2"
            />
            <button
              type="submit"
              disabled={!uploadFile || !categoryId || !uploadVersion || isUploading}
              className="rounded-md bg-[var(--color-flag-600)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40 sm:col-span-3"
            >
              {isUploading ? "Yükleniyor..." : "Kaynağı yükle"}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            {categoryDocuments.length === 0 && (
              <p className="text-xs text-[var(--color-ink-500)]">Bu kategori için henüz kaynak yüklenmemiş.</p>
            )}
            {categoryDocuments.map((doc) => {
              const isExpanded = expandedId === doc.id;
              const chunks = chunksByDoc[doc.id];
              const isLoadingChunks = loadingChunksId === doc.id;

              return (
                <div key={doc.id} className="rounded-lg border border-[var(--color-border)] bg-white">
                  <button
                    type="button"
                    onClick={() => handleToggleChunks(doc.id)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-[var(--color-ink-900)]">{doc.title}</p>
                      <p className="font-mono text-[11px] text-[var(--color-ink-500)]">
                        v{doc.version} · {doc.uploadedAt} · {doc.uploadedBy}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          doc.isActive
                            ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                            : "bg-black/5 text-[var(--color-ink-500)]"
                        }`}
                      >
                        {doc.isActive ? "Aktif" : "Pasif"}
                      </span>
                      {doc.isActive ? (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeactivate(doc.id);
                          }}
                          className="text-xs font-medium text-[var(--color-flag-700)] hover:underline"
                        >
                          Pasife al
                        </span>
                      ) : (
                        <span
                          role="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivate(doc.id);
                          }}
                          className="text-xs font-medium text-[var(--color-success)] hover:underline"
                        >
                          Aktife al
                        </span>
                      )}
                      <span
                        role="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(doc.id, doc.title);
                        }}
                        className="text-xs font-medium text-[var(--color-flag-600)] hover:underline"
                      >
                        Sil
                      </span>
                      <span className="text-xs text-[var(--color-ink-500)]">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 border-t border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-3">
                      {isLoadingChunks && <p className="text-xs text-[var(--color-ink-500)]">Yükleniyor...</p>}
                      {!isLoadingChunks && chunks && chunks.length === 0 && (
                        <p className="text-xs text-[var(--color-ink-500)]">Henüz içerik yok</p>
                      )}
                      {!isLoadingChunks &&
                        chunks &&
                        chunks.map((chunk) => (
                          <div key={chunk.id} className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2">
                            <p className="whitespace-pre-wrap font-mono text-xs text-[var(--color-ink-700)]">
                              {chunk.content}
                            </p>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
