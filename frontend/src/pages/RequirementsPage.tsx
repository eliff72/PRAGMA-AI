import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AppShell } from "../components/AppShell";
import { CategoryPicker } from "../components/CategoryPicker";
import { fetchCompetitions, fetchActiveDocuments } from "../api/resources";
import type { Competition, KnowledgeDocument } from "../types";

export function RequirementsPage() {
  const [searchParams] = useSearchParams();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  // Sohbet ekranindan "?category=<id>" ile gelinmis olabilir — o zaman
  // yarismacinin o an konustugu kategori onceden secili gelir. Yoksa ilk
  // kategori varsayilan olur (bkz. asagidaki fetch sonrasi fallback).
  const [categoryId, setCategoryId] = useState(searchParams.get("category") ?? "");
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);

  useEffect(() => {
    fetchCompetitions().then((list) => {
      setCompetitions(list);
      setCategoryId((current) => current || (list.length ? list[0].id : ""));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!categoryId) {
      setDocuments([]);
      return;
    }
    fetchActiveDocuments(categoryId).then(setDocuments);
  }, [categoryId]);

  const selectedCategory = competitions.find((c) => c.id === categoryId);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Yarışma Şartnamesi
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Seçtiğiniz kategorinin doğrulanmış, güncel (aktif) kaynak belgeleri.
        </p>

        <div className="mt-4">
          <CategoryPicker competitions={competitions} value={categoryId} onChange={setCategoryId} />
        </div>

        {selectedCategory && (
          <p className="mt-3 text-xs text-[var(--color-ink-500)]">{selectedCategory.description}</p>
        )}

        <div className="mt-6 space-y-2">
          {documents.length === 0 && (
            <p className="text-sm text-[var(--color-ink-500)]">
              Bu kategori için henüz aktif bir kaynak belge yüklenmemiş.
            </p>
          )}
          {documents.map((doc) => (
            <div key={doc.id} className="rounded-lg border border-[var(--color-border)] bg-white p-4">
              <p className="text-sm font-medium text-[var(--color-ink-900)]">{doc.title}</p>
              <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-500)]">
                v{doc.version} · {doc.uploadedAt}
              </p>
              {doc.sourceUrl && (
                <a
                  href={doc.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-block text-xs font-semibold text-[var(--color-navy-700)] underline"
                >
                  Şartnameyi Görüntüle →
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
