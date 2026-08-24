import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CategoryPicker } from "../components/CategoryPicker";
import { fetchCompetitions } from "../api/resources";
import { fetchFaq } from "../api/faq";
import type { Competition, FAQEntry } from "../types";

export function ContentFaqPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [faqEntries, setFaqEntries] = useState<FAQEntry[]>([]);
  const [faqSearch, setFaqSearch] = useState("");
  const [isFaqLoading, setIsFaqLoading] = useState(false);

  useEffect(() => {
    fetchCompetitions().then(setCompetitions);
  }, []);

  useEffect(() => {
    setIsFaqLoading(true);
    const debounce = setTimeout(() => {
      fetchFaq(categoryId, faqSearch)
        .then(setFaqEntries)
        .finally(() => setIsFaqLoading(false));
    }, 250);
    return () => clearTimeout(debounce);
  }, [categoryId, faqSearch]);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Soru Havuzu
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Destek ekibinin daha önce cevapladığı sorular — aynı/benzer soru
          tekrar geldiğinde sistem buradan otomatik yanıtlar.
        </p>

        <div className="mt-4">
          <CategoryPicker
            competitions={competitions}
            value={categoryId}
            onChange={setCategoryId}
            includeAllOption
          />
        </div>

        <section className="mt-6 rounded-xl border border-[var(--color-border)] bg-white p-5">
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
                <div key={entry.id} className="rounded-lg border border-[var(--color-border)] bg-white p-4">
                  <p className="text-sm font-medium text-[var(--color-ink-900)]">{entry.question}</p>
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
