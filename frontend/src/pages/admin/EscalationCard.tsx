import { useState } from "react";
import type { EscalationItem } from "../../types/admin";

interface Props {
  escalation: EscalationItem;
  onAnswer: (answer: string, addToFaq: boolean) => void;
  isSubmitting: boolean;
}

export default function EscalationCard({ escalation, onAnswer, isSubmitting }: Props) {
  const [answer, setAnswer] = useState("");
  const [addToFaq, setAddToFaq] = useState(false);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-medium text-slate-800">{escalation.question}</p>
      <p className="mt-1 text-xs text-slate-400">{new Date(escalation.created_at).toLocaleString("tr-TR")}</p>

      <textarea
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        placeholder="Yanıtınızı yazın..."
        rows={3}
        className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />

      <label className="mt-2 flex items-center gap-2 text-xs text-slate-500">
        <input type="checkbox" checked={addToFaq} onChange={(e) => setAddToFaq(e.target.checked)} />
        Bu konu tekrar ediyorsa SSS havuzuna ekle
      </label>

      <button
        onClick={() => onAnswer(answer, addToFaq)}
        disabled={!answer.trim() || isSubmitting}
        className="mt-3 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50"
      >
        Yanıtla ve Kapat
      </button>
    </div>
  );
}
