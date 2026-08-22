interface ConfidenceBadgeProps {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  let label = "Düşük";
  let colorClass = "bg-red-100 text-red-700";

  if (confidence >= 0.8) {
    label = "Yüksek";
    colorClass = "bg-green-100 text-green-700";
  } else if (confidence >= 0.5) {
    label = "Orta";
    colorClass = "bg-yellow-100 text-yellow-700";
  }

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${colorClass}`}
    >
      Güven: {label} ({Math.round(confidence * 100)}%)
    </span>
  );
}
