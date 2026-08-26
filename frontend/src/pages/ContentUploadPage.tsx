import { useEffect, useState } from "react";
import axios from "axios";
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
  createCompetition,
  deleteCompetition,
} from "../api/resources";
import { slugify } from "../utils/search";
import type { Competition, DocumentChunk, KnowledgeDocument } from "../types";

type CategoryMode = "existing" | "new";

export function ContentUploadPage() {
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categoryId, setCategoryId] = useState("");

  const [categoryMode, setCategoryMode] = useState<CategoryMode>("existing");
  const [newCatName, setNewCatName] = useState("");
  const [newCatSlug, setNewCatSlug] = useState("");
  const [newCatSlugTouched, setNewCatSlugTouched] = useState(false);
  const [newCatDescription, setNewCatDescription] = useState("");

  const [uploadVersion, setUploadVersion] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

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

  function handleNewCatNameChange(value: string) {
    setNewCatName(value);
    if (!newCatSlugTouched) setNewCatSlug(slugify(value));
  }

  function resetNewCategoryFields() {
    setNewCatName("");
    setNewCatSlug("");
    setNewCatSlugTouched(false);
    setNewCatDescription("");
  }

  const isNewCategoryValid = newCatName.trim() !== "" && newCatSlug.trim() !== "";
  const canSubmitUpload =
    !!uploadFile &&
    !!uploadVersion &&
    (categoryMode === "existing" ? !!categoryId : isNewCategoryValid) &&
    !isUploading;

  async function handleUploadSubmit(e: React.FormEvent) {
    e.preventDefault();
    setUploadError(null);
    if (!uploadFile || !uploadVersion) return;
    if (categoryMode === "existing" && !categoryId) return;
    if (categoryMode === "new" && !isNewCategoryValid) return;

    setIsUploading(true);
    let targetCategoryId = categoryId;
    let createdCompetitionId: string | null = null;

    try {
      // Kategori + kaynak TEK adimda olusuyor: once (varsa) kategori acilir,
      // hemen ardindan dosya o kategoriye yuklenir. Boylece icinde hic
      // kaynak olmayan bos bir kategori yarismaciya asla gorunmez (bkz. rapor).
      if (categoryMode === "new") {
        const created = await createCompetition(newCatName.trim(), newCatSlug.trim(), newCatDescription.trim());
        targetCategoryId = created.id;
        createdCompetitionId = created.id;
      }

      try {
        await uploadDocument(uploadFile, targetCategoryId, uploadVersion);
      } catch (uploadErr) {
        // Dosya yukleme (ingest) basarisiz oldu: az once acilan kategoriyi
        // geri al (rollback) — kaynaksiz/bos kategori kalmasin.
        if (createdCompetitionId) {
          try {
            await deleteCompetition(createdCompetitionId);
          } catch (rollbackErr) {
            console.error("Rollback basarisiz — kategori manuel kontrol edilmeli:", rollbackErr);
          }
        }
        throw uploadErr;
      }

      setUploadFile(null);
      setUploadVersion("");
      if (categoryMode === "new") {
        resetNewCategoryFields();
        setCategoryMode("existing");
        setCategoryId(targetCategoryId);
      }
      await load();
    } catch (err) {
      const detail = axios.isAxiosError(err) ? err.response?.data?.detail : undefined;
      setUploadError(typeof detail === "string" ? detail : "Kaynak yüklenemedi. Dosyayı ve bilgileri kontrol edin.");
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
            className="flex flex-col gap-3 rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-bg-panel)] p-4"
          >
            <div>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wide text-[var(--color-ink-500)]">
                Kategori
              </label>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5">
                  <input
                    type="radio"
                    checked={categoryMode === "existing"}
                    onChange={() => setCategoryMode("existing")}
                  />
                  Var olan kategoriyi seç
                </label>
                <label className="flex items-center gap-1.5">
                  <input type="radio" checked={categoryMode === "new"} onChange={() => setCategoryMode("new")} />
                  Yeni kategori oluştur
                </label>
              </div>
            </div>

            {categoryMode === "existing" ? (
              <p className="rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-ink-700)]">
                Yukarıda seçili kategoriye yüklenecek:{" "}
                <span className="font-semibold">
                  {competitions.find((c) => c.id === categoryId)?.name ?? "— kategori seçin —"}
                </span>
              </p>
            ) : (
              <div className="flex flex-col gap-3 rounded-md border border-[var(--color-border)] bg-white p-3">
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">İsim</label>
                  <input
                    value={newCatName}
                    onChange={(e) => handleNewCatNameChange(e.target.value)}
                    placeholder="ör. Teknofest İHA"
                    required={categoryMode === "new"}
                    className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                    Slug{" "}
                    <span className="font-normal text-[var(--color-ink-500)]">
                      (isimden otomatik türetilir, düzenlenebilir)
                    </span>
                  </label>
                  <input
                    value={newCatSlug}
                    onChange={(e) => {
                      setNewCatSlugTouched(true);
                      setNewCatSlug(e.target.value);
                    }}
                    placeholder="ör. teknofest-iha"
                    required={categoryMode === "new"}
                    className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 font-mono text-sm"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold text-[var(--color-ink-900)]">
                    Açıklama <span className="font-normal text-[var(--color-ink-500)]">(opsiyonel)</span>
                  </label>
                  <input
                    value={newCatDescription}
                    onChange={(e) => setNewCatDescription(e.target.value)}
                    placeholder="Kısa açıklama"
                    className="w-full rounded-md border border-[var(--color-border)] px-3 py-2 text-sm"
                  />
                </div>
                <p className="text-[11px] text-[var(--color-ink-500)]">
                  Kategori, aşağıdaki dosya yüklemesiyle birlikte tek adımda oluşturulur — dosya yüklenemezse
                  kategori otomatik geri alınır, boş kategori kalmaz.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            </div>

            {uploadError && <p className="text-xs text-[var(--color-flag-600)]">{uploadError}</p>}

            <button
              type="submit"
              disabled={!canSubmitUpload}
              className="rounded-md bg-[var(--color-flag-600)] px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {isUploading
                ? categoryMode === "new"
                  ? "Kategori oluşturuluyor ve kaynak yükleniyor..."
                  : "Yükleniyor..."
                : categoryMode === "new"
                  ? "Kategoriyi Oluştur ve Kaynağı Yükle"
                  : "Kaynağı yükle"}
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
