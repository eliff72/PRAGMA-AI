interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let label = "Düşük";
  let colorClass = "bg-rose-50 text-rose-700 ring-rose-200";
  let dotClass = "bg-rose-500";

  if (confidence >= 0.8) {
    label = "Yüksek";
    colorClass = "bg-emerald-50 text-emerald-700 ring-emerald-200";
    dotClass = "bg-emerald-500";
  } else if (confidence >= 0.5) {
    label = "Orta";
    colorClass = "bg-amber-50 text-amber-700 ring-amber-200";
    dotClass = "bg-amber-500";
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${colorClass}`}
      title={`Güven skoru: %${Math.round(confidence * 100)}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {label} güven · %{Math.round(confidence * 100)}
    </span>
  );
}
