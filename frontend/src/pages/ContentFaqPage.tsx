import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CategoryPicker } from "../components/CategoryPicker";
import { fetchCompetitions } from "../api/resources";
import { fetchFaq, createManualFaqEntry, deactivateFaqEntry } from "../api/faq";
import type { Competition, FAQEntry } from "../types";

export function ContentFaqPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [faqEntries, setFaqEntries] = useState<FAQEntry[]>([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [isFaqLoading, setIsFaqLoading] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formQuestion, setFormQuestion] = useState("");
  const [formAnswer, setFormAnswer] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchCompetitions().then((list) => {
      setCompetitions(list);
      setFormCategoryId((current) => current || (list.length ? list[0].id : ""));
    });
  }, []);

  function reloadFaq() {
    setIsFaqLoading(true);
    fetchFaq(categoryId, faqSearch)
      .then(setFaqEntries)
      .finally(() => setIsFaqLoading(false));
  }

  useEffect(() => {
    setIsFaqLoading(true);
    const debounce = setTimeout(() => {
      fetchFaq(categoryId, faqSearch)
        .then(setFaqEntries)
        .finally(() => setIsFaqLoading(false));
    }, 250);
    return () => clearTimeout(debounce);
  }, [categoryId, faqSearch]);

  async function handleDeactivate(faqId: string) {
    await deactivateFaqEntry(faqId);
    reloadFaq();
  }

  async function handleAddQuestion(e: React.FormEvent) {
    e.preventDefault();
    if (!formCategoryId || !formQuestion.trim() || !formAnswer.trim()) return;
    setIsSaving(true);
    setFormError(null);
    try {
      await createManualFaqEntry(formCategoryId, formQuestion.trim(), formAnswer.trim());
      setFormQuestion("");
      setFormAnswer("");
      setIsFormOpen(false);
      reloadFaq();
    } catch {
      setFormError("Soru eklenemedi. Lütfen tekrar deneyin.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
              Soru Havuzu
            </h1>
            <p className="mt-1 text-sm text-[var(--color-ink-500)]">
              Destek ekibinin daha önce cevapladığı sorular — aynı/benzer soru
              tekrar geldiğinde sistem buradan otomatik yanıtlar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsFormOpen((v) => !v)}
            className="shrink-0 rounded-md bg-[var(--color-navy-900)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            {isFormOpen ? "Vazgeç" : "Yeni Soru Ekle"}
          </button>
        </div>

        {isFormOpen && (
          <form
            onSubmit={handleAddQuestion}
            className="mt-4 space-y-3 rounded-xl border border-[var(--color-border)] bg-white p-5"
          >
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-700)]">
                Kategori
              </label>
              <select
                value={formCategoryId}
                onChange={(e) => setFormCategoryId(e.target.value)}
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              >
                {competitions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-700)]">
                Soru
              </label>
              <textarea
                value={formQuestion}
                onChange={(e) => setFormQuestion(e.target.value)}
                placeholder="Örn: Takım değişikliği ne zamana kadar yapılabilir?"
                rows={2}
                required
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-[var(--color-ink-700)]">
                Cevap
              </label>
              <textarea
                value={formAnswer}
                onChange={(e) => setFormAnswer(e.target.value)}
                placeholder="Yarışmacıya gösterilecek net cevap"
                rows={3}
                required
                className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
              />
            </div>
            {formError && <p className="text-xs text-[var(--color-flag-600)]">{formError}</p>}
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-md bg-[var(--color-flag-600)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {isSaving ? "Kaydediliyor..." : "Kaydet"}
            </button>
          </form>
        )}

        <div className="mt-6">
          <CategoryPicker
            competitions={competitions}
            value={categoryId}
            onChange={setCategoryId}
            includeAllOption
          />
        </div>

        <section className="mt-4 rounded-xl border border-[var(--color-border)] bg-white p-5">
          <input
            value={faqSearch}
            onChange={(e) => setFaqSearch(e.target.value)}
            placeholder="Sorularda ara..."
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm"
          />

          <div className="mt-4 space-y-2">
            {isFaqLoading && <p className="text-xs text-[var(--color-ink-500)]">Yükleniyor...</p>}
            {!isFaqLoading && faqEntries.length === 0 && (
              <p className="text-xs text-[var(--color-ink-500)]">Kayıtlı bir soru-cevap yok.</p>
            )}
            {!isFaqLoading &&
              faqEntries.map((entry) => (
                <div
                  key={entry.id}
                  className={`rounded-lg border p-4 ${
                    entry.isActive
                      ? "border-[var(--color-border)] bg-white"
                      : "border-[var(--color-border)] bg-[var(--color-bg-panel)] opacity-60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-medium text-[var(--color-ink-900)]">{entry.question}</p>
                    {entry.isActive ? (
                      <button
                        type="button"
                        onClick={() => handleDeactivate(entry.id)}
                        className="shrink-0 rounded-md border border-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-700)] hover:bg-white"
                      >
                        Pasife Al
                      </button>
                    ) : (
                      <span className="shrink-0 rounded-md bg-[var(--color-border)] px-2.5 py-1 text-xs font-medium text-[var(--color-ink-500)]">
                        Pasif
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-ink-700)]">{entry.answer}</p>
                  <p className="mt-2 font-mono text-[11px] text-[var(--color-ink-500)]">
                    {entry.competitionName} · kaynak: {entry.source} · {entry.createdAt}
                  </p>
                </div>
              ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
