import type { SourceCitation } from "../types";

export default function SourceList({ sources }: { sources: SourceCitation[] }) {
  if (sources.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {sources.map((s) => (
        <span
          key={s.source_id}
          className="inline-flex items-center gap-1 rounded-md border border-navy-100 bg-navy-50 px-2 py-1 text-xs font-medium text-navy-700"
          title={`Benzerlik: %${Math.round(s.similarity * 100)}`}
        >
          <svg
            className="h-3 w-3 shrink-0 text-navy-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          {s.source_title}
        </span>
      ))}
    </div>
  );
}
