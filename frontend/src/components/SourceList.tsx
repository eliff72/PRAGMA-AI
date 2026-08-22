import type { SourceCitation } from "../types";

export default function SourceList({ sources }: { sources: SourceCitation[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <span
          key={s.source_id}
          className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs text-slate-600"
          title={`Benzerlik: %${Math.round(s.similarity * 100)}`}
        >
          📄 {s.source_title}
        </span>
      ))}
    </div>
  );
}
