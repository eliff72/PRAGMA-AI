import type { SourceCitation } from "../types";

export function SourceCard({ source }: { source: SourceCitation }) {
  const pct = Math.round(source.confidence * 100);
  const level =
    source.confidence >= 0.8 ? "yüksek" : source.confidence >= 0.62 ? "orta" : "düşük";
  const barColor =
    source.confidence >= 0.8
      ? "bg-[var(--color-success)]"
      : source.confidence >= 0.62
      ? "bg-[var(--color-gold-500)]"
      : "bg-[var(--color-flag-600)]";

  return (
    <div className="mt-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-panel)] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--color-success)] text-[10px] font-bold text-white">
            ✓
          </span>
          <span className="font-mono text-[11px] uppercase tracking-wider text-[var(--color-ink-500)]">
            Doğrulanmış Kaynak
          </span>
        </div>
        <span className="font-mono text-[11px] text-[var(--color-ink-500)]">
          v{source.version}
        </span>
      </div>

      <p className="mt-2 font-display text-sm font-medium leading-snug text-[var(--color-ink-900)]">
        {source.documentTitle}
      </p>
      <p className="font-mono text-[12px] text-[var(--color-ink-500)]">{source.section}</p>

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between font-mono text-[10px] text-[var(--color-ink-500)]">
          <span>GÜVEN SEVİYESİ · {level.toUpperCase()}</span>
          <span>{pct}%</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/[0.06]">
          <div className={`h-full ${barColor}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
