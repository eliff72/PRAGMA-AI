import type { ChatMessage } from "../types";
import ConfidenceBadge from "./ConfidenceBadge";
import SourceList from "./SourceList";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end gap-2 py-2">
        <div className="max-w-[85%] sm:max-w-[70%] rounded-2xl rounded-br-md bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-2.5 text-sm leading-relaxed text-white shadow-md shadow-blue-600/20">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const hasMeta =
    message.confidence !== undefined || (message.sources?.length ?? 0) > 0;

  return (
    <div className="flex justify-start gap-2 py-2">
      <div className="mt-0.5 hidden h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-sm text-white shadow-sm sm:flex">
        🤖
      </div>

      <div className="max-w-[90%] sm:max-w-[75%] space-y-2">
        {/* Yanıt kartı */}
        <div
          className={`rounded-2xl rounded-bl-md border px-4 py-3 shadow-sm ${
            message.needsHuman
              ? "border-amber-200 bg-amber-50/80"
              : "border-slate-200 bg-white"
          }`}
        >
          <p
            className={`whitespace-pre-wrap text-sm leading-relaxed ${
              message.needsHuman ? "text-amber-900" : "text-slate-800"
            }`}
          >
            {message.content}
          </p>

          {!message.needsHuman && hasMeta && (
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
              {message.confidence !== undefined && (
                <ConfidenceBadge confidence={message.confidence} />
              )}
              {message.sources && <SourceList sources={message.sources} />}
            </div>
          )}
        </div>

        {/* İnsana yönlendirme uyarısı */}
        {message.needsHuman && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-white p-3 shadow-sm">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-100 text-sm">
              🙋
            </span>
            <div>
              <p className="text-sm font-semibold text-amber-900">
                Emin değilim — destek ekibine yönlendiriliyor
              </p>
              <p className="mt-0.5 text-xs leading-relaxed text-amber-700">
                Bu soru için doğrulanmış bir kaynak bulamadım. Talebiniz destek
                ekibine iletildi, en kısa sürede dönüş yapılacak.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
