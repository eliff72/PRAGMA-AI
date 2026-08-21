interface Props {
  confidence: number;
}

export default function ConfidenceBadge({ confidence }: Props) {
  const percent = Math.round(confidence * 100);
  const level = percent >= 85 ? "yüksek" : percent >= 70 ? "orta" : "düşük";
  const color =
    level === "yüksek"
      ? "bg-emerald-100 text-emerald-700"
      : level === "orta"
        ? "bg-amber-100 text-amber-700"
        : "bg-red-100 text-red-700";

  return (
    <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
      Güven: {level} (%{percent})
    </span>
  );
}
