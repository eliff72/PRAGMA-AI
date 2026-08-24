import type { SourceCitation } from "../types";

export default function SourceList({ sources }: { sources: SourceCitation[] }) {
  if (sources.length === 0) return null;

  return (
    <>
      {sources.map((s) => (
        <span
          key={s.source_id}
          className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:border-slate-300 hover:bg-slate-100"
          title={`Benzerlik: %${Math.round(s.similarity * 100)}`}
        >
          <span aria-hidden>📄</span>
          <span className="truncate">{s.source_title}</span>
          <span className="shrink-0 rounded bg-white px-1.5 py-0.5 text-[10px] text-slate-500 ring-1 ring-slate-200">
            %{Math.round(s.similarity * 100)}
          </span>
        </span>
      ))}
    </>
  );
}
