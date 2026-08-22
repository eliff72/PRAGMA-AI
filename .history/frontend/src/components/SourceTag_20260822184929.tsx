import type { Source } from "../api/questions";

interface SourceTagProps {
  source: Source;
}

export default function SourceTag({ source }: SourceTagProps) {
  return (
    <span className="inline-block rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
      📄 {source.name}
      {source.section ? ` — ${source.section}` : ""}
    </span>
  );
}
