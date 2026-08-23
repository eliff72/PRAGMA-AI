interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let label = "Düşük";
  let dotClass = "bg-red-500";
  let textClass = "text-red-700";

  if (confidence >= 0.8) {
    label = "Yüksek";
    dotClass = "bg-emerald-500";
    textClass = "text-emerald-700";
  } else if (confidence >= 0.5) {
    label = "Orta";
    dotClass = "bg-amber-500";
    textClass = "text-amber-700";
  }

  return (
    <span
      className={`inline-flex w-fit items-center gap-1.5 rounded-full bg-slate-50 px-2.5 py-1 text-xs font-medium ${textClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      Güven: {label} ({Math.round(confidence * 100)}%)
    </span>
  );
}
