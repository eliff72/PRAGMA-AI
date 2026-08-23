import type { ChatMessage } from "../types";
import ConfidenceBadge from "./ConfidenceBadge";
import SourceList from "./SourceList";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex animate-rise-in gap-2 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-800 text-[10px] font-bold text-white font-display">
          P
        </div>
      )}

      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser
            ? "rounded-tr-sm bg-navy-800 text-white"
            : "rounded-tl-sm bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>

        {!isUser && message.needsHuman && (
          <p className="mt-2.5 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-xs text-amber-700">
            <span>⚠️</span>
            Bu soru için elimizde yeterli doğrulanmış kaynak bulunamadı.
            Talebiniz destek ekibine iletildi, en kısa sürede size dönüş
            yapılacak.
          </p>
        )}

        {!isUser && !message.needsHuman && message.confidence !== undefined && (
          <div className="mt-2.5 flex flex-col gap-1.5 border-t border-slate-100 pt-2.5">
            <ConfidenceBadge confidence={message.confidence} />
            {message.sources && <SourceList sources={message.sources} />}
          </div>
        )}
      </div>
    </div>
  );
}
