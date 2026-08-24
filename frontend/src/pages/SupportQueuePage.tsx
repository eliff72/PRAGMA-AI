import { useEffect, useState } from "react";
import axios from "axios";
import { AppShell } from "../components/AppShell";
import { fetchEscalations, resolveEscalation, addEscalationToFaq } from "../api/admin";
import type { Escalation } from "../types";

type FaqFeedback = { type: "success" | "error"; text: string };

export function SupportQueuePage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [faqFeedback, setFaqFeedback] = useState<Record<string, FaqFeedback>>({});

  async function load() {
    setEscalations(await fetchEscalations());
  }

  useEffect(() => {
    load();
  }, []);

  async function handleResolve(id: string) {
    const answer = drafts[id]?.trim();
    if (!answer) return;
    await resolveEscalation(id, answer);
    await load();
  }

  async function handleAddToFaq(id: string) {
    try {
      await addEscalationToFaq(id);
      setFaqFeedback((f) => ({ ...f, [id]: { type: "success", text: "SSS havuzuna eklendi" } }));
    } catch (err) {
      const detail = axios.isAxiosError(err)
        ? (err.response?.data?.detail ?? err.message)
        : "Beklenmeyen bir hata oluştu";
      setFaqFeedback((f) => ({ ...f, [id]: { type: "error", text: `SSS'e eklenemedi: ${detail}` } }));
    } finally {
      setTimeout(() => {
        setFaqFeedback((f) => {
          const { [id]: _removed, ...rest } = f;
          return rest;
        });
      }, 4000);
    }
  }

  const pending = escalations.filter((e) => e.status === "bekliyor");
  const resolved = escalations.filter((e) => e.status === "cozuldu");

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-6 py-8">
        <h1 className="font-display text-xl font-semibold text-[var(--color-ink-900)]">
          İnsana Yönlendirilen Sorular
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-500)]">
          Asistanın yeterli kanıt bulamadığı sorular burada birikir.
        </p>

        <section className="mt-6 space-y-3">
          {pending.length === 0 && (
            <p className="text-sm text-[var(--color-ink-500)]">Bekleyen soru yok.</p>
          )}
          {pending.map((esc) => (
            <div key={esc.id} className="rounded-xl border border-[var(--color-flag-600)]/30 bg-[var(--color-flag-50)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-ink-900)]">{esc.question}</p>
                  <p className="mt-1 font-mono text-[11px] text-[var(--color-ink-500)]">
                    {esc.competitionName} · {esc.askedBy} · {esc.createdAt}
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-[var(--color-flag-600)] px-2.5 py-1 text-[11px] font-semibold text-white">
                  Bekliyor
                </span>
              </div>

              <textarea
                value={drafts[esc.id] ?? ""}
                onChange={(e) => setDrafts((d) => ({ ...d, [esc.id]: e.target.value }))}
                placeholder="Yanıtını yaz..."
                rows={2}
                className="mt-3 w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm outline-none focus:border-[var(--color-navy-700)]"
              />
              <button
                onClick={() => handleResolve(esc.id)}
                disabled={!drafts[esc.id]?.trim()}
                className="mt-2 rounded-md bg-[var(--color-navy-900)] px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
              >
                Yanıtla ve kapat
              </button>
            </div>
          ))}
        </section>

        <section className="mt-10">
          <h2 className="mb-3 font-display text-sm font-semibold text-[var(--color-ink-700)]">
            Çözülenler
          </h2>
          <div className="space-y-2">
            {resolved.map((esc) => (
              <div key={esc.id} className="rounded-lg border border-[var(--color-border)] bg-white p-4">
                <p className="text-sm font-medium text-[var(--color-ink-900)]">{esc.question}</p>
                <p className="mt-1 text-sm text-[var(--color-ink-700)]">{esc.answer}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="font-mono text-[11px] text-[var(--color-ink-500)]">
                    {esc.competitionName} · {esc.createdAt}
                  </p>
                  <button
                    onClick={() => handleAddToFaq(esc.id)}
                    className="text-xs font-medium text-[var(--color-flag-700)] hover:underline"
                  >
                    SSS havuzuna ekle
                  </button>
                </div>
                {faqFeedback[esc.id] && (
                  <p
                    className={`mt-2 text-[11px] font-medium ${
                      faqFeedback[esc.id].type === "success"
                        ? "text-[var(--color-success)]"
                        : "text-[var(--color-flag-700)]"
                    }`}
                  >
                    {faqFeedback[esc.id].text}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
