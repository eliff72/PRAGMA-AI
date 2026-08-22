import type { ChatMessage } from "../types";
import ConfidenceBadge from "./ConfidenceBadge";
import SourceList from "./SourceList";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${
          isUser ? "bg-blue-600 text-white" : "bg-white text-slate-800 shadow-sm ring-1 ring-slate-100"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && message.needsHuman && (
          <p className="mt-2 rounded bg-amber-50 px-2 py-1.5 text-xs text-amber-700">
            Bu soru için elimizde yeterli doğrulanmış kaynak bulunamadı. Talebiniz
            destek ekibine iletildi, en kısa sürede size dönüş yapılacak.
          </p>
        )}

        {!isUser && !message.needsHuman && message.confidence !== undefined && (
          <div className="mt-2 flex flex-col gap-1.5">
            <ConfidenceBadge confidence={message.confidence} />
            {message.sources && <SourceList sources={message.sources} />}
          </div>
        )}
      </div>
    </div>
  );
}
