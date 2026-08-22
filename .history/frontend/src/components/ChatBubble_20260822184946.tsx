import ConfidenceBadge from "./ConfidenceBadge";
import SourceTag from "./SourceTag";
import type { Source } from "../api/questions";

interface ChatBubbleProps {
  role: "user" | "assistant";
  text: string;
  sources?: Source[];
  confidence?: number;
  needsHuman?: boolean;
}

export default function ChatBubble({
  role,
  text,
  sources,
  confidence,
  needsHuman,
}: ChatBubbleProps) {
  const isUser = role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[85%] sm:max-w-[70%] rounded-2xl px-4 py-2 ${
          isUser
            ? "bg-blue-600 text-white"
            : needsHuman
              ? "bg-amber-50 text-amber-900 border border-amber-200"
              : "bg-white text-slate-800 border border-slate-200"
        }`}
      >
        <p className="text-sm leading-relaxed">{text}</p>

        {!isUser && sources && sources.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {sources.map((src, i) => (
              <SourceTag key={i} source={src} />
            ))}
          </div>
        )}

        {!isUser && typeof confidence === "number" && !needsHuman && (
          <div className="mt-2">
            <ConfidenceBadge confidence={confidence} />
          </div>
        )}

        {!isUser && needsHuman && (
          <div className="mt-2 text-xs font-medium text-amber-700">
            👤 Destek ekibine yönlendiriliyor
          </div>
        )}
      </div>
    </div>
  );
}
