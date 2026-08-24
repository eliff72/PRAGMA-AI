import { useEffect, useState } from "react";
import { AppShell } from "../components/AppShell";
import { CategoryPicker } from "../components/CategoryPicker";
import { fetchCompetitions } from "../api/resources";
import { fetchMyEscalations } from "../api/chat";
import type { Competition, Escalation } from "../types";

export function MyEscalationsPage() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [categoryId, setCategoryId] = useState("");
  const [escalations, setEscalations] = useState<Escalation[]>([]);

  useEffect(() => {
    fetchCompetitions().then(setCompetitions);
    fetchMyEscalations().then(setEscalations);
  }, []);

  const selectedCategory = competitions.find((c) => c.id === categoryId);
  // Escalation tipinde competitionId yok, sadece competitionName (bkz.
  // backend EscalationRead) — bu yuzden isim uzerinden filtreleniyor.
  const filtered = selectedCategory
    ? escalations.filter((e) => e.competitionName === selectedCategory.name)
    : escalations;

  const answeredCount = escalations.filter((e) => e.status === "cozuldu").length;

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          Yönlendirilen Sorularım
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          İnsana yönlendirdiğiniz sorular ve varsa destek ekibinin cevapları —{" "}
          {escalations.length} soru, {answeredCount} cevaplandı.
        </p>

        <div className="mt-4">
          <CategoryPicker
            competitions={competitions}
            value={categoryId}
            onChange={setCategoryId}
            includeAllOption
          />
        </div>

        <div className="mt-6 space-y-2">
          {filtered.length === 0 && (
            <p className="text-sm text-[var(--color-ink-500)]">
              {selectedCategory ? "Bu kategoride yönlendirilmiş bir sorunuz yok." : "Yönlendirilmiş bir sorunuz yok."}
            </p>
          )}
          {filtered.map((esc) => (
            <div key={esc.id} className="rounded-lg border border-[var(--color-border)] bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-[var(--color-ink-900)]">{esc.question}</p>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                    esc.status === "cozuldu"
                      ? "bg-[var(--color-success-bg)] text-[var(--color-success)]"
                      : "bg-[var(--color-flag-50)] text-[var(--color-flag-700)]"
                  }`}
                >
                  {esc.status === "cozuldu" ? "Cevaplandı" : "Bekliyor"}
                </span>
              </div>
              {esc.status === "cozuldu" && esc.answer && (
                <p className="mt-2 text-sm text-[var(--color-ink-700)]">{esc.answer}</p>
              )}
              <p className="mt-2 font-mono text-[11px] text-[var(--color-ink-500)]">
                {esc.competitionName} · {esc.createdAt}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
